# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from dateutil.relativedelta import relativedelta

from odoo import api, models, fields, _, exceptions


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    cem_virtual_contract_duration = fields.Integer(related="company_id.cem_virtual_contract_duration", readonly=False)
    cem_vc_code_gen_type = fields.Selection(related="company_id.cem_vc_code_gen_type", readonly=False)
    cem_vc_prefix_code = fields.Selection(related="company_id.cem_vc_prefix_code", readonly=False)

