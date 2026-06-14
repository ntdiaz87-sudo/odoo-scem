# Part of Odoo. See LICENSE file for full copyright and licensing details.
import base64

from odoo import api, models, fields, _
from odoo.exceptions import UserError

SO_CEM_STATE = [
    ('no_paid', "No Paid"),
    ('paid', "Paid"),
    ('delivered', "Delivered"),
]



class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # Campos de pagos


    # Campo para controlar readonly desde la vista
    is_form_readonly = fields.Boolean(
        string='Form Readonly',
        compute='_compute_is_form_readonly',
        store=False
    )

    # Checkbox para activar pago al proveedor
    is_supplier_payment = fields.Boolean(
        string='Pago al Proveedor',
        tracking=True,
        help='Marcar si esta orden requiere pago a un proveedor'
    )

    # Proveedor seleccionado
    supplier_partner_id = fields.Many2one(
        'res.partner',
        string='Proveedor',
        domain=[('is_provider', '=', True)],
        tracking=True,
        help='Proveedor al que se realizará el pago'
    )

    # Cuenta bancaria del proveedor
    supplier_bank_account_id = fields.Many2one(
        'res.partner.bank',
        string='Cuenta Bancaria Proveedor',
        domain="[('partner_id', '=', supplier_partner_id)]",
        help='Cuenta bancaria del proveedor para el pago'
    )

    # Campos relacionados con la cuenta bancaria del proveedor
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
    supplier_bank_account_ids = fields.One2many(
        related='supplier_partner_id.bank_ids',
        string='Cuentas Bancarias Disponibles',
        readonly=True
    )



    def _prepare_invoice(self):
        # Llamamos al método original para obtener los valores base
        invoice_vals = super()._prepare_invoice()

        # Agregar los campos personalizados que quieres pasar a la factura
        invoice_vals.update({
            'selected_payment_method_payment_id': self.payment_meth_id.id if self.payment_meth_id else False,
            'is_supplier_payment': self.is_supplier_payment,
            'supplier_partner_id': self.supplier_partner_id.id if self.supplier_partner_id else False,
            'supplier_bank_account_id': self.supplier_bank_account_id.id if self.supplier_bank_account_id else False,

        })

        return invoice_vals

    @api.depends('state')
    def _compute_is_form_readonly(self):
        for order in self:
            order.is_form_readonly = order.state == 'sale'

    @api.depends('payment_prov_id', 'is_supplier_payment')
    def _get_payment_methods(self):
        for rec in self:
            if rec.is_supplier_payment:
                # Si es pago a proveedor, no restringimos métodos
                rec.payment_meth_ids_comp = self.env['payment.method'].search([])
            elif rec.payment_prov_id:
                rec.payment_meth_ids_comp = rec.payment_prov_id.payment_method_ids
            else:
                rec.payment_meth_ids_comp = [(5, 0, 0)]

    @api.depends('invoice_ids', 'invoice_ids.payment_state', 'picking_ids', 'picking_ids.state')
    def _compute_so_cem_state(self):
        for order in self:
            invoices = order.mapped('invoice_ids')
            all_invs_paid = invoices and all(inv.payment_state in ('paid', 'in_payment') for inv in invoices)
            all_picks_done = order.picking_ids and all(p.state in ('done', 'cancel') for p in order.picking_ids)
            if all_invs_paid and not all_picks_done:
                order.so_cem_state = 'paid'
            elif all_picks_done:
                order.so_cem_state = 'delivered'
            else:
                order.so_cem_state = 'no_paid'

    @api.onchange('payment_prov_id')
    def _onchange_payment_prov_id(self):
        if not self.is_supplier_payment:
            self.payment_meth_id = False
            if self.payment_prov_id:
                return {'domain': {'payment_meth_id': [('id', 'in', self.payment_prov_id.payment_method_ids.ids)]}}

    @api.onchange('supplier_partner_id')
    def _onchange_supplier_partner_id(self):
        """Selecciona automáticamente la cuenta bancaria si solo hay una"""
        self.supplier_bank_account_id = False
        if self.supplier_partner_id and len(self.supplier_partner_id.bank_ids) == 1:
            self.supplier_bank_account_id = self.supplier_partner_id.bank_ids[0]

    @api.onchange('is_supplier_payment')
    def _onchange_is_supplier_payment(self):
        """Configura valores automáticos cuando se marca pago a proveedor"""
        if self.is_supplier_payment:
            self.payment_prov_id = self.env.ref('payment.payment_provider_transfer', raise_if_not_found=False)
            self.payment_meth_id = self.env.ref('payment.payment_method_bank_transfer', raise_if_not_found=False)
        else:
            self.supplier_partner_id = False
            self.supplier_bank_account_id = False
            self.payment_prov_id = False
            self.payment_meth_id = False

    # Métodos de confirmación y correo se mantienen tal cual
    def action_confirm_custom(self):
        for order in self:
            if order.supplier_partner_id and not order.supplier_bank_account_id:
                order.message_post(
                    body=_("⚠ El proveedor %s no tiene cuentas bancarias registradas.") % order.supplier_partner_id.name
                )
        return super(SaleOrder, self).action_confirm_custom()
