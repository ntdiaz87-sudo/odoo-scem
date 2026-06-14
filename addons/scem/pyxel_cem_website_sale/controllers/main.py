# -*- coding: utf-8 -*-
from odoo import http, fields, _
from odoo.http import request
from odoo.exceptions import ValidationError, UserError
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.addons.portal.controllers.portal import CustomerPortal
from odoo.addons.portal.controllers.portal import get_error
from odoo.addons.portal.controllers.portal import CustomerPortal, pager as portal_pager
import base64
import math
import json
import secrets
import logging
import re

_logger = logging.getLogger(__name__)


class WebsiteController(CustomerPortal):
    """
        Intercepta las rutas de portal de sale.order para sincronizar
        la pricelist de sesión desde la orden — sin tocar la orden en BD.

        REGLA: en portal, la orden es fuente de verdad de la moneda.
        La sesión se actualiza para que el header muestre la moneda correcta.
        """

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _sync_pricelist_from_order(self, order_id, access_token=None):
        """
        Lee la pricelist de la orden y la escribe en sesión.
        NO modifica la orden — solo sincroniza la sesión del navegador.

        Retorna True si pudo sincronizar, False si la orden no existe / no es válida.
        """
        try:
            SaleOrder = request.env['sale.order'].sudo()

            # Buscar la orden — con o sin access_token
            order = SaleOrder.browse(int(order_id))
            if not order.exists():
                return False

            # Validar access_token si se provee
            if access_token and order.access_token != access_token:
                return False

            pl = order.pricelist_id
            if not pl:
                return False

            website = request.website
            if not website:
                return False

            available = website.get_pricelist_available(show_visible=True)
            if not available:
                return False

            # Solo sincronizar si la pricelist de la orden está disponible en el website
            if pl in available:
                current = request.session.get('website_sale_current_pl')
                if current != pl.id:
                    request.session['website_sale_current_pl'] = pl.id
                    request.session.modified = True
                    _logger.info(
                        "Portal pricelist sync: orden %s → sesión = %s (%s)",
                        order.name, pl.id, pl.currency_id.name,
                    )
                return True

            _logger.warning(
                "Portal pricelist sync: pricelist %s de orden %s no está disponible en website %s",
                pl.id, order.name, website.id,
            )
            return False

        except Exception as e:
            _logger.error("Portal pricelist sync error: %s", e, exc_info=True)
            return False

    # ------------------------------------------------------------------
    # Rutas — /my/orders
    # ------------------------------------------------------------------

    @http.route(
        ['/my/orders/<int:order_id>'],
        type='http',
        auth='public',
        website=True,
    )
    def portal_order_page(self, order_id, access_token=None, **kwargs):
        """
        Odoo pasa el access_token como QUERY PARAM (?access_token=xxx),
        no como path segment. Por eso hay que capturarlo de kwargs / httprequest.
        """
        # access_token puede venir como query param directamente en kwargs
        token = access_token or kwargs.get('access_token') or \
                request.httprequest.args.get('access_token')

        self._sync_pricelist_from_order(order_id, access_token=token)

        return super().portal_order_page(
            order_id=order_id,
            access_token=token,
            **{k: v for k, v in kwargs.items() if k != 'access_token'},
        )

    # ------------------------------------------------------------------
    # Rutas — /my/quotes
    # ------------------------------------------------------------------

    @http.route(
        [
            '/my/quotes/<int:order_id>',
            '/my/quotes/<int:order_id>/<access_token>',
        ],
        type='http',
        auth='public',
        website=True,
    )
    def portal_quote_page(self, order_id, access_token=None, **kwargs):
        token = access_token or kwargs.get('access_token') or \
                request.httprequest.args.get('access_token')

        self._sync_pricelist_from_order(order_id, access_token=token)

        return super().portal_quote_page(
            order_id=order_id,
            access_token=token,
            **{k: v for k, v in kwargs.items() if k != 'access_token'},
        )
