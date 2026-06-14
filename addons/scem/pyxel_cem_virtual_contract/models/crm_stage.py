# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _

class Stage(models.Model):
    _inherit = 'crm.stage'

    cem_manag_contract = fields.Boolean(string="Enable virtual contract management", default = False)
    cem_vcontract_expired = fields.Boolean(string="Virtual contract expired", default = False)
    cem_vcontract_approved_hiring_process = fields.Boolean(
        string='Enable virtual contract Approved/Hiring Process',
        default=False,
        help='Indica si esta etapa corresponde a un estado de aprobado o proceso de contratación'
    )
