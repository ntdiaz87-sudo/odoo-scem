# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _

from odoo.exceptions import ValidationError


class ResCompany(models.Model):
    _inherit = 'res.company'

    is_default = fields.Boolean('Is Default', compute="_compute_is_def")
    nit = fields.Char(string='NIT')
    reeup = fields.Char(string='REEUP')

    beneficiary = fields.Char(string='Beneficiary')
    account_number = fields.Char(string='Account Number')
    bank = fields.Char(string='Bank')
    swift_code = fields.Char(string='Swift Code')
    company_warranty = fields.Html("Garantía")
    cem_print_paid_waterm = fields.Boolean("Print 'Paid' watermark in invoice document")

    warranty_management = fields.Boolean(
        string='Gestión de Garantía',
        default=False,
        help='Habilitar si la compañía lleva gestión de garantías'
    )

    company_terms_conditions = fields.Html(
        string="Términos y Condiciones",
        help="Términos y condiciones generales de la compañía"
    )
    terms_conditions_management = fields.Boolean(
        string='Gestión de Términos y Condiciones',
        default=False,
        help='Habilitar si la compañía utiliza términos y condiciones personalizados'
    )

    cem_show_invoice_taxes = fields.Boolean('Show Taxes', default=True)

    @api.depends()
    def _compute_is_def(self):
        def_comp = self.env.ref('base.main_company')
        for rec in self:
            rec.is_default = self.id == def_comp.id

    @api.constrains('nit','reeup','account_number')
    def validate_numeric_fields(self):
        for rec in self:
            if rec.nit and not str.isdigit(str(rec.nit)):
                raise ValidationError(_('NIT is invalid.'))
            if rec.reeup and not str.isdigit(str(rec.reeup)):
                raise ValidationError(_('REEUP is invalid.'))
            if rec.account_number and not str.isdigit(str(rec.account_number)):
                raise ValidationError(_('Account Number is invalid.'))

    @api.onchange('nit', 'reeup', 'account_number')
    def on_change_numeric_fields(self):
        fields_name = []
        if self.nit and not str.isdigit(str(self.nit)):
            fields_name.append(_('NIT'))
        if self.reeup and not str.isdigit(str(self.reeup)):
            fields_name.append(_('REEUP'))
        if self.account_number and not str.isdigit(str(self.account_number)):
            fields_name.append(_('Account Number'))
        if fields_name:
            return {'warning': {
                'title': _('Invalid Value'),
                'message': _('Only is allowed numbers in the value in this fields: %s') % ', '.join(fields_name)}}

