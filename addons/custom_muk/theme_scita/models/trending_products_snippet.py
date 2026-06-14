# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models

class TrendingProductsConfiguration(models.Model):
    _name = 'trending.products.configuration'
    _description = 'Trending Product Snippet Configuration'

    name = fields.Char(string="Name", help="Name",required=True, translate=True)
    active = fields.Boolean(string="Active", default=True)
    category_ids = fields.Many2many("product.public.category", string="Category")
