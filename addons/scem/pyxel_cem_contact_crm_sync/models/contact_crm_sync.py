# Part of Odoo. See LICENSE file for full copyright and licensing details.
import re
import logging
import xmlrpc.client
from random import randrange

from odoo import api, models, _
from odoo.exceptions import UserError
from odoo.fields import Command

_logger = logging.getLogger(__name__)


class CEMContactCRMSynchronizer(models.TransientModel):
    _name = 'cem.contact.crm.synchronizer'
    _description = 'CEM Contact CRM Synchronizer'

    @api.model
    def syncronize_contacts(self):
        try:
            url = self.env.company.cem_crm_origin_url_server
            db = self.env.company.cem_crm_origin_db
            user = self.env.company.cem_crm_origin_username
            passw = self.env.company.cem_crm_origin_password
            common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(url))
            uid = common.authenticate(db, user, passw, {})
            models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(url))
            stage_id_orig = models.execute_kw(db, uid, passw, 'crm.stage', 'search_read',
                                              [[['name', '=', self.env.company.cem_crm_origin_stage]]],
                                              {'limit': 1, 'context': {'lang': self.env.company.cem_crm_origin_lang}},
                                              )
            scalar_fields = ['name', 'date', 'ref', 'lang', 'tz', 'vat', 'website', 'comment', 'employee', 'function',
                             'type', 'street', 'street2', 'zip', 'city', 'partner_latitude', 'partner_longitude',
                             'email', 'phone', 'mobile', 'is_company', 'color', 'barcode', 'image_1920'
                             ]
            rel_fields = ['state_id', 'country_id']
            partners = []
            crm_leads = []
            users = []
            if stage_id_orig:
                companies = models.execute_kw(db, uid, passw, 'res.company', 'search_read', [[]],
                                                       {'fields': ['name']})
                company_name = {}
                for comp_ in companies:
                    company_name[comp_['name']] = comp_['id']
                domain = [['partner_id', '!=', False], ['stage_id', '=', stage_id_orig[0]['id']]]
                if not self.env.company.cem_crm_origin_company:
                    domain.append(['company_id', '!=', False])
                else:
                    domain.append(['company_id', '=', company_name[self.env.company.cem_crm_origin_company]])
                lead_partners_sels = models.execute_kw(db, uid, passw, 'crm.lead', 'search_read',
                                                       [domain],
                                                       {'fields':
                                                            ['name', 'partner_id', 'company_id', 'expected_revenue']})
                partner_orig_ids = set()
                partner_lead_orig_match = {}
                for rec in lead_partners_sels:
                    partner_orig_ids.add(rec['partner_id'][0])
                    partner_lead_orig_match.setdefault(rec['partner_id'][1], []).append(
                        {'name': rec['name'], 'expected_revenue': rec['expected_revenue']})

                partners_rows = models.execute_kw(db, uid, passw, 'res.partner', 'search_read',
                                                  [[['id', 'in', tuple(partner_orig_ids)]]],
                                                  {'fields': scalar_fields + rel_fields})
                existing_partners = {}
                common_partners = self.env['res.partner']
                for rec in self.env['res.partner'].sudo().search([]):
                    existing_partners[rec['name']] = rec
                existing_logins = set([rec['login'] for rec in self.env['res.users'].sudo().search([])])
                emails_new = set()
                partner_vals = []
                installed_lang = dict(self.env['res.lang'].get_installed())

                valid_email_chars = r"[a-zA-Z0-9._%+-]"
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

                def sanitize_to_email(name_p: str):
                    _email = name_p
                    for c in _email:
                        if c != '@' and not re.match(valid_email_chars, c):
                            _email = _email.replace(c, '-')
                    return _email

                for row in partners_rows:
                    if row['name'] not in existing_partners:
                        if not row['email'] or not re.match(email_pattern, row['email']):
                            if not row['email']:
                                name_ = row['name']
                                fake_dom = '@fake-email.fake'
                                name_ = sanitize_to_email(name_)
                                for i in range(1000):
                                    fake_email = f'{name_}{randrange(1, 10^6)}{fake_dom}'
                                    if fake_email not in existing_logins:
                                        row['email'] = fake_email
                                        existing_logins.add(fake_email)
                                        emails_new.add(fake_email)
                                        break
                            else:
                                row['email'] = sanitize_to_email(row['email'])
                        new_partner_vals = {}
                        for f in scalar_fields:
                            if f == 'lang' and row[f] in installed_lang or f != 'lang':
                                new_partner_vals[f] = row[f]
                        new_partner_vals.update({f: row[f] and row[f][0] or False for f in rel_fields})
                        partner_vals.append(new_partner_vals)
                    else:
                        common_partners |= existing_partners[row['name']]

                partners_new = self.env['res.partner'].create(partner_vals)
                common_partners |= partners_new
                existing_leads = set([(rec.company_id.id, rec.partner_id.id, rec.stage_id.id, rec.name) for rec in
                                      self.env['crm.lead'].search([])])
                crm_leads_vals = []
                users_vals = []
                for p in common_partners:
                    for _lead in partner_lead_orig_match[p.name]:
                        _key = (self.env.company.id, p.id, self.env.company.stage_cem_crm_end_id.id, _lead['name'])
                        if _key not in existing_leads:
                            crm_leads_vals.append({
                                'name': _lead['name'],
                                'stage_id': self.env.company.stage_cem_crm_end_id.id,
                                'partner_id': p.id,
                                'company_id': self.env.company.id,
                                'expected_revenue': _lead['expected_revenue']
                            })
                    in_exist_email = p.email in existing_logins
                    if p.email and (not in_exist_email or (in_exist_email and p.email in emails_new)):
                        users_vals.append({
                            'partner_id': p.id,
                            'login': p.email,
                            'groups_id': [Command.set([self.env.ref('base.group_portal').id])]
                        })
                        existing_logins.add(p.email)

                crm_leads = self.env['crm.lead'].create(crm_leads_vals)
                users = self.env['res.users'].create(users_vals)
            msg = f">>>>    Imported {len(partners)} partners, created {len(crm_leads)} crm leads in " \
                  f"{self.env.company.stage_cem_crm_end_id.name} crm stage, created {len(users)} users."
            _logger.info(msg)
            return msg
        except Exception as e:
            _logger.error(f'>>>>    Error:  {str(e)}')
            raise UserError(_("Failed connection to %s or some value in 'Data Origin' is wrong.") %
                            self.env.company.cem_crm_origin_url_server)

    # def do_syncronize_contacts(self):
    #     try:
    #         msg = self.syncronize_contacts()
    #         return {
    #             'type': 'ir.actions.client',
    #             'tag': 'display_notification',
    #             'params': {
    #                 'title': _("Successful Synchronization"),
    #                 'message': msg,
    #                 # 'type': 'success',
    #                 'sticky': True,
    #             }
    #         }
    #     except Exception as e:
    #         return {
    #             'type': 'ir.actions.client',
    #             'tag': 'display_notification',
    #             'params': {
    #                 'title': _("Failed Synchronization"),
    #                 'message': e,
    #                 # 'type': 'danger',
    #                 'sticky': True,
    #                 'next': {'type': 'ir.actions.act_window_close'},
    #             }
    #         }

    @api.model
    def syncronize_contacts_cron(self):
        _logger.info(">>>>    Begin CEM CRM Synchronization")
        try:
            self.syncronize_contacts()
        except Exception:
            pass
        _logger.info(">>>>    Finished CEM CRM Synchronization")
