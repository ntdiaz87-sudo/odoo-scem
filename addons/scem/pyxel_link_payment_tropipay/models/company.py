# -*- coding: utf-8 -*-

from odoo import fields, models, api, _


class ResCompany(models.Model):
    _inherit = "res.company"

    link_exp_hours = fields.Integer('Link Expiration Hours', default=24)
    time_diff = fields.Integer('Time Difference', default=6)