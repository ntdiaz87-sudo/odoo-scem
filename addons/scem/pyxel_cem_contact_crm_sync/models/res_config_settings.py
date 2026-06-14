# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from dateutil.relativedelta import relativedelta

from odoo import api, models, fields, _
from odoo.exceptions import ValidationError

class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    cem_crm_origin_url_server = fields.Char(related="company_id.cem_crm_origin_url_server", readonly=False)
    cem_crm_origin_db = fields.Char(related="company_id.cem_crm_origin_db", readonly=False)
    cem_crm_origin_username = fields.Char(related="company_id.cem_crm_origin_username", readonly=False)
    cem_crm_origin_password = fields.Char(related="company_id.cem_crm_origin_password", readonly=False)

    cem_crm_origin_lang = fields.Selection(related="company_id.cem_crm_origin_lang", readonly=False)
    cem_crm_origin_stage = fields.Char(related="company_id.cem_crm_origin_stage", readonly=False)
    cem_crm_origin_company = fields.Char(related="company_id.cem_crm_origin_company", readonly=False)
    stage_cem_crm_end_id = fields.Many2one(related="company_id.stage_cem_crm_end_id", readonly=False)

    cem_sync_id = fields.Many2one(related="company_id.cem_sync_id")
    # ir.cron fields
    cem_crm_sync_interval_number = fields.Integer(related='cem_sync_id.interval_number', string='Interval Number',
                                                  readonly=False)
    cem_crm_sync_interval_type = fields.Selection(related='cem_sync_id.interval_type', string='Interval Unit',
                                                  readonly=False)
    cem_crm_sync_nextcall = fields.Datetime(related='cem_sync_id.nextcall', readonly=True)
    cem_crm_sync_data_changed = fields.Boolean

    @api.constrains('cem_crm_sync_interval_number')
    def validate_interval(self):
        for rec in self:
            if rec.cem_crm_sync_interval_number < 1 :
                raise ValidationError(_('Time interval is invalid.'))

    def _get_nextcall(self, interval_number, interval_type):
        return fields.Datetime.now() + relativedelta(**{interval_type: interval_number})

    def do_contacts_sync(self):
        self.env['cem.contact.crm.synchronizer'].sudo().syncronize_contacts()

    @api.model_create_multi
    def create(self, vals_list):
        if not self.env.company.cem_sync_id:
            self.env.company.assign_synchronizer()

        res = super().create(vals_list)

        cron_vals = {'nextcall': self._get_nextcall(res.cem_crm_sync_interval_number,
                                                            res.cem_crm_sync_interval_type)}
        cron_vals = {field_name: value for field_name, value in cron_vals.items() if
                     res.cem_sync_id[field_name] != value}
        if cron_vals:
            res.cem_sync_id.write(cron_vals)

        return res
