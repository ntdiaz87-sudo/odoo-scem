# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.addons.pyxel_cem_website_sale.controllers.main import MyWebsiteSale
import base64
import os
import logging
_logger = logging.getLogger(__name__)


class CevendeCheckoutController(http.Controller):
    """Checkout minorista en 1 página (Fase 3). Login obligatorio."""

    # Mecanismos de pago ofrecidos en el checkout (minorista y mayorista). Se
    # listan los proveedores marcados con cv_in_checkout, ordenados por cv_sort:
    # Transferencia bancaria, Tropipay, Pasarela del Parque y Zelle.
    def _cevende_providers(self):
        return request.env['payment.provider'].sudo().search(
            [('cv_in_checkout', '=', True)], order='cv_sort, id')

    @http.route('/cevende/checkout', type='http', auth='user', website=True, sitemap=False)
    def checkout(self, **kw):
        # Paso 1 (datos de entrega). El gate de login arranca AQUÍ: la página del
        # carrito (/shop/cart) es pública, pero al pulsar "Finalizar compra" y
        # entrar al checkout se exige iniciar sesión (auth='user').
        order = request.website.sale_get_order()
        if not order or not order.website_order_line:
            return request.redirect('/shop')
        partner = request.env.user.partner_id
        cuba = request.env.ref('base.cu', raise_if_not_found=False)
        states = request.env['res.country.state'].sudo().search(
            [('country_id.code', '=', 'CU')], order='name')
        municipalities = request.env['res.municipality'].sudo().search(
            [('state_id', '=', partner.state_id.id)], order='name') \
            if partner.state_id else request.env['res.municipality']
        return request.render('pyxel_cubaelectronica_website.cevende_checkout', {
            'order': order,
            'partner': partner,
            'states': states,
            'municipalities': municipalities,
            'cuba': cuba,
        })

    def _cevende_guardar_datos_cliente(self, post):
        """Guarda los datos de entrega/contacto del cliente (paso 1). La pasarela
        Tropipay exige teléfono, dirección, ciudad y país."""
        partner = request.env.user.partner_id
        partner_vals = {}
        for field, key in [('name', 'name'), ('phone', 'phone'), ('street', 'street'),
                           ('zip', 'zip')]:
            val = (post.get(key) or '').strip()
            if val:
                partner_vals[field] = val
        state_id = post.get('state_id')
        if state_id and state_id.isdigit() and int(state_id):
            partner_vals['state_id'] = int(state_id)
        mun_id = post.get('municipality_id')
        if mun_id and mun_id.isdigit() and int(mun_id):
            mun = request.env['res.municipality'].sudo().browse(int(mun_id))
            if mun.exists():
                partner_vals['city'] = mun.name
                if 'municipality_id' in partner._fields:
                    partner_vals['municipality_id'] = mun.id
                if 'res_municipality_id' in partner._fields:
                    partner_vals['res_municipality_id'] = mun.id
        if not partner.country_id:
            cuba = request.env.ref('base.cu', raise_if_not_found=False)
            if cuba:
                partner_vals['country_id'] = cuba.id
        if partner_vals:
            partner.sudo().write(partner_vals)

    def _cevende_adjuntar_comprobante(self, order):
        """Adjunta el comprobante de pago (transferencia/Zelle) al pedido."""
        file = request.httprequest.files.get('comprobante')
        if not file or not file.filename or not file.filename.strip():
            return False
        allowed = ('.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif')
        ext = os.path.splitext(file.filename.lower())[1]
        if ext not in allowed:
            return False
        data = file.read()
        if not data or len(data) > 10 * 1024 * 1024:
            return False
        request.env['ir.attachment'].sudo().create({
            'name': 'Comprobante de pago - %s' % file.filename,
            'datas': base64.b64encode(data),
            'res_model': 'sale.order', 'res_id': order.id, 'type': 'binary',
        })
        try:
            order.sudo().message_post(body="El cliente subió el comprobante de pago.")
        except Exception:
            pass
        return True

    @http.route('/cevende/checkout/pago', type='http', auth='user', website=True,
                methods=['GET', 'POST'], csrf=True)
    def checkout_pago(self, **post):
        """Paso 2 (minorista): selección del mecanismo de pago. En POST guarda
        primero los datos de entrega enviados en el paso 1."""
        order = request.website.sale_get_order()
        if not order or not order.website_order_line:
            return request.redirect('/shop')
        if request.httprequest.method == 'POST':
            self._cevende_guardar_datos_cliente(post)
        return request.render('pyxel_cubaelectronica_website.cevende_checkout_pago', {
            'order': order,
            'partner': request.env.user.partner_id,
            'providers': self._cevende_providers(),
        })

    @http.route('/cevende/municipalities', type='json', auth='user', website=True)
    def municipalities(self, state_id=None, **kw):
        """Municipios de una provincia, para el desplegable dependiente del
        checkout (Provincia → Municipio)."""
        res = []
        if state_id:
            muns = request.env['res.municipality'].sudo().search(
                [('state_id', '=', int(state_id))], order='name')
            res = [{'id': m.id, 'name': m.name} for m in muns]
        return res

    @http.route('/cevende/country_states', type='json', auth='user', website=True)
    def country_states(self, country_id=None, **kw):
        """Estados/provincias de un país, para el desplegable dependiente de la
        dirección de facturación internacional (País → Estado/Provincia)."""
        res = []
        if country_id:
            sts = request.env['res.country.state'].sudo().search(
                [('country_id', '=', int(country_id))], order='name')
            res = [{'id': s.id, 'name': s.name} for s in sts]
        return res

    def _cevende_asignar_proveedor(self, order, provider):
        """Asigna el proveedor + método de pago elegido al pedido."""
        if not (provider and provider.exists()):
            return
        vals = {}
        if 'payment_provider_id' in order._fields:
            vals['payment_provider_id'] = provider.id
        if 'payment_prov_id' in order._fields:
            vals['payment_prov_id'] = provider.id
        if 'payment_meth_id' in order._fields and provider.payment_method_ids:
            # Para Tropipay hay 2 métodos ('card' y 'tropipay'); el flag
            # pay_by_tpp exige el método con code == 'tropipay'. Se elige el
            # método cuyo code coincide con el del proveedor; si no, el primero.
            meth = provider.payment_method_ids.filtered(
                lambda m: m.code == provider.code)[:1] or provider.payment_method_ids[:1]
            vals['payment_meth_id'] = meth.id
        if vals:
            order.sudo().write(vals)

    @http.route('/cevende/checkout/process', type='http', auth='user', website=True,
                methods=['POST'], csrf=True)
    def checkout_process(self, **post):
        order = request.website.sale_get_order()
        if not order or not order.website_order_line:
            return request.redirect('/shop')

        # Proveedor elegido en el paso de pago.
        provider_id = post.get('provider_id')
        provider = None
        if provider_id and provider_id != '0':
            provider = request.env['payment.provider'].sudo().browse(int(provider_id))
            if not provider.exists():
                provider = None

        # Mecanismo con comprobante (transferencia, Zelle): si aún no se ha
        # mostrado el detalle, mostrarlo (instrucciones + subir comprobante).
        if provider and provider.cv_requires_proof and not post.get('cv_confirm'):
            return request.render('pyxel_cubaelectronica_website.cevende_checkout_detalle', {
                'order': order, 'provider': provider,
                'partner': request.env.user.partner_id,
            })

        # Asignar proveedor y confirmar el pedido (minorista → state 'sale').
        self._cevende_asignar_proveedor(order, provider)
        if order.state == 'draft':
            order.sudo().action_confirm()
        if hasattr(order, 'ordered_by_user_id'):
            order.sudo().write({'ordered_by_user_id': request.env.user.id})

        # Comprobante de pago (si el mecanismo lo pide).
        if post.get('cv_confirm'):
            self._cevende_adjuntar_comprobante(order)

        order_id = order.id

        # ── Pago online (Tropipay): generar enlace y redirigir a pagar ──
        if provider and provider.code == 'tropipay':
            pay_link = None
            try:
                pay_link = order.sudo().tpp_link
            except Exception as e:
                _logger.warning("No se pudo generar el enlace Tropipay del pedido %s: %s", order.name, e)
            request.website.sale_reset()
            if pay_link and pay_link != 'invalid_url':
                # local=False: el enlace es externo (https://tppay.me/...). Sin esto
                # Odoo despoja el host y lo convierte en una ruta local.
                return request.redirect(pay_link, local=False)
            # El enlace no se pudo generar → confirmación con aviso
            return request.redirect('/cevende/checkout/done/%s?pay_error=1' % order_id)

        # ── Pago manual (transferencia): email + página de confirmación ──
        try:
            tmpl = request.env.ref('pyxel_cem_website_sale.custom_order_confirmation_email', False)
            if tmpl:
                tmpl.sudo().send_mail(order.id, force_send=False)
        except Exception:
            pass

        request.website.sale_reset()
        return request.redirect('/cevende/checkout/done/%s' % order_id)

    @http.route('/cevende/checkout/done/<int:order_id>', type='http', auth='user', website=True, sitemap=False)
    def checkout_done(self, order_id, pay_error=None, **kw):
        order = request.env['sale.order'].sudo().browse(order_id)
        if not order.exists():
            return request.redirect('/shop')
        company = request.env.company
        return request.render('pyxel_cubaelectronica_website.cevende_checkout_done', {
            'order': order,
            'company': company,
            'pay_error': bool(pay_error),
        })

    # ══════════════════════════════════════════════════════════════════
    # CHECKOUT MAYORISTA (B2B) — candado: login + empresa (jurídico)
    # La acreditación NO bloquea la compra: los documentos se suben en el
    # registro y se revisan en paralelo (se pide lo que falte).
    # ══════════════════════════════════════════════════════════════════
    # Documentos mínimos obligatorios para poder comprar al por mayor. El
    # resto de la acreditación CRM se revisa en paralelo y no bloquea la compra.
    MAYORISTA_DOCS_OBLIGATORIOS = [
        'documento_constitutivo', 'documento_existencia',
        'documento_registro_mercantil', 'documento_registro_contribuyente',
        'documento_licencia_comercio', 'documento_carta_timbrada',
        'documento_carnet_acorec', 'documento_perfil_cliente',
    ]

    def _es_empresa_real(self, p):
        """Una empresa acreditable: contacto de compañía, jurídico y con datos
        de empresa (NIT o nombre de entidad). Un usuario de registro básico
        (natural, sin estos datos) NO cuenta como empresa."""
        return bool(p and p.is_company and p.user_type == 'juridico'
                    and (p.nit or p.vat or p.name_entity))

    def _mayorista_company(self, partner):
        """Devuelve la empresa (jurídico) del usuario, o False si aún no la tiene."""
        if self._es_empresa_real(partner):
            return partner
        if partner.parent_id and self._es_empresa_real(partner.parent_id):
            return partner.parent_id
        return False

    def _mayorista_docs_complete(self, company):
        """True si la empresa tiene subidos todos los documentos obligatorios."""
        Att = request.env['ir.attachment'].sudo()
        tipos = set(Att.search([
            ('res_model', '=', 'res.partner'), ('res_id', '=', company.id),
            ('document_type', 'in', self.MAYORISTA_DOCS_OBLIGATORIOS),
        ]).mapped('document_type'))
        return all(d in tipos for d in self.MAYORISTA_DOCS_OBLIGATORIOS)

    def _mayorista_stage(self, partner):
        """Decide la etapa del asistente de compra mayorista según lo que falte:
        'empresa' (faltan datos de empresa) → 'documentos' (faltan documentos
        obligatorios) → 'compra' (puede comprar)."""
        company = self._mayorista_company(partner)
        if not company:
            return 'empresa', None
        if not self._mayorista_docs_complete(company):
            return 'documentos', company
        return 'compra', company

    @http.route('/cevende/mayorista', type='http', auth='user', website=True, sitemap=False)
    def mayorista_checkout(self, **kw):
        order = request.website.sale_get_order()
        if not order or not order.website_order_line:
            return request.redirect('/shop')
        partner = request.env.user.partner_id
        stage, company = self._mayorista_stage(partner)

        # Paso 1 del asistente: datos de empresa (acreditación).
        if stage == 'empresa':
            states = request.env['res.country.state'].sudo().search(
                [('country_id.code', '=', 'CU')], order='name')
            return request.render('pyxel_cubaelectronica_website.cevende_mayorista_empresa', {
                'order': order, 'partner': partner, 'states': states, 'post': {},
            })

        # Paso 2 del asistente: documentos obligatorios (Fase C).
        if stage == 'documentos':
            return self._mayorista_render_documentos(order, company)

        # Paso 3 del asistente: datos de compra (direcciones de facturación y
        # entrega). El pago es un paso aparte (/cevende/mayorista/pago).
        return self._mayorista_render_datos(order, partner, company)

    def _mayorista_render_datos(self, order, partner, company):
        accredited = self._mayorista_is_accredited(company)
        cuba = request.env.ref('base.cu', raise_if_not_found=False)
        # Direcciones existentes de la empresa (la empresa + sus contactos hijos).
        all_addrs = company | company.child_ids
        # Facturación INTERNACIONAL: nunca de Cuba → se ocultan las direcciones
        # cuyo país es Cuba (el cliente añade una de otro país).
        billing_addrs = all_addrs.filtered(
            lambda a: (a.id == company.id or a.type in ('invoice', 'contact'))
            and (not cuba or a.country_id.id != cuba.id))
        delivery_addrs = all_addrs.filtered(lambda a: a.id == company.id or a.type in ('delivery', 'contact'))
        # Provincias de Cuba (para la entrega) y países (para la facturación, sin Cuba).
        states = request.env['res.country.state'].sudo().search(
            [('country_id.code', '=', 'CU')], order='name')
        countries = request.env['res.country'].sudo().search(
            [('code', '!=', 'CU')], order='name')
        return request.render('pyxel_cubaelectronica_website.cevende_mayorista_checkout', {
            'order': order, 'partner': partner, 'company': company, 'accredited': accredited,
            'billing_addrs': billing_addrs, 'delivery_addrs': delivery_addrs,
            'states': states, 'countries': countries,
        })

    def _mayorista_create_company(self, partner, post):
        """Crea la empresa (jurídico) como padre del usuario y le abre una
        oportunidad CRM 'en revisión' (etapa sin allows_sale)."""
        nit = (post.get('nit') or '').strip()
        vals = {
            'name': (post.get('name_entity') or '').strip(),
            'name_entity': (post.get('name_entity') or '').strip(),
            'is_company': True,
            'company_type': 'company',
            'user_type': 'juridico',
            'entity_type': post.get('entity_type') or False,
            'nit': nit or False,
            'vat': nit or False,
            'reeup': (post.get('reeup') or '').strip() or False,
            'social_object': (post.get('social_object') or '').strip() or False,
            'phone': (post.get('phone') or '').strip() or False,
            'street': (post.get('street') or '').strip() or False,
            'email': partner.email or False,
        }
        state_id = post.get('state_id')
        if state_id and state_id.isdigit() and int(state_id):
            vals['state_id'] = int(state_id)
        mun_id = post.get('municipality_id')
        if mun_id and mun_id.isdigit() and int(mun_id):
            mun = request.env['res.municipality'].sudo().browse(int(mun_id))
            if mun.exists():
                vals['city'] = mun.name
                if 'res_municipality_id' in request.env['res.partner']._fields:
                    vals['res_municipality_id'] = mun.id
        cuba = request.env.ref('base.cu', raise_if_not_found=False)
        if cuba:
            vals['country_id'] = cuba.id
        company = request.env['res.partner'].sudo().create(vals)
        partner.sudo().write({'parent_id': company.id})
        try:
            Stage = request.env['crm.stage'].sudo()
            stage = Stage.search([('allows_sale', '=', False)], limit=1) or Stage.search([], limit=1)
            if stage:
                request.env['crm.lead'].sudo().create({
                    'name': 'Acreditación %s' % company.name,
                    'partner_id': company.id,
                    'stage_id': stage.id,
                })
        except Exception as e:
            _logger.warning("Mayorista: no se pudo crear lead de acreditación: %s", e)
        return company

    @http.route('/cevende/mayorista/empresa', type='http', auth='user', website=True,
                methods=['POST'], csrf=True)
    def mayorista_empresa(self, **post):
        order = request.website.sale_get_order()
        if not order or not order.website_order_line:
            return request.redirect('/shop')
        partner = request.env.user.partner_id
        if self._mayorista_company(partner):
            return request.redirect('/cevende/mayorista')
        name = (post.get('name_entity') or '').strip()
        nit = (post.get('nit') or '').strip()
        if not name or not nit or not post.get('entity_type'):
            states = request.env['res.country.state'].sudo().search(
                [('country_id.code', '=', 'CU')], order='name')
            return request.render('pyxel_cubaelectronica_website.cevende_mayorista_empresa', {
                'order': order, 'partner': partner, 'states': states, 'post': post,
                'error': 'Completa al menos Nombre de la entidad, NIT y Tipo de entidad.',
            })
        self._mayorista_create_company(partner, post)
        return request.redirect('/cevende/mayorista')

    def _mayorista_docs_catalogo(self):
        """Documentos obligatorios con su etiqueta, en orden."""
        return [
            ('documento_constitutivo', 'Documento constitutivo de la firma o compañía'),
            ('documento_existencia', 'Documento que acredite la existencia legal de la firma o compañía'),
            ('documento_registro_mercantil', 'Certificación del Registro Mercantil o Registro Público'),
            ('documento_registro_contribuyente', 'Certificación de inscripción en el Registro de Contribuyente'),
            ('documento_licencia_comercio', 'Licencia de la Cámara de Comercio de Cuba'),
            ('documento_carta_timbrada', 'Carta timbrada con la intención de negocios'),
            ('documento_carnet_acorec', 'Carnet de ACOREC o permiso de trabajo del representante'),
            ('documento_perfil_cliente', 'Perfil del cliente'),
        ]

    def _mayorista_render_documentos(self, order, company):
        Att = request.env['ir.attachment'].sudo()
        subidos = set(Att.search([
            ('res_model', '=', 'res.partner'), ('res_id', '=', company.id),
            ('document_type', 'in', self.MAYORISTA_DOCS_OBLIGATORIOS),
        ]).mapped('document_type'))
        docs = [{'key': k, 'label': lbl, 'done': k in subidos}
                for k, lbl in self._mayorista_docs_catalogo()]
        return request.render('pyxel_cubaelectronica_website.cevende_mayorista_documentos', {
            'order': order, 'company': company, 'docs': docs,
            'faltan': sum(1 for d in docs if not d['done']),
        })

    @http.route('/cevende/mayorista/documentos', type='http', auth='user', website=True,
                methods=['POST'], csrf=True)
    def mayorista_documentos(self, **post):
        order = request.website.sale_get_order()
        if not order or not order.website_order_line:
            return request.redirect('/shop')
        partner = request.env.user.partner_id
        company = self._mayorista_company(partner)
        if not company:
            return request.redirect('/cevende/mayorista')
        allowed = ('.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif')
        max_size = 10 * 1024 * 1024
        Att = request.env['ir.attachment'].sudo()
        for key in self.MAYORISTA_DOCS_OBLIGATORIOS:
            file = request.httprequest.files.get(key)
            if not file or not file.filename or not file.filename.strip():
                continue
            ext = os.path.splitext(file.filename.lower())[1]
            if ext not in allowed:
                continue
            data = file.read()
            if not data or len(data) > max_size:
                continue
            # Reemplaza un documento previo del mismo tipo (re-subida).
            Att.search([('res_model', '=', 'res.partner'), ('res_id', '=', company.id),
                        ('document_type', '=', key)]).unlink()
            Att.create({
                'name': file.filename, 'datas': base64.b64encode(data),
                'res_model': 'res.partner', 'res_id': company.id, 'type': 'binary',
                'document_type': key,
            })
        return request.redirect('/cevende/mayorista')

    def _mayorista_is_accredited(self, company):
        """True si la empresa tiene un lead CRM en una etapa con allows_sale."""
        Lead = request.env['crm.lead'].sudo()
        lead = Lead.search([('partner_id', '=', company.id)], limit=1)
        return bool(lead and lead.stage_id and lead.stage_id.allows_sale)

    def _mayorista_resolve_address(self, post, prefix, company, addr_type):
        """Devuelve el id de la dirección elegida; si es 'new', la crea como hijo
        de la empresa. Si falta data en 'new', cae a la empresa."""
        sel = post.get('%s_id' % prefix)
        if sel and sel != 'new' and sel.isdigit():
            return int(sel)
        name = (post.get('%s_name' % prefix) or '').strip()
        street = (post.get('%s_street' % prefix) or '').strip()
        if not (name and street):
            return company.id
        vals = {'name': name, 'street': street, 'parent_id': company.id, 'type': addr_type}
        phone = (post.get('%s_phone' % prefix) or '').strip()
        if phone:
            vals['phone'] = phone

        if prefix == 'billing':
            # Facturación INTERNACIONAL: país (≠ Cuba) + estado/provincia + ciudad
            # + código postal. Como en los comercios internacionales.
            cuba = request.env.ref('base.cu', raise_if_not_found=False)
            country_id = post.get('billing_country_id')
            if country_id and country_id.isdigit() and int(country_id):
                country = request.env['res.country'].sudo().browse(int(country_id))
                if country.exists() and (not cuba or country.id != cuba.id):
                    vals['country_id'] = country.id
            state_id = post.get('billing_state_id')
            if state_id and state_id.isdigit() and int(state_id):
                vals['state_id'] = int(state_id)
            city = (post.get('billing_city') or '').strip()
            if city:
                vals['city'] = city
            zip_code = (post.get('billing_zip') or '').strip()
            if zip_code:
                vals['zip'] = zip_code
            return request.env['res.partner'].sudo().create(vals).id

        # Entrega (Cuba): provincia + municipio.
        state_id = post.get('%s_state_id' % prefix)
        if state_id and state_id.isdigit() and int(state_id):
            vals['state_id'] = int(state_id)
        mun_id = post.get('%s_municipality_id' % prefix)
        if mun_id and mun_id.isdigit() and int(mun_id):
            mun = request.env['res.municipality'].sudo().browse(int(mun_id))
            if mun.exists():
                vals['city'] = mun.name
                if 'municipality_id' in request.env['res.partner']._fields:
                    vals['municipality_id'] = mun.id
        cuba = request.env.ref('base.cu', raise_if_not_found=False)
        if cuba:
            vals['country_id'] = cuba.id
        return request.env['res.partner'].sudo().create(vals).id

    @http.route('/cevende/mayorista/pago', type='http', auth='user', website=True,
                methods=['POST'], csrf=True)
    def mayorista_pago(self, **post):
        """Paso 4 del asistente: selección del mecanismo de pago. En POST guarda
        primero las direcciones elegidas en el paso de datos."""
        order = request.website.sale_get_order()
        if not order or not order.website_order_line:
            return request.redirect('/shop')
        partner = request.env.user.partner_id
        stage, company = self._mayorista_stage(partner)
        if stage != 'compra' or not company:
            return request.redirect('/cevende/mayorista')

        # Direcciones de facturación y entrega (elegidas o nuevas).
        billing_id = self._mayorista_resolve_address(post, 'billing', company, 'invoice')
        shipping_id = self._mayorista_resolve_address(post, 'delivery', company, 'delivery')
        vals = {'partner_id': company.id}
        if billing_id:
            vals['partner_invoice_id'] = billing_id
        if shipping_id:
            vals['partner_shipping_id'] = shipping_id
        order.sudo().write(vals)
        # Se guardan en sesión: el siguiente paso (process) llama de nuevo a
        # sale_get_order(), que vuelve a fijar el partner del pedido al usuario
        # logueado; hay que reaplicar empresa + direcciones antes de confirmar.
        request.session['cv_mayorista_addr'] = {
            'partner': company.id, 'invoice': billing_id, 'shipping': shipping_id,
        }

        return request.render('pyxel_cubaelectronica_website.cevende_mayorista_pago', {
            'order': order, 'company': company,
            'providers': self._cevende_providers(),
        })

    @http.route('/cevende/mayorista/process', type='http', auth='user', website=True,
                methods=['POST'], csrf=True)
    def mayorista_process(self, **post):
        order = request.website.sale_get_order()
        if not order or not order.website_order_line:
            return request.redirect('/shop')
        partner = request.env.user.partner_id
        # Gate de acreditación: solo se puede confirmar si la empresa está
        # creada y tiene los documentos obligatorios subidos.
        stage, company = self._mayorista_stage(partner)
        if stage != 'compra' or not company:
            return request.redirect('/cevende/mayorista')

        # Proveedor elegido.
        provider_id = post.get('provider_id')
        provider = None
        if provider_id and provider_id != '0':
            provider = request.env['payment.provider'].sudo().browse(int(provider_id))
            if not provider.exists():
                provider = None

        # Mecanismo con comprobante (transferencia, Zelle): mostrar el detalle
        # (instrucciones + subir comprobante) si aún no se ha confirmado.
        if provider and provider.cv_requires_proof and not post.get('cv_confirm'):
            return request.render('pyxel_cubaelectronica_website.cevende_mayorista_detalle', {
                'order': order, 'company': company, 'provider': provider,
            })

        # Reaplicar empresa + direcciones (sale_get_order las resetea al usuario).
        addr = request.session.get('cv_mayorista_addr') or {}
        ovals = {'partner_id': company.id}
        if addr.get('invoice'):
            ovals['partner_invoice_id'] = addr['invoice']
        if addr.get('shipping'):
            ovals['partner_shipping_id'] = addr['shipping']
        order.sudo().write(ovals)

        # Asignar proveedor y confirmar.
        self._cevende_asignar_proveedor(order, provider)
        if order.state == 'draft':
            order.sudo().action_confirm()
        if hasattr(order, 'ordered_by_user_id'):
            order.sudo().write({'ordered_by_user_id': request.env.user.id})
        if post.get('cv_confirm'):
            self._cevende_adjuntar_comprobante(order)
        request.session.pop('cv_mayorista_addr', None)
        order_id = order.id

        # Confirmación AUTOMÁTICA según método de pago
        if provider and provider.code == 'tropipay':
            pay_link = None
            try:
                pay_link = order.sudo().tpp_link
            except Exception as e:
                _logger.warning("Tropipay (mayorista) %s: %s", order.name, e)
            request.website.sale_reset()
            if pay_link and pay_link != 'invalid_url':
                return request.redirect(pay_link, local=False)
            return request.redirect('/cevende/checkout/done/%s?pay_error=1' % order_id)

        # Transferencia / manual → confirmación con instrucciones
        try:
            tmpl = request.env.ref('pyxel_cem_website_sale.custom_order_confirmation_email', False)
            if tmpl:
                tmpl.sudo().send_mail(order.id, force_send=False)
        except Exception:
            pass
        request.website.sale_reset()
        return request.redirect('/cevende/checkout/done/%s' % order_id)