# ---------------------------------------------------------------------------------------


    def _orders_domain_by_status(self, partner, status):
        """
        Mapea tu 'status' (lo que mandas en la URL) a un domain real de sale.order.
        """
        base = [('partner_id', '=', partner.id)]

        mapping = {
            # Quotes -> state sent
            'quotes': base + [('state', '=', 'sent')],

            # Requests -> state sale + so_cem_state no_paid (según tu lógica actual)
            'requests': base + [('state', '=', 'sale'), ('so_cem_state', '=', 'no_paid')],

            # Invoices -> so_cem_state paid (según tu lógica actual)
            'invoices': base + [('so_cem_state', '=', 'paid')],

            # Cancelled -> cancel
            'cancelled': base + [('state', '=', 'cancel')],
        }
        return mapping.get(status, base)

    @http.route(['/my/orders/by_state/<string:status>'], type='http', auth='user', website=True)
    def my_orders_by_state(self, status, **kwargs):
        partner = request.env.user.partner_id
        SaleOrder = request.env['sale.order'].sudo()

        base_domain = [('partner_id', '=', partner.id)]

        domain_quotes = base_domain + [('state', '=', 'sent')]
        domain_requests = base_domain + [('state', '=', 'sale'), ('so_cem_state', '=', 'no_paid')]
        domain_invoices = base_domain + [('so_cem_state', '=', 'paid')]
        domain_cancelled = base_domain + [('state', '=', 'cancel')]

        status_map = {
            'quotes': (_('Quotes'), domain_quotes),
            'requests': (_('Orders in progress'), domain_requests),
            'invoices': (_('Invoices'), domain_invoices),
            'cancelled': (_('Canceled orders'), domain_cancelled),
        }

        if status not in status_map:
            return request.redirect('/my/profile')

        title, domain = status_map[status]

        search_term = (kwargs.get('search') or '').strip()
        if search_term:
            domain += [('name', 'ilike', search_term)]

        orders = SaleOrder.search(domain, order='date_order desc')

        values = self._prepare_portal_layout_values()
        values.update({
            'title': _(title),
            'status_key': status,  # <-- IMPORTANTE para el action del form
            'orders': orders,
            'search': search_term,
        })
        return request.render('pyxel_cem_website_sale.portal_orders_by_state', values)

    @http.route(['/my/invoices/status/<string:status>'], type='http', auth='user', website=True)
    def my_invoices_by_status(self, status, **kwargs):
        partner = request.env.user.partner_id
        Move = request.env['account.move'].sudo()

        # Facturas de cliente (y opcionalmente notas de crédito)
        base_domain = [
            ('partner_id', '=', partner.id),
            ('move_type', 'in', ['out_invoice', 'out_refund']),
            ('state', '!=', 'draft'),  # opcional: esconder borradores
        ]

        # Odoo 17: payment_state suele ser: not_paid, in_payment, paid, partial, reversed, etc.
        status_map = {
            'paid': ('Paid invoices', base_domain + [('payment_state', '=', 'paid')]),
            'unpaid': (
            'Unpaid invoices', base_domain + [('payment_state', 'in', ['not_paid', 'partial', 'in_payment'])]),
            'all': ('All invoices', base_domain),
        }

        if status not in status_map:
            return request.redirect('/my/profile')

        title, domain = status_map[status]

        search_term = (kwargs.get('search') or '').strip()
        if search_term:
            domain += ['|', ('name', 'ilike', search_term), ('ref', 'ilike', search_term)]

        invoices = Move.search(domain, order='invoice_date desc, id desc')

        values = self._prepare_portal_layout_values()
        values.update({
            'page_name': 'invoices',
            'title': title,
            'status_key': status,
            'invoices': invoices,
            'search': search_term,
        })
        return request.render('pyxel_cem_website_sale.portal_invoices_by_status', values)

    def _prepare_portal_layout_values(self):
        values = super(WebsiteController, self)._prepare_portal_layout_values()
        partner = request.env.user.partner_id
        values.update({
            'partner': partner,
            'error': {},
            'error_message': [],
            'countries': request.env['res.country'].sudo().search([]),
            'states': request.env['res.country.state'].sudo().search([]),
            'partner_can_edit_vat': partner.can_edit_vat(),
        })
        return values

    def _details_form_validate(self, data):
        error = {}
        error_message = []

        def _val(field):
            # normaliza a string, trim
            v = (data.get(field) or "").strip()
            return v

        # Helpers
        name_allowed_re = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿÑñ0-9\s]+$")
        digits_only_re = re.compile(r"^\d+$")

        # Requeridos
        for field_name in ['name', 'email']:
            if not _val(field_name):
                error[field_name] = 'required'
                error_message.append(f'{field_name.capitalize()} is required.')

        # Email básico
        email = _val('email')
        if email and '@' not in email:
            error['email'] = 'invalid'
            error_message.append('Invalid email address.')

        # --- REGLA 1: Name, Company Name, City sin números ni caracteres especiales ---
        name = _val('name')
        if name and not name_allowed_re.match(name):
            error['name'] = 'invalid'
            error_message.append("Name cannot contain special characters.")

        company_name = _val('company_name')
        if company_name and not name_allowed_re.match(company_name):
            error['company_name'] = 'invalid'
            error_message.append("Company Name cannot contain special characters.")

        city = _val('city')
        if city and (any(ch.isdigit() for ch in city) or not name_allowed_re.match(city)):
            error['city'] = 'invalid'
            error_message.append("City cannot contain numbers or special characters.")

        # --- REGLA 2: Phone, VAT, ZipCode solo dígitos ---
        phone = _val('phone')
        if phone and not digits_only_re.match(phone):
            error['phone'] = 'invalid'
            error_message.append("Phone it can only contain numbers (no letters or symbols).")

        vat = _val('vat')
        if vat and not digits_only_re.match(vat):
            error['vat'] = 'invalid'
            error_message.append("It can only contain numbers (no letters or symbols).")

        zipcode = _val('zipcode')  # input name="zipcode"
        if zipcode and not digits_only_re.match(zipcode):
            error['zip'] = 'invalid'  # en el template se usa error.get('zip')
            error_message.append("Zip / Postal Code it can only contain numbers (no letters or symbols).")

        # country/state ids válidos
        for field_name in ['country_id', 'state_id']:
            v = _val(field_name)
            if v and v != 'false':
                try:
                    int(v)
                except ValueError:
                    error[field_name] = 'invalid'
                    error_message.append(f'{field_name.capitalize()} it must be a valid ID.')

        return error, error_message

    @http.route('/my/profile', type='http', auth='user', website=True, methods=['GET', 'POST'])
    def my_profile(self, **kwargs):
        user = request.env.user
        partner = user.partner_id

        # AÑADIR AQUÍ: Buscar el contrato del partner
        contract = False
        try:
            Contract = request.env['cem.virtual.contract']
        except KeyError:
            Contract = False

        if Contract:
            contract = Contract.sudo().search([
                ('partner_id', '=', partner.id),
                ('state', 'in', ['sent', 'confirmed', 'accepted', 'expired', 'canceled'])
            ], limit=1)

        addresses = request.env['res.partner'].sudo().search([
            '|',
            ('id', '=', partner.id),
            ('parent_id', '=', partner.id),
            ('type', 'in', ['contact', 'delivery', 'invoice']),
        ])
        addresses_data = [{
            'street': address.street,
            'street2': address.street2,
            'state_name': address.state_id.name,
            'city': address.city,
        } for address in addresses]

        SaleOrder = request.env['sale.order'].sudo()
        domain = [('partner_id', '=', partner.id)]

        # Contadores (se mantienen sin filtro de búsqueda)
        new_orders_count = SaleOrder.search_count(domain + [('state', '=', 'sent')])
        orders_in_progress_count = SaleOrder.search_count(
            domain + [('so_cem_state', '=', 'no_paid'), ('state', '=', 'sale')])
        orders_shipped_count = SaleOrder.search_count(domain + [('so_cem_state', '=', 'paid')])
        orders_cancelled_count = SaleOrder.search_count(domain + [('state', '=', 'cancel')])

        sent_orders = SaleOrder.search(
            domain + [
                '|',
                ('state', '=', 'sent'),
                '&',
                ('so_cem_state', '=', 'no_paid'),
                ('state', '=', 'sale')
            ],
            order='date_order desc'
        )

        # Si se envía 'search', se filtra el historial
        search_term = kwargs.get('search')
        if search_term:
            domain_orders = domain + [('name', 'ilike', search_term)]
            active_tab = 'history-order'
        else:
            domain_orders = domain
            active_tab = 'profile-orders'  # por defecto, se muestra "My Profile" o la pestaña inicial

        all_orders = SaleOrder.search(domain_orders, order='date_order desc')

        values = self._prepare_portal_layout_values()

        values['get_error'] = get_error
        values['errors'] = {}
        values['success'] = {}

        partner_bank_accounts = {
            'corriente': '',
            'gastos_cup': '',
            'gastos_mlc': '',
            'cuenta_usd_eur': ''
        }
        partner_banks = request.env['res.partner.bank'].sudo().search([('partner_id', '=', partner.id)])
        for bank in partner_banks:
            if bank.account_type in partner_bank_accounts:
                partner_bank_accounts[bank.account_type] = bank.acc_number

        # OBTENER DOCUMENTOS SUBIDOS DEL PARTNER
        partner_documents = request.env['ir.attachment'].sudo().search([
            ('res_model', '=', 'res.partner'),
            ('res_id', '=', partner.id),
            ('type', '=', 'binary')
        ])

        # Organizar documentos por tipo
        organized_docs, other_docs = self._get_partner_documents_by_type(partner_documents)

        management_type = False
        management_type_name = False

        # Verificar si el módulo pyxel_import_backend está instalado
        module_installed = request.env['ir.module.module'].sudo().search_count([
            ('name', '=', 'pyxel_import_backend'),
            ('state', '=', 'installed')
        ]) > 0

        if module_installed:
            try:
                # Buscar el tipo de gestión desde la compañía (parent_id)
                company = partner.parent_id if partner.parent_id else partner

                # Verificar si el modelo tiene el campo management_type_id
                if hasattr(company, 'management_type_id') and company.management_type_id:
                    management_type = company.management_type_id
                    management_type_name = company.management_type_id.name
            except Exception as e:
                _logger.warning(f"Error al obtener management_type_id: {e}")

        values.update({
            'partner_bank_accounts': partner_bank_accounts,
            'new_orders_count': new_orders_count,
            'orders_in_progress_count': orders_in_progress_count,
            'orders_shipped_count': orders_shipped_count,
            'orders_cancelled_count': orders_cancelled_count,
            'sent_orders': sent_orders,
            'all_orders': all_orders,
            'addresses': addresses_data,
            'active_tab': active_tab,
            'search': search_term or "",
            'contract': contract,
            'organized_docs': organized_docs,  # Documentos organizados por tipo
            'other_docs': other_docs,  # Otros documentos
            'partner_documents': partner_documents,  # Todos los documentos
            'management_type': management_type,
            'management_type_name': management_type_name,
            'show_management_type': module_installed,
        })

        if request.httprequest.method == 'POST' and kwargs.get('op') == 'password':
            is_ajax = request.httprequest.headers.get("X-Requested-With") == "XMLHttpRequest"

            old = (kwargs.get('old') or '').strip()
            new1 = (kwargs.get('new1') or '').strip()
            new2 = (kwargs.get('new2') or '').strip()

            # --- 1) Validaciones de complejidad ---
            flat_errors = {}

            if new1 and len(new1) < 8:
                flat_errors["password.new1"] = "The new password must be at least 8 characters long."

            if new1 and not re.search(r"[^A-Za-z0-9]", new1):
                flat_errors["password.new1"] = "The new password must contain at least one special character."

            # Si hay errores de complejidad, responder según AJAX o HTML
            if flat_errors:
                if is_ajax:
                    return request.make_response(
                        json.dumps({"success": False, "errors": flat_errors}),
                        headers=[("Content-Type", "application/json")]
                    )

                values["errors"] = flat_errors
                values["success"] = {}
                values["active_tab"] = "security-section"
                return request.render('pyxel_cem_website_sale.my_profile', values)

            # --- 2) Validación y cambio real (Odoo) ---
            pwd_vals = self._update_password(old, new1, new2)

            raw_errors = pwd_vals.get("errors", {}) or {}
            success = pwd_vals.get("success", {}) or {}

            # Aplanar errores (pueden venir anidados)
            flat_errors = {}

            def _walk(prefix, obj):
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        new_prefix = f"{prefix}.{k}" if prefix else str(k)
                        _walk(new_prefix, v)
                    return
                if isinstance(obj, (list, tuple, set)):
                    for item in obj:
                        _walk(prefix, item)
                    return
                if prefix:
                    flat_errors[prefix] = str(obj)

            _walk("", raw_errors)

            # Respuesta JSON si es AJAX
            if is_ajax:
                return request.make_response(
                    json.dumps({
                        "success": bool(success.get("password")),
                        "errors": flat_errors,
                    }),
                    headers=[("Content-Type", "application/json")]
                )

            # Fallback HTML normal
            values["errors"] = flat_errors
            values["success"] = success

            values['active_tab'] = 'security-section'
            return request.render('pyxel_cem_website_sale.my_profile', values)

        search_term = kwargs.get('search', '').strip()
        values['active_tab'] = 'history-order' if search_term else 'profile-orders'

        if request.httprequest.method == 'POST':
            data = dict(kwargs)
            error, error_message = self._details_form_validate(data)
            response_data = {}
            if error:
                response_data = {
                    'success': False,
                    'error_message': error_message,
                }
            else:
                try:
                    partner_vals = {
                        'name': data.get('name'),
                        'email': data.get('email'),
                        'phone': data.get('phone'),
                        'street': data.get('street'),
                        'city': data.get('city'),
                        'zip': data.get('zipcode'),
                        'last_name': data.get('last_name'),
                        'date_of_birth': data.get('date_of_birth'),
                        'name_entity': data.get('name_entity'),
                        'reeup': data.get('reeup'),
                        'social_object': data.get('social_object'),
                        'entity_type': data.get('entity_type'),
                    }

                    if data.get('country_id') and data.get('country_id') != 'false':
                        partner_vals['country_id'] = int(data.get('country_id'))

                    if data.get('custom_state_id') and data.get('custom_state_id') != 'false':
                        state_id = int(data.get('custom_state_id'))
                        partner_vals['state_id'] = state_id

                        # 🔥 NUEVA LÓGICA: Buscar/crear ciudad en res.city
                        city_name = data.get('city')
                        if city_name and state_id:
                            country_id = partner_vals.get('country_id', partner.country_id.id)
                            if not country_id and data.get('country_id'):
                                country_id = int(data.get('country_id'))
                            elif not country_id:
                                # Buscar país por defecto (Cuba)
                                cuba = request.env['res.country'].sudo().search([('code', '=', 'CU')], limit=1)
                                country_id = cuba.id if cuba else False

                            if country_id:
                                # Buscar si ya existe la ciudad en res.city
                                city_domain = [
                                    ('name', 'ilike', city_name),
                                    ('state_id', '=', state_id),
                                    ('country_id', '=', country_id)
                                ]

                                city = request.env['res.city'].sudo().search(city_domain, limit=1)

                                if not city:
                                    # Crear la ciudad en res.city si no existe
                                    city = request.env['res.city'].sudo().create({
                                        'name': city_name,
                                        'state_id': state_id,
                                        'country_id': country_id,
                                    })

                        # 🔥 NUEVA LÓGICA: Buscar/actualizar res_municipality_id
                        if city_name and state_id:
                            # Buscar el municipio en res.municipality por nombre y provincia
                            municipality = request.env['res.municipality'].sudo().search([
                                ('name', 'ilike', city_name),
                                ('state_id', '=', state_id)
                            ], limit=1)

                            if municipality:
                                partner_vals['res_municipality_id'] = municipality.id

                    if partner.can_edit_vat():
                        partner_vals.update({
                            'company_name': data.get('company_name'),
                            'vat': data.get('vat'),
                        })

                    file_obj = request.httprequest.files.get('profile_image')
                    if file_obj:
                        partner_vals['image_1920'] = base64.b64encode(file_obj.read()).decode('utf-8')

                    # Dejar SOLO campos que existen en res.partner en esta DB
                    invalid_partner_fields = [k for k in partner_vals if k not in partner._fields]
                    if invalid_partner_fields:
                        _logger.warning(
                            "Campos ignorados al actualizar perfil porque no existen en res.partner: %s",
                            invalid_partner_fields
                        )

                    partner_vals = {k: v for k, v in partner_vals.items() if k in partner._fields}
                    partner.sudo().write(partner_vals)

                    # Diccionario para almacenar información de documentos subidos
                    uploaded_documents_info = {}
                    other_documents_info = []

                    if partner.user_type == 'juridico':
                        document_fields = [
                            ('documento_constitutivo', 'Documento constitutivo'),
                            ('documento_existencia', 'Documento de existencia legal'),
                            ('documento_registro_mercantil', 'Registro mercantil'),
                            ('documento_registro_contribuyente', 'Registro de contribuyente'),
                            ('documento_licencia_comercio', 'Licencia de Cámara de Comercio'),
                            ('documento_carta_timbrada', 'Carta timbrada'),
                            ('documento_carnet_acorec', 'Carnet de ACOREC'),
                            ('documento_perfil_cliente', 'Perfil del cliente')
                        ]

                        for field_name, doc_description in document_fields:
                            file = request.httprequest.files.get(field_name)
                            if file and file.filename:
                                # Validar tipo de archivo
                                if not self._validate_file_type(file.filename):
                                    raise ValidationError(
                                        f"El archivo '{file.filename}' no es un PDF o imagen válido. Formatos aceptados: PDF, JPG, JPEG, PNG, GIF, BMP, TIFF")

                                # Validar tamaño (10MB máximo)
                                is_valid_size, file_size = self._validate_file_size(file, 10)
                                if not is_valid_size:
                                    raise ValidationError(
                                        f"El archivo '{file.filename}' excede el tamaño máximo de 10MB. Tamaño actual: {file_size // (1024 * 1024)}MB")

                                # Buscar si ya existe un documento de este tipo para actualizar
                                existing_doc = request.env['ir.attachment'].sudo().search([
                                    ('res_model', '=', 'res.partner'),
                                    ('res_id', '=', partner.id),
                                    ('document_type', '=', field_name)
                                ], limit=1)

                                if existing_doc:
                                    # Actualizar documento existente
                                    existing_doc.write({
                                        'name': file.filename,
                                        'datas': base64.b64encode(file.read()),
                                    })
                                    doc_record = existing_doc
                                else:
                                    # Crear nuevo documento
                                    doc_record = request.env['ir.attachment'].sudo().create({
                                        'name': file.filename,
                                        'datas': base64.b64encode(file.read()),
                                        'res_model': 'res.partner',
                                        'res_id': partner.id,
                                        'type': 'binary',
                                        'document_type': field_name,
                                    })

                                # Guardar información del documento para la respuesta
                                uploaded_documents_info[field_name] = {
                                    'id': doc_record.id,
                                    'name': doc_record.name,
                                    'file_size': doc_record.file_size or 0,
                                    'create_date': doc_record.create_date.strftime(
                                        '%d/%m/%Y %H:%M') if doc_record.create_date else None,
                                    'document_type': doc_record.document_type or field_name,
                                }

                        # Para otros documentos
                        for file in request.httprequest.files.getlist('otros_documentos'):
                            if file and file.filename:
                                # Validar tipo de archivo
                                if not self._validate_file_type(file.filename):
                                    raise ValidationError(
                                        f"El archivo '{file.filename}' no es un PDF o imagen válido. Formatos aceptados: PDF, JPG, JPEG, PNG, GIF, BMP, TIFF")

                                # Validar tamaño (10MB máximo)
                                is_valid_size, file_size = self._validate_file_size(file, 10)
                                if not is_valid_size:
                                    raise ValidationError(
                                        f"El archivo '{file.filename}' excede el tamaño máximo de 10MB. Tamaño actual: {file_size // (1024 * 1024)}MB")

                                doc_record = request.env['ir.attachment'].sudo().create({
                                    'name': file.filename,
                                    'datas': base64.b64encode(file.read()),
                                    'res_model': 'res.partner',
                                    'res_id': partner.id,
                                    'type': 'binary',
                                    'document_type': 'otros',
                                })

                                # Guardar información para otros documentos
                                other_documents_info.append({
                                    'id': doc_record.id,
                                    'name': doc_record.name,
                                    'file_size': doc_record.file_size or 0,
                                    'create_date': doc_record.create_date.strftime(
                                        '%d/%m/%Y %H:%M') if doc_record.create_date else None,
                                    'is_pdf': '.pdf' in doc_record.name.lower(),
                                })

                    moneda_map = {'corriente': 'CUP', 'gastos_cup': 'CUP', 'gastos_mlc': 'MLC', 'cuenta_usd_eur': 'USD'}
                    PartnerBank = request.env['res.partner.bank'].sudo()

                    for key, value in data.items():
                        if key.startswith('account_number_') and value.strip():
                            tipo_cuenta = key.replace('account_number_', '')
                            moneda = moneda_map.get(tipo_cuenta, 'CUP')
                            currency = request.env['res.currency'].sudo().search([('name', '=', moneda)], limit=1)

                            # Buscar banco existente para este partner y tipo de cuenta
                            existing_bank = PartnerBank.search([
                                ('partner_id', '=', partner.id),
                                ('account_type', '=', tipo_cuenta)
                            ], limit=1)

                            vals_bank = {
                                'acc_number': value.strip(),
                                'currency_id': currency.id if currency else None,
                                'account_type': tipo_cuenta,
                            }

                            if existing_bank:
                                # Actualizar si el número de cuenta cambió (evitar update innecesario)
                                if existing_bank.acc_number != vals_bank['acc_number']:
                                    existing_bank.write(vals_bank)
                            else:
                                # Crear nuevo registro solo si no existe
                                PartnerBank.create({
                                    'partner_id': partner.id,
                                    **vals_bank,
                                })

                    response_data = {
                        'success': True,
                        'message': 'Profile successfully updated.',
                        'updated_values': {
                            'name': partner_vals.get('name'),
                            'email': partner_vals.get('email'),
                            'image_1920': partner.image_1920.decode('utf-8') if partner.image_1920 else False,
                        },
                        'uploaded_documents': uploaded_documents_info,
                        'other_documents': other_documents_info,
                    }
                except (ValidationError, UserError) as e:
                    _logger.error("Error de validación o usuario: %s", str(e))
                    response_data = {
                        'success': False,
                        'error_message': [str(e)],
                    }
                except Exception as e:
                    _logger.error("Error inesperado: %s", str(e))
                    response_data = {
                        'success': False,
                        'error_message': ['Un error ha ocurrido: ' + str(e)],
                    }

            if request.httprequest.headers.get('Accept') == 'application/json':
                return request.make_response(
                    json.dumps(response_data),
                    headers=[('Content-Type', 'application/json')]
                )
            values.update({
                'success_message': response_data.get('message') if response_data.get('success') else None,
                'error_message': response_data.get('error_message', []),
            })

        return request.render('pyxel_cem_website_sale.my_profile', values)

    def _get_partner_documents_by_type(self, partner_documents):
        """Organizar documentos del partner por tipo usando el campo document_type"""
        organized_docs = {}
        other_docs = []

        document_types = [
            'documento_constitutivo', 'documento_existencia', 'documento_registro_mercantil',
            'documento_registro_contribuyente', 'documento_licencia_comercio',
            'documento_carta_timbrada', 'documento_carnet_acorec', 'documento_perfil_cliente'
        ]

        # Inicializar diccionario para cada tipo
        for doc_type in document_types:
            organized_docs[doc_type] = []

        for attachment in partner_documents:
            if attachment.document_type and attachment.document_type in document_types:
                # Usar el campo document_type definido en el modelo
                organized_docs[attachment.document_type].append(attachment)
            elif attachment.document_type == 'otros':
                other_docs.append(attachment)
            else:
                # Si no tiene document_type asignado, intentar inferirlo del nombre
                found = False
                attachment_name_lower = attachment.name.lower()

                for doc_type in document_types:
                    if doc_type in attachment_name_lower:
                        # Actualizar el document_type del attachment para futuras referencias
                        attachment.write({'document_type': doc_type})
                        organized_docs[doc_type].append(attachment)
                        found = True
                        break

                if not found:
                    other_docs.append(attachment)

        return organized_docs, other_docs

    @http.route('/my/profile/download_document/<int:attachment_id>', type='http', auth='user', website=True)
    def download_document(self, attachment_id, **kwargs):
        """Descargar documento del partner"""
        attachment = request.env['ir.attachment'].sudo().browse(attachment_id)

        # Verificar que el documento pertenece al partner actual
        if attachment.exists() and attachment.res_model == 'res.partner' and attachment.res_id == request.env.user.partner_id.id:
            return request.make_response(
                base64.b64decode(attachment.datas),
                [
                    ('Content-Type', attachment.mimetype or 'application/octet-stream'),
                    ('Content-Disposition', f'attachment; filename="{attachment.name}"')
                ]
            )
        else:
            return request.not_found()

    @http.route('/my/profile/delete_document/<int:attachment_id>', type='http', auth='user', website=True)
    def delete_document(self, attachment_id, **kwargs):
        """Eliminar documento del partner"""
        attachment = request.env['ir.attachment'].sudo().browse(attachment_id)

        # Verificar que el documento pertenece al partner actual
        if attachment.exists() and attachment.res_model == 'res.partner' and attachment.res_id == request.env.user.partner_id.id:
            attachment.unlink()
            # Devolver JSON en lugar de redirigir
            return json.dumps({
                'success': True,
                'message': 'Documento eliminado correctamente',
                'attachment_id': attachment_id
            })
        else:
            # Devolver error en JSON
            return json.dumps({
                'success': False,
                'message': 'Error al eliminar el documento'
            })

    def _validate_file_type(self, filename):
        """Validar que el archivo sea PDF o imagen"""
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff']
        return any(filename.lower().endswith(ext) for ext in allowed_extensions)

    def _validate_file_size(self, file_obj, max_size_mb=10):
        """Validar tamaño del archivo"""
        file_obj.seek(0, 2)  # Ir al final
        file_size = file_obj.tell()
        file_obj.seek(0)  # Volver al inicio
        max_size = max_size_mb * 1024 * 1024  # Convertir a bytes
        return file_size <= max_size, file_size

    @http.route(['/my', '/my/home'], type='http', auth="user", website=True, sitemap=False)
    def home(self, **kw):
        return request.redirect('/my/profile')


