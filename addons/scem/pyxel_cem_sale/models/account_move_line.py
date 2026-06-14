from odoo import api, fields, models
from odoo.exceptions import ValidationError

                

class AccountMoveLine(models.Model):
    _inherit = "account.move.line"

    sale_has_supplier_source = fields.Boolean(
        string="Has Supplier Source",
        compute="_compute_sale_supplier_data",
    )

    sale_available_supplier_ids = fields.Many2many(
        comodel_name="res.partner",
        string="Available Suppliers",
        compute="_compute_sale_supplier_data",
    )

    sale_supplier_partner_id = fields.Many2one(
        comodel_name="res.partner",
        string="Proveedor",
        compute="_compute_sale_supplier_data",
        inverse="_inverse_sale_supplier_partner_id",
        readonly=False,
    )

    sale_supplier_currency_id = fields.Many2one(
        comodel_name="res.currency",
        string="Moneda proveedor",
        compute="_compute_sale_supplier_data",
        readonly=True,
    )

    sale_supplier_price = fields.Monetary(
        string="Precio de proveedor",
        currency_field="sale_supplier_currency_id",
        compute="_compute_sale_supplier_data",
        readonly=True,
    )

    def _get_supplier_sale_lines(self):
        self.ensure_one()

        sale_lines = self.sale_line_ids.filtered(lambda line: not line.display_type)

        if sale_lines:
            return sale_lines

        # Fallback si tienes account.move.sale_id personalizado
        if self.move_id.sale_id and self.product_id:
            return self.move_id.sale_id.order_line.filtered(
                lambda line: not line.display_type
                and line.product_id == self.product_id
            )

        return self.env["sale.order.line"]

    def _get_main_supplier_sale_line(self):
        self.ensure_one()

        sale_lines = self._get_supplier_sale_lines()

        if not sale_lines:
            return self.env["sale.order.line"]

        sale_lines_with_supplier = sale_lines.filtered(
            lambda line: line.supplier_partner_id
        )

        if sale_lines_with_supplier:
            return sale_lines_with_supplier[:1]

        return sale_lines[:1]

    @api.depends(
        "sale_line_ids",
        "sale_line_ids.supplier_partner_id",
        "sale_line_ids.supplier_price",
        "sale_line_ids.supplier_currency_id",
        "sale_line_ids.available_supplier_ids",
        "sale_line_ids.has_multiple_suppliers",
        "move_id.sale_id",
        "move_id.sale_id.order_line.supplier_partner_id",
        "move_id.sale_id.order_line.supplier_price",
        "move_id.sale_id.order_line.supplier_currency_id",
        "move_id.sale_id.order_line.available_supplier_ids",
        "product_id",
        "move_id.currency_id",
    )
    def _compute_sale_supplier_data(self):
        for line in self:
            sale_lines = line._get_supplier_sale_lines()
            sale_line = line._get_main_supplier_sale_line()

            available_suppliers = sale_lines.mapped("available_supplier_ids")

            line.sale_has_supplier_source = bool(sale_lines)
            line.sale_available_supplier_ids = available_suppliers

            line.sale_supplier_partner_id = (
                sale_line.supplier_partner_id
                if sale_line
                else False
            )

            line.sale_supplier_currency_id = (
                sale_line.supplier_currency_id
                if sale_line and sale_line.supplier_currency_id
                else line.move_id.currency_id
            )

            line.sale_supplier_price = (
                sale_line.supplier_price
                if sale_line
                else 0.0
            )

    def _inverse_sale_supplier_partner_id(self):
        for line in self:
            sale_lines = line._get_supplier_sale_lines()

            if not sale_lines:
                continue

            supplier = line.sale_supplier_partner_id

            if supplier:
                invalid_lines = sale_lines.filtered(
                    lambda sale_line: supplier not in sale_line.available_supplier_ids
                )

                if invalid_lines:
                    raise ValidationError(
                        "The selected supplier is not valid for one or more related sale order lines."
                    )

            sale_lines.write({
                "supplier_partner_id": supplier.id if supplier else False,
            })
            
            
            