# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from datetime import date

from odoo import _, api, fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    link_exp_hours = fields.Integer(related='company_id.link_exp_hours', readonly=False)
    time_diff = fields.Integer(related='company_id.time_diff', readonly=False)
