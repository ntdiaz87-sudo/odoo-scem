# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _


class ResPartner(models.Model):
    _inherit = 'res.partner'

    cem_abbreviations = fields.Char(string="Abbreviations")
    active_vc_ids = fields.One2many('cem.virtual.contract', 'partner_id', "Active Virtual Contract",
                                    compute="_compute_active_vcs")
    lead_ids = fields.One2many('crm.lead', 'partner_id', string='Leads')
    is_hireable = fields.Boolean(string="Is Hireable", compute="_compute_is_hireable", store=True)

    @api.depends()
    def _compute_active_vcs(self):
        vc_model = self.env['cem.virtual.contract']
        for rec in self:
            rec.active_vc_ids = vc_model.search([
                ('partner_id', '=', rec.id),
                ('state', 'not in', ['expired', 'canceled'])
            ], limit=1)

    def get_active_vcontract(self):
        self.ensure_one()
        return self.active_vc_ids and self.active_vc_ids[0]

    def get_vcontract_2_accept(self):
        to_accept = self.get_active_vcontract()
        if to_accept.state == 'sent':
            return to_accept
        return False

    def action_view_active_vc(self):
        self.ensure_one()
        vc_form_view_id = self.env.ref('pyxel_cem_virtual_contract.cem_virtual_contract_form_view').id
        return {
            'name': _('Active virtual contract'),
            'type': 'ir.actions.act_window',
            'res_model': 'cem.virtual.contract',
            'views': [(vc_form_view_id, 'form')],
            'res_id': self.active_vc_ids.ids[0]
        }

    @api.depends('lead_ids', 'lead_ids.stage_id')
    def _compute_is_hireable(self):
        hireable_stages_ids = self.env['crm.stage'].search([('cem_manag_contract', '=', True)]).ids
        hireable_partners = {row.partner_id.id for row in
                             self.env['crm.lead'].search([('company_id', '=', self.env.company.id),
                                                          ('stage_id', 'in', hireable_stages_ids)])}
        for rec in self:
            rec.is_hireable = rec.id in hireable_partners
