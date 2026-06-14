# -*- coding: utf-8 -*-
from odoo import models, fields, api

class AccountMoveLine(models.Model):
    _inherit = "account.move.line"

    cif_value = fields.Float(
        string="Valor CIF",
        digits=(16, 4),
        readonly=True,
        copy=False,
        help="Valor CIF calculado al confirmar la factura."
    )
    
    cif_indicator_value = fields.Float(
        string="Indicador CIF (%) (histórico)",
        digits=(16, 4),
        copy=False,
        readonly=False,
    )

    @api.onchange("product_id")
    def _onchange_product_id_set_cif_indicator(self):
        for line in self:
            if line.product_id:
                tmpl = line.product_id.product_tmpl_id
                line.cif_indicator_value = getattr(tmpl, "cif_cost", 0.0) or 0.0

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for line in records:
            # set solo si está vacío
            if not line.cif_indicator_value and line.product_id:
                tmpl = line.product_id.product_tmpl_id
                line.cif_indicator_value = getattr(tmpl, "cif_cost", 0.0) or 0.0
        return records

    def write(self, vals):
        res = super().write(vals)
        # si cambian producto y NO te mandan cif_indicator_value explícito, recalcula
        if "product_id" in vals and "cif_indicator_value" not in vals:
            for line in self:
                if line.product_id:
                    tmpl = line.product_id.product_tmpl_id
                    line.cif_indicator_value = getattr(tmpl, "cif_cost", 0.0) or 0.0
        return res