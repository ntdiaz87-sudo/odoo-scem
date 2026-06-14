from odoo import models, fields, api


class AccountMove(models.Model):
    _inherit = "account.move"

    description_report = fields.Char(string="Descripción")
    observations = fields.Char(string="Observaciones")
    sale_order_name = fields.Char(compute="_compute_so_info", string="Pedido", store=False)
    sale_order_date = fields.Datetime(compute="_compute_so_info", string="Fecha Pedido", store=False)

    @api.depends('invoice_line_ids.sale_line_ids.order_id')
    def _compute_so_info(self):
        for move in self:
            orders = move.invoice_line_ids.mapped('sale_line_ids.order_id')
            move.sale_order_name = ', '.join(orders.mapped('name')) if orders else False
            move.sale_order_date = orders[:1].date_order if orders else False

