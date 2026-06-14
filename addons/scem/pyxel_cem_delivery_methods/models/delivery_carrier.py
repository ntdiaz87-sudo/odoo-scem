# -*- coding: utf-8 -*-
import math
from odoo import models, fields, _
from odoo.http import request

import logging
_logger = logging.getLogger(__name__)


class DeliveryCarrier(models.Model):
    _inherit = 'delivery.carrier'

    # Solo dejamos nuestro tipo custom para la "Entrega estándar"
    delivery_type = fields.Selection(
        selection_add=[
            ('based_on_seller', 'Based on seller'),
        ],
        ondelete={
            'based_on_seller': 'set default',
        },
    )

    # -------- Helpers generales --------

    def _get_order_shipping_city(self, order):
        """Devuelve el municipality_id que usaremos para tarifas de entrega."""
        municipality_id = order.partner_shipping_id.municipality_id.id
        if not municipality_id:
            # Fallback a la sesión del modal, por si el partner aún no tiene ciudad asignada
            try:
                if request and getattr(request, 'session', None):
                    raw = request.session.get('delivery_city') or 0
                    municipality_id = int(raw) if raw and str(raw).isdigit() else 0
            except Exception:
                municipality_id = 0
        return municipality_id


    def _warehouse_delivery_records_for_warehouses_city(self, warehouses, municipality_id):
        """Devuelve los warehouse.delivery para los almacenes dados en esa ciudad."""
        WarehouseDelivery = self.env['warehouse.delivery'].sudo()
        if not warehouses or not municipality_id:
            return WarehouseDelivery
        return WarehouseDelivery.search([
            ('warehouse_id', 'in', warehouses.ids),
            ('municipality_id', '=', municipality_id),
        ])

    def _available_qty_in_wh(self, product, warehouse):
        """
        Qty disponible real del producto en el warehouse:
        sum(quantity) - sum(reserved_quantity) en quants bajo warehouse.lot_stock_id.
        Devuelve 0.0 si no hay lot_stock_id o no hay quants.
        """
        if not product or not warehouse or not warehouse.lot_stock_id:
            return 0.0

        Quant = self.env["stock.quant"].sudo()
        groups = Quant.read_group(
            domain=[
                ("product_id", "=", product.id),
                ("location_id", "child_of", warehouse.lot_stock_id.id),
            ],
            fields=["quantity:sum", "reserved_quantity:sum"],
            groupby=[],
            lazy=False,
        )

        qty = (groups[0].get("quantity", 0.0) if groups else 0.0) or 0.0
        reserved = (groups[0].get("reserved_quantity", 0.0) if groups else 0.0) or 0.0
        return qty - reserved
    
    def _apply_margin_percent(self, base_price, margin_percent):
        """
        Aplica margen como porcentaje sobre el precio base.
        Ej: base 30, margen 10 => 33
        """
        base_price = base_price or 0.0
        margin_percent = margin_percent or 0.0
        return base_price * (1.0 + (margin_percent / 100.0))

    def _compute_order_standard_delivery_price(self, order):
        """
        Precio estándar basado en:
        - municipio seleccionado (partner_shipping.municipality_id o session fallback)
        - warehouses que entregan a ese municipio (warehouse.delivery)
        - si un warehouse puede servir al menos una línea (stock suficiente en su lot_stock_id)
        => precio = máximo warehouse.delivery.price de los warehouses implicados
        - si un pedido tienen productos de diferentes almacenes, la entrega toma el precio mas alto
        """
        self.ensure_one()
        if not order:
            return 0.0

        municipality_id = False
        if getattr(order.partner_shipping_id, "municipality_id", False) and order.partner_shipping_id.municipality_id:
            municipality_id = order.partner_shipping_id.municipality_id.id

        municipality_id = municipality_id or int(request.session.get("delivery_city") or 0) or False
        if not municipality_id:
            _logger.info("DELIVERY | No municipality_id -> price=0")
            return 0.0

        WarehouseDelivery = self.env["warehouse.delivery"].sudo()
        wds = WarehouseDelivery.search([("municipality_id", "=", municipality_id)])
        if not wds:
            _logger.info("DELIVERY | No warehouse.delivery for municipality_id=%s -> price=0", municipality_id)
            return 0.0

        max_price = 0.0

        for wd in wds:
            wh = wd.warehouse_id
            if not wh:
                continue

            serves_any_line = False

            for line in order.order_line.filtered(lambda l: l.product_id and l.product_id.type == "product"):
                product = line.product_id
                needed = line.product_uom._compute_quantity(line.product_uom_qty, product.uom_id)
                available = self._available_qty_in_wh(product, wh)

                _logger.info(
                    "DELIVERY | muni=%s | wh=%s | prod=%s | needed=%s | available=%s",
                    municipality_id, wh.id, product.id, needed, available
                )

                if available >= needed and needed > 0:
                    serves_any_line = True
                    break

            if serves_any_line:
                base_price = wd.price or 0.0
                price_with_margin = self._apply_margin_percent(base_price, wd.margin_percent)

                _logger.info(
                    "DELIVERY | muni=%s | wh=%s | base_price=%s | margin=%s | price_with_margin=%s",
                    municipality_id, wh.id, base_price, wd.margin_percent, price_with_margin
                )

                if price_with_margin > max_price:
                    max_price = price_with_margin

        _logger.info("DELIVERY | muni=%s -> max_price=%s", municipality_id, max_price)
        return max_price


    # --------- Método de rating para la "Entrega estándar" ---------

    def based_on_seller_rate_shipment(self, order):
        """
        Entrega estándar:
        - Basada en warehouse.delivery por almacén / ciudad.
        - Si intervienen varios almacenes, se toma el precio MÁS ALTO.
        """
        if not self._match_address(order.partner_shipping_id):
            return {
                'success': False,
                'price': 0.0,
                'error_message': _('Error: this delivery method is not available for this address.'),
                'warning_message': False,
            }

        price = self._compute_order_standard_delivery_price(order)
        return {
            'success': True,
            'price': price,
            'error_message': False,
            'warning_message': False,
        }


    def based_on_seller_send_shipping(self, pickings):
        """
        Este carrier es interno (no integra con transportista). Debe devolver una lista
        de resultados, uno por picking, para que stock_delivery no reviente.
        """
        results = []
        for picking in pickings:
            results.append({
                "exact_price": 0.0,
                "tracking_number": False,
            })
        return results

    def send_shipping(self, pickings):
        # deja que Odoo rutee por delivery_type; si no, fallback seguro
        res = super().send_shipping(pickings)
        return res or [{"exact_price": 0.0, "tracking_number": False} for _p in pickings]
