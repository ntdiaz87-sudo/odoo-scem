# -*- coding: utf-8 -*-
from odoo import models, fields


class WarehouseDelivery(models.Model):
    _name = 'warehouse.delivery'
    _description = 'Warehouse Delivery Zones'

    warehouse_id = fields.Many2one('stock.warehouse', required=True, string='Warehouse')
    margin_percent = fields.Float('Margen comercial', default=10.0, required=True)
    municipality_id = fields.Many2one('res.municipality', required=True, string='Municipality')
    currency_id = fields.Many2one('res.currency', string='Moneda', required=True)
    price = fields.Float(string='Delivery Price')
    is_free_delivery = fields.Boolean(string="Free Delivery?", default=False)
    free_delivery_amount = fields.Float(string="Free if total > ...")
    express_price = fields.Monetary(string="Envío Express", currency_field='currency_id', help="Precio que se le suma a la entrega estándar")
