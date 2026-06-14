# -*- coding: utf-8 -*-
from odoo import api, models


class ProductProduct(models.Model):
    _inherit = "product.product"

    @api.depends('list_price', 'price_extra', 'wholesale_price', 'sale_margin')
    @api.depends_context('uom', 'packaging_uom_min')
    def _compute_product_lst_price(self):
        to_uom = None
        if self._context.get('uom'):
            to_uom = self.env['uom.uom'].browse(self._context['uom'])

        # uom_min del packaging seleccionado (SI NO VIENE, fallback a 1)
        ctx_uom_min = float(self._context.get("packaging_uom_min") or 1.0)
        if ctx_uom_min <= 0:
            ctx_uom_min = 1.0

        for product in self:
            if product.wholesale_price and product.wholesale_price > 0:
                price = product.wholesale_price
                if to_uom:
                    price = product.uom_id._compute_price(price, to_uom)

                margin = product.sale_margin or 0.0
                percent = (100.0 - margin) if margin < 100.0 else 1.0
                price = price * 100.0 / percent

            else:
                # deja que Odoo calcule lst_price normal
                super(ProductProduct, product)._compute_product_lst_price()
                price = product.lst_price

            # ✅ Aquí aplicas el factor packaging (precio por “pack”)
            price = price * ctx_uom_min

            product.lst_price = price
            product.list_price = price