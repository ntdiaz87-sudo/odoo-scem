# Part of Odoo. See LICENSE file for full copyright and licensing details.
import pytz

from odoo import api, models, fields, _
from odoo.exceptions import UserError

from odoo.addons.pyxel_link_payment_tropipay.const import TROPIPAY_CODE


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    pay_by_tpp = fields.Boolean(string="Pay by Tropipay", compute='_compute_pay_tpp')
    tpp_link = fields.Char(string="Payment Link", compute='_compute_link')
    error_msg = fields.Char(string="Error Message", compute='_compute_link')
    tpp_link_exp_date = fields.Datetime(string="Tropipay Payment Link Expiration", compute='_compute_link')
    tpp_link_exp_date_str = fields.Char(string="Tropipay Payment Link Expiration Str", compute='_compute_link')
    is_fully_paid = fields.Boolean(string="Is Fully Paid", compute='_compute_fully_paid')

    # Compute always
    @api.depends()
    def _compute_pay_tpp(self):
        for so in self:
            payment_prov_id = getattr(so, 'payment_prov_id')
            payment_meth_id = getattr(so, 'payment_meth_id')
            so.pay_by_tpp = payment_prov_id and payment_prov_id.code == TROPIPAY_CODE and \
                            payment_meth_id.code == TROPIPAY_CODE

    @api.depends('state')
    def _compute_link(self):
        tpp_provider = self.env['payment.provider'].get_tpp_provider()
        for so in self:
            link = "invalid_url"
            error_msg = ""
            exp_date = None
            if so.state == 'sale':
                try:
                    params = self.get_tpp_payment_link_data()
                    data_ = tpp_provider._generate_pay_tpp_link(**params)
                    link = data_['pay_link']
                    exp_date = data_['exp_date']
                except Exception as e:
                    error_msg = e.__str__()
            so.tpp_link = link
            so.error_msg = error_msg
            so.tpp_link_exp_date = exp_date
            tz = self.env.user.tz or 'UTC'
            so.tpp_link_exp_date_str = exp_date and exp_date.replace(tzinfo=pytz.UTC).astimezone(
                pytz.timezone(tz)).replace(tzinfo=None) or None

    @api.depends('invoice_ids', 'invoice_ids.payment_state')
    def _compute_fully_paid(self):
        for so in self:
            so.is_fully_paid = so.invoice_ids and \
                               all(inv.payment_state in ('paid', 'in_payment') for inv in so.invoice_ids)

    def _get_default_pay_tpp_link_values(self):
        self.ensure_one()

        return {
            'amount': self.amount_total,
            'currency_id': self.currency_id.id,
            'partner_id': self.partner_id.id,
        }

    def get_tpp_payment_link_data(self):
        name_tokens = self.partner_id.name.split(' ')
        if len(name_tokens) == 1:
            i = 1;
            j = 0
        elif len(name_tokens) > 1:
            i = 1;
            j = 1
        else:
            i = 2;
            j = 2
        name = ' '.join(name_tokens[: i])
        last_name = ' '.join(name_tokens[j:])
        lang = self.env['res.lang'].with_context(active_test=True).search([('code', '=', self.partner_id.lang)])
        tz = self.partner_id.tz or self.env.user.tz or 'UTC'
        return {
            'reference': self.name, 'concept': _('Shopping in %s') % self.company_id.name,
            'description': self._get_tpp_desc(), 'amount': self.amount_total,
            'currency': self.currency_id.name, 'lang': lang.iso_code,
            'client': {
                'client_tz': tz,
                'name': name, 'lastName': last_name,
                'address': self.partner_id.contact_address,
                'phone': self.partner_id.phone,
                'email': self.partner_id.email,
                'countryIso': self.partner_id.country_id.code,
                'termsAndConditions': True,
                'city': self.partner_id.city,
                'postCode': self.partner_id.zip,
                'dateOfBirth': None
            }
        }

    def _get_tpp_desc(self):
        desc_ = ', '.join([l.product_id.name for l in self.order_line.sorted('price_total', reverse=True)])
        return f'{desc_[:250]} ...' if len(desc_) > 250 else desc_

    def _create_invoices(self, grouped=False, final=False, date=None):
        moves = super()._create_invoices(grouped=grouped, final=final, date=date)
        self.send_so_confirmation_mail_tpp()
        return moves

    def send_so_confirmation_mail_tpp(self):
        self.ensure_one()
        if self.payment_prov_id.code != TROPIPAY_CODE:
            return False
        wrong_so_tpp_link = self.tpp_link == 'invalid_url'
        if wrong_so_tpp_link:
            raise UserError(
                _("Can't posible resolve the Tropipay payment link of the order. Please check your connection "
                  "to Tropipay or resolve the following issue. %s", self.error_msg))
        mail_template = self.env.ref('pyxel_link_payment_tropipay.mail_template_sale_confirmation_custom',
                                     raise_if_not_found=False)
        if mail_template:
            mail_template.sudo().send_mail(self.id, force_send=True, email_layout_xmlid='mail.mail_notification_light')
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'type': 'success',
                    'message': _('The sale order was confirmed and notified to customer via email.'),
                    'next': {'type': 'ir.actions.act_window_close'},
                }
            }
        return True

        # Usando un wizard, afecta la experiencia de usuario
        # ctx = {
        #     'default_model': 'sale.order',
        #     'default_res_ids': so_ids,
        #     'default_template_id': mail_template.id if mail_template else None,
        #     'default_composition_mode': 'mass_mail',
        #     'default_email_layout_xmlid': 'mail.mail_notification_layout_with_responsible_signature',
        #     'force_email': True,
        #     'model_description': _('Tropipay CEM Payment Mail Notification'),
        #     'cem_mailing': True,
        # }
        # return {
        #     'type': 'ir.actions.act_window',
        #     'view_mode': 'form',
        #     'res_model': 'mail.compose.message',
        #     'views': [(False, 'form')],
        #     'view_id': False,
        #     'target': 'new',
        #     'context': ctx,
        # }
