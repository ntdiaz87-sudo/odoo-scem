# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import api, models, fields, _

class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    # redefinir el compute del price_unit
    @api.depends('product_id', 'product_uom', 'product_uom_qty', 'order_id.so_cem_order_type')
    def _compute_price_unit(self):
        line_to_reset_price = self.env['sale.order.line']
        for line in self:
            if line.order_id.so_cem_order_type == 'import':
                line.price_unit = 0
                line_to_reset_price |= line

        super(SaleOrderLine, self - line_to_reset_price)._compute_price_unit()