class MyWebsiteSale(WebsiteSale):
    @http.route('/shop/get_providers_list', type='json', auth='public', website=True, sitemap=False)
    def _get_providers_list(self, **post):
        # Find partners who are suppliers
        providers = request.env['res.partner'].sudo().search_read(
            [('is_provider', '=', True)],
            ['name', 'id']
        )
        for provider in providers:
            count = request.env['product.template'].sudo().search_count([
                ('provider_id', '=', provider['id'])
            ])
            provider.update({'product_count': count})
        return {
            'providers': providers or [],
        }

    
    def _get_shop_payment_values(self, order, **post):
        values = super()._get_shop_payment_values(order, **post)

        def _hide_payment_methods():
            payment_methods = values.get('payment_methods_sudo')
            tokens = values.get('tokens_sudo')

            if payment_methods:
                values['payment_methods_sudo'] = payment_methods.filtered(lambda p: False)

            if tokens:
                values['tokens_sudo'] = tokens.filtered(lambda t: False)

            values['display_submit_button'] = False

        if not order:
            _logger.info("[SCEM PAYMENT VALUES] No order found. Hiding payment methods.")
            _hide_payment_methods()
            return values

        can_pay_with_odoo = order.sudo()._scem_can_pay_with_odoo_payment(
            website=request.website
        )

        if not can_pay_with_odoo:
            _hide_payment_methods()

        return values

    def _get_product_published_field(self):
        """Detecta el campo correcto para productos publicados"""
        ProductTemplate = request.env['product.template'].sudo()
        return 'website_published' if 'website_published' in ProductTemplate._fields else 'is_published'

    def _get_current_pricelist_for_filter(self):
        """
        Obtiene la pricelist que realmente está activa para el usuario.
        Prioridad:
          1. Pricelist guardada en sesión (website_sale_current_pl)
          2. Pricelist del website por defecto
        """
        website = request.website
        pl_id = request.session.get('website_sale_current_pl')

        if pl_id:
            pricelist = request.env['product.pricelist'].sudo().browse(pl_id)
            if pricelist.exists():
                available = website.get_pricelist_available(show_visible=True)
                if pricelist in available:
                    return pricelist

        # Fallback: pricelist por defecto del website
        return website._get_current_pricelist()

    def _compute_price_range(self):
        """
        Lógica real del cálculo de rango de precios.
        Llamado tanto por get_price_range() como por shop().
        Retorna un dict con min_price, max_price, currency_symbol, etc.
        Retorna el precio mínimo y máximo de los productos que cumplen TODOS estos criterios:
        - Publicados (website_published = True)
        - Activos (active = True)
        - Se pueden vender (sale_ok = True)
        - Tienen stock (qty_available > 0 O virtual_available > 0)
        - Tipo de producto: 'product' (Producto Almacenable / Stockable Product)
        - En la moneda seleccionada en el selector
        """
        ProductTemplate = request.env['product.template'].sudo()
        website = request.website
        pricelist = self._get_current_pricelist_for_filter()
        currency = pricelist.currency_id
        published_field = self._get_product_published_field()

        products = ProductTemplate.search([
            (published_field, '=', True),
            ('active', '=', True),
            ('sale_ok', '=', True),
            ('detailed_type', '=', 'product'),
        ])

        max_price = 0.0
        min_price = None
        valid_products_count = 0

        for product in products:
            try:
                has_stock = any(
                    v.qty_available > 0
                    for v in product.product_variant_ids
                )
                if not has_stock:
                    continue

                price = pricelist._get_product_price(product, 1.0)
                if price and isinstance(price, (int, float)) and price > 0:
                    valid_products_count += 1
                    if min_price is None or price < min_price:
                        min_price = price
                    if price > max_price:
                        max_price = price

            except Exception as e:
                _logger.warning("Error getting price for product %s: %s", product.id, e)
                continue

        if min_price is None or valid_products_count == 0:
            min_price = 0.0
            max_price = 0.0

        return {
            'min_price': float(min_price),
            'max_price': float(max_price),
            'currency_symbol': currency.symbol,
            'currency_position': currency.position,
            'currency_name': currency.name,
            'decimal_places': int(currency.decimal_places),
        }
    @http.route('/shop/get_price_range', type='json', auth='public', website=True)
    def get_price_range(self):
        return self._compute_price_range()

    def _convert_price_to_company_currency(self, price, from_pricelist):
        """
        Convierte un precio desde la moneda de la pricelist activa
        a la moneda de la empresa (que es la que usa super().shop() internamente).
        """
        if not price or price == 0.0:
            return 0.0

        company_currency = request.env.company.currency_id
        pricelist_currency = from_pricelist.currency_id

        if pricelist_currency == company_currency:
            return price  # ya están en la misma moneda, no hace falta convertir

        converted = pricelist_currency._convert(
            price,
            company_currency,
            request.env.company,
            fields.Date.today(),
        )
        return converted

    @http.route(['/shop', '/shop/page/<int:page>'], type='http', auth="public", website=True, sitemap=True)
    def shop(self, page=0, category=None, search='', min_price=0.0, max_price=0.0, ppg=False, **post):
        try:
            min_price = float(min_price) if min_price else 0.0
        except (ValueError, TypeError):
            min_price = 0.0
        try:
            max_price = float(max_price) if max_price else 0.0
        except (ValueError, TypeError):
            max_price = 0.0

        # ✅ Leer min_rating
        try:
            min_rating = int(float(request.params.get('min_rating', 0) or 0))
        except (ValueError, TypeError):
            min_rating = 0

        _logger.info("======= SHOP min_rating =======: %s", min_rating)
        _logger.info("======= SHOP params =======: %s", dict(request.params))

        price_range = self._compute_price_range()
        actual_min = price_range.get('min_price', 0.0)
        actual_max = price_range.get('max_price', 0.0)
        currency_symbol = price_range.get('currency_symbol', '')
        decimal_places = price_range.get('decimal_places', 2)

        params = request.httprequest.args
        user_set_min = 'min_price' in params and params.get('min_price', '0') != '0'
        user_set_max = 'max_price' in params

        pricelist = self._get_current_pricelist_for_filter()

        call_min = self._convert_price_to_company_currency(min_price, pricelist) if user_set_min else 0.0
        call_max = self._convert_price_to_company_currency(max_price, pricelist) if user_set_max else 0.0

        response = super(MyWebsiteSale, self).shop(
            page=page,
            category=category,
            search=search,
            min_price=call_min,
            max_price=call_max,
            ppg=ppg,
            **post
        )

        # ✅ FILTRO DE RATING — directo sobre qcontext después del super()
        # Eliminar _get_search_domain completo

        # En shop(), reemplazar el bloque de rating filter por:
        if min_rating > 0:
            ProductTemplate = request.env['product.template'].sudo()
            pt_fields = ProductTemplate._fields
            rating_field = 'rating_avg' if 'rating_avg' in pt_fields else (
                'rating_avg_score' if 'rating_avg_score' in pt_fields else None
            )
            if rating_field:
                valid_ids = ProductTemplate.search([
                    (rating_field, '>=', float(min_rating)),
                    (rating_field, '>', 0),
                ]).ids
                response.qcontext['rating_valid_ids'] = valid_ids
            else:
                response.qcontext['rating_valid_ids'] = []
        else:
            response.qcontext['rating_valid_ids'] = None

        product_published_field = self._get_product_published_field()
        ProductTemplate = request.env['product.template'].sudo()

        # --- Proveedores ---
        provider_records = request.env['res.partner'].sudo().search([('is_provider', '=', True)])
        providers_list = []
        for prov in provider_records:
            try:
                count = ProductTemplate.search_count([
                    ('provider_id', '=', prov.id),
                    (product_published_field, '=', True),
                    ('active', '=', True),
                    ('sale_ok', '=', True),
                    ('detailed_type', '=', 'product'),
                ])
                if count > 0:
                    providers_list.append({
                        'id': int(prov.id),
                        'name': str(prov.name or ''),
                        'product_count': int(count)
                    })
            except Exception:
                continue

        # --- Categorías ---
        category_records = request.env['product.public.category'].sudo().search([])
        categories_list = []
        for cat in category_records:
            try:
                count = ProductTemplate.search_count([
                    ('public_categ_ids', 'in', cat.id),
                    (product_published_field, '=', True),
                    ('active', '=', True),
                    ('sale_ok', '=', True),
                    ('detailed_type', '=', 'product'),
                ])
                if count > 0:
                    parent_id_value = False
                    try:
                        if cat.parent_id and cat.parent_id.id:
                            parent_id_value = [int(cat.parent_id.id), str(cat.parent_id.name or '')]
                    except Exception:
                        parent_id_value = False

                    child_id_value = []
                    try:
                        child_cats = request.env['product.public.category'].sudo().search([
                            ('parent_id', '=', cat.id)
                        ])
                        child_id_value = [int(c.id) for c in child_cats]
                    except Exception:
                        child_id_value = []

                    categories_list.append({
                        'id': int(cat.id),
                        'name': str(cat.name or ''),
                        'parent_id': parent_id_value,
                        'child_id': child_id_value,
                        'product_count': int(count)
                    })
            except Exception:
                continue

        final_providers = json.loads(json.dumps(providers_list))
        final_categories = json.loads(json.dumps(categories_list))

        current_provider = request.httprequest.args.get('provider')
        current_category = request.httprequest.args.get('category')

        display_min = min_price if user_set_min else actual_min
        display_max = max_price if user_set_max else actual_max

        response.qcontext['providers'] = final_providers
        response.qcontext['categories'] = final_categories
        response.qcontext['current_provider'] = int(
            current_provider) if current_provider and current_provider.isdigit() else None
        response.qcontext['current_category'] = int(
            current_category) if current_category and current_category.isdigit() else None
        response.qcontext['actual_min_price'] = actual_min
        response.qcontext['actual_max_price'] = actual_max
        response.qcontext['min_price'] = display_min
        response.qcontext['max_price'] = display_max
        response.qcontext['currency_symbol'] = currency_symbol
        response.qcontext['decimal_places'] = decimal_places
        response.qcontext['current_min_rating'] = min_rating
        return response