class CevendeCartController(http.Controller):
    """Endpoint JSON para el drawer lateral del carrito (Fase 2)."""

    @http.route('/cevende/cart/data', type='json', auth='public', website=True)
    def cart_data(self):
        order = request.website.sale_get_order()
        lines = []
        if order:
            for line in order.website_order_line:
                if line.display_type:  # saltar secciones/notas
                    continue
                product = line.product_id
                lines.append({
                    'line_id': line.id,
                    'product_id': product.id,
                    'name': product.display_name,
                    'url': product.product_tmpl_id.website_url or '#',
                    'qty': int(line.product_uom_qty),
                    'price': line.price_unit,
                    'subtotal': line.price_subtotal,
                    'image': '/web/image/product.product/%s/image_256' % product.id,
                })
        return {
            'lines': lines,
            'quantity': order.cart_quantity if order else 0,
            'amount': order.amount_total if order else 0.0,
            'currency': (order.currency_id.symbol if order else '$') or '$',
        }


class HomePageController(http.Controller):

    def format_price(self, price):
        if not price:
            return "0.00"
        try:
            return "{:,.2f}".format(float(price))
        except (ValueError, TypeError):
            return "0.00"

    @http.route(['/', '/home'], auth='public', type='http', website=True)
    def home_page(self, **kwargs):
        base_domain = [('is_published', '=', True), ('qty_available', '>', 0)]

        # Banner carousel
        carrusel_productos = request.env['product.template'].sudo().search(
            base_domain + [('show_in_banner', '=', True)])
        carrusel_personalizados = request.env['carousel.customization'].sudo().search(
            [('active', '=', True)])

        carrusel_combinado = []
        for producto in carrusel_productos:
            carrusel_combinado.append({'type': 'product', 'record': producto})
        for personalizado in carrusel_personalizados:
            carrusel_combinado.append({'type': 'custom', 'record': personalizado})

        # Productos minorista
        productos_retail = request.env['product.template'].sudo().search(
            base_domain + [('sale_type', 'in', ['retail', 'both'])])

        # Productos mayorista
        productos_mayorista = request.env['product.template'].sudo().search(
            base_domain + [('sale_type', 'in', ['wholesale', 'both'])])

        # Más vendidos (compatibilidad con lógica existente)
        categoria_vendidos = request.env['product.category'].sudo().search(
            [('name', '=', 'Más vendidos')], limit=1)
        vendidos = request.env['product.template'].sudo().search(
            base_domain + [('categ_id', '=', categoria_vendidos.id)],
            order='create_date desc') \
            if categoria_vendidos else request.env['product.template']

        # Ofertas
        categoria_oferta = request.env['product.category'].sudo().search(
            [('name', '=', 'Ofertas y descuentos')], limit=1)
        oferta = request.env['product.template'].sudo().search(
            base_domain + [('categ_id', '=', categoria_oferta.id)]) \
            if categoria_oferta else request.env['product.template']

        # Vitrina "Marcas que trabajamos": se muestran TODAS las marcas marcadas
        # como relevantes, tengan o no stock publicado ahora mismo (es una vitrina
        # de marca/confianza, no de inventario).
        brands = request.env['product.template.mark'].sudo().search([
            ('is_relevant', '=', True),
        ])

        # Productos recién añadidos (últimos publicados con stock)
        productos_nuevos = request.env['product.template'].sudo().search(
            base_domain, order='create_date desc', limit=12)

        return request.render('pyxel_cubaelectronica_website.home_template', {
            'carrusel': carrusel_combinado,
            'banners': list(carrusel_personalizados),
            'productos_retail': productos_retail,
            'productos_mayorista': productos_mayorista,
            'vendidos': vendidos,
            'productos_nuevos': productos_nuevos,
            'brands': brands,
            'oferta': oferta,
            'format_price': self.format_price,
        })


