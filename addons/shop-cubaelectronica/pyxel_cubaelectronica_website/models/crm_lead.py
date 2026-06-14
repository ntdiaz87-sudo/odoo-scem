# -*- coding: utf-8 -*-
from odoo import api, fields, models


class CrmLead(models.Model):
    _inherit = 'crm.lead'

    # Campo computado para documentos del partner
    document_ids = fields.One2many(
        'ir.attachment',
        compute='_compute_document_ids',
        string='Documentos del Cliente'
    )

    document_count = fields.Integer(
        string='Número de Documentos',
        compute='_compute_document_count'
    )

    @api.depends('partner_id')
    def _compute_document_ids(self):
        """Calcular documentos del partner"""
        for lead in self:
            if lead.partner_id:
                documents = self.env['ir.attachment'].search([
                    ('res_model', '=', 'res.partner'),
                    ('res_id', '=', lead.partner_id.id)
                ])
                lead.document_ids = documents
            else:
                lead.document_ids = False

    @api.depends('partner_id')
    def _compute_document_count(self):
        """Calcular el número de documentos del partner"""
        for lead in self:
            if lead.partner_id:
                count = self.env['ir.attachment'].search_count([
                    ('res_model', '=', 'res.partner'),
                    ('res_id', '=', lead.partner_id.id)
                ])
                lead.document_count = count
            else:
                lead.document_count = 0

    def action_view_documents(self):
        """Abrir vista de documentos del partner"""
        self.ensure_one()
        if not self.partner_id:
            return

        return {
            'type': 'ir.actions.act_window',
            'name': f'Documentos - {self.partner_id.name}',
            'res_model': 'ir.attachment',
            'view_mode': 'kanban,tree,form',
            'domain': [
                ('res_model', '=', 'res.partner'),
                ('res_id', '=', self.partner_id.id)
            ],
            'context': {
                'default_res_model': 'res.partner',
                'default_res_id': self.partner_id.id,
                'search_default_my_documents': 1,
            }
        }

    @api.model
    def create(self, vals):
        lead = super().create(vals)
        if lead.partner_id:
            lead.partner_id._assign_seq_code_id_client_if_needed()
        return lead

    def write(self, vals):
        res = super().write(vals)
        if any(k in vals for k in ('stage_id', 'partner_id')):
            partners = self.mapped('partner_id')
            if partners:
                partners._assign_seq_code_id_client_if_needed()
        return res