class WebsiteSaleController(http.Controller):

    def _get_order_partner(self):
        """
        Determina qué partner debe usarse para la orden.
        Si el módulo pyxel_import_backend está instalado y el usuario es jurídico,
        retorna la compañía (parent_id). En caso contrario, retorna el partner del usuario.
        Además, retorna el usuario autenticado original.

        Returns:
            tuple: (partner_for_order, original_user_partner)
        """
        user = request.env.user
        original_partner = user.partner_id

        # Verificar si el módulo pyxel_import_backend está instalado
        module_installed = request.env['ir.module.module'].sudo().search_count([
            ('name', '=', 'pyxel_import_backend'),
            ('state', '=', 'installed')
        ]) > 0

        # Verificar si el usuario es de tipo jurídico
        is_juridico = original_partner.user_type == 'juridico'

        if module_installed and is_juridico and original_partner.parent_id:
            # Usar la compañía como partner_id de la orden
            partner_for_order = original_partner.parent_id
            _logger.info(
                f"Usuario jurídico {original_partner.name} asociado a compañía {partner_for_order.name} - Usando compañía para la orden")
        else:
            # Usar el partner del usuario autenticado
            partner_for_order = original_partner
            _logger.info(f"Usuario {original_partner.name} - Usando partner directo para la orden")

        return partner_for_order, original_partner

    @http.route('/shop/confirm/order', type='http', auth='public', website=True)
    def confirm_order(self, **post):
        '''
        If the order is over $2,500, you don't need to make a payment right away.
        Simply save the order as "To Be Billed" and send the corresponding emails.
        MODIFICADO: Guarda el usuario que hizo el pedido cuando se usa compañía.
        '''
        order = request.website.sale_get_order()

        if order and order.state in ('draft', 'sent'):
            # Obtener el partner para la orden y el usuario original
            partner_for_order, original_partner = self._get_order_partner()

            # Si el partner_for_order es diferente del partner actual de la orden, actualizarlo
            if partner_for_order and order.partner_id.id != partner_for_order.id:
                _logger.info(
                    f"Actualizando partner de orden {order.name}: de {order.partner_id.name} a {partner_for_order.name}")
                order.sudo().write({'partner_id': partner_for_order.id})

                # También actualizar la dirección de facturación y envío si es necesario
                if not order.partner_invoice_id or order.partner_invoice_id.id == order.partner_id.id:
                    order.sudo().write({'partner_invoice_id': partner_for_order.id})
                if not order.partner_shipping_id or order.partner_shipping_id.id == order.partner_id.id:
                    order.sudo().write({'partner_shipping_id': partner_for_order.id})

            # Guardar el usuario autenticado original en la orden
            # Añadimos un campo many2one a res.users para guardar quién hizo el pedido
            # Si el campo no existe, podemos usar un campo x_studio o comentario
            if hasattr(order, 'ordered_by_user_id'):
                order.sudo().write({'ordered_by_user_id': request.env.user.id})
                _logger.info(
                    f"Guardado usuario que hizo el pedido: {request.env.user.name} (ID: {request.env.user.id})")
            else:
                # Si no existe el campo, guardar en el log o en un mensaje del chatter
                _logger.info(
                    f"Pedido {order.name} realizado por usuario {request.env.user.name} (ID: {request.env.user.id}) para compañía {partner_for_order.name}")
                # Opcional: Añadir mensaje al chatter
                order.sudo().message_post(
                    body=f"Pedido realizado por: {request.env.user.name} ({request.env.user.login})",
                    message_type='notification',
                    subtype_xmlid='mail.mt_note'
                )

            order.action_confirm()

            # Send email to the billing address and shipping address customer
            template = request.env.ref('pyxel_cem_website_sale.custom_order_confirmation_email')
            if template:
                template.sudo().send_mail(order.id, force_send=True)

            # Send email to the platform's sales representative
            comercial_template = request.env.ref('pyxel_cem_website_sale.custom_order_notification_commercial')
            if comercial_template:
                comercial_template.sudo().send_mail(order.id, force_send=True)

            request.website.sale_reset()

            return request.redirect('/shop/confirmation')

        return request.redirect('/shop')

    @http.route('/shop/get_variant_qty/<int:variant_id>', type='http', auth='public', website=True)
    def get_variant_qty(self, variant_id, **kwargs):
        variant = request.env['product.product'].sudo().browse(variant_id)
        if not variant.exists():
            data = {'qty_available': 0, 'uom_name': ''}
        else:
            data = {'qty_available': variant.qty_available, 'uom_name': variant.uom_id.name}
        return request.make_response(json.dumps(data), headers=[('Content-Type', 'application/json')])

    @http.route('/shop/has_lead', type='json', auth="user", methods=['POST'])
    def shop_has_lead(self):
        '''
        Validations when purchasing a product:
            - If the user is not authenticated, redirect to login.
            - If the user is logged in but does not have a lead in the CRM (contact or company)
            - If the user is authenticated, they have a lead, but the stage has allows_sale = False
            - If the user is authenticated, they have a lead, but the stage has allows_sale = True

        Priority logic:
            1. If contact has a company (parent_id): check company lead
            2. If no company or company has no lead: check contact lead
            3. If neither has lead: return has_lead = False
        '''
        website = request.env['website'].get_current_website()
        acreditation_url = website.acreditation_url or ''
        partner = request.env.user.partner_id
        Lead = request.env['crm.lead'].sudo()

        lead = None

        # Si el contacto tiene una compañía asociada, buscar lead de la compañía primero
        if partner.parent_id:
            lead = Lead.search([('partner_id', '=', partner.parent_id.id)], limit=1)

        # Si no tiene compañía o la compañía no tiene lead, buscar lead del contacto
        if not lead:
            lead = Lead.search([('partner_id', '=', partner.id)], limit=1)

        # Si ni el contacto ni la compañía tienen lead
        if not lead:
            return {'has_lead': False, 'acreditation_url': acreditation_url}

        # Verificar si la etapa permite ventas
        allowed_stage = request.env['crm.stage'].sudo().search([
            ('allows_sale', '=', True)
        ], order="sequence asc", limit=1)

        if allowed_stage:
            if lead.stage_id.sequence >= allowed_stage.sequence:
                return {'has_lead': True, 'allowed_sale': True, 'acreditation_url': acreditation_url}
            else:
                return {'has_lead': True, 'allowed_sale': False, 'acreditation_url': acreditation_url}

        # If no stage is found with allows_sale=True, the purchase is allowed by default.
        return {'has_lead': True, 'allowed_sale': True, 'acreditation_url': acreditation_url}

    @http.route(['/shop/order_request', '/shop/order_request/payment'],
                type='http', auth='public', website=True)
    def order_request(self, **post):
        """
        Proceso de solicitud de orden:
        1. Mostrar vista de métodos de pago
        2. Procesar la solicitud y generar PDF
        MODIFICADO: Guarda el usuario que hizo el pedido cuando se usa compañía.
        """
        order = request.website.sale_get_order()

        if not order or order.state != 'draft':
            return request.redirect('/shop/cart')

        # Si es POST, procesar la solicitud
        if request.httprequest.method == 'POST':
            # Obtener método de pago seleccionado
            payment_provider_id = post.get('payment_method_id')

            payment_vals = {}

            if payment_provider_id and payment_provider_id != '0':
                try:
                    payment_provider = request.env['payment.provider'].sudo().browse(int(payment_provider_id))
                    if payment_provider.exists():
                        # Guardar proveedor de pago en la orden
                        payment_vals['payment_prov_id'] = payment_provider.id

                        # Buscar un método de pago asociado al proveedor
                        if payment_provider.payment_method_ids:
                            payment_method = payment_provider.payment_method_ids[0]
                            payment_vals['payment_meth_id'] = payment_method.id
                        else:
                            payment_method = request.env['payment.method'].sudo().search([
                                ('code', '=', payment_provider.code)
                            ], limit=1)
                            if payment_method:
                                payment_vals['payment_meth_id'] = payment_method.id
                except (ValueError, TypeError):
                    pass

            # Obtener el partner para la orden y el usuario original
            partner_for_order, original_partner = self._get_order_partner()

            # Actualizar la orden con los valores de pago y el partner correcto
            update_vals = payment_vals.copy()

            # Si el partner_for_order es diferente del partner actual, actualizarlo
            if partner_for_order and order.partner_id.id != partner_for_order.id:
                update_vals['partner_id'] = partner_for_order.id
                # También actualizar direcciones si son las mismas que el partner original
                if not order.partner_invoice_id or order.partner_invoice_id.id == order.partner_id.id:
                    update_vals['partner_invoice_id'] = partner_for_order.id
                if not order.partner_shipping_id or order.partner_shipping_id.id == order.partner_id.id:
                    update_vals['partner_shipping_id'] = partner_for_order.id
                _logger.info(
                    f"Actualizando partner en order_request: {order.partner_id.name} -> {partner_for_order.name}")

            if update_vals:
                order.write(update_vals)

            # Guardar el usuario autenticado original en la orden
            if hasattr(order, 'ordered_by_user_id'):
                order.sudo().write({'ordered_by_user_id': request.env.user.id})
                _logger.info(
                    f"Guardado usuario que hizo el pedido (order_request): {request.env.user.name} (ID: {request.env.user.id})")
            else:
                order.sudo().message_post(
                    body=f"Solicitud de pedido realizada por: {request.env.user.name} ({request.env.user.login})",
                    message_type='notification',
                    subtype_xmlid='mail.mt_note'
                )

            # Cambiar estado de la orden
            order.write({'state': 'sent'})

            # Generate the access token manually if it doesn't exist yet
            if not order.access_token:
                import uuid
                order.write({'access_token': uuid.uuid4().hex})

            # Subscribe the partner (so that it appears in My Account -> Quotes)
            order.message_subscribe([order.partner_id.id])

            # Send email to the billing address and shipping address customer
            template = request.env.ref('pyxel_cem_website_sale.custom_order_confirmation_email')
            if template:
                template.sudo().send_mail(order.id, force_send=True)

            # Send email to the platform's sales representative
            comercial_template = request.env.ref('pyxel_cem_website_sale.custom_order_notification_commercial')
            if comercial_template:
                comercial_template.sudo().send_mail(order.id, force_send=True)

            request.website.sale_reset()

            return request.redirect(order.get_portal_url())

        # Si es GET, mostrar la vista de métodos de pago
        payment_providers = request.env['payment.provider'].sudo().search([
            ('state', 'in', ['enabled', 'test']),
            ('company_id', '=', request.website.company_id.id),
        ])

        values = {
            'order': order,
            'payment_methods': payment_providers,
            'website': request.website,
        }

        return request.render('pyxel_cem_website_sale.order_request_payment', values)

    @http.route('/shop/tracking_order', type='http', auth='public', website=True, methods=['GET', 'POST'])
    def tracking_order(self, **post):
        if post.get('order_id'):
            order_reference = post.get('order_id')
            invoice_email = post.get('invoice_id')  # También validar el email

            # Búsqueda con validación de email
            domain = [('name', '=', order_reference)]
            if invoice_email:
                domain.append(('partner_id.email', '=', invoice_email))

            sale_order = request.env['sale.order'].sudo().search(domain, limit=1)

            if sale_order:
                return request.redirect('/my/orders/%s' % sale_order.id)
            else:
                error_msg = 'No existe un pedido con el ID "%s"' % order_reference
                if invoice_email:
                    error_msg += ' y el email "%s"' % invoice_email
                error_msg += '.'

                return request.render('pyxel_cem_website_sale.tracking_order_page', {
                    'error': error_msg
                })

        # GET request - mostrar el formulario vacío
        return request.render('pyxel_cem_website_sale.tracking_order_page')

    @http.route('/shop/get_variant_data/<int:variant_id>', type='http', auth='public', website=True)
    def get_variant_data(self, variant_id, **kwargs):
        product = request.env['product.product'].sudo().browse(variant_id)
        if not product.exists():
            return request.make_response(json.dumps({'error': 'Product not found'}),
                                         headers={'Content-Type': 'application/json'})

        website = request.website
        currency = website.currency_id

        # Convert the price to the current website currency
        unit_price = product.currency_id._convert(
            product.lst_price,
            currency,
            request.env.company,
            fields.Date.today(),
            round=True
        )

        # AÑADIR: Obtener sale_min_qty (puede venir del producto o variante)
        sale_min_qty = product.sale_min_qty or product.product_tmpl_id.sale_min_qty or 1

        return request.make_response(json.dumps({
            'qty_available': product.qty_available,
            'unit_price': unit_price,
            'uom_name': product.uom_id.name,
            'sale_min_qty': sale_min_qty,  # ← AÑADIR ESTA LÍNEA
        }), headers={'Content-Type': 'application/json'})

    @http.route('/shop/cart/product_qty/<int:product_id>', type='http', auth='public', website=True, csrf=False)
    def get_product_qty_in_cart(self, product_id, **kwargs):
        order = request.website.sale_get_order()
        qty_in_cart = 0
        if order:
            qty_in_cart = sum(
                line.product_uom_qty
                for line in order.order_line
                if line.product_id.id == product_id
            )
        return request.make_response(
            json.dumps({'product_id': product_id, 'qty_in_cart': qty_in_cart}),
            headers={'Content-Type': 'application/json'}
        )

    @http.route('/get_cities', type='json', auth='public', website=True)
    def get_cities(self, state_id, **kwargs):
        if not state_id:
            return {'cities': []}

        cities = request.env['res.municipality'].sudo().search([
            ('state_id', '=', int(state_id))
        ], order='name')

        return {
            'cities': [{
                'id': city.name,  # Enviamos el nombre como ID
                'name': city.name
            } for city in cities]
        }


