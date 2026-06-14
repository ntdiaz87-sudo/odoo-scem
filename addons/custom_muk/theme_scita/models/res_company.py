# -*- coding: utf-8 -*-
# Part of AppJetty. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class ResCompany(models.Model):
    _inherit = "res.company"
    
    # Delivery location configuration
    delivery_icon = fields.Char(string='Icon', help='Delivery Icon')
    delivery_text = fields.Char(string='Title', help='Delivery Text',
                                default="Deliver To:", translate=True)
    delivery_btn_name = fields.Char(
        string='Button Name', help='Delivery Button Name', default="Check", translate=True)
    delivery_blank_msg = fields.Char(string='Blank Validation Message',
                                     help='Delivery zip code is blank', default="Please enter the zip code", translate=True)
    delivery_success_msg = fields.Char(
        string='Success Message', help='Delivery zip code is available message', default="Available", translate=True)
    delivery_fail_msg = fields.Char(
        string='Fail Message', help='Delivery zip code is not available message', default="Currently not available", translate=True)
