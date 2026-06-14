# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class CustomResConfiguration(models.TransientModel):
    """ Inherit the base settings to add favicon. """
    _inherit = 'res.config.settings'

    header_logo = fields.Binary(
        'Header Logo', related='website_id.header_logo', readonly=False)
    footer_logo = fields.Binary(
        'Footer Logo', related='website_id.footer_logo', readonly=False)
    shop_qty = fields.Boolean(
        'Decimal Qty', related='website_id.shop_qty', readonly=False)
    hide_price = fields.Boolean(
        'Price Hide for Shop', related='website_id.hide_price', readonly=False)
    add_to_cart = fields.Boolean('Hide Add Cart Button', related='website_id.add_to_cart', readonly=False)

    social_twitter = fields.Char('Twitter Account', related='website_id.social_twitter',readonly=False)
    social_facebook = fields.Char('Facebook Account', related='website_id.social_facebook',readonly=False)
    social_github = fields.Char('GitHub Account', related='website_id.social_github',readonly=False)
    social_linkedin = fields.Char('LinkedIn Account', related='website_id.social_linkedin',readonly=False)
    social_youtube = fields.Char('Youtube Account', related='website_id.social_youtube',readonly=False)
    social_instagram = fields.Char('Instagram Account', related='website_id.social_instagram',readonly=False)

    # For multi image
    no_extra_options = fields.Boolean(string='Slider effects',
                                      related='website_id.no_extra_options',
                                      help="Slider with all options for next, previous, play, pause, fullscreen, hide/show thumbnail panel.", readonly=False)
    interval_play = fields.Char(string='slideshow interval',
                                related='website_id.interval_play',
                                help='With this field you can set the interval play time between two images.', readonly=False)
    enable_disable_text = fields.Boolean(string='Enable text panel',
                                         related='website_id.enable_disable_text',
                                         help='Enable/Disable text which is visible on the image in multi image.', readonly=False)
    color_opt_thumbnail = fields.Selection(
        related='website_id.color_opt_thumbnail', readonly=False)

    thumbnail_panel_position = fields.Selection(
        related='website_id.thumbnail_panel_position', readonly=False)
    change_thumbnail_size = fields.Boolean(string="Change thumbnail size",
                                           related="website_id.change_thumbnail_size", readonly=False
                                           )
    thumb_height = fields.Char(string='Thumb height',
                               related="website_id.thumb_height", readonly=False
                               )
    thumb_width = fields.Char(string='Thumb width',
                              related="website_id.thumb_width", readonly=False
                              )
    # For brand setting
    is_brand_display = fields.Boolean(
        string="Brand display in product page", related="website_id.is_brand_display", readonly=False)
    brand_display_option = fields.Selection(
        related="website_id.brand_display_option", readonly=False)
    is_default_code = fields.Boolean(
        string="Default code display in product page", related="website_id.is_default_code", readonly=False)
    is_amp_enable = fields.Boolean(
        string="Enable AMP", related="website_id.is_amp_enable", readonly=False)
