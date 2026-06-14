# Part of Odoo. See LICENSE file for full copyright and licensing details

import json
from werkzeug.exceptions import Forbidden, NotFound
from odoo.http import request, route, Controller
from odoo import http, tools, fields
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.addons.payment.controllers import portal as payment_portal
from odoo.osv import expression
import werkzeug
from odoo.addons.website.controllers.main import QueryURL
from datetime import datetime
from pytz import timezone
from odoo.tools import lazy, str2bool
from odoo.addons.http_routing.models.ir_http import slug
from werkzeug import urls as wz_urls

import logging
_logger = logging.getLogger(__name__)


PPG = 20 


class ModalDelivery(WebsiteSale):

    @http.route('/set_delivery_address', type='http', methods=['POST'], auth='public', website=True, csrf=False)
    def set_delivery_address(self, **post):
        state = (post.get('state_modal_id') or '').strip()
        city  = (post.get('city_modal_id') or '').strip()
        cur_seller = (post.get('current_seller_id') or '').strip()

        def _clear_and_force_modal():
            for k in ('delivery_state','delivery_city','current_city_name',
                      'current_state_name','country_delivery_name','country_delivery_id',
                      'seller_no_delivery','_prev_delivery_state','_prev_delivery_city'):
                request.session.pop(k, None)
            request.session['force_delivery_modal'] = True
            return werkzeug.utils.redirect(request.httprequest.referrer or '/shop')

        if not state.isdigit() or not city.isdigit():
            return _clear_and_force_modal()

        # guarda los valores previos
        prev_state = int(request.session.get('delivery_state') or 0)
        prev_city  = int(request.session.get('delivery_city') or 0)
        request.session['_prev_delivery_state'] = prev_state
        request.session['_prev_delivery_city']  = prev_city

        # aplica de momento la nueva ubicación
        request.session['delivery_state'] = int(state)
        request.session['delivery_city']  = int(city)

        website = request.env['website'].sudo().get_current_website()
        if hasattr(website, 'ensure_valid_delivery_session'):
            ctx = website.ensure_valid_delivery_session()
            if not ctx or not ctx.get('municipality_id'):
                return _clear_and_force_modal()
        else:
            valid_sellers = request.env['res.partner'].sudo().search([
                ('seller','=',True),
                '|', ('is_published','=',True), ('website_published','=',True)
            ]).ids
            ok = bool(request.env['warehouse.delivery'].sudo().search_count([
                ('seller_id','in', valid_sellers),
                ('municipality_id','=', int(city))
            ]))
            if not ok:
                return _clear_and_force_modal()

        # cart wipe si cambia la ubicación
        order = request.website.sale_get_order()
        if order and (prev_state != int(state) or prev_city != int(city)):
            order.sudo().order_line.unlink()

        # si estamos en /shop?seller_id=X y X no entrega a la nueva ciudad -> disparar modal
        try:
            ref = request.httprequest.referrer or ''
            parsed = wz_urls.url_parse(ref)
            q = wz_urls.url_decode(parsed.query)
            seller_id = q.get('seller_id') or cur_seller
            if seller_id and str(seller_id).isdigit():
                seller_id = int(seller_id)
                has_delivery = bool(request.env['seller.delivery'].sudo().search_count([
                    ('seller_id', '=', seller_id),
                    ('municipality_id',   '=', int(city)),
                ]))
                if not has_delivery:
                    seller = request.env['res.partner'].sudo().browse(seller_id)
                    # bandera para mostrar modal (excepto en /sellers por el filtro JS)
                    request.session['seller_no_delivery'] = {
                        'seller_name': seller.name or '',
                    }
        except Exception:
            pass

        # set names for header label
        state_rec = request.env['res.country.state'].sudo().browse(int(state))
        request.session['current_state_name']    = state_rec.name
        request.session['country_delivery_name'] = state_rec.country_id.name
        request.session['country_delivery_id']   = state_rec.country_id.id
        
        for key in ['force_delivery_modal', 'seller_no_delivery']:
            request.session.pop(key, None)


        return werkzeug.utils.redirect(request.httprequest.referrer or '/shop')



    @http.route('/revert_delivery_change', type='json', auth='public', website=True, csrf=False)
    def revert_delivery_change(self):
        prev_state = request.session.get('_prev_delivery_state')
        prev_city  = request.session.get('_prev_delivery_city')
        if prev_state and prev_city:
            request.session['delivery_state'] = int(prev_state)
            request.session['delivery_city']  = int(prev_city)
        # limpia banderas
        for k in ('seller_no_delivery','force_delivery_modal','_prev_delivery_state','_prev_delivery_city'):
            request.session.pop(k, None)
        return {'ok': True}
    
    #  limpiar bandera y redirigir a /sellers manteniendo la nueva ubicación
    @http.route('/go_sellers_keep_location', type='http', auth='public', website=True)
    def go_sellers_keep_location(self):
        for k in ('seller_no_delivery','force_delivery_modal','_prev_delivery_state','_prev_delivery_city'):
            request.session.pop(k, None)
        return werkzeug.utils.redirect('/sellers')

    @http.route('/dismiss_seller_no_delivery', type='json', auth='public', website=True)
    def dismiss_seller_no_delivery(self):
        # descarta la nueva ubicación y cierra el modal
        request.session.pop('seller_no_delivery', None)
        request.session.pop('pending_delivery', None)
        try:
            request.session.modified = True
        except Exception:
            pass
        return True
 
    @http.route('/get_website_cities', type='json', auth='public', website=True)
    def get_website_cities(self, state_id=None, **kw):
        res = {}
        if state_id:
            cities = request.env['seller.delivery'].sudo().search([
                ('municipality_id.state_id', '=', int(state_id))]).mapped('municipality_id')
            res = {str(x.id): x.name for x in cities}
        return res


    def _get_shop_domain(self, search, category, attrib_values, search_in_description=True):
        domains = super()._get_shop_domain(search, category, attrib_values, search_in_description)

        municipality_id = request.session.get('delivery_city')
        if not municipality_id:
            return domains

        try:
            municipality_id = int(municipality_id)
        except Exception:
            return domains

        # Buscar almacenes que entregan en ese municipio
        warehouses = request.env['warehouse.delivery'].sudo().search([
            ('municipality_id', '=', municipality_id)
        ]).mapped('warehouse_id')

        if not warehouses:
            return domains + [('id', '=', 0)]  # nadie entrega → no mostrar nada

        # Obtener ubicaciones de stock de esos almacenes
        stock_locations = warehouses.mapped('lot_stock_id')

        # Productos con stock disponible > 0 en esas ubicaciones
        quant_domain = [
            ('location_id', 'child_of', stock_locations.ids),
            ('quantity', '>', 0),
            ('product_id.active', '=', True),
        ]

        product_tmpl_ids = request.env['stock.quant'].sudo().search(quant_domain).mapped('product_id.product_tmpl_id').ids

        if not product_tmpl_ids:
            return domains + [('id', '=', 0)]

        return domains + [('id', 'in', product_tmpl_ids)]
    
    @http.route(['/shop', '/shop/page/<int:page>'], type='http', auth="public", website=True)
    def shop(self, page=0, **kwargs):
        return super().shop(page=page, **kwargs)

    def _is_importadora_installed(self):
        """Verifica si el módulo pyxel_import_backend está instalado"""
        try:
            module = request.env['ir.module.module'].sudo().search([
                ('name', '=', 'pyxel_import_backend'),
                ('state', '=', 'installed')
            ])
            return bool(module)
        except Exception:
            return False

    def _get_company_billing_data(self, partner):
        """
        Obtiene los datos de la compañía asociada al contacto para facturación
        """
        if not self._is_importadora_installed():
            return None

        # Buscar si el partner tiene una compañía asociada
        company_partner = None

        # Si el partner actual es una compañía
        if partner.is_company:
            company_partner = partner
        # Si el partner tiene una compañía padre
        elif partner.parent_id and partner.parent_id.is_company:
            company_partner = partner.parent_id
        # Buscar compañía por nombre similar o relación comercial
        else:
            # Buscar compañías con el mismo nombre o similar
            companies = request.env['res.partner'].sudo().search([
                ('is_company', '=', True),
                ('name', 'ilike', partner.name),
                ('active', '=', True)
            ], limit=1)
            if companies:
                company_partner = companies[0]

        if company_partner:
            return {
                'name': company_partner.name,
                'company_name': company_partner.name,
                'vat': company_partner.vat,
                'street': company_partner.street,
                'street2': company_partner.street2,
                'city': company_partner.city,
                'municipality_id': company_partner.municipality_id.id if hasattr(company_partner,
                                                                                 'municipality_id') else False,
                'state_id': company_partner.state_id.id if company_partner.state_id else False,
                'country_id': company_partner.country_id.id if company_partner.country_id else False,
                'zip': company_partner.zip,
                'phone': company_partner.phone,
                'email': company_partner.email,  # Asegurar que el email se incluya
            }
        return None



    def sale_product_domain(self):
        """
        Dominio base de productos del shop + filtro por zona y por stock
        en almacenes que entregan al municipio seleccionado.
        """
        domain = super(Website, self).sale_product_domain()

        # tu filtro existente
        domain += [('available_in_delivery_zone', '=', True)]

        municipality_id = self._get_selected_municipality_id()
        if municipality_id:
            warehouses = self._get_warehouses_for_municipality(municipality_id)
            tmpl_ids = self._get_template_ids_with_stock_in_warehouses(warehouses)

            # si no hay stock en esos almacenes -> vacía resultados
            domain += [('id', 'in', tmpl_ids or [0])]

        return domain

    @http.route('/shop/set_need_home_delivery', type='json', auth='public', website=True, csrf=False)
    def set_need_home_delivery(self, need_home_delivery=False, **kwargs):
        order = request.website.sale_get_order()
        if not order:
            return {'success': False}

        need_home_delivery = str(need_home_delivery).lower() in ('1', 'true', 'on', 'yes')

        vals = {
            'need_home_delivery': need_home_delivery,
        }

        if not need_home_delivery and order.partner_invoice_id:
            vals.update({
                'partner_shipping_id': order.partner_invoice_id.id,
                'carrier_id': False,
            })

        order.sudo().write(vals)

        if not need_home_delivery and hasattr(order, '_remove_delivery_line'):
            order._remove_delivery_line()

        _logger.info(
            "[pickup][set_need_home_delivery] order=%s need=%s inv=%s ship=%s carrier=%s",
            order.id,
            order.need_home_delivery,
            order.partner_invoice_id.id if order.partner_invoice_id else False,
            order.partner_shipping_id.id if order.partner_shipping_id else False,
            order.carrier_id.id if order.carrier_id else False,
        )
        return {'success': True}


    def _is_pickup(self, order):
        return bool(order and not order.need_home_delivery)


    def _apply_pickup_mode(self, order):
        if not self._is_pickup(order) or not order.partner_invoice_id:
            return

        vals = {}
        if order.partner_shipping_id != order.partner_invoice_id:
            vals['partner_shipping_id'] = order.partner_invoice_id.id
        if order.carrier_id:
            vals['carrier_id'] = False

        if vals:
            order.sudo().write(vals)

        if hasattr(order, '_remove_delivery_line'):
            order._remove_delivery_line()

        _logger.info(
            "[pickup][_apply_pickup_mode] order=%s inv=%s ship=%s carrier=%s",
            order.id,
            order.partner_invoice_id.id if order.partner_invoice_id else False,
            order.partner_shipping_id.id if order.partner_shipping_id else False,
            order.carrier_id.id if order.carrier_id else False,
        )


    def _billing_redirect_if_invalid(self, order):
        partner_invoice = order.partner_invoice_id
        if not partner_invoice or not self._check_billing_partner_mandatory_fields(partner_invoice):
            partner_id = partner_invoice.id if partner_invoice else order.partner_id.id
            return request.redirect('/shop/address?partner_id=%d&mode=billing' % partner_id)
        return None


    def checkout_check_address(self, order):
        if self._is_pickup(order):
            redirection = self._billing_redirect_if_invalid(order)
            if redirection:
                return redirection
            self._apply_pickup_mode(order)
            return
        return super().checkout_check_address(order)


    def _get_shop_payment_errors(self, order):
        if order and self._is_pickup(order):
            return []
        return super()._get_shop_payment_errors(order)


    @http.route('/shop/cart/update_address', type='http', auth='public', methods=['POST'], website=True)
    def update_cart_address(self, partner_id, mode='billing', **kw):
        res = super().update_cart_address(partner_id, mode=mode, **kw)
        order = request.website.sale_get_order()

        if order and self._is_pickup(order) and mode == 'billing':
            self._apply_pickup_mode(order)

        return res


    @http.route(['/shop/confirm_order'], type='http', auth='public', website=True, sitemap=False)
    def confirm_order(self, **post):
        order = request.website.sale_get_order()

        if self._is_pickup(order):
            self._apply_pickup_mode(order)

            redirection = self.checkout_redirection(order) or self._billing_redirect_if_invalid(order)
            if redirection:
                return redirection

            order.order_line._compute_tax_id()
            request.website.sale_get_order(update_pricelist=True)

            extra_step = request.website.viewref('website_sale.extra_info')
            if extra_step.active:
                return request.redirect("/shop/extra_info")

            return request.redirect("/shop/payment")

        return super().confirm_order(**post)

    @http.route(['/shop/country_infos/<model("res.country"):country>'], type='json', auth="public", methods=['POST'],
                website=True)
    def country_infos(self, country, mode, **kw):
        fields = country.get_address_fields()
        municipality_ids = request.env['res.municipality'].search([('country_id', '=', country.id)])
        return dict(
            fields=fields,
            states=[(st.id, st.name, st.code) for st in country.get_website_sale_states(mode=mode)],
            cities=[(ct.id, ct.name, getattr(ct, 'code', '') or '', ct.state_id.id) for ct in municipality_ids],
            phone_code=country.phone_code,
            zip_required=country.zip_required,
            state_required=country.state_required,
            city_required=country.enforce_cities,
        )
        
    def _get_mandatory_fields_billing(self, country_id=False):
        req = ["name", "email", "street", "city", "country_id", "phone"]
        if country_id:
            country = request.env['res.country'].browse(country_id)
            if country.state_required:
                req += ['state_id']
            if country.zip_required:
                req += ['zip']
        return req

    def _get_mandatory_fields_shipping(self, country_id=False):
            req = ["name", "street", "city", "country_id", "phone", "email"]
            if country_id:
                country = request.env['res.country'].browse(country_id)
                if country.state_required:
                    req += ['state_id']
                if country.zip_required:
                    req += ['zip']
            return req
        
    def _get_shop_payment_values(self, order, **kwargs):
        values = super()._get_shop_payment_values(order, **kwargs)

        if order and self._is_pickup(order):
            values['errors'] = []
            values['only_services'] = True
            values['shipping_info_required'] = False
            values.pop('deliveries', None)
            values.pop('delivery_has_storable', None)
            values.pop('delivery_action_id', None)

        return values

    @http.route('/shop/payment', type='http', auth='public', website=True, sitemap=False)
    def shop_payment(self, **post):
        order = request.website.sale_get_order()

        request.update_context(is_real_payment_page=False)

        if order:
            redirection = self.checkout_redirection(order)
            if redirection:
                return redirection

            # PICKUP: no exigir shipping ni validar municipio contra shipping
            if self._is_pickup(order):
                billing_redirect = self._billing_redirect_if_invalid(order)
                if billing_redirect:
                    return billing_redirect

                self._apply_pickup_mode(order)
                request.update_context(is_real_payment_page=True)

                values = self._get_shop_payment_values(order, **post)
                values['only_services'] = True
                values['errors'] = []
                values['shipping_info_required'] = False
                values.pop('deliveries', None)
                values.pop('delivery_has_storable', None)
                values.pop('delivery_action_id', None)

                return request.render("website_sale.payment", values)

            # DELIVERY: mantener lógica actual de develop
            municipality_id = int(request.session.get('delivery_city') or 0) or False
            if not municipality_id:
                return request.redirect("/")

            shipping_mun = order.partner_shipping_id.municipality_id.id if order.partner_shipping_id else False
            if municipality_id != shipping_mun:
                values = self.checkout_values(order, **post)
                values['invalid_address'] = True
                return request.render('website_sale.checkout', values)

            request.update_context(is_real_payment_page=True)

        return super().shop_payment(**post)
