# -*- coding: utf-8 -*- 
from odoo import models, fields, api
from datetime import timedelta

class PyxelPctReport(models.Model):
    _name = 'pyxel.pct.report'
    _description = 'Pyxel - PCT Report'
    
    company_pct_report_id = fields.Many2one(
        'company.pct.report',
        string="Company PCT Report",
        required=True,
        ondelete="cascade"
    )

    date = fields.Date(
        string="Fecha de Creación",
        default=fields.Date.today,
        readonly=True,
        help="Fecha en que se creó la conciliación"
    )
    provider_id = fields.Many2one('res.partner', string='Proveedor', required=True, domain="[('is_provider','=',True)]")
    seller_id = fields.Many2one('res.partner', string='Vendedor', required=True, domain="[('is_beneficiary','=',True)]")
    service_1 = fields.Char(string="Servicio", required=True)
    service_2 = fields.Char(string="Servicio", required=True)
    
    invoiced = fields.Float(
        string='Total Facturas',
        compute='_compute_invoiced',
        store=True,
        readonly=True,
    )

    financial_cost = fields.Float(
        string="Costo Financiero",
        compute="_compute_financial_cost",
        store=True,
        readonly=True,
    )
    
    amount_distributed = fields.Float(
        string='Monto a repartir',
        compute='_compute_amount_distributed',
        store=True,
        readonly=True,
    )
    to_pct = fields.Float(
        string='Monto para PCT',
        compute='_compute_to_pct',
        store=True,
        readonly=True,
    )
    to_pyxel = fields.Float(
        string='Monto para Pyxel',
        compute='_compute_to_pyxel',
        store=True,
        readonly=True,
    )
    
    
    @api.depends('company_pct_report_id.amount_software', 'company_pct_report_id.pct_utility')
    def _compute_invoiced(self):
        for record in self:
            report = record.company_pct_report_id
            record.invoiced = (report.amount_software or 0.0) + (report.pct_utility or 0.0)
    
    @api.depends('company_pct_report_id.sales_total')
    def _compute_financial_cost(self):
        for record in self:
            report = record.company_pct_report_id
            record.financial_cost = (report.sales_total or 0.0) * 0.05
            
    @api.depends('invoiced', 'financial_cost')
    def _compute_amount_distributed(self):
        for record in self:
            record.amount_distributed = ((record.invoiced or 0.0) - (record.financial_cost or 0.0))
            
    @api.depends('amount_distributed')
    def _compute_to_pct(self):
        for record in self:
            record.to_pct = ((record.amount_distributed or 0.0) * 0.1)
            
            
    @api.depends('amount_distributed', 'to_pct', 'financial_cost')
    def _compute_to_pyxel(self):
        for record in self:
            record.to_pyxel = (
                (record.amount_distributed or 0.0) -
                (record.to_pct or 0.0) +
                (record.financial_cost or 0.0)
            )


    def action_print_pyxel_report(self):
        return self.env.ref('pyxel_cem_seller_payment.action_pyxel_pct_report').report_action(self)


    _sql_constraints = [
        ('unique_company_pct', 'unique(company_pct_report_id)', 'Ya existe una conciliación Pyxel para este Reporte Compañía-PCT .'),
    ]