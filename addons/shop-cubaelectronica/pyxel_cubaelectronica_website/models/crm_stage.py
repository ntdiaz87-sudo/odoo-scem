# -*- coding: utf-8 -*-
from odoo import api, models

class CrmStage(models.Model):
    _inherit = 'crm.stage'

    def write(self, vals):
        res = super().write(vals)
        if any(k in vals for k in ('allows_sale', 'sequence')):
            leads = self.env['crm.lead'].sudo().search([('stage_id', 'in', self.ids)])
            partners = leads.mapped('partner_id')
            if partners:
                partners._assign_seq_code_id_client_if_needed()
        return res
