# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.


from odoo import models, api


class ThemeNew(models.AbstractModel):
    _inherit = 'theme.utils'

    def _theme_scita_post_copy(self, mod):
        self.disable_view('website_sale_wishlist.product_add_to_wishlist')
        self.disable_view('website_sale.product_quantity')
        self.disable_view('website_sale.product_buy_now')
        self.disable_view('website_sale.product_comment')
        self.disable_view('website_sale_comparison.product_add_to_compare')
        self.disable_view('website_sale.search')
        self.disable_view('website_sale.ecom_show_extra_fields')

