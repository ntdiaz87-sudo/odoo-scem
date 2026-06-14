# Part of Odoo. See LICENSE file for full copyright and licensing details.
import base64

from odoo import api, models, fields, _
from odoo.exceptions import UserError, ValidationError

SO_CEM_STATE = [
    ('no_paid', "No Paid"),
    ('paid', "Paid"),
    ('delivered', "Delivered"),
]


SUPPLIER_MANAGEMENT_PARAM = "pyxel_cem_sale.supplier_management"


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    payment_prov_id = fields.Many2one('payment.provider', string="Payment Provider", ondelete='restrict')
    payment_meth_id = fields.Many2one('payment.method', string="Payment Method", ondelete='restrict')
    payment_meth_ids_comp = fields.Many2many(
        comodel_name='payment.method',
        string="Payment Methods",
        compute='_compute_payment_methods',
        copy=False)
    so_cem_state = fields.Selection(selection=SO_CEM_STATE, string="CEM State", compute="_compute_so_cem_state",
        readonly=True, store=True, default='no_paid')

    delivery_lapse = fields.Char(string="Delivery Lapse")
    
    
    show_supplier_management_columns = fields.Boolean(
        string="Show Supplier Management Columns",
        compute="_compute_show_supplier_management_columns",
    )

    def _is_supplier_management_enabled(self):
        return (
            self.env["ir.config_parameter"]
            .sudo()
            .get_param(SUPPLIER_MANAGEMENT_PARAM)
            == "True"
        )

    @api.depends("order_line.product_id", "order_line.has_multiple_suppliers")
    def _compute_show_supplier_management_columns(self):
        enabled = self._is_supplier_management_enabled()

        for order in self:
            order.show_supplier_management_columns = bool(
                enabled
                and any(
                    line.has_multiple_suppliers
                    for line in order.order_line
                    if not line.display_type
                )
            )

    @api.onchange("order_line", "order_line.product_id")
    def _onchange_supplier_management_columns(self):
        self._compute_show_supplier_management_columns()

    def action_confirm(self):
        self._check_supplier_management_lines()
        return super().action_confirm()

    def _check_supplier_management_lines(self):
        if not self._is_supplier_management_enabled():
            return

        for order in self:
            missing_supplier_lines = order.order_line.filtered(
                lambda line: not line.display_type
                and line.product_id
                and line.has_multiple_suppliers
                and not line.supplier_partner_id
            )

            if missing_supplier_lines:
                products = "\n".join(
                    "- %s" % line.product_id.display_name
                    for line in missing_supplier_lines
                )

                raise ValidationError(
                    _(
                        "You must select a supplier for the following products:\n%s"
                    )
                    % products
                )

            invalid_supplier_lines = order.order_line.filtered(
                lambda line: not line.display_type
                and line.product_id
                and line.supplier_partner_id
                and line.supplier_partner_id not in line.available_supplier_ids
            )

            if invalid_supplier_lines:
                products = "\n".join(
                    "- %s" % line.product_id.display_name
                    for line in invalid_supplier_lines
                )

                raise ValidationError(
                    _(
                        "The selected supplier is not valid for the following products:\n%s"
                    )
                    % products
                )


    @api.depends('payment_prov_id')
    def _compute_payment_methods(self):
        for rec in self:
            if rec.payment_prov_id:
                rec.payment_meth_ids_comp = rec.payment_prov_id.payment_method_ids
            else:
                rec.payment_meth_ids_comp = [(5, 0, 0)]

    @api.depends('invoice_ids', 'invoice_ids.payment_state', 'picking_ids', 'picking_ids.state')
    def _compute_so_cem_state(self):
        for order in self:
            invoices = self.mapped('invoice_ids')
            invs_paid = [inv.payment_state in ('paid', 'in_payment') for inv in invoices]
            all_invs_paid = invs_paid and all(invs_paid)
            picks_done = [p.state in ('done', 'cancel') for p in self.picking_ids]
            all_picks_done = picks_done and all(picks_done)
            if all_invs_paid and not all_picks_done:
                order.so_cem_state = 'paid'
            elif all_picks_done:
                order.so_cem_state = 'delivered'
            else:
                order.so_cem_state = 'no_paid'

    @api.onchange('payment_prov_id')
    def _onchange_payment_prov_id(self):
        self.payment_meth_id = False
        if self.payment_prov_id:
            domain = {'payment_meth_id': [('id', 'in', self.payment_prov_id.payment_method_ids.ids)]}
            return {'domain': domain}

    # =========================
    # CONTROL DE VISTA
    # =========================

    @api.model
    def _get_view(self, view_id=None, view_type='form', **options):

        def make_fields_readonly(node):
            read_att_value = "so_cem_state != 'no_paid'"
            for child in node.iterchildren():
                if child.tag == 'field':
                    read_att_xml = child.get('readonly', "")
                    val_att = f"{read_att_xml} or {read_att_value}" if read_att_xml else read_att_value
                    child.set('readonly', val_att)
                else:
                    make_fields_readonly(child)
            return node

        arch, view = super()._get_view(view_id, view_type, **options)
        if view_type == 'form':
            arch = make_fields_readonly(arch)
        return arch, view

    # =========================
    # LÓGICA DE NEGOCIO
    # =========================

    def action_confirm_custom(self):
        # Notify exectution flow from scem sale
        self = self.with_context({'__invoke_from_scem_sales__': 1})
        self.action_confirm()

        #  Custom action on confirmation
        return self.run_on_confirm()

    def run_on_confirm(self):
        # Create invoice
        for order in self:
            order._create_invoices(grouped=True)
            return order.send_mail_custom()

    def send_mail_custom(self):
        # Override to customize email notification
        mail_template = self.env.ref('pyxel_cem_sale.mail_template_sale_confirmation_custom',
                                     raise_if_not_found=False)
        if mail_template:
            mail_template.sudo().send_mail(self.id, force_send=True,
                                           email_layout_xmlid='mail.mail_notification_light')
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'type': 'success',
                    'message': _('The sale order was confirmed and notified to customer via email.'),
                    'next': {'type': 'ir.actions.act_window_close'},
                }
            }

    def _prepare_invoice(self):
        # OVERRIDE
        vals = super()._prepare_invoice()
        vals['sale_id'] = self.id

        return vals

    def action_delivered(self):
        self.ensure_one()
        self.action_lock()
        # Confirm the delivery
        res = self.picking_ids.button_validate()
        if self.picking_ids.filtered(lambda p: p.state not in ('done', 'cancel')):
            raise UserError(_('There is transfers in warehouse that must be delivered or canceled.'))
        # Send email to customer
        template = self.env.ref('pyxel_cem_sale.mail_template_sale_delivered', raise_if_not_found=True)
        if template:
            template.sudo().send_mail(self.id, force_send=True, email_layout_xmlid='mail.mail_notification_light')
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'type': 'success',
                    'message': _('The sale order was fully delivered to customer and notified via email.'),
                    'next': {'type': 'ir.actions.act_window_close'},
                }
            }
        return res

    def _action_cancel(self):
        res = super(SaleOrder, self)._action_cancel()
        # Cancel the delivery
        self.picking_ids.action_cancel()
        template = self.env.ref('pyxel_cem_sale.mail_template_sale_canceled', raise_if_not_found=True)
        if template:
            invoice_report = self.env.ref('account.account_invoices')
            invoices = self.invoice_ids
            pdf_content = base64.b64encode(self.env['ir.actions.report'].sudo()._render_qweb_pdf(
                invoice_report, invoices.ids, data=None)[0])
            ir_values = {
                'name': _('Invoice: %s', (', '.join(invoices.mapped('name')))),
                'type': 'binary',
                'datas': pdf_content,
                'store_fname': pdf_content,
                'mimetype': 'application/pdf',
                'res_model': 'account.move',
            }
            # create the attachment
            invoice_report_attach_id = self.env['ir.attachment'].sudo().create(ir_values)
            if invoice_report_attach_id:
                template.attachment_ids = [(4, invoice_report_attach_id.id)]
            template.sudo().send_mail(self.id, force_send=True, email_layout_xmlid='mail.mail_notification_light')
            if invoice_report_attach_id:
                # remove attachment from template
                template.attachment_ids = [(3, invoice_report_attach_id.id)]
                # delete attachment
                invoice_report_attach_id.unlink()
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'type': 'danger',
                    'message': _('The sale order was canceled and notified via email.'),
                    'next': {'type': 'ir.actions.act_window_close'},
                }
            }
        return res
