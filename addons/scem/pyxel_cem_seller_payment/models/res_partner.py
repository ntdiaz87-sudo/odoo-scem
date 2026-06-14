# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _

class ResPartner(models.Model):
    _inherit = 'res.partner'

    is_beneficiary = fields.Boolean(string="Beneficiario", default = False, help="Contacts with this field marked can be used in sales reports.")
