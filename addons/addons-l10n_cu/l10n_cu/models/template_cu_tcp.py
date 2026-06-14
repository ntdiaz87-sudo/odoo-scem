# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import models, _
from odoo.addons.account.models.chart_template import template


class AccountChartTemplate(models.AbstractModel):
    _inherit = 'account.chart.template'

    @template('cu_tcp')
    def _get_cu_tcp_template_data(self):
        return {
            'visible': True,
            'name': 'Cuba - Plan Contable TCP',
            'code_digits': '3',
            'parent': 'cu_common',

            #  origin l10n_cu post data
            'property_account_receivable_id': 'account_tcp_135',
            'property_account_payable_id': 'account_common_4050020',
            'property_account_expense_categ_id': 'account_common_800',
            'property_account_income_categ_id': 'account_common_900',

        }

    @template('cu_tcp', 'res.company')
    def _get_cu_tcp_res_company(self):
        return {
            self.env.company.id: {
                # origin l10n_cu xml
                'cash_account_code_prefix': '101.',
                'bank_account_code_prefix': '109.',
                'transfer_account_code_prefix': '108.',
                'currency_id': 'base.CUP',
                'country_id': 'base.cu',

                # added
                'account_fiscal_country_id': 'base.cu',

                #  origin l10n_cu post data
                'account_journal_payment_debit_account_id': 'account_common_106',
                'account_journal_payment_credit_account_id': 'account_common_107',
                'default_cash_difference_expense_account_id': 'account_common_839',
                'default_cash_difference_income_account_id': 'account_common_924',
                'account_journal_early_pay_discount_loss_account_id': 'account_common_835',
                'account_journal_early_pay_discount_gain_account_id': 'account_common_920',
            },
        }
