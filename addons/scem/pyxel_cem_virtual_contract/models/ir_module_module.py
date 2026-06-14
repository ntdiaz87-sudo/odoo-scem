# -*- coding: utf-8 -*-
from odoo import models

class IrModuleModule(models.Model):
    _inherit = 'ir.module.module'

    def write(self, vals):
        res = super().write(vals)

        # Solo reaccionar si cambia el estado del módulo
        if 'state' in vals:
            self.env['ir.ui.menu']._adjust_vc_menu_parent()

        return res