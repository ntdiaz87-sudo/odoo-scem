# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

import base64

from odoo import api, fields, models, tools, _
from odoo.exceptions import ValidationError
from odoo.addons.web_editor.tools import get_video_embed_code, get_video_thumbnail


class BannerImage(models.Model):
    _name = 'banner.image'
    _description = "Banner Image"
    _inherit = ['image.mixin']
    _order = 'sequence, id'

    name = fields.Char("Name", required=True)
    sequence = fields.Integer(default=10)

    image_1920 = fields.Image()
    banner_image_id = fields.Many2one("biztech.deal.of.the.day.configuration", "Deal of day banner")
    page_link = fields.Char(string="Link")
    website_menu_id = fields.Many2one("website.menu", "Website Menu")

class ProductConfiguration(models.Model):
    _name = 'biztech.deal.of.the.day.configuration'
    _description = 'Product Snippet Configuration'

    name = fields.Char(string="Banner Title", help="Name",
                       required=True, translate=True, default="Bestseller")
    active = fields.Boolean(
        string="Active", help="Enable or Disable tag from website", default=True)
    img_banner = fields.Binary(string="Image banner",
                               help="""Image banner""")
    banner_text = fields.Char("Banner Text", help="""Image banner""", default="Organic Fruits & Vegetables")
    banner_btn_text = fields.Char("Banner Button Text", help="""Banner Button Text""", default="Shop Now")
    banner_btn_url = fields.Char("Banner Button Url", help="""Banner Button Url""", default="/shop")
    product_ids = fields.Many2many(
        'product.template', string='Products', required=True)
    deal_title = fields.Char("Title")
    deal_of_day_banner_ids = fields.One2many("banner.image", "banner_image_id", "Deal Of Day Banner")