class ProductVariantController(http.Controller):

    @http.route('/shop/get_variant_data/<int:variant_id>', type='http', auth='public', website=True, methods=['GET'])
    def get_variant_data(self, variant_id, **kwargs):
        """
        Obtiene información detallada de una variante específica
        Incluye: stock disponible, precio unitario, cantidades mínimas, datos de formato
        """
        try:
            variant = request.env['product.product'].sudo().browse(variant_id)

            if not variant.exists():
                return request.make_json_response({
                    'error': 'Variante no encontrada'
                }, status=404)

            # Obtener datos del formato
            format_data = variant._get_variant_format_data()

            # Obtener pricelist del website
            pricelist = request.website.get_current_pricelist()

            # Calcular precio unitario (precio para 1 unidad)
            unit_price = pricelist._get_product_price(variant, 1.0)

            # Calcular precio con la cantidad mínima del formato
            min_qty = format_data['uom_min']
            total_price = pricelist._get_product_price(variant, min_qty)
            price_per_unit = total_price / min_qty if min_qty > 0 else unit_price

            data = {
                'variant_id': variant.id,
                'name': variant.name,
                'qty_available': variant.qty_available,
                'unit_price': price_per_unit,  # Precio por unidad individual
                'total_price': total_price,  # Precio total con cantidad mínima
                'sale_min_qty': variant.sale_min_qty or 1,
                'uom_min': format_data['uom_min'],
                'is_uom_min': format_data['is_uom_min'],
                'list_price': variant.lst_price,
                'currency': pricelist.currency_id.symbol,
                'currency_position': pricelist.currency_id.position,
            }

            return request.make_json_response(data)

        except Exception as e:
            return request.make_json_response({
                'error': str(e)
            }, status=500)

    @http.route('/shop/calculate_price', type='json', auth='public', website=True, methods=['POST'])
    def calculate_price(self, variant_id, quantity, **kwargs):
        """
        Calcula el precio total para una cantidad específica de una variante
        """
        try:
            variant = request.env['product.product'].sudo().browse(int(variant_id))

            if not variant.exists():
                return {
                    'error': 'Variante no encontrada'
                }

            qty = float(quantity)
            pricelist = request.website.get_current_pricelist()

            # Calcular precio total
            total_price = pricelist._get_product_price(variant, qty)
            unit_price = total_price / qty if qty > 0 else 0

            return {
                'variant_id': variant.id,
                'quantity': qty,
                'unit_price': unit_price,
                'total_price': total_price,
                'currency': pricelist.currency_id.symbol,
                'currency_position': pricelist.currency_id.position,
            }

        except Exception as e:
            return {
                'error': str(e)
            }

    @http.route('/shop/cart/product_qty/<int:product_id>', type='http', auth='public', website=True, methods=['GET'])
    def get_cart_product_qty(self, product_id, **kwargs):
        """
        Obtiene la cantidad de un producto específico en el carrito actual
        """
        try:
            order = request.website.sale_get_order()
            qty_in_cart = 0

            if order:
                order_line = order.order_line.filtered(
                    lambda line: line.product_id.id == product_id
                )
                if order_line:
                    qty_in_cart = sum(order_line.mapped('product_uom_qty'))

            return request.make_json_response({
                'product_id': product_id,
                'qty_in_cart': qty_in_cart
            })

        except Exception as e:
            return request.make_json_response({
                'error': str(e),
                'qty_in_cart': 0
            }, status=500)

    @http.route('/shop/variant/format_info', type='json', auth='public', website=True, methods=['POST'])
    def get_variant_format_info(self, variant_id, **kwargs):
        """
        Obtiene información específica del formato de una variante
        Útil cuando se cambia el atributo de formato
        """
        try:
            variant = request.env['product.product'].sudo().browse(int(variant_id))

            if not variant.exists():
                return {
                    'error': 'Variante no encontrada'
                }

            format_data = variant._get_variant_format_data()
            pricelist = request.website.get_current_pricelist()

            # Calcular precio con la cantidad mínima del formato
            min_qty = format_data['uom_min']
            total_price = pricelist._get_product_price(variant, min_qty)
            unit_price = total_price / min_qty if min_qty > 0 else 0

            return {
                'variant_id': variant.id,
                'uom_min': format_data['uom_min'],
                'is_uom_min': format_data['is_uom_min'],
                'unit_price': unit_price,
                'total_price': total_price,
                'min_qty': min_qty,
                'success': True
            }

        except Exception as e:
            return {
                'error': str(e),
                'success': False
            }


