from odoo import models, fields, api

class ResUsers(models.Model):
    _inherit = "res.users"

    is_commercial = fields.Boolean("¿Es Comercial?")

    @api.onchange("is_commercial")
    def _onchange_is_commercial(self):
        group = self.env.ref("pyxel_cem_configuration.group_comerciales", raise_if_not_found=False)
        if not group:
            return
        if self.is_commercial:
            self.groups_id |= group
        else:
            self.groups_id -= group
