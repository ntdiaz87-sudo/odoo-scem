# -*- coding: utf-8 -*-
from odoo import models, api
from odoo.http import request


class Website(models.Model):
    _inherit = 'website'

    # -------------------------------------------------------------------------
    # ESTADOS / CIUDADES EN FUNCIÓN DE warehouse.delivery (no sellers)
    # -------------------------------------------------------------------------

    @api.model
    def get_states_ids(self):
        """Provincias donde existe al menos un warehouse.delivery."""
        WD = self.env['warehouse.delivery'].sudo()
        groups = WD.read_group(
            domain=[('municipality_id', '!=', False)],
            fields=['municipality_id'],
            groupby=['municipality_id'],
        )
        # ids de ciudades que tienen warehouse.delivery
        municipality_ids = [g['municipality_id'][0] for g in groups if g.get('municipality_id')]
        cities = self.env['res.municipality'].sudo().browse(municipality_ids)
        # mapped devuelve un recordset único, así evitamos duplicados
        states = cities.mapped('state_id')
        return states.sorted(key=lambda s: s.name or '')

    @api.model
    def get_cities_ids(self):
        """Ciudades de la provincia guardada en sesión."""
        state_id = int(request.session.get('delivery_state') or 0)
        if not state_id:
            return self.env['res.municipality']

        WD = self.env['warehouse.delivery'].sudo()
        groups = WD.read_group(
            domain=[('municipality_id.state_id', '=', state_id)],
            fields=['municipality_id'],
            groupby=['municipality_id'],
        )
        municipality_ids = [
            g['municipality_id'][0]
            for g in groups
            if g.get('municipality_id')
        ]
        # set() por si acaso
        cities = self.env['res.municipality'].sudo().browse(list(set(municipality_ids)))
        return cities.sorted(key=lambda c: c.name or '')

    @api.model
    def get_all_delivery_municipality_ids(self):
        """
        Devuelve todas las ciudades con warehouse.delivery activo.
        (Evita duplicados y asegura que cada city tenga su state_id precargado.)
        """
        WD = self.env['warehouse.delivery'].sudo()
        groups = WD.read_group(
            domain=[('municipality_id', '!=', False)],
            fields=['municipality_id'],
            groupby=['municipality_id'],
        )
        municipality_ids = [g['municipality_id'][0] for g in groups if g.get('municipality_id')]
        cities = self.env['res.municipality'].sudo().browse(municipality_ids)
        # Evita ciudades sin state asignado
        return cities.filtered(lambda c: c.state_id).sorted(key=lambda c: (c.state_id.name, c.name))

    # -------------------------------------------------------------------------
    # FILTRO DE PRODUCTOS
    # -------------------------------------------------------------------------

    def sale_product_domain(self):
        """Sólo productos marcados como disponibles en la zona."""
        base = super(Website, self).sale_product_domain()
        return base + [('available_in_delivery_zone', '=', True)]

    # -------------------------------------------------------------------------
    # SESIÓN
    # -------------------------------------------------------------------------

    def _clear_delivery_session(self):
        for k in (
            'delivery_state',
            'delivery_city',
            'current_city_name',
            'current_state_name',
            'country_delivery_name',
            'country_delivery_id',
        ):
            request.session.pop(k, None)
        try:
            request.session.modified = True
        except Exception:
            pass

    @api.model
    def ensure_valid_delivery_session(self):
        """
        Comprueba que (state, city) en sesión sigan siendo válidos
        para algún warehouse.delivery. Si no lo son, limpia la sesión.
        Devuelve: dict con state_id, municipality_id, city_name.
        """
        sess = request.session
        state_id = int(sess.get('delivery_state') or 0)
        municipality_id = int(sess.get('delivery_city') or 0)

        result = {'state_id': None, 'municipality_id': None, 'city_name': None}

        if not state_id or not municipality_id:
            self._clear_delivery_session()
            return result

        WD = self.env['warehouse.delivery'].sudo()
        ok = bool(WD.search_count([
            ('municipality_id', '=', municipality_id),
            ('municipality_id.state_id', '=', state_id),
        ]))

        city = self.env['res.municipality'].sudo().browse(municipality_id)
        if not ok or not city or city.state_id.id != state_id:
            self._clear_delivery_session()
            return result

        # todo OK -> mantener en sesión y devolver
        sess['current_city_name'] = city.name
        try:
            sess.modified = True
        except Exception:
            pass

        result.update({
            'state_id': state_id,
            'municipality_id': municipality_id,
            'city_name': city.name,
        })
        return result

   # -------------------------------------------------------------------------
    # FILTRO DE PRODUCTOS POR ALMACÉN SEGÚN MUNICIPIO (DELIVERY POINT)
    # -------------------------------------------------------------------------

    def _get_selected_municipality_id(self):
        """
        Lee el municipio seleccionado desde session.
        En tu implementación actual, el modal guarda el municipio en 'delivery_city'.
        """
        mid = (
            request.session.get("delivery_municipality_id")  # si algún día decides usar esta key
            or request.session.get("delivery_city")          # tu key actual (legacy)
        )
        try:
            return int(mid) if mid else False
        except Exception:
            return False


    def _get_warehouses_for_municipality(self, municipality_id):
        """
        Devuelve los almacenes que tienen configurado ese municipio como punto de entrega,
        usando warehouse.delivery (NO depende de un campo en stock.warehouse).
        """
        if not municipality_id:
            return self.env["stock.warehouse"].sudo().browse()

        wds = self.env["warehouse.delivery"].sudo().search([
            ("municipality_id", "=", int(municipality_id)),
        ])
        return wds.mapped("warehouse_id")


    def _get_template_ids_with_stock_in_warehouses(self, warehouses):
        """
        Devuelve IDs de product.template con stock disponible en esos almacenes:
        suma por producto en los lot_stock_id (y ubicaciones hijas) y filtra por
        (quantity - reserved_quantity) > 0.
        """
        if not warehouses:
            return []

        locations = warehouses.mapped("lot_stock_id")
        if not locations:
            return []

        Quant = self.env["stock.quant"].sudo()

        groups = Quant.read_group(
            domain=[
                ("location_id", "child_of", locations.ids),
                ("quantity", ">", 0),
            ],
            fields=["product_id", "quantity:sum", "reserved_quantity:sum"],
            groupby=["product_id"],
            lazy=False,
        )

        product_ids = [
            g["product_id"][0]
            for g in groups
            if g.get("product_id") and (g["quantity"] - g["reserved_quantity"]) > 0
        ]
        if not product_ids:
            return []

        return self.env["product.product"].sudo().browse(product_ids).mapped("product_tmpl_id").ids


    def _get_checkout_step_list(self):
        steps = super()._get_checkout_step_list()

        redirect_to_sign_in = (
            self.account_on_checkout == 'mandatory'
            and self.is_public_user()
        )

        fixed_href = (
            '/web/login?redirect=/shop/checkout'
            if redirect_to_sign_in
            else '/shop/checkout'
        )

        patched_steps = []
        for xmlids, step in steps:
            step = dict(step)
            if 'website_sale.cart' in xmlids:
                step['main_button_href'] = fixed_href
            patched_steps.append((xmlids, step))

        return patched_steps