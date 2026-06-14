# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class CompanyPctConfig(models.Model):
    _name = "company.pct.config"
    _description = "Company/PCT Configuration"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _rec_name = "name"

    name = fields.Char(default=lambda self: _("Configuración"), required=True, readonly=True)
    
    company_profit = fields.Float(string="Utilidad de la Compañía (%)", digits=(16, 4), tracking=True)
    pct_profit = fields.Float(string="Utilidad PCT (%)", digits=(16, 4), tracking=True)

    @api.model_create_multi
    def create(self, vals_list):
        if self.search_count([]) >= 1:
            raise ValidationError(_("Solo puede existir un registro de Configuración PCT."))
        return super().create(vals_list)

    def unlink(self):
        raise ValidationError(_("No se puede eliminar la Configuración PCT."))