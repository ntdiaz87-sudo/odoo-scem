# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _
from odoo.exceptions import UserError

# NO VA----------------------------
# class ResPartner(models.Model):
#     _inherit = 'res.partner'
#
#     onei_code = fields.Char(string="ONEI Code")
#     bank_title = fields.Char(string="Bank Title")
#     global_location_number = fields.Char(string="Bank Title")
#     invoice_stamp_image = fields.Binary(string="Invoice Stamp Image")
# ----------------------------------

class AccountMove(models.Model):
    _inherit = 'account.move'



    # Pago a proveedor
    is_supplier_payment = fields.Boolean(
        string='Pago al Proveedor',
        tracking=True,
        help='Marcar si esta orden requiere pago a un proveedor'
    )
    supplier_partner_id = fields.Many2one(
        'res.partner',
        string='Proveedor',
        domain=[('is_provider', '=', True)],
        tracking=True,
        help='Proveedor al que se realizará el pago'
    )
    supplier_bank_account_id = fields.Many2one(
        'res.partner.bank',
        string='Cuenta Bancaria Proveedor',
        domain="[('partner_id', '=', supplier_partner_id)]",
        help='Cuenta bancaria del proveedor para el pago'
    )
    supplier_acc_number = fields.Char(
        string='Número de Cuenta',
        related='supplier_bank_account_id.acc_number',
        readonly=True
    )
    supplier_currency_id = fields.Many2one(
        'res.currency',
        string='Moneda Cuenta',
        related='supplier_bank_account_id.currency_id',
        readonly=True
    )
    supplier_account_type = fields.Selection(
        string='Tipo de Cuenta',
        related='supplier_bank_account_id.acc_type',
        readonly=True
    )
    supplier_titular_id = fields.Many2one(
        'res.partner',
        string='Titular',
        related='supplier_bank_account_id.titular_id',
        help='Titular de la cuenta bancaria'
    )
    supplier_swift_code = fields.Char(
        string='Código SWIFT',
        related='supplier_bank_account_id.swift_code',
        readonly=True
    )
    supplier_bank_id = fields.Many2one(
        'res.bank',
        string='Banco',
        related='supplier_bank_account_id.bank_id',
        help='Banco asociado a la cuenta'
    )
    cem_hide_supplier_data = fields.Boolean(
        string='No imprimir Datos del Proveedor',
    )

    # Control de readonly en la vista
    is_form_readonly = fields.Boolean(
        string='Form Readonly',
        compute='_compute_is_form_readonly',
        store=False
    )

    @api.depends('state')
    def _compute_is_form_readonly(self):
        for move in self:
            move.is_form_readonly = move.state == 'posted'

    @api.onchange('is_supplier_payment')
    def _onchange_is_supplier_payment(self):
        for rec in self:
            if rec.is_supplier_payment:
                wire_transfer = self.env['payment.method'].search([('name', '=', 'Wire Transfer')], limit=1)
                rec.selected_payment_method_payment_id = wire_transfer
            else:
                rec.selected_payment_method_payment_id = False
                rec.supplier_partner_id = False
                rec.supplier_bank_account_id = False

    @api.onchange('supplier_partner_id')
    def _onchange_supplier_partner_id(self):
        if self.supplier_partner_id and len(self.supplier_partner_id.bank_ids) == 1:
            self.supplier_bank_account_id = self.supplier_partner_id.bank_ids[0]
        else:
            self.supplier_bank_account_id = False



    def action_post_pay_custom(self):
        # Validación de cuenta bancaria
        for order in self:
            if order.supplier_partner_id and not order.supplier_bank_account_id:
                order.message_post(
                    body=_("⚠ El proveedor %s no tiene cuentas bancarias registradas.") % order.supplier_partner_id.name
                )
                self.env['bus.bus']._sendone(
                    self.env.user.partner_id,
                    'simple_notification',
                    {
                        'title': _('Información'),
                        'message': _('El proveedor %s no tiene cuentas bancarias registradas.') % order.supplier_partner_id.name,
                        'type': 'warning'
                    }
                )

        # Publicar factura
        self.action_post()

        # Registrar pago
        ctx = {
            'active_model': 'account.move.line',
            'dont_redirect_to_payments': True,
            'display_account_trust': True,
            'active_id': self.id,
            'active_ids': self.line_ids.ids
        }
        self.with_context(ctx).env['account.payment.register'].create({}).action_create_payments()

        # Enviar correo al cliente
        template = self.env.ref('pyxel_cem_sale.mail_template_invoice_confirmation_custom', raise_if_not_found=True)
        action = True
        if template:
            template.sudo().send_mail(self.id, force_send=True, email_layout_xmlid='mail.mail_notification_light')
            action = {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'type': 'success',
                    'message': _('The invoice was confirmed and has been successfully sent to customer in email.'),
                    'next': {'type': 'ir.actions.act_window_close'},
                }
            }

        # Enviar correo a usuarios de almacén
        template = self.env.ref('pyxel_cem_sale.mail_template_delivery_confirmation_custom', raise_if_not_found=True)
        if template:
            grocers = self.env['res.users'].search([
                ('company_ids', 'in', self.env.company.id),
                ('groups_id', 'in', self.env.ref('pyxel_cem_sale.group_stock_grocer_cem').id)
            ])
            emails = set(r.email_formatted for r in grocers if r.email_formatted)
            if emails:
                email_values = {'email_to': ','.join(emails)}
                ctx = {'invoice_origin_name': self.name}
                for pick in self.sale_id.picking_ids:
                    template.sudo().with_context(**ctx).send_mail(
                        pick.id,
                        force_send=True,
                        email_values=email_values,
                        email_layout_xmlid='mail.mail_notification_light'
                    )

        return action

    @api.depends('sale_id.payment_meth_id')
    def _compute_selected_payment_method(self):
        for record in self:
            if record.sale_id:
                record.selected_payment_method_payment_id = record.sale_id.payment_meth_id
            else:
                record.selected_payment_method_payment_id = False