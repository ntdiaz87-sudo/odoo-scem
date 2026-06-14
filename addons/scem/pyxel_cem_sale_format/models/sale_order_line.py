# -*- coding: utf-8 -*-

import logging

from odoo import _, api, fields, models
from odoo.http import request
from odoo.tools import (
    float_compare, float_is_zero, float_round, format_date, groupby,
    )

_logger = logging.getLogger(__name__)

class SaleOrderLine(models.Model):
    _inherit = "sale.order.line"

    packaging_pack_qty = fields.Float(string="Packaging Qty (website)", copy=False)
    packaging_converted = fields.Boolean(string="Packaging Converted", default=False, copy=False)
    website_packaging_qty = fields.Char(
        compute="_compute_website_packaging_qty",
        string="Website Packaging Qty",
    )


    @api.depends("name", "product_uom_qty")
    def _compute_website_packaging_qty(self):
        """Cantidad por paquetes."""
        for line in self:
            line.website_packaging_qty = line._get_website_packaging_qty()

    def _get_website_packaging_qty(self) -> str:
        """Cantidad por paquetes."""
        no_variant_ptavs = self.product_no_variant_attribute_value_ids._origin.filtered(
            lambda ptav: ptav.display_type == "multi" or ptav.attribute_line_id.value_count > 1
        )
        if not self.product_custom_attribute_value_ids and not no_variant_ptavs:
            return ""

        name = "\n"

        custom_ptavs = self.product_custom_attribute_value_ids.custom_product_template_attribute_value_id
        multi_ptavs = no_variant_ptavs.filtered(lambda ptav: ptav.display_type == "multi").sorted()

        for ptav in (no_variant_ptavs - multi_ptavs - custom_ptavs):
            if ptav.uom_min > 0 and self.product_uom_qty >= ptav.uom_min:
                name = f"{self.product_uom_qty / ptav.uom_min} {ptav.name}"

        return name


    def _get_packaging_ptav(self):
        self.ensure_one()
        ptavs = self.product_no_variant_attribute_value_ids
        ptavs |= self.product_custom_attribute_value_ids.custom_product_template_attribute_value_id
        ptav = ptavs.filtered(lambda v: v.attribute_id.is_packaging_attribute)[:1]
        if ptav:
            return ptav
        return self.product_id.product_template_attribute_value_ids.filtered(
            lambda v: v.attribute_id.is_packaging_attribute
        )[:1]
        

    def _get_packaging_reference_ptav(self):
        """
        PTAV 'referencia' del atributo packaging: el que tiene is_uom_min=True (ej: 'box'),
        independiente del valor seleccionado (ej: 'pallet').
        """
        self.ensure_one()
        Ptav = self.env["product.template.attribute.value"]

        tmpl = self.product_id.product_tmpl_id
        pack_line = tmpl.valid_product_template_attribute_line_ids.filtered(
            lambda l: l.attribute_id.is_packaging_attribute
        )[:1]
        if not pack_line:
            return Ptav.browse()

        ref_ptav = pack_line.product_template_value_ids.filtered(lambda v: v.is_uom_min)[:1]
        return ref_ptav or pack_line.product_template_value_ids[:1]
    
    @api.depends(
        "product_id",
        "product_uom_qty",
        "product_uom",
        "order_id.pricelist_id",
        "order_id.partner_id",
        "product_no_variant_attribute_value_ids",
        "product_custom_attribute_value_ids",
    )
    def _compute_price_unit(self):
        super()._compute_price_unit()

        if self.env.context.get("skip_packaging_price_mult"):
            return

        for line in self:
            if line.packaging_converted:
                continue

            if line.order_id.state not in ("draft", "sent"):
                continue

            ptav = line._get_packaging_ptav()
            mult = float(ptav.uom_min or 1.0) if ptav else 1.0
            if mult <= 1.0:
                continue

            if line.price_unit:
                line.price_unit = line.price_unit * mult
                
                
