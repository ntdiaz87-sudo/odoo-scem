# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api, _

SUPPLIER_MANAGEMENT_PARAM = "pyxel_cem_sale.supplier_management"

class AccountMove(models.Model):
    _inherit = 'account.move'

    sale_id = fields.Many2one(
        'sale.order',
        string="Sale Order Origin",
        ondelete='restrict',
        copy = False
    )

    selected_payment_method_payment_id = fields.Many2one(
        'payment.method',
        string="Payment Method",
        compute='_compute_selected_payment_method',
        store=True,
        readonly=True,
        copy=False
    )

    cem_hide_supplier_data = fields.Boolean(
        string='No imprimir Datos del Proveedor',
    )

    show_warranty_section = fields.Boolean(
        string='Mostrar Sección Garantías',
        compute='_compute_show_warranty_section',
        store=False
    )

    display_warranty = fields.Html(
        string='Garantía a Mostrar',
        compute='_compute_display_warranty',
        store=False
    )

    show_terms_conditions_section = fields.Boolean(
        string='Mostrar Sección Términos y Condiciones',
        compute='_compute_show_terms_conditions_section',
        store=False
    )

    display_terms_conditions = fields.Html(
        string='Términos y Condiciones a Mostrar',
        compute='_compute_display_terms_conditions',
        store=False
    )
    
    show_invoice_supplier_management_columns = fields.Boolean(
        string="Show Supplier Management Columns",
        compute="_compute_show_invoice_supplier_management_columns",
    )

    def _is_supplier_management_enabled(self):
        return (
            self.env["ir.config_parameter"]
            .sudo()
            .get_param(SUPPLIER_MANAGEMENT_PARAM)
            == "True"
        )

    @api.depends(
        "invoice_line_ids.sale_line_ids",
        "invoice_line_ids.sale_line_ids.has_multiple_suppliers",
        "sale_id",
        "sale_id.order_line.has_multiple_suppliers",
    )
    def _compute_show_invoice_supplier_management_columns(self):
        enabled = self._is_supplier_management_enabled()

        for move in self:
            sale_lines = move.invoice_line_ids.mapped("sale_line_ids")

            if not sale_lines and move.sale_id:
                sale_lines = move.sale_id.order_line

            move.show_invoice_supplier_management_columns = bool(
                enabled
                and sale_lines.filtered(lambda line: line.has_multiple_suppliers)
            )

            
    @api.depends('sale_id.payment_meth_id')
    def _compute_selected_payment_method(self):
        for record in self:
            # Si la factura está relacionada con un pedido, toma el método de pago del pedido.
            if record.sale_id:
                record.selected_payment_method_payment_id = record.sale_id.payment_meth_id
            else:
                record.selected_payment_method_payment_id = False


    @api.depends('invoice_line_ids', 'company_id')
    def _compute_show_warranty_section(self):
        for invoice in self:

            if not invoice.company_id.warranty_management:
                invoice.show_warranty_section = False
                continue

            invoice.show_warranty_section = any(
                line.product_id and line.product_id.has_warranty
                for line in invoice.invoice_line_ids
            )

    @api.depends('company_id')
    def _compute_display_warranty(self):
        """Compute la garantía a mostrar en el reporte"""
        for invoice in self:
            warranty_content = False

            # Verificar si la compañía tiene garantía habilitada y no está vacía
            if (invoice.company_id.warranty_management and
                    invoice.company_id.company_warranty):
                warranty_content = invoice.company_id.company_warranty

            invoice.display_warranty = warranty_content

    @api.depends('company_id')
    def _compute_show_terms_conditions_section(self):
        """Compute si se debe mostrar la sección de términos y condiciones"""
        for invoice in self:
            # Verificar si la compañía tiene habilitada la gestión de términos y condiciones
            if not invoice.company_id.terms_conditions_management:
                invoice.show_terms_conditions_section = False
                continue

            # Puedes agregar condiciones adicionales aquí si es necesario
            # Por ejemplo, solo mostrar si es factura de cliente, etc.
            if invoice.move_type in ['out_invoice', 'out_refund']:
                invoice.show_terms_conditions_section = True
            else:
                invoice.show_terms_conditions_section = False

    @api.depends('invoice_line_ids', 'company_id')
    def _compute_display_terms_conditions(self):
        """Compute los términos y condiciones a mostrar en el reporte"""
        for invoice in self:
            terms_content = False

            # Verificar si hay productos con términos y condiciones
            for line in invoice.invoice_line_ids:
                if line.product_id and line.product_id.terms_cond:
                    terms_content = line.product_id.terms_cond
                    break  # Tomar el primer producto que tenga términos

            # Si no se encontraron términos en productos, usar los de la compañía
            if not terms_content and invoice.company_id.terms_conditions_management:
                terms_content = invoice.company_id.company_terms_conditions

            invoice.display_terms_conditions = terms_content

    # =========================
    # ACCIONES
    # =========================

    def action_post_pay_custom(self):
        # Publicar factura
        self.action_post()

        # Registrar Pago
        ctx = {
            'active_model': 'account.move.line',
            'dont_redirect_to_payments': True,
            'display_account_trust': True,
            'active_id': self.id,
            'active_ids': self.line_ids.ids
        }
        self.with_context(ctx).env['account.payment.register'].create({}).action_create_payments()

        # Enviar email al cliente
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