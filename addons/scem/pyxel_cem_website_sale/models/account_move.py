from odoo import models, api

class AccountMove(models.Model):
    _inherit = 'account.move'

    def _invoice_paid_hook(self):
        res = super(AccountMove, self)._invoice_paid_hook()
        for invoice in self.filtered(lambda inv: inv.move_type == 'out_invoice' and inv.invoice_origin):
            sale_order = self.env['sale.order'].search([('name', '=', invoice.invoice_origin)], limit=1)
            if sale_order:
                if hasattr(sale_order, '_create_invoice_paid_notification'):
                    sale_order._create_invoice_paid_notification(invoice)
        return res