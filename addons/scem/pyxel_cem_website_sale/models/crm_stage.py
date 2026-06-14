# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _

class Stage(models.Model):
    _inherit = 'crm.stage'

    allows_sale = fields.Boolean(string="Allowed to buy in wholesale store", default = False)
