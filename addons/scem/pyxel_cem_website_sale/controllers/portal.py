# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
from odoo.addons.account.controllers.portal import PortalAccount as BasePortalAccount
from odoo.addons.payment.controllers.portal import PaymentPortal

class CustomPortalAccount(BasePortalAccount, PaymentPortal):
    def _invoice_get_page_view_values(self, invoice, access_token, **kwargs):
        '''
        Modify the domain for payment method availability:
        - The only available payment method is the one selected in the selected_payment_method_payment_id field of the invoice.
        - If there is no value in the selected_payment_method_payment_id field, there are no payment methods available.
        '''
        values = super(CustomPortalAccount, self)._invoice_get_page_view_values(invoice, access_token, **kwargs)

        if not invoice._has_to_be_paid():
            return values

        if invoice.selected_payment_method_payment_id:
            selected_method = invoice.selected_payment_method_payment_id

            payment_methods_sudo = selected_method

            if selected_method.provider_ids:
                providers_sudo = selected_method.provider_ids
                tokens_sudo = request.env['payment.token'].sudo()._get_available_tokens(
                    providers_sudo.ids, invoice.partner_id.id
                )
            else:
                providers_sudo = request.env['payment.provider'].sudo()._get_compatible_providers(
                    invoice.company_id.id,
                    invoice.partner_id.id,
                    invoice.amount_total,
                    currency_id=invoice.currency_id.id
                )
                tokens_sudo = request.env['payment.token'].sudo()._get_available_tokens(
                    providers_sudo.ids, invoice.partner_id.id
                )

            values.update({
                'providers_sudo': providers_sudo,
                'payment_methods_sudo': payment_methods_sudo,
                'tokens_sudo': tokens_sudo,
            })
        else:
            #If you have no payment method selected, empty lists are passed.
            values.update({
                'providers_sudo': request.env['payment.provider'].sudo().browse([]),
                'payment_methods_sudo': request.env['payment.method'].sudo().browse([]),
                'tokens_sudo': request.env['payment.token'].sudo().browse([]),
            })

        return values
