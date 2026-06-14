# Part of Odoo. See LICENSE file for full copyright and licensing details.

import pytz

from odoo import _, api, fields, models


class TppPayLinkWizard(models.TransientModel):
    _name = 'tropipay.pay.link.wizard'
    _description = "Generate Pay by Tropipay Link"

    @api.model
    def default_get(self, fields_list):
        res = super().default_get(fields_list)
        res_id = self.env.context.get('active_id')
        res_model = self.env.context.get('active_model')
        if res_id and res_model:
            res.update({'res_model': res_model, 'res_id': res_id})
            res.update(
                self.env[res_model].browse(res_id)._get_default_pay_tpp_link_values()
            )
        return res

    res_model = fields.Char("Related Document Model", required=True)
    res_id = fields.Integer("Related Document ID", required=True)
    reference = fields.Char("Reference", compute='_compute_row_data')
    amount = fields.Monetary(currency_field='currency_id', required=True)
    currency_id = fields.Many2one('res.currency')
    partner_id = fields.Many2one('res.partner')
    partner_email = fields.Char(related='partner_id.email')
    link = fields.Char(string="Payment Link", compute='_compute_link')
    link_exp_date = fields.Datetime(string="Payment Link Expiration Date", compute='_compute_link')
    error_msg = fields.Char(string="Error Message", compute='_compute_link')
    company_id = fields.Many2one('res.company', compute='_compute_row_data')

    # @api.depends('amount', 'currency_id', 'partner_id', 'company_id')
    @api.depends('res_model', 'res_id')
    def _compute_link(self):
        # tpp_provider = self.env['payment.provider'].get_tpp_provider()
        for pay_link in self:
            try:
                record = self.env[self.res_model].browse(self.res_id)
                link = record.tpp_link
                exp_date = record.tpp_link_exp_date
                error = record.error_msg
                if not record:
                    raise Exception(_('No record found'))
                # if not hasattr(record, 'get_tpp_payment_link_data'):
                #     raise Exception
                # params = record.get_tpp_payment_link_data()
                # data_ = tpp_provider._generate_pay_tpp_link(**params)
                # link = data_['pay_link']
                # exp_date = data_['exp_date']
                # if exp_date:
                #     #   LLevarlo a UTC para que en el vista se muestre correctamente
                #     tz_name = self.partner_id.tz or self.env.user.tz or 'UTC'
                #     tz = tz_name and pytz.timezone(tz_name) or pytz.UTC
                #     exp_date =tz.localize(exp_date, is_dst=False).astimezone(pytz.UTC).replace(tzinfo=None)

            except Exception as e:
                link = "invalid_url"
                exp_date = None
                error = e.__str__()
            pay_link.link = link
            pay_link.link_exp_date = exp_date
            pay_link.error_msg = error

    @api.depends('res_model', 'res_id')
    def _compute_row_data(self):
        for link in self:
            record = self.env[link.res_model].browse(link.res_id)
            link.reference = record.name if 'name' in record else False
            link.company_id = record.company_id if 'company_id' in record else False
