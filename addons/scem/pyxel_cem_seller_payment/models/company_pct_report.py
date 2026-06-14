# -*- coding: utf-8 -*- 
from odoo import models, fields, api, _
from datetime import timedelta
from odoo.exceptions import ValidationError

import logging
_logger = logging.getLogger(__name__)

class CompanyPctReport(models.Model):
    _name = 'company.pct.report'
    _description = 'Company - PCT Report'
    _inherit = ["mail.thread", "mail.activity.mixin"]
    
    # FILTROS
    start_date = fields.Date(string="Fecha de Inicio", required=True)
    end_date = fields.Date(string="Fecha de Fin", required=True)
    provider_id = fields.Many2one("res.partner", string="Proveedor", required=True,
                                  domain="[('is_provider','=',True)]")
    
        # RESULTADOS BASE
    sales_total = fields.Float(string="Ventas Totales", compute="_compute_sales_metrics", store=True, readonly=True)
    sold_qty = fields.Float(string="Cantidad Vendida", compute="_compute_sales_metrics", store=True, readonly=True)
    
    seller_id = fields.Many2one('res.partner', string='Vendedor',  domain="[('is_beneficiary','=',True)]")
    service = fields.Char(string="Servicio")
    
    beneficiary_commodity = fields.Many2one('res.partner', string="Beneficiario de Mercancia", domain="[('is_beneficiary','=',True)]")
    amount_commodity = fields.Float(string="Total CIF", compute="_compute_costs", store=True, readonly=True)
 
    beneficiary_import = fields.Many2one('res.partner', string="Beneficiario de Importación", domain="[('is_beneficiary','=',True)]")
    amount_import = fields.Float(string="Costo Servicio Importación", compute="_compute_costs", store=True, readonly=True)
     
    beneficiary_import_services = fields.Many2one('res.partner', string="Beneficiario de Servicios de Importación", domain="[('is_beneficiary','=',True)]")
    amount_import_services = fields.Float(string="Servicios de Importación", compute="_compute_costs", store=True, readonly=True)
     
     
    beneficiary_tpte = fields.Many2one('res.partner', string="Beneficiario de Servicio (TPTE)", domain="[('is_beneficiary','=',True)]")
    amount_tpte = fields.Float(string="Monto de  Servicio (TPTE)" )
    
    beneficiary_software = fields.Many2one('res.partner', string="Beneficiario de Software", domain="[('is_beneficiary','=',True)]")
    amount_software = fields.Float(string="Costo Plataforma Software", compute="_compute_costs", store=True, readonly=True)
    
    beneficiary_logistics = fields.Many2one('res.partner', string="Beneficiario de Logística", domain="[('is_beneficiary','=',True)]")
    amount_logistics = fields.Float(string="Gastos Operación Logística", compute="_compute_costs", store=True, readonly=True)
    
    beneficiary_import_intern = fields.Many2one('res.partner', string="Beneficiario de gastos internos de Importación", domain="[('is_beneficiary','=',True)]")
    amount_import_intern = fields.Float(string="Gastos Aduanales", compute="_compute_costs", store=True, readonly=True)
    
    invoice_amount = fields.Float(
        string='Total Facturas',
        compute='_compute_invoice_amount',
        store=True,
        readonly=True,
    )
    
    total_expenses = fields.Float(string="Gastos Totales", compute="_compute_totals", store=True, readonly=True)
    financy_expenses = fields.Float(string="Gastos Financieros", compute="_compute_costs", store=True, readonly=True)
    
    # Utilidades 
    utility = fields.Float(string="Utilidades", compute="_compute_totals", store=True, readonly=True)
    company_utility = fields.Float(string="Utilidades Compañía", compute="_compute_totals", store=True, readonly=True)
    pct_utility = fields.Float(string="Utilidades PCT", compute="_compute_totals", store=True, readonly=True)

    
    pyxel_pct_reports = fields.One2many('pyxel.pct.report', 'company_pct_report_id', string="Conciliaciones Pyxel")
    pyxel_pct_report_id = fields.Many2one(
        'pyxel.pct.report', 
        string="Conciliación Pyxel", compute='_compute_single_pyxel',
        store=True,
        readonly=True)
    
    # en company.pct.report
    config_id = fields.Many2one(
        "company.pct.config",
        string="Configuración",
        compute="_compute_config_id",
        store=False,
    )

    company_profit = fields.Float(related="config_id.company_profit", readonly=True)
    pct_profit = fields.Float(related="config_id.pct_profit", readonly=True)
    
    debug_product_ids = fields.Many2many(
        "product.product",
        "company_pct_report_product_rel",
        "report_id",
        "product_id",
        string="Productos encontrados (debug)",
        readonly=True,
        copy=False,
    )

    debug_line_ids = fields.Many2many(
        "account.move.line",
        "company_pct_report_aml_rel",
        "report_id",
        "line_id",
        string="Productos Facturados",
        readonly=True,
        copy=False,
    )

    debug_info = fields.Text(
        string="Debug info",
        readonly=True,
        copy=False,
    )
    
    def _get_products_for_provider(self, provider_partner):
        provider_cp = provider_partner.commercial_partner_id

        sinfos = self.env["product.supplierinfo"].sudo().search([
            ("partner_id.commercial_partner_id", "=", provider_cp.id),
        ])

        tmpl_ids = sinfos.mapped("product_tmpl_id").ids
        variant_ids = sinfos.mapped("product_id").ids  

        products = self.env["product.product"].sudo().search([
            "|",
            ("product_tmpl_id", "in", tmpl_ids),
            ("id", "in", variant_ids),
        ])

        return sinfos, tmpl_ids, variant_ids, products
    
    def _get_invoiced_lines_for_provider(self, start_date, end_date, provider_partner):
        provider_cp = provider_partner.commercial_partner_id
        MoveLine = self.env["account.move.line"].sudo()

        product_line_domain = ["|", ("display_type", "=", False), ("display_type", "=", "product")]

        base = [
            ("move_id.state", "=", "posted"),
            ("move_id.move_type", "in", ("out_invoice", "out_refund")),
            ("product_id", "!=", False),
        ] + product_line_domain

        cand = MoveLine.search(base + [
            ("move_id.invoice_date", ">=", start_date),
            ("move_id.invoice_date", "<=", end_date),
        ])

        if not cand:
            cand = MoveLine.search(base + [
                ("move_id.date", ">=", start_date),
                ("move_id.date", "<=", end_date),
            ])

        def _match_vendor(line):
            tmpl = line.product_id.product_tmpl_id
            return any(
                s.partner_id and s.partner_id.commercial_partner_id.id == provider_cp.id
                for s in tmpl.seller_ids
            )

        return cand.filtered(_match_vendor), cand

        # def _match_vendor(line):
        #     tmpl = line.product_id.product_tmpl_id
        #     for s in tmpl.seller_ids:
        #         if s.partner_id and s.partner_id.commercial_partner_id.id == provider_cp.id:
        #             return True
        #     return False

        # return cand.filtered(_match_vendor), cand

        # # 3) Filtrar por proveedor usando supplierinfo (seller_ids) del template
        # def _match_vendor(line):
        #     tmpl = line.product_id.product_tmpl_id
        #     # seller_ids = product.supplierinfo
        #     for s in tmpl.seller_ids:
        #         if s.partner_id and s.partner_id.commercial_partner_id.id == provider_cp.id:
        #             # opcional: respetar company del supplierinfo si la tiene
        #             if not s.company_id or s.company_id == line.move_id.company_id:
        #                 return True
        #     return False

        # return cand.filtered(_match_vendor), cand

    def _compute_config_id(self):
        cfg = self.env["company.pct.config"].search([], limit=1)
        for rec in self:
            rec.config_id = cfg
    

    def _compute_single_pyxel(self):
        for record in self:
            record.pyxel_pct_report_id = record.pyxel_pct_reports[:1].id

  
    # -------------------------
    # 1) Ventas / Cantidad / CIF total del proveedor en el periodo
    @api.depends("start_date", "end_date", "provider_id")
    def _compute_sales_metrics(self):
        for rec in self:
            rec.sales_total = 0.0
            rec.sold_qty = 0.0
            rec.debug_product_ids = [(5, 0, 0)]
            rec.debug_line_ids = [(5, 0, 0)]
            rec.debug_info = False

            if not rec.start_date or not rec.end_date or not rec.provider_id:
                rec.debug_info = "Faltan filtros (start_date/end_date/provider_id)."
                continue

            provider_cp = rec.provider_id.commercial_partner_id

            domain = [
                ("move_id.state", "=", "posted"),
                ("move_id.move_type", "in", ("out_invoice", "out_refund")),
                ("move_id.date", ">=", rec.start_date),
                ("move_id.date", "<=", rec.end_date),
                "|", ("display_type", "=", False), ("display_type", "=", "product"),
                ("product_id", "!=", False),

                # Vendor match por commercial partner (robusto)
                "|",
                ("product_id.product_tmpl_id.seller_ids.partner_id.commercial_partner_id", "=", provider_cp.id),
                ("product_id.seller_ids.partner_id.commercial_partner_id", "=", provider_cp.id),
            ]
            lines = self.env["account.move.line"].sudo().search(domain)


            # Debug: guardar líneas y productos

            all_lines = self.env["account.move.line"].sudo().search([
                ("move_id.state", "=", "posted"),
                ("move_id.move_type", "in", ("out_invoice", "out_refund")),
                ("move_id.date", ">=", rec.start_date),
                ("move_id.date", "<=", rec.end_date),
                "|", ("display_type", "=", False), ("display_type", "=", "product"),
                ("product_id", "!=", False),
            ])

            vendor_lines = all_lines.filtered(lambda l:
                provider_cp in l.product_id.product_tmpl_id.seller_ids.partner_id.commercial_partner_id
                or provider_cp in l.product_id.seller_ids.partner_id.commercial_partner_id
            )

            rec.debug_line_ids = [(6, 0, vendor_lines.ids)]
            rec.debug_product_ids = [(6, 0, vendor_lines.mapped("product_id").ids)]

            rec.debug_info = (
                f"Proveedor seleccionado={rec.provider_id.id} "
                f"(commercial={provider_cp.id}) | "
                f"Total líneas en rango={len(all_lines)} | "
                f"Líneas que matchean proveedor={len(vendor_lines)}"
            )

            if all_lines:
                l0 = all_lines[0]
                sellers = l0.product_id.product_tmpl_id.seller_ids
                rec.debug_info = (rec.debug_info or "") + "\n" + (
                    f"\nEjemplo línea: product={l0.product_id.display_name} | "
                    f"sellers={[(s.partner_id.id, s.partner_id.display_name, s.partner_id.commercial_partner_id.id) for s in sellers]}"
                )


            sales_total = 0.0
            sold_qty = 0.0
            for line in lines:
                sign = -1.0 if line.move_id.move_type == "out_refund" else 1.0
                sales_total += sign * (line.price_subtotal or 0.0)
                sold_qty += sign * (line.quantity or 0.0)

            rec.sales_total = sales_total
            rec.sold_qty = sold_qty


        
        
    # -------------------------
    # 2) Costos (incluye CIF mercancia = sumatoria de CIF por líneas)
    @api.depends("debug_line_ids", "sales_total", "amount_tpte")
    def _compute_costs(self):
        for rec in self:
            rec.amount_commodity = 0.0
            rec.amount_import = 0.0
            rec.amount_import_services = 0.0
            rec.amount_software = 0.0
            rec.amount_logistics = 0.0
            rec.amount_import_intern = 0.0
            rec.financy_expenses = 0.0

            lines = rec.debug_line_ids
            if not lines:
                continue

            cif_total = 0.0
            for line in lines:
                sign = -1.0 if line.move_id.move_type == "out_refund" else 1.0
                cif_total += sign * (line.cif_value or 0.0) 

            rec.amount_commodity = cif_total
            rec.amount_import = cif_total * 0.01
            rec.amount_import_services = cif_total * 0.01
            rec.amount_software = (rec.sales_total or 0.0) * 0.01
            rec.amount_logistics = (rec.sales_total or 0.0) * 0.01
            rec.amount_import_intern = cif_total * 0.002 * 24.0
            rec.financy_expenses = (rec.sales_total or 0.0) * 0.05

    # -------------------------
    # 10) Gastos Totales y 11) Utilidades + reparto
    @api.depends(
        "sales_total",
        "amount_commodity",
        "amount_import",
        "amount_import_services",
        "amount_tpte",
        "amount_software",
        "amount_logistics",
        "amount_import_intern",
        "financy_expenses",
        "company_profit",
        "pct_profit",
    )
    def _compute_totals(self):
        for rec in self:
            # Punto 10: total de gastos (si lo sigues mostrando)
            rec.total_expenses = (
                (rec.amount_commodity or 0.0) +
                (rec.amount_import or 0.0) +
                (rec.amount_import_services or 0.0) +
                (rec.amount_tpte or 0.0) +
                (rec.amount_software or 0.0) +
                (rec.amount_logistics or 0.0) +
                (rec.amount_import_intern or 0.0) +
                (rec.financy_expenses or 0.0) 
            )

            #  Utilidades según tu regla:
            # utility = Ventas Totales - Gastos
            rec.utility = (rec.sales_total or 0.0) - (rec.total_expenses or 0.0)
            
            # Reparto por porcentaje (config)
            company_pct = (rec.company_profit or 0.0) / 100.0
            pct_pct = (rec.pct_profit or 0.0) / 100.0

            rec.company_utility = (rec.utility or 0.0) * company_pct
            rec.pct_utility = (rec.utility or 0.0) * pct_pct

                
    def action_debug_recompute(self):
        for rec in self:
            rec.ensure_one()

            rec.debug_line_ids = [(5, 0, 0)]
            rec.debug_product_ids = [(5, 0, 0)]
            rec.debug_info = ""

            if not rec.start_date or not rec.end_date or not rec.provider_id:
                rec.debug_info = "Faltan filtros (start_date/end_date/provider_id)."
                continue

            # 1-2) proveedor -> supplierinfo -> templates/variantes/productos
            sinfos, tmpl_ids, variant_ids, products = rec._get_products_for_provider(rec.provider_id)

            # DEBUG: facturas en rango por invoice_date y por date
            Move = self.env["account.move"].sudo()
            inv_by_invoice_date = Move.search([
                ("state", "=", "posted"),
                ("move_type", "in", ("out_invoice", "out_refund")),
                ("invoice_date", ">=", rec.start_date),
                ("invoice_date", "<=", rec.end_date),
            ])
            inv_by_date = Move.search([
                ("state", "=", "posted"),
                ("move_type", "in", ("out_invoice", "out_refund")),
                ("date", ">=", rec.start_date),
                ("date", "<=", rec.end_date),
            ])

            # 3) líneas facturadas SOLO de productos del proveedor (por template/variante)
            lines, cand_lines = rec._get_invoiced_lines_for_provider(rec.start_date, rec.end_date, rec.provider_id)

            # guardar debug
            rec.debug_product_ids = [(6, 0, products.ids)]
            rec.debug_line_ids = [(6, 0, lines.ids)]

            rec.debug_info = (
                f"Proveedor={rec.provider_id.display_name} (id={rec.provider_id.id}, commercial={rec.provider_id.commercial_partner_id.id})\n"
                f"Rango={rec.start_date}..{rec.end_date}\n"
                f"Supplierinfo encontrados={len(sinfos)}\n"
                f"Templates encontrados={len(tmpl_ids)}\n"
                f"Variantes directas en supplierinfo={len([x for x in variant_ids if x])}\n"
                f"Productos (debug) encontrados={len(products)}\n\n"
                f"Facturas posted en rango por invoice_date={len(inv_by_invoice_date)}\n"
                f"Facturas posted en rango por date(contable)={len(inv_by_date)}\n"
                f"Líneas de factura encontradas (productos proveedor)={len(lines)}\n"
            )

            if inv_by_invoice_date:
                m = inv_by_invoice_date[0]
                rec.debug_info += f"\nEjemplo factura(invoice_date): {m.name} | invoice_date={m.invoice_date} | date={m.date} | move_type={m.move_type}\n"
            elif inv_by_date:
                m = inv_by_date[0]
                rec.debug_info += f"\nEjemplo factura(date): {m.name} | invoice_date={m.invoice_date} | date={m.date} | move_type={m.move_type}\n"

            if lines:
                l0 = lines[0]
                rec.debug_info += (
                    f"\nEjemplo línea: move={l0.move_id.name} | product={l0.product_id.display_name} "
                    f"| tmpl={l0.product_id.product_tmpl_id.id} | qty={l0.quantity} | subtotal={l0.price_subtotal}\n"
                )
                
            rec.debug_info += (
                f"Líneas candidatas en rango (sin filtrar proveedor)={len(cand_lines)}\n"
                f"Líneas de factura encontradas (productos proveedor)={len(lines)}\n"
            )

            if cand_lines:
                l = cand_lines[0]
                rec.debug_info += (
                    f"\nEjemplo línea candidata: move={l.move_id.name} | product={l.product_id.display_name} "
                    f"| tmpl={l.product_id.product_tmpl_id.id}\n"
                )

            if lines:
                l = lines[0]
                rec.debug_info += (
                    f"\nEjemplo línea MATCH proveedor: move={l.move_id.name} | product={l.product_id.display_name} "
                    f"| tmpl={l.product_id.product_tmpl_id.id} | qty={l.quantity} | subtotal={l.price_subtotal}\n"
                )
                # mostrar sellers del template de esa línea
                sellers = l.product_id.product_tmpl_id.seller_ids
                rec.debug_info += (
                    "Sellers del template (partner_id, commercial, company_id): "
                    f"{[(s.partner_id.id, s.partner_id.commercial_partner_id.id, s.company_id.id if s.company_id else None) for s in sellers]}\n"
                )

            # métricas
            sales_total = 0.0
            sold_qty = 0.0
            for l in lines:
                sign = -1.0 if l.move_id.move_type == "out_refund" else 1.0
                sales_total += sign * (l.price_subtotal or 0.0)
                sold_qty += sign * (l.quantity or 0.0)

            rec.sales_total = sales_total
            rec.sold_qty = sold_qty

            rec._compute_costs()
            rec._compute_totals()

            rec.message_post(body=_("Recalculo ejecutado. Revisa la pestaña Debug."))

        return True
    
    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records.action_debug_recompute()
        return records

    def write(self, vals):
        res = super().write(vals)
        # solo recalcular si cambiaron filtros
        trigger_fields = {"start_date", "end_date", "provider_id"}
        if trigger_fields.intersection(vals.keys()):
            self.action_debug_recompute()
        return res
        
    def action_print_report(self):
        return self.env.ref('pyxel_cem_seller_payment.action_company_pct_report').report_action(self)
