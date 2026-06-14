# -*- coding: utf-8 -*-
from odoo import fields, models, api
from odoo.exceptions import ValidationError


class ProductAttribute(models.Model):
    _inherit = "product.attribute"

    is_packaging_attribute = fields.Boolean(string="Packaging Attribute", help="This attribute defines the packaging format and establishes the quantity ratio.")
   
   
    @api.constrains('is_packaging_attribute')
    def _check_single_packaging_attribute(self):
        for rec in self:
            if rec.is_packaging_attribute:
                cnt = self.search_count([
                    ('is_packaging_attribute', '=', True),
                    ('id', '!=', rec.id),
                ])
                if cnt:
                    raise ValidationError(
                        "Only one attribute can be marked as true."
                    )