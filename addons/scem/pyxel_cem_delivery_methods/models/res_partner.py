# -*- coding: utf-8 -*-
from odoo import fields, models

class ResPartner(models.Model):
    _inherit = "res.partner"

    municipality_id = fields.Many2one(
        "res.municipality",
        string="Municipality",
        # opcional: filtrar por provincia/país del partner si aplica
        domain="[('state_id', '=', state_id), ('country_id', '=', country_id)]",
    )