class PTAVController(http.Controller):

    @http.route('/ptav/get_formato_data', type='json', auth='public', methods=['POST'])
    def get_formato_data(self, product_tmpl_id=None, ptav_id=None, **kwargs):
        print('========== get_formato_data ==========')

        # Caso 1: Buscar formato por defecto (is_uom_min=True)
        if product_tmpl_id:
            print(f'Buscando formato por defecto para producto: {product_tmpl_id}')

            ptav = request.env['product.template.attribute.value'].sudo().search([
                ('product_tmpl_id', '=', int(product_tmpl_id)),
                ('attribute_id.name', '=', 'Formato'),
                ('is_uom_min', '=', True)
            ], limit=1)

            if ptav:
                print(f'✓ Formato por defecto: {ptav.name}')
                print(f'  ptav_id: {ptav.id}')
                print(f'  uom_min: {ptav.uom_min}')
                print(f'  is_uom_min: {ptav.is_uom_min}')
                print('=' * 40)

                return {
                    'ptav_id': ptav.id,
                    'name': ptav.name,
                    'uom_min': ptav.uom_min or 1,
                    'is_uom_min': True
                }
            else:
                print('⚠️ No hay formato con is_uom_min=True')
                print('=' * 40)
                return {}

        # Caso 2: Obtener datos de un PTAV específico (cuando usuario cambia)
        elif ptav_id:
            print(f'Obteniendo datos del ptav_id: {ptav_id}')

            ptav = request.env['product.template.attribute.value'].sudo().browse(int(ptav_id))

            if ptav.exists():
                print(f'✓ PTAV encontrado: {ptav.name}')
                print(f'  uom_min: {ptav.uom_min}')
                print(f'  is_uom_min: {ptav.is_uom_min}')
                print('=' * 40)

                return {
                    'ptav_id': ptav.id,
                    'name': ptav.name,
                    'uom_min': ptav.uom_min or 1,
                    'is_uom_min': ptav.is_uom_min
                }
            else:
                print('❌ PTAV no existe')
                print('=' * 40)
                return {'uom_min': 1, 'is_uom_min': False}

        print('❌ No se recibió product_tmpl_id ni ptav_id')
        print('=' * 40)
        return {}

    @http.route('/shop/get_variant_from_ptav', type='json', auth='public', methods=['POST'])
    def get_variant_from_ptav(self, product_tmpl_id, ptav_id, **kwargs):
        print(f'========== get_variant_from_ptav ==========')
        print(f'product_tmpl_id: {product_tmpl_id}, ptav_id: {ptav_id}')

        try:
            variant = request.env['product.product'].sudo().search([
                ('product_tmpl_id', '=', int(product_tmpl_id)),
                ('product_template_attribute_value_ids', 'in', [int(ptav_id)])
            ], limit=1)

            if variant:
                print(f'✓ Variante encontrada: {variant.id} - {variant.name}')
                print('=' * 40)
                return {'product_id': variant.id}
            else:
                print('⚠️ No se encontró variante')
                print('=' * 40)
                return {}
        except Exception as e:
            print(f'❌ Error: {e}')
            import traceback
            traceback.print_exc()
            print('=' * 40)
            return {}




