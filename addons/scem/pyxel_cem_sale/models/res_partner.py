# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _

class ResPartner(models.Model):
    _inherit = 'res.partner'

    is_provider = fields.Boolean(string="Is a provider?", default = False, help="Convert the contact into a provider for the Wholesale Store")


    # NO VA
    # hide_peppol_fields = fields.Boolean()