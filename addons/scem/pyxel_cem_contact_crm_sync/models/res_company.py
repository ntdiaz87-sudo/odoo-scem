# -*- coding: utf-8 -*-

from operator import itemgetter

from odoo import fields, models, api, tools, _


class ResCompany(models.Model):
    _inherit = "res.company"

    @api.model
    @tools.ormcache()
    def _get_all_lang(self):
        langs = self.env['res.lang'].with_context(active_test=False).search([])
        return sorted([(lang.code, lang.name) for lang in langs], key=itemgetter(1))

    cem_crm_origin_url_server = fields.Char('URL Server Origin')
    cem_crm_origin_db = fields.Char('DB')
    cem_crm_origin_username = fields.Char('User')
    cem_crm_origin_password = fields.Char('Password')

    cem_crm_origin_lang = fields.Selection(_get_all_lang, string='User Language in use', default='es_ES')
    cem_crm_origin_stage = fields.Char('Origin Stage')
    cem_crm_origin_company = fields.Char('Origin Company')
    stage_cem_crm_end_id = fields.Many2one('crm.stage', string='End Stage')

    cem_sync_id = fields.Many2one('ir.cron', string="Syncronizer")

    def assign_synchronizer(self):
        ir_cron = self.env['ir.cron'].sudo()
        cron_vals = {
            'name': _("CRM: CRM Contacts synchronizer to %s") % self.env.company.name,
            'model_id': self.env.ref('pyxel_cem_contact_crm_sync.model_cem_contact_crm_synchronizer').id,
            'state': 'code',
            'code': 'model.syncronize_contacts()',
            'active': True,
            'user_id': self.env.user.id,
            'interval_number': 1,
            'interval_type': 'days',
            'numbercall': -1
        }
        cron = ir_cron.create(cron_vals)
        self.write({'cem_sync_id': cron.id})

    @api.model_create_multi
    def create(self, vals_list):
        res = super().create(vals_list)
        # link ir_cron
        res.assign_synchronizer()
        return res


