# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _

class ProductAttributeValue(models.Model):
    _inherit = 'product.template.attribute.value'

    is_uom_min = fields.Boolean(string='Is minimum order?')
    uom_min = fields.Integer(string='Minimum order number', default=0)
    