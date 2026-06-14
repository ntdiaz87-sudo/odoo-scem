# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api

class ProductProduct(models.Model):
    _inherit = 'product.product'

    uom_min = fields.Integer(
        string='Minimum order number', 
        compute='_compute_uom_min', 
        store=True
    )

    is_uom_min = fields.Boolean(
        string='Is minimum order?', 
        compute='_compute_uom_min', 
        store=True
    )
    
    # Codigo para cuando el 'Formato' tiene variantes
    @api.depends('product_template_attribute_value_ids')
    def _compute_uom_min(self):
        '''
        Calculate the minimum quantity and is_uom_min of the product according to the "Formato" variant
        '''
        for product in self:
            uom_min_value = 1
            is_uom_min_value = False
            for attr_value in product.product_template_attribute_value_ids:
                if attr_value.attribute_id.name == "Formato":
                    uom_min_value = attr_value.uom_min
                    is_uom_min_value = attr_value.is_uom_min
                    break
            product.uom_min = uom_min_value
            product.is_uom_min = is_uom_min_value


    @api.depends('list_price', 'price_extra', 'wholesale_price', 'sale_margin')
    @api.depends_context('uom')
    def _compute_product_lst_price(self):
        to_uom = None
        if 'uom' in self._context:
            to_uom = self.env['uom.uom'].browse(self._context['uom'])

        for product in self:
            if product.wholesale_price and product.wholesale_price > 0:
                price = product.wholesale_price
                if to_uom:
                    price = product.uom_id._compute_price(price, to_uom)
                margin = product.sale_margin or 0.0
                percent = (100.0 - margin) if margin < 100.0 else 1.0
                price = price * 100.0 / percent
                product.lst_price = price
                product.list_price = price
            else:
                super(ProductProduct, product)._compute_product_lst_price()