class MyWebsiteSaleFixed(WebsiteSale):

    @http.route(
        ['/shop/change_pricelist/<model("product.pricelist"):pl>'],
        type='http',
        auth="public",
        website=True,
    )
    def pricelist(self, pl, **post):
        # 1. Validar disponibilidad
        available = request.website.get_pricelist_available(show_visible=True)
        if pl not in available:
            _logger.warning("Pricelist %s no disponible para website %s", pl.id, request.website.id)
            return request.redirect('/shop')

        # 2. Guardar en sesión — fuente de verdad
        request.session['website_sale_current_pl'] = pl.id
        request.session.modified = True

        _logger.info("Pricelist cambiada → %s (%s)", pl.id, pl.currency_id.name)

        # 3. Recalcular carrito
        try:
            request.website.sale_get_order(update_pricelist=True)
        except Exception as e:
            _logger.error("Error recalculando carrito: %s", e, exc_info=True)

        # 4. Redirect al origen con query string completo
        redirect_url = post.get('r') or request.httprequest.referrer or '/shop'
        return request.redirect(self._sanitize_redirect(redirect_url))

    @staticmethod
    def _sanitize_redirect(url, fallback='/shop'):
        if not url:
            return fallback
        if '/shop/change_pricelist' in url:
            return fallback
        # Permitir rutas de portal (quotation, order, etc.)
        if url.startswith(('http://', 'https://')):
            return fallback
        return url

