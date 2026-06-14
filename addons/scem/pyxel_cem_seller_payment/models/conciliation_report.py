# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import logging

_logger = logging.getLogger(__name__)


class ConciliationReport(models.Model):
    _name = 'conciliation.report'
    _description = 'Acta de Conciliación'
    _inherit = ["mail.thread", "mail.activity.mixin"]

    # ─────────────────────────────────────────
    # FILTROS / CABECERA
    # ─────────────────────────────────────────
    origin = fields.Selection(
        selection=[('sale', 'Ventas'), ('purchase', 'Compras')],
        string="Origen de la Conciliación",
        required=True,
        default='sale',
        tracking=True,
    )

    month = fields.Selection(
        selection=[
            ('01', 'Enero'), ('02', 'Febrero'), ('03', 'Marzo'),
            ('04', 'Abril'), ('05', 'Mayo'), ('06', 'Junio'),
            ('07', 'Julio'), ('08', 'Agosto'), ('09', 'Septiembre'),
            ('10', 'Octubre'), ('11', 'Noviembre'), ('12', 'Diciembre'),
        ],
        string="Mes",
        required=True,
        tracking=True,
    )

    provider_id = fields.Many2one(
        'res.partner',
        string="Proveedor",
        required=True,
        domain="[('is_provider', '=', True)]",
        tracking=True,
    )

    seller_name = fields.Char(string="Vendedor", tracking=True)

    start_date = fields.Date(string="Fecha de Inicio", required=True, tracking=True)
    end_date = fields.Date(string="Fecha de Fin", required=True, tracking=True)

    concept = fields.Char(string="Concepto de Conciliación", tracking=True)

    margin_pct = fields.Float(
        string="Valor de Margen %",
        digits=(5, 2),
        tracking=True,
    )

    # ─────────────────────────────────────────
    # CAMPOS CALCULADOS (líneas de la tabla)
    # ─────────────────────────────────────────
    amount_sales = fields.Float(
        string="Ventas (USD)",
        compute='_compute_amounts',
        store=True,
        readonly=True,
        digits=(16, 2),
    )

    amount_cif = fields.Float(
        string="CIF (USD)",
        compute='_compute_amounts',
        store=True,
        readonly=True,
        digits=(16, 2),
    )

    amount_margin = fields.Float(
        string="Margen (USD)",
        compute='_compute_margin',
        store=True,
        readonly=True,
        digits=(16, 2),
    )

    # ─────────────────────────────────────────
    # OBSERVACIONES EDITABLES POR LÍNEA
    # ─────────────────────────────────────────
    obs_sales = fields.Char(string="Observaciones Ventas")
    obs_cif = fields.Char(string="Observaciones CIF")
    obs_margin = fields.Char(string="Observaciones Margen")

    # ─────────────────────────────────────────
    # DEBUG
    # ─────────────────────────────────────────
    debug_line_ids = fields.Many2many(
        'account.move.line',
        'conciliation_report_aml_rel',
        'report_id',
        'line_id',
        string="Líneas encontradas (debug)",
        readonly=True,
        copy=False,
    )
    debug_info = fields.Text(string="Debug info", readonly=True, copy=False)


    # ─────────────────────────────────────────
    # CONSTRAINTS
    # ─────────────────────────────────────────
    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        for rec in self:
            if rec.start_date and rec.end_date and rec.start_date > rec.end_date:
                raise ValidationError(_("La fecha de inicio no puede ser posterior a la fecha de fin."))

    # ─────────────────────────────────────────
    # COMPUTE
    # ─────────────────────────────────────────
    @api.depends('origin', 'start_date', 'end_date', 'provider_id')
    def _compute_amounts(self):
        for rec in self:
            rec.amount_sales = 0.0
            rec.amount_cif = 0.0
            rec.debug_line_ids = [(5, 0, 0)]
            rec.debug_info = False

            if not rec.start_date or not rec.end_date or not rec.provider_id:
                rec.debug_info = "Faltan filtros obligatorios."
                continue

            provider_cp = rec.provider_id.commercial_partner_id

            if rec.origin == 'purchase':
                domain = [
                    ('move_id.state', '=', 'posted'),
                    ('move_id.move_type', 'in', ('in_invoice', 'in_refund')),
                    ('move_id.invoice_date', '>=', rec.start_date),
                    ('move_id.invoice_date', '<=', rec.end_date),
                    ('move_id.payment_state', 'in', ('paid', 'in_payment')),
                    ('move_id.partner_id', '=', rec.provider_id.id),
                    ('product_id', '!=', False),
                    ('display_type', 'in', ('product', False)),
                ]
                lines = self.env['account.move.line'].sudo().search(domain)

                if not lines:
                    domain_fallback = [
                        ('move_id.state', '=', 'posted'),
                        ('move_id.move_type', 'in', ('in_invoice', 'in_refund')),
                        ('move_id.date', '>=', rec.start_date),
                        ('move_id.date', '<=', rec.end_date),
                        ('move_id.payment_state', 'in', ('paid', 'in_payment')),
                        ('move_id.partner_id', '=', rec.provider_id.id),
                        ('product_id', '!=', False),
                        ('display_type', 'in', ('product', False)),
                    ]
                    lines = self.env['account.move.line'].sudo().search(domain_fallback)

            else:
                # ── VENTAS ───────────────────────────────────────────────
                # Facturas de cliente confirmadas y pagadas
                # donde los PRODUCTOS tienen como proveedor al seleccionado

                # Paso 1: obtener IDs de productos que tienen ese proveedor
                supplier_infos = self.env['product.supplierinfo'].sudo().search([
                    ('partner_id.commercial_partner_id', '=', provider_cp.id),
                ])

                # supplier_infos puede apuntar a product_tmpl_id o product_id
                product_ids = set()
                for si in supplier_infos:
                    if si.product_id:
                        product_ids.add(si.product_id.id)
                    elif si.product_tmpl_id:
                        variants = si.product_tmpl_id.product_variant_ids
                        product_ids.update(variants.ids)

                if not product_ids:
                    rec.debug_info = (
                        f"No se encontraron productos con proveedor "
                        f"{rec.provider_id.display_name} (commercial_id={provider_cp.id})"
                    )
                    continue

                # Paso 2: buscar líneas de facturas de venta con esos productos
                domain = [
                    ('move_id.state', '=', 'posted'),
                    ('move_id.move_type', 'in', ('out_invoice', 'out_refund')),
                    ('move_id.invoice_date', '>=', rec.start_date),
                    ('move_id.invoice_date', '<=', rec.end_date),
                    ('move_id.payment_state', 'in', ('paid', 'in_payment')),
                    ('product_id', 'in', list(product_ids)),
                    ('display_type', 'in', ('product', False)),
                ]
                lines = self.env['account.move.line'].sudo().search(domain)

                # Fallback por fecha contable
                if not lines:
                    domain_fallback = [
                        ('move_id.state', '=', 'posted'),
                        ('move_id.move_type', 'in', ('out_invoice', 'out_refund')),
                        ('move_id.date', '>=', rec.start_date),
                        ('move_id.date', '<=', rec.end_date),
                        ('move_id.payment_state', 'in', ('paid', 'in_payment')),
                        ('product_id', 'in', list(product_ids)),
                        ('display_type', 'in', ('product', False)),
                    ]
                    lines = self.env['account.move.line'].sudo().search(domain_fallback)

            # ── ACUMULAR ─────────────────────────────────────────────────
            rec.debug_line_ids = [(6, 0, lines.ids)]

            sales_total = 0.0
            cif_total = 0.0
            for line in lines:
                sign = -1.0 if line.move_id.move_type in ('out_refund', 'in_refund') else 1.0
                sales_total += sign * (line.price_subtotal or 0.0)
                cif_total += sign * (getattr(line, 'cif_value', None) or 0.0)

            rec.amount_sales = sales_total
            rec.amount_cif = cif_total

            extra = f" | product_ids count={len(product_ids)}" if rec.origin == 'sale' else ""
            rec.debug_info = (
                f"Origen={rec.origin} | Proveedor={rec.provider_id.display_name} "
                f"(commercial_id={provider_cp.id}) | "
                f"Rango={rec.start_date}..{rec.end_date} | "
                f"Líneas encontradas={len(lines)}{extra}"
            )

    @api.depends('amount_sales', 'amount_cif')
    def _compute_margin(self):
        for rec in self:
            rec.amount_margin = (rec.amount_sales or 0.0) - (rec.amount_cif or 0.0)

    # ─────────────────────────────────────────
    # ACCIÓN RECALCULAR
    # ─────────────────────────────────────────
    def action_recompute(self):
        self._compute_amounts()
        self._compute_margin()
        self.message_post(body=_("Recálculo ejecutado manualmente."))
        return True

    # ─────────────────────────────────────────
    # IMPRIMIR REPORTE
    # ─────────────────────────────────────────
    def action_print_report(self):
        return self.env.ref(
            'pyxel_cem_seller_payment.action_conciliation_report'
        ).report_action(self)

    # ─────────────────────────────────────────
    # NOMBRE DISPLAY
    # ─────────────────────────────────────────
    def name_get(self):
        result = []
        month_map = dict(self._fields['month'].selection)
        for rec in self:
            month_label = month_map.get(rec.month, rec.month or '')
            provider_name = rec.provider_id.name or ''
            result.append((rec.id, f"Conciliación {provider_name} - {month_label}"))
        return result