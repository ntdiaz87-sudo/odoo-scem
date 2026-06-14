# -*- coding: utf-8 -*-

from operator import itemgetter

from odoo import fields, models, api, tools, _


class ResCompany(models.Model):
    _inherit = "res.company"

    # To config.settings
    cem_virtual_contract_duration = fields.Integer("Duration in Months", default=1)
    cem_vc_code_gen_type = fields.Selection([('auto', 'Automatic'), ('manual', 'Manual')],
                                                     string="Generation Type for Virtual Contract Code", default='auto')
    cem_vc_prefix_code = fields.Selection([('reeup', 'REEUP'), ('5-abb', 'Firts 5 Abbreviations')], string="Code Prefix")

