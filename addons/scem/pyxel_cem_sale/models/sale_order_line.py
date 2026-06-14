# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import api, models, fields, _

class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    uom_min_line = fields.Integer(
        string='Minimum qty for this line',
        compute='_compute_uom_min_line',
        store=False,
    )
    
    is_uom_min_line = fields.Boolean(
        string='Is minimum order step?',
        compute='_compute_uom_min_line',
        store=False,
    )
    
    available_supplier_ids = fields.Many2many(
        comodel_name="res.partner",
        string="Available Suppliers",
        compute="_compute_available_suppliers",
    )

    has_multiple_suppliers = fields.Boolean(
        string="Has Multiple Suppliers",
        compute="_compute_available_suppliers",
    )

    supplier_partner_id = fields.Many2one(
        comodel_name="res.partner",
        string="Proveedor",
        copy=False,
    )

    supplierinfo_id = fields.Many2one(
        comodel_name="product.supplierinfo",
        string="Supplier Info",
        compute="_compute_supplier_data",
        store=True,
        readonly=True,
    )

    supplier_currency_id = fields.Many2one(
        comodel_name="res.currency",
        string="Supplier Currency",
        compute="_compute_supplier_data",
        store=True,
        readonly=True,
    )

    supplier_price = fields.Monetary(
        string="Precio de proveedor",
        currency_field="supplier_currency_id",
        compute="_compute_supplier_data",
        store=True,
        readonly=True,
    )

    def _get_available_supplierinfos(self):
        self.ensure_one()

        SupplierInfo = self.env["product.supplierinfo"]

        if not self.product_id:
            return SupplierInfo

        company = self.order_id.company_id or self.company_id

        sellers = self.product_id.product_tmpl_id.seller_ids

        sellers = sellers.filtered(
            lambda seller: (
                not seller.product_id or seller.product_id == self.product_id
            )
            and (
                not seller.company_id
                or not company
                or seller.company_id == company
            )
        )

        return sellers

    @api.depends("product_id", "order_id.company_id", "company_id")
    def _compute_available_suppliers(self):
        for line in self:
            sellers = line._get_available_supplierinfos()
            partners = sellers.mapped("partner_id")

            line.available_supplier_ids = partners
            line.has_multiple_suppliers = len(partners) > 1

    def _get_selected_supplierinfo(self):
        self.ensure_one()

        SupplierInfo = self.env["product.supplierinfo"]

        if not self.product_id or not self.supplier_partner_id:
            return SupplierInfo

        date_order = self.order_id.date_order
        supplier_date = (
            date_order.date()
            if date_order
            else fields.Date.context_today(self)
        )

        seller = SupplierInfo

        try:
            seller = self.product_id._select_seller(
                partner_id=self.supplier_partner_id,
                quantity=self.product_uom_qty or 0.0,
                date=supplier_date,
                uom_id=self.product_uom,
                params={"order_id": self.order_id},
            )
        except TypeError:
            seller = self.product_id._select_seller(
                partner_id=self.supplier_partner_id,
                quantity=self.product_uom_qty or 0.0,
                date=supplier_date,
                uom_id=self.product_uom,
            )

        if seller:
            return seller

        sellers = self._get_available_supplierinfos().filtered(
            lambda supplierinfo: supplierinfo.partner_id == self.supplier_partner_id
        )

        sellers = sellers.sorted(
            key=lambda supplierinfo: (
                not bool(supplierinfo.product_id),
                -(supplierinfo.min_qty or 0.0),
            )
        )

        return sellers[:1]

    @api.depends(
        "supplier_partner_id",
        "product_id",
        "product_uom_qty",
        "product_uom",
        "order_id.date_order",
        "order_id.company_id",
        "company_id",
    )
    def _compute_supplier_data(self):
        for line in self:
            seller = line._get_selected_supplierinfo()

            company = (
                line.order_id.company_id
                or line.company_id
                or self.env.company
            )

            line.supplierinfo_id = seller
            line.supplier_currency_id = (
                seller.currency_id if seller else company.currency_id
            )
            line.supplier_price = seller.price if seller else 0.0

    @api.onchange("product_id", "product_uom_qty", "product_uom")
    def _onchange_product_supplier_management(self):
        for line in self:
            sellers = line._get_available_supplierinfos()
            partners = sellers.mapped("partner_id")

            if line.supplier_partner_id and line.supplier_partner_id not in partners:
                line.supplier_partner_id = False

            if len(partners) == 1 and not line.supplier_partner_id:
                line.supplier_partner_id = partners[0]

            return {
                "domain": {
                    "supplier_partner_id": [("id", "in", partners.ids)]
                }
            }

    @api.depends('product_no_variant_attribute_value_ids', 'product_template_attribute_value_ids')
    def _compute_uom_min_line(self):
        for line in self:
            # obtén el valor de Formato
            ptavs = line.product_no_variant_attribute_value_ids | line.product_template_attribute_value_ids
            formato = ptavs.filtered(lambda v: v.attribute_id.name == 'Formato')[:1]
            # asigna ambos campos
            line.uom_min_line    = formato.uom_min    or 1
            line.is_uom_min_line = bool(formato.is_uom_min)
