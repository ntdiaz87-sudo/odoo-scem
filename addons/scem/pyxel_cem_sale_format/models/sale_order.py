# -*- coding: utf-8 -*-
from odoo import models
from odoo.tools import float_round
class SaleOrder(models.Model):
    _inherit = "sale.order"
    
    def _convert_packaging_lines_to_base_qty(self):
        for order in self:
            for line in order.order_line:
                if line.packaging_converted:
                    continue

                ptav = line._get_packaging_ptav()
                mult = float(ptav.uom_min or 1.0) if ptav else 1.0
                if mult <= 1.0:
                    continue

                pack_qty = line.product_uom_qty or 0.0
                if not pack_qty:
                    continue

                base_qty = pack_qty * mult
                base_qty = float_round(base_qty, precision_rounding=line.product_uom.rounding)
                base_price_unit = (line.price_unit / mult) if line.price_unit else 0.0

                line.with_context(skip_packaging_price_mult=True).write({
                    "packaging_pack_qty": pack_qty,
                    "product_uom_qty": base_qty,
                    "price_unit": base_price_unit,
                    "packaging_converted": True,
                })

    def write(self, vals):
        """
        Convertir la cantidad justo cuando el controller pone state='sent'
        
        """
        old_state = {}
        if "state" in vals:
            for o in self:
                old_state[o.id] = o.state

        res = super().write(vals)

        if vals.get("state") == "sent" and not self.env.context.get("skip_packaging_conversion"):
            to_convert = self.filtered(lambda o: old_state.get(o.id) == "draft" and o.state == "sent")
         
            if to_convert:
                to_convert.with_context(skip_packaging_conversion=True)._convert_packaging_lines_to_base_qty()

        return res
    