class DivepImportRequestController(http.Controller):

    @http.route('/divep/create_import_request', type='json', auth='public', methods=['POST'], website=True, csrf=False)
    def create_import_request(self, product_id, quantity=1, **kw):
        """
        Crea automáticamente una solicitud de importación (sale.order)
        para un producto in-bond si el usuario está acreditado
        """
        _logger = logging.getLogger(__name__)

        try:
            # Verificar si el usuario está autenticado
            if request.env.user._is_public():
                return {
                    'success': False,
                    'message': 'Debe iniciar sesión para realizar una solicitud de importación',
                    'requires_login': True,
                    'redirect_url': '/web/login?redirect=/shop'
                }

            partner = request.env.user.partner_id
            _logger.info(f"Usuario {request.env.user.login} intenta crear solicitud de importación para producto {product_id}")

            # Verificar si el usuario está acreditado
            is_accredited = self._check_user_accreditation(partner)

            if not is_accredited:
                _logger.info(f"Usuario {request.env.user.login} NO está acreditado")
                return {
                    'success': False,
                    'message': 'No está acreditado para realizar importaciones',
                    'requires_accreditation': True,
                    'redirect_url': '/my/profile'
                }

            _logger.info(f"Usuario {request.env.user.login} SÍ está acreditado")

            # Obtener el producto
            product = request.env['product.product'].sudo().browse(int(product_id))
            if not product.exists():
                return {
                    'success': False,
                    'message': 'El producto seleccionado no existe'
                }

            # Guardar en sesión
            selected_products = request.session.get('product_selected', [])
            if product.product_tmpl_id.id not in selected_products:
                selected_products.append(product.product_tmpl_id.id)
                request.session['product_selected'] = selected_products
                request.session.modified = True

            # CREAR LA SOLICITUD
            sale_order = self._create_import_sale_order(partner, product, quantity)

            if sale_order:
                _logger.info(f"Solicitud de importación creada: {sale_order.name}")
                self._send_import_notifications(sale_order)

                return {
                    'success': True,
                    'message': 'Solicitud de importación creada exitosamente',
                    'order_name': sale_order.name,
                    'order_id': sale_order.id,
                    'redirect_url': '/my/orders/by_state/requests'
                }
            else:
                return {
                    'success': False,
                    'message': 'Error al crear la solicitud de importación'
                }

        except Exception as e:
            _logger.error(f"Error en create_import_request: {str(e)}", exc_info=True)
            return {
                'success': False,
                'message': f'Error interno: {str(e)}'
            }

    def _check_user_accreditation(self, partner):
        """Verifica si el usuario está acreditado basado en el CRM lead"""
        Lead = request.env['crm.lead'].sudo()

        lead = None
        if partner.parent_id:
            lead = Lead.search([('partner_id', '=', partner.parent_id.id)], limit=1)

        if not lead:
            lead = Lead.search([('partner_id', '=', partner.id)], limit=1)

        if not lead:
            return False

        if lead.stage_id and lead.stage_id.allows_sale:
            return True
        return False

    def _create_import_sale_order(self, partner, product, quantity):
        """Crea el sale.order para la solicitud de importación"""
        try:
            order_vals = {
                'partner_id': partner.id,
                'partner_invoice_id': partner.id,
                'partner_shipping_id': partner.id,
                'company_id': request.website.company_id.id,
                'user_id': False,
                'order_line': [(0, 0, {
                    'product_id': product.id,
                    'product_uom_qty': float(quantity),
                    'price_unit': product.list_price,
                })],
                'origin': f"Solicitud web - Producto in-bond: {product.name}",
                'client_order_ref': f"IMP-{product.default_code or product.id}",
            }

            sale_order = request.env['sale.order'].sudo().create(order_vals)
            sale_order.action_confirm()
            sale_order.write({'state': 'sent'})

            if not sale_order.access_token:
                sale_order.write({'access_token': secrets.token_hex(16)})

            sale_order.message_subscribe([partner.id])

            return sale_order

        except Exception as e:
            _logger.error(f"Error creando sale.order: {str(e)}", exc_info=True)
            return False

    def _send_import_notifications(self, sale_order):
        """Enviar notificaciones por email"""
        try:
            template = request.env.ref('pyxel_cem_website_sale.custom_order_confirmation_email', raise_if_not_found=False)
            if template:
                template.sudo().send_mail(sale_order.id, force_send=True)

            comercial_template = request.env.ref('pyxel_cem_website_sale.custom_order_notification_commercial', raise_if_not_found=False)
            if comercial_template:
                comercial_template.sudo().send_mail(sale_order.id, force_send=True)
        except Exception as e:
            _logger.error(f"Error enviando notificaciones: {str(e)}")


# ============================================================
# CLASE: DivepCartController
# Maneja operaciones del carrito (vaciar, eliminar líneas)
# ============================================================
class DivepCartController(http.Controller):

    @http.route('/divep/cart/line/remove', type='json', auth='public', methods=['POST'], website=True, csrf=False)
    def remove_cart_line(self, line_id, **kwargs):
        """Elimina una línea del carrito por line_id"""
        _logger = logging.getLogger(__name__)

        try:
            order = request.website.sale_get_order(force_create=False)

            if not order:
                return {'status': 'error', 'message': 'No hay carrito activo'}

            line = request.env['sale.order.line'].sudo().browse(int(line_id))

            if not line.exists():
                return {'status': 'error', 'message': 'Línea no encontrada'}

            if line.order_id.id != order.id:
                return {'status': 'error', 'message': 'Línea no pertenece a este carrito'}

            line.unlink()
            order._compute_cart_info()

            return {
                'status': 'ok',
                'cart_quantity': order.cart_quantity,
                'amount_total': order.amount_total,
            }

        except Exception as e:
            _logger.error(f'Error al eliminar línea {line_id}: {str(e)}')
            return {'status': 'error', 'message': f'Error interno: {str(e)}'}

    @http.route('/divep/cart/clear_and_add', type='http', auth='public', website=True)
    def clear_cart_and_add(self, product_id, add_qty=1, **kwargs):
        """Vacía el carrito y agrega un producto"""
        _logger = logging.getLogger(__name__)

        try:
            order = request.website.sale_get_order(force_create=False)

            if order:
                # Eliminar todas las líneas
                order.order_line.unlink()
                _logger.info(f"Carrito vaciado para agregar producto {product_id}")

            # Agregar el nuevo producto
            product = request.env['product.product'].sudo().browse(int(product_id))
            if product.exists():
                order = request.website.sale_get_order(force_create=True)
                order._cart_update(product_id=int(product_id), add_qty=int(add_qty))

                _logger.info(f"Producto {product_id} agregado al carrito después de vaciarlo")

            return request.redirect('/shop/cart')

        except Exception as e:
            _logger.error(f"Error en clear_cart_and_add: {str(e)}")
            return request.redirect('/shop/cart')

    @http.route('/divep/cart/clear', type='json', auth='public', methods=['POST'], website=True, csrf=False)
    def clear_cart(self, **kwargs):
        """Vacía el carrito completamente"""
        _logger = logging.getLogger(__name__)

        try:
            order = request.website.sale_get_order(force_create=False)
            if order:
                order.order_line.unlink()
                _logger.info("Carrito vaciado exitosamente")
                return {'status': 'ok', 'message': 'Carrito vaciado'}
            return {'status': 'ok', 'message': 'No hay carrito activo'}
        except Exception as e:
            _logger.error(f"Error vaciando carrito: {str(e)}")
            return {'status': 'error', 'message': str(e)}