class AddressForm(ModalDelivery):

    def _get_shop_payment_values(self, order, **kwargs):
        values = super()._get_shop_payment_values(order, **kwargs)

        # Si el módulo importadora está instalado, desactivamos autocompletado de teléfono
        if self._is_importadora_installed():
            values['disable_phone_autocomplete'] = True

        return values

    @http.route(['/shop/address'], type='http', methods=['GET', 'POST'], auth="public", website=True, sitemap=False)
    def address(self, **kw):
        Partner = request.env['res.partner'].with_context(show_address=1).sudo()
        order = request.website.sale_get_order()
        partner_sudo = False

        if self._is_pickup(order):
            kw = dict(kw)
            if kw.get('mode') != 'shipping':
                kw['use_same'] = '1'
        
        redirection = self.checkout_redirection(order)
        if redirection:
            return redirection

        can_edit_vat = False
        values, errors = {}, {}
        mode = None

        # Saneo seguro de partner_id (evita int(''))
        partner_id_str = (kw.get('partner_id') or '').strip()
        partner_id = int(partner_id_str) if partner_id_str.isdigit() else -1

        # ===== NUEVA LÓGICA: Cargar datos de compañía si aplica =====
        company_loaded = False
        company_data = None

        if self._is_importadora_installed():
            # Obtener el partner actual
            current_partner = None
            if partner_id > 0:
                current_partner = Partner.browse(partner_id)
            elif order and order.partner_id:
                current_partner = order.partner_id

            # Si hay un partner y es de tipo compañía o tiene compañía asociada
            if current_partner:
                company_data = self._get_company_billing_data(current_partner)
                if company_data:
                    # Si estamos en modo facturación y no hay valores previos, cargar los de la compañía
                    mode_type = kw.get('mode', 'billing')
                    if mode_type == 'billing' and not kw.get('submitted'):
                        # Cargar los datos de la compañía en el formulario
                        for field, value in company_data.items():
                            if value and field not in kw:
                                kw[field] = value
                                company_loaded = True

                        # *** NUEVO: Para el teléfono, NO aplicamos formato automático ***
                        # Solo cargamos el teléfono tal cual está en la compañía
                        if company_data.get('phone') and not kw.get('phone'):
                            kw['phone'] = company_data['phone']
                            # Eliminamos cualquier intento de formato automático
                            if 'phone' in kw:
                                # Limpiamos cualquier prefijo que se haya añadido automáticamente
                                phone_value = kw['phone']
                                # Si el teléfono ya tiene +53 o 53, lo dejamos como está
                                # pero NO añadimos nada automáticamente
                                if phone_value and not phone_value.startswith('+') and not phone_value.startswith('53'):
                                    # No hacemos nada, respetamos el valor original
                                    pass

                        _logger.info(f"Cargando datos de compañía para facturación: {company_data['name']}")

        if order._is_public_order():
            mode = ('new', 'billing')
            can_edit_vat = True
        else:  # IF ORDER LINKED TO A PARTNER
            if partner_id > 0:
                if partner_id == order.partner_id.id:
                    # Si se modifica el cliente principal del SO -> 'billing'
                    can_edit_vat = order.partner_id.can_edit_vat()
                    mode = ('edit', 'billing')
                else:
                    address_mode = kw.get('mode')
                    if not address_mode:
                        if partner_id == order.partner_invoice_id.id:
                            address_mode = 'billing'
                        elif partner_id == order.partner_shipping_id.id:
                            address_mode = 'shipping'

                    # Asegurar que la dirección exista y pertenezca al cliente del SO
                    partner_sudo = Partner.browse(partner_id).exists()
                    partners_sudo = Partner.search(
                        [('id', 'child_of', order.partner_id.commercial_partner_id.ids)]
                    )
                    mode = ('edit', address_mode)
                    if address_mode == 'billing':
                        billing_partners = partners_sudo.filtered(lambda p: p.type != 'delivery')
                        if partner_sudo not in billing_partners:
                            raise Forbidden()
                    elif address_mode == 'shipping':
                        shipping_partners = partners_sudo.filtered(lambda p: p.type != 'invoice')
                        if partner_sudo not in shipping_partners:
                            raise Forbidden()

                    can_edit_vat = partner_sudo.can_edit_vat()

                if mode and partner_id != -1:
                    values = Partner.browse(partner_id)
                    # Si cargamos datos de compañía, asegurar que email y phone se actualicen
                    if company_loaded and company_data:
                        if company_data.get('email'):
                            values.email = company_data['email']
                        if company_data.get('phone'):
                            values.phone = company_data['phone']
            elif partner_id == -1:
                mode = ('new', kw.get('mode') or 'shipping')
            else:  # sin modo - refrescar sin post
                return request.redirect('/shop/checkout')

        # IF POSTED
        if 'submitted' in kw and request.httprequest.method == "POST":
            pre_values = self.values_preprocess(kw)
            errors, error_msg = self.checkout_form_validate(mode, kw, pre_values)
            post, errors, error_msg = self.values_postprocess(order, mode, pre_values, errors, error_msg)

            # --- Saneo de municipality_id / city antes de guardar ---
            municipality_id_str = (kw.get('municipality_id') or '').strip()
            if municipality_id_str.isdigit():
                post['municipality_id'] = int(municipality_id_str)
            elif kw.get('city'):
                post['city'] = kw['city']
            # -----------------------------------------------

            if errors:
                errors['error_message'] = error_msg
                values = kw
            else:
                update_mode, address_mode = mode
                partner_id = self._checkout_form_save(mode, post, kw)
                # Cuando partner_id no pertenece a shipping puede devolver Forbidden()
                if isinstance(partner_id, Forbidden):
                    return partner_id

                fpos_before = order.fiscal_position_id
                update_values = {}
                if update_mode == 'new':  # New address
                    if order._is_public_order():
                        update_values['partner_id'] = partner_id

                    if address_mode == 'billing':
                        update_values['partner_invoice_id'] = partner_id
                        if self._is_pickup(order) or kw.get('use_same'):
                            update_values['partner_shipping_id'] = partner_id
                        elif (
                                order._is_public_order()
                                and not kw.get('callback')
                                and not order.only_services
                        ):
                            kw['callback'] = '/shop/address'
                    elif address_mode == 'shipping':
                        update_values['partner_shipping_id'] = partner_id
                elif update_mode == 'edit':  # Updating an existing address
                    if order.partner_id.id == partner_id:
                        # Editar el partner principal del SO -> recomputar fpos y relacionados
                        update_values['partner_id'] = partner_id

                    if address_mode == 'billing':
                        update_values['partner_invoice_id'] = partner_id
                        if self._is_pickup(order):
                            update_values['partner_shipping_id'] = partner_id
                        elif not kw.get('callback') and not order.only_services:
                            kw['callback'] = '/shop/checkout'
                    elif address_mode == 'shipping':
                        update_values['partner_shipping_id'] = partner_id

                order.write(update_values)
                if self._is_pickup(order):
                    self._apply_pickup_mode(order)

                if order.fiscal_position_id != fpos_before:
                    # Recalcular impuestos si cambió la fpos
                    order._recompute_taxes()

                if 'partner_id' in update_values:
                    # Forzar recomputo de pricelist si cambió el cliente principal
                    request.website.sale_get_order(update_pricelist=True)

                # TDE FIXME: don't ever do this
                order.message_partner_ids = [(4, partner_id), (3, request.website.partner_id.id)]

                # --- Actualización segura de la ciudad sobre el partner guardado ---
                partner_to_update = request.env['res.partner'].sudo().browse(partner_id).exists()
                if partner_to_update:
                    municipality_id_str = (kw.get('municipality_id') or '').strip()
                    if municipality_id_str.isdigit():
                        city = request.env['res.municipality'].sudo().browse(int(municipality_id_str))
                        if city.exists():
                            partner_to_update.write({'municipality_id': city.id, 'city': city.name})
                    elif kw.get('city'):
                        partner_to_update.write({'city': kw['city']})
                # -------------------------------------------------------------------

                return request.redirect(kw.get('callback') or '/shop/confirm_order')

        # (Opcional) Soportar actualización por GET de la ciudad (blindado y solo si hay partner_sudo)
        if request.httprequest.method == "GET" and partner_sudo:
            municipality_id_str = (kw.get('municipality_id') or '').strip()
            if municipality_id_str.isdigit():
                city = request.env['res.municipality'].sudo().browse(int(municipality_id_str))
                if city.exists():
                    partner_sudo.write({'municipality_id': city.id, 'city': city.name})
            elif kw.get('city'):
                partner_sudo.write({'city': kw['city']})

        is_public_user = request.website.is_public_user()

        # Asegurar que los valores de email y phone estén disponibles para la vista
        if company_loaded and company_data:
            if not kw.get('email') and company_data.get('email'):
                kw['email'] = company_data['email']
            if not kw.get('phone') and company_data.get('phone'):
                kw['phone'] = company_data['phone']
            # values es un objeto res.partner, no un diccionario
            if values and hasattr(values, 'email') and not values.email and company_data.get('email'):
                values.email = company_data['email']
            if values and hasattr(values, 'phone') and not values.phone and company_data.get('phone'):
                values.phone = company_data['phone']

        render_values = {
            'website_sale_order': order,
            'partner_id': partner_id,
            'mode': mode,
            'checkout': values,
            'can_edit_vat': can_edit_vat,
            'error': errors,
            'callback': kw.get('callback'),
            'only_services': order and order.only_services,
            'account_on_checkout': request.website.account_on_checkout,
            'is_public_user': is_public_user,
            'is_public_order': order._is_public_order(),
            'use_same': True if self._is_pickup(order) else (
                is_public_user or (
                    'use_same' in kw and len(kw['use_same']) > 1 and str2bool(kw.get('use_same'))
            )
),
            'disable_phone_autocomplete': self._is_importadora_installed(),
        }
        render_values.update(self._get_country_related_render_values(kw, render_values))
        return request.render("website_sale.address", render_values)

    def order_2_return_dict(self, order):
        """ Returns the tracking_cart dict of the order for Google analytics basically defined to be inherited """
        tracking_cart_dict = {
            'transaction_id': order.id,
            'affiliation': order.company_id.name,
            'value': order.amount_total,
            'tax': order.amount_tax,
            'currency': order.currency_id.name,
            'items': self.order_lines_2_google_api(order.order_line),
        }
        delivery_line = order.order_line.filtered('is_delivery')
        if delivery_line:
            tracking_cart_dict['shipping'] = sum(delivery_line.mapped('price_unit'))
        return tracking_cart_dict
    


    
class DeliveryPickup(http.Controller):

    @http.route('/shop/set_pickup_warehouse', type='json', auth='public', website=True, csrf=False)
    def set_pickup_warehouse(self, warehouse_id):
        order = request.website.sale_get_order()
        if not order:
            return {'ok': False, 'error': 'no_order'}
        try:
            wid = int(warehouse_id)
        except Exception:
            return {'ok': False, 'error': 'bad_id'}

        wh = request.env['stock.warehouse'].sudo().browse(wid)
        if not wh.exists():
            return {'ok': False, 'error': 'not_found'}

        candidates = order._mp_pickup_candidate_warehouses()
        if wh not in candidates:
            return {'ok': False, 'error': 'not_candidate'}

        order._mp_apply_pickup_warehouse(wh)
        return {'ok': True}
    
    
# ----------------------------------------------------------------------------------------------

class WebsiteSaleDeliveryFilter(WebsiteSale):

    def _get_selected_municipality_id(self):
        """
        Lee el municipio seleccionado desde session.
        Recomendación: usa un key explícito como delivery_municipality_id.
        """
        return (
            request.session.get("delivery_municipality_id")
            or request.session.get("delivery_city")  # legacy si antes lo guardabas así
        )
