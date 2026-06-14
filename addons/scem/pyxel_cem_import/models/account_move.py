# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _


class AccountMove(models.Model):
    _inherit = 'account.move'

    so_cem_order_type = fields.Selection(related='sale_id.so_cem_order_type')
