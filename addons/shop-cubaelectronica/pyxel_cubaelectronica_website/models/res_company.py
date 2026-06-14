# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _

from odoo.exceptions import ValidationError


class ResCompany(models.Model):
    _inherit = 'res.company'

    cup_account_number = fields.Char(string='Cuenta (CUP)')
    usd_account_number = fields.Char(string='Cuenta (Moneda extranjera)')
    cup_bank = fields.Char(string='Banco (cup)')
    usd_bank = fields.Char(string='Banco (Moneda extrnajera)')