class CuastomController(http.Controller):

    @http.route('/about/cuba_electronica', type='http', auth='public', website=True, methods=['GET', 'POST'])
    def about_us(self, **kwargs):
        return request.render('pyxel_cubaelectronica_website.about_cubaElectronica')


class WebsiteNewsletter(http.Controller):

    @http.route(
        ['/subscribe_newsletter'],
        type='http',
        auth='public',
        methods=['POST'],
        website=True,
        csrf=True,
    )
    def subscribe_newsletter(self, **post):
        email = post.get('email', '').strip()
        if email:
            Contact = request.env['mailing.contact'].sudo()
            contact = Contact.search([('email', '=', email)], limit=1)
            if not contact:
                Contact.create({'email': email})
        return request.redirect(request.httprequest.referrer or '/')


class WebsiteSaleMarkFilter(MyWebsiteSale):

    @http.route(['/shop/checkout'], type='http', auth='public', website=True, sitemap=False)
    def checkout(self, **post):
        """El checkout estándar de Odoo NO se usa en CEVENDE (exige login para
        invitados). El flujo minorista es /cevende/checkout (datos como invitado
        → login al pagar). Cualquier acceso al checkout estándar — la barra de
        pasos del carrito, enlaces antiguos, etc. — se redirige ahí para que el
        invitado pueda continuar sin muro de login en el carrito."""
        return request.redirect('/cevende/checkout')

    @http.route([
        '/shop/category/<model("product.public.category"):category>',
        '/shop/category/<model("product.public.category"):category>/page/<int:page>',
    ], type='http', auth='public', website=True, sitemap=False)
    def shop_category(self, category, page=0, **kw):
        """Las rutas de categoría se perdieron al redefinir /shop en los
        controllers base (pyxel_cem). Aquí se recuperan redirigiendo al
        formato con querystring que sí funciona (/shop?category=ID)."""
        params = dict(kw)
        params['category'] = category.id
        query = '&'.join('%s=%s' % (k, v) for k, v in params.items() if v not in (None, '', False))
        return request.redirect('/shop?' + query)

    @http.route(['/shop', '/shop/page/<int:page>'], type='http', auth="public", website=True, sitemap=True)
    def shop(self, page=0, category=None, search='', min_price=0.0, max_price=0.0, ppg=False, **post):
        response = super(WebsiteSaleMarkFilter, self).shop(
            page=page,
            category=category,
            search=search,
            min_price=min_price,
            max_price=max_price,
            ppg=ppg,
            **post,
        )

        if not hasattr(response, 'qcontext'):
            return response

        qcontext = response.qcontext

        # ── Filtro de marca ──────────────────────────────────────────────────
        brand_id = post.get('brand') or request.httprequest.args.get('brand', '')
        current_brand = None
        if brand_id and brand_id not in ('0', '', 'None', 'False', 'all'):
            try:
                current_brand = int(brand_id)
            except ValueError:
                current_brand = None

        published_field = self._get_product_published_field()
        active_category = qcontext.get('current_category') or category
        active_provider = qcontext.get('current_provider') or \
            request.httprequest.args.get('provider', None)

        marks_list = []
        published_products = request.env['product.template'].sudo().search(
            [(published_field, '=', True)])
        mark_ids = list(set(published_products.mapped('mark_id').ids))

        if mark_ids:
            marks = request.env['product.template.mark'].sudo().search(
                [('id', 'in', mark_ids)])
            for mark in marks:
                domain = [('mark_id', '=', mark.id), (published_field, '=', True)]
                if active_category:
                    try:
                        cat_id = int(active_category)
                        if cat_id:
                            domain.append(('public_categ_ids', 'in', [cat_id]))
                    except (ValueError, TypeError):
                        pass
                if active_provider:
                    try:
                        prov_id = int(active_provider)
                        if prov_id:
                            domain.append(('provider_id', '=', prov_id))
                    except (ValueError, TypeError):
                        pass
                count = request.env['product.template'].sudo().search_count(domain)
                if count > 0:
                    marks_list.append({'id': mark.id, 'name': mark.name, 'product_count': count})

        if current_brand:
            products = qcontext.get('products')
            if products is not None:
                filtered_products = products.filtered(lambda p: p.mark_id.id == current_brand)
                qcontext['products'] = filtered_products
                qcontext['search_count'] = len(filtered_products)
                if 'search_product' in qcontext:
                    qcontext['search_product'] = filtered_products
                self._rebuild_bins(qcontext, filtered_products)

        # ── Filtro mayorista / minorista ─────────────────────────────────────
        tipo = post.get('tipo') or request.httprequest.args.get('tipo', '')
        # Recordar el modo de compra elegido (contexto): minorista o mayorista.
        # Determina qué flujo se ofrece luego en el carrito/drawer (el flujo
        # mayorista "Cotizar" solo corre en contexto mayorista).
        if tipo in ('retail', 'wholesale'):
            request.session['cv_sale_mode'] = tipo
        if tipo in ('retail', 'wholesale'):
            products = qcontext.get('products')
            if products is not None:
                if tipo == 'retail':
                    filtered = products.filtered(lambda p: p.sale_type in ('retail', 'both'))
                else:
                    filtered = products.filtered(lambda p: p.sale_type in ('wholesale', 'both'))
                qcontext['products'] = filtered
                qcontext['search_count'] = len(filtered)
                if 'search_product' in qcontext:
                    qcontext['search_product'] = filtered
                self._rebuild_bins(qcontext, filtered)

        qcontext.update({
            'marks': marks_list,
            'current_brand': current_brand,
            'use_brand_filter': getattr(request.website, 'use_brand_filter', False),
            'current_category': active_category,
            'current_provider': active_provider,
            'current_tipo': tipo or 'all',
        })

        return response

    def _rebuild_bins(self, qcontext, filtered_products):
        filtered_ids = set(filtered_products.ids)
        raw_bins = qcontext.get('bins')
        if raw_bins is None:
            return
        ppr = qcontext.get('ppr', 4)
        new_bins, current_row = [], []
        try:
            for row in list(raw_bins):
                for cell in list(row):
                    product = cell.get('product')
                    if product and product.id in filtered_ids:
                        current_row.append(cell)
                        if len(current_row) == ppr:
                            new_bins.append(current_row)
                            current_row = []
        except Exception:
            pass
        if current_row:
            new_bins.append(current_row)
        qcontext['bins'] = new_bins

    def _get_search_domain(self, search, category, **kwargs):
        domain = super(WebsiteSaleMarkFilter, self)._get_search_domain(search, category, **kwargs)
        mark_domain = request.env.context.get('mark_filter_domain', [])
        if mark_domain:
            domain += mark_domain
        return domain
