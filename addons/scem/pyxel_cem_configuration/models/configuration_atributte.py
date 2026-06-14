from odoo import models, fields, api

class ConfiguracionAutomatica(models.TransientModel):
    _inherit = 'res.config.settings'

    group_product_variant = fields.Boolean(default=True)

    @api.model
    def set_values(self):
        res = super().set_values()
        self.env['ir.config_parameter'].set_param('product.group_product_variant', True)
        return res

    @api.model
    def set_default_scem_settings(self):
        self.website_cookies_bar = True
        self.group_show_uom_price = True
        self.set_values()
