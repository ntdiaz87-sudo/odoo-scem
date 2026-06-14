# -*- coding: utf-8 -*-

from odoo import models, fields, api

class ProductProduct(models.Model):
    _inherit = 'product.product'

    def get_carousel_products(self):
        return self.search([
            ('website_published', '=', True),
            ('sale_ok', '=', True)
        ], limit=3)

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    show_in_banner = fields.Boolean(
        string='Mostrar en Banner',
        help='Activar para incluir este producto en el banner principal.'
    )

    sale_type = fields.Selection([
        ('retail', 'Minorista'),
        ('wholesale', 'Mayorista'),
        ('both', 'Ambos'),
    ], string='Tipo de venta', default='retail',
       help='Categoría del producto: minorista, mayorista o ambos.')

    wholesale_price = fields.Float(
        string='Precio Mayorista',
        digits='Product Price',
        help='Precio para ventas mayoristas. Aplica cuando el tipo es Mayorista o Ambos.',
    )

    # ── Dirección de entrega del producto ───────────────────────────────
    # Cada producto indica su zona de entrega (provincia + municipio). Sustituye
    # al modal de selección de zona: ahora la zona la lleva el producto y se
    # muestra en su detalle. El costo de envío se calcula con esta zona.
    delivery_state_id = fields.Many2one(
        'res.country.state', string='Provincia de entrega',
        domain="[('country_id.code', '=', 'CU')]",
        help='Provincia donde se entrega este producto.',
    )
    delivery_municipality_id = fields.Many2one(
        'res.municipality', string='Municipio de entrega',
        domain="[('state_id', '=?', delivery_state_id)]",
        help='Municipio donde se entrega este producto.',
    )

    # ── Disponibilidad sin modal de zona ────────────────────────────────
    # Se quitó el modal de selección de provincia/municipio del cliente: la zona
    # ahora la lleva el producto. Por eso 'available_in_delivery_zone' deja de
    # depender de la sesión y pasa a depender SOLO del stock, para que el catálogo
    # muestre todos los productos disponibles (sin gating por zona).
    def _compute_available_in_delivery_zone(self):
        for rec in self:
            rec.available_in_delivery_zone = rec.virtual_available > (rec.freeze_sale_below_qty_available or 0)

    def _search_available_in_delivery_zone(self, operator, value):
        in_stock_ids = self.sudo().search([('virtual_available', '>', 0)]).ids
        positive = bool(value) if operator in ('=', '==') else not bool(value)
        return [('id', 'in' if positive else 'not in', in_stock_ids)]