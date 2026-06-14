# -*- coding: utf-8 -*-
from odoo import models


class DeliveryCarrier(models.Model):
    _inherit = 'delivery.carrier'

    def _compute_order_standard_delivery_price(self, order):
        """Costo de envío basado en la ZONA DE CADA PRODUCTO (no en la zona que
        antes elegía el cliente en el modal, que se eliminó).

        Regla: una tarifa de envío por cada municipio distinto presente entre los
        productos del carrito (delivery_municipality_id). Para cada municipio se
        toma su tarifa de warehouse.delivery (la mayor si hay varios almacenes) y
        se suman. Si un producto no tiene municipio de entrega, no aporta costo.
        """
        self.ensure_one()
        if not order:
            return 0.0

        WD = self.env['warehouse.delivery'].sudo()
        municipality_ids = set()
        for line in order.order_line.filtered(lambda l: l.product_id and not l.display_type):
            mun = line.product_id.product_tmpl_id.delivery_municipality_id
            if mun:
                municipality_ids.add(mun.id)

        total = 0.0
        for mid in municipality_ids:
            zone_price = 0.0
            for wd in WD.search([('municipality_id', '=', mid)]):
                price = self._apply_margin_percent(wd.price or 0.0, wd.margin_percent)
                if price > zone_price:
                    zone_price = price
            total += zone_price
        return total
