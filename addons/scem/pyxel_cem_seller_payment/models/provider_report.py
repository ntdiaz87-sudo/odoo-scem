# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class ProviderReport(models.Model):
    _name = "provider.report"
    _description = "Conciliación de la Plataforma con Proveedores"
    _inherit = ["mail.thread", "mail.activity.mixin"]

    provider_id = fields.Many2one(
        "res.partner",
        string="Proveedor",
        domain="[('is_provider','=',True)]",
        tracking=True,
        help="Si no se selecciona, se mostrarán ventas de todos los productos (sin proveedor en la columna).",
    )
    start_date = fields.Date(string="Fecha de inicio", required=True, tracking=True)
    end_date = fields.Date(string="Fecha de fin", required=True, tracking=True)

    line_ids = fields.One2many(
        "provider.report.line",
        "report_id",
        string="Productos",
        copy=False,
        readonly=True,
    )
    debug_info = fields.Text(string="Debug", readonly=True, copy=False)

    @api.constrains("start_date", "end_date")
    def _check_dates(self):
        for rec in self:
            if rec.start_date and rec.end_date and rec.start_date > rec.end_date:
                raise ValidationError(_("La Fecha de inicio no puede ser mayor que la Fecha de fin."))

    def action_recompute(self):
        for rec in self:
            rec.ensure_one()
            rec.line_ids = [(5, 0, 0)]
            rec.debug_info = False

            aml_domain = [
                ("move_id.state", "=", "posted"),
                ("move_id.payment_state", "=", "paid"),
                ("move_id.move_type", "in", ("out_invoice", "out_refund")),
                ("product_id", "!=", False),
                "|", ("display_type", "=", False), ("display_type", "=", "product"),
                ("move_id.invoice_date", ">=", rec.start_date),
                ("move_id.invoice_date", "<=", rec.end_date),
            ]

            if rec.provider_id:
                provider_cp = rec.provider_id.commercial_partner_id
                aml_domain += [
                    ("product_id.product_tmpl_id.seller_ids.partner_id.commercial_partner_id", "=", provider_cp.id),
                ]

            MoveLine = self.env["account.move.line"].sudo()
            lines = MoveLine.search(aml_domain)

            # --- Agrupar por producto + CIF histórico + Indicador CIF histórico ---
            agg = {}
            for l in lines:
                sign = -1.0 if l.move_id.move_type == "out_refund" else 1.0
                pid = l.product_id.id

                qty = sign * (l.quantity or 0.0)
                subtotal = sign * (l.price_subtotal or 0.0)

                cif_unit = getattr(l, "cif_value", 0.0) or 0.0
                cif_unit_key = round(cif_unit, 4)

                cif_indicator = getattr(l, "cif_indicator_value", 0.0) or 0.0
                cif_indicator_key = round(cif_indicator, 4)

                key = (pid, cif_unit_key, cif_indicator_key)

                if key not in agg:
                    agg[key] = {
                        "qty": 0.0,
                        "sale_total": 0.0,
                    }

                agg[key]["qty"] += qty
                agg[key]["sale_total"] += subtotal

            # ✅ Si NO se seleccionó proveedor: proveedor por producto (primer vendor del template)
            provider_by_product = {}
            if not rec.provider_id and agg:
                product_ids = list({pid for (pid, _cif, _ind) in agg.keys()})
                products = self.env["product.product"].sudo().browse(product_ids)
                templates = products.mapped("product_tmpl_id")
                templates.read(["seller_ids"])

                for p in products:
                    tmpl = p.product_tmpl_id
                    seller = tmpl.seller_ids.sorted(lambda s: (s.sequence, s.id))[:1] if tmpl.seller_ids else False
                    provider_by_product[p.id] = seller.partner_id.id if seller else False

            # ✅ Crear líneas
            values = []
            for (pid, cif_unit, cif_indicator), a in agg.items():
                qty_sold = a["qty"]
                cif_total = qty_sold * cif_unit

                line_provider_id = rec.provider_id.id if rec.provider_id else provider_by_product.get(pid, False)

                values.append((0, 0, {
                    "provider_id": line_provider_id,
                    "product_id": pid,
                    "qty_sold": qty_sold,
                    "cif_unit": cif_unit,
                    "cif_total": cif_total,
                    "cif_indicator": cif_indicator,
                    "sale_total": a["sale_total"],
                }))

            rec.line_ids = values
            rec.debug_info = (
                f"Proveedor={'ALL' if not rec.provider_id else rec.provider_id.display_name}\n"
                f"Rango={rec.start_date}..{rec.end_date}\n"
                f"AML encontrados={len(lines)}\n"
                f"Filas (producto+cif+indicador)={len(agg)}\n"
            )
            rec.message_post(body=_("Reporte recalculado."))

        return True
    
    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records.action_recompute()
        return records

    def write(self, vals):
        res = super().write(vals)
        if {"start_date", "end_date", "provider_id"} & set(vals.keys()):
            self.action_recompute()
        return res
    
    def action_print_report(self):
        self.ensure_one()
        return self.env.ref('pyxel_cem_seller_payment.action_provider_report_pdf').report_action(self)


class ProviderReportLine(models.Model):
    _name = "provider.report.line"
    _description = "Provider Report Line"
    _order = "sale_total desc, qty_sold desc, product_id"

    report_id = fields.Many2one("provider.report", required=True, ondelete="cascade")
    provider_id = fields.Many2one("res.partner", string="Proveedor", readonly=True)
    product_id = fields.Many2one("product.product", string="Producto", required=True, readonly=True)

    qty_sold = fields.Float(string="Cantidad vendida", readonly=True)
    cif_unit = fields.Float(string="Costo CIF unitario", readonly=True)
    cif_total = fields.Float(string="Costo CIF total", readonly=True)
    sale_total = fields.Float(string="Valor de venta total", readonly=True)
    cif_indicator = fields.Float(string="Indicador CIF (%)", readonly=True)
    