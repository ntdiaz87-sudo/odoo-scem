# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class SalesManager(models.Model):
    _name = 'pyxel.sales.manager'
    _description = 'Gestor de Ventas'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'name'

    # Basic Information
    name = fields.Char(
        string='Nombre',
        required=True,
        tracking=True,
        index=True
    )

    code = fields.Char(
        string='Código',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('Nuevo'),
        tracking=True
    )

    active = fields.Boolean(
        string='Activo',
        default=True,
        tracking=True
    )

    user_id = fields.Many2one(
        'res.users',
        string='Usuario Relacionado',
        tracking=True,
        help='Usuario de Odoo asociado a este gestor de ventas'
    )

    partner_id = fields.Many2one(
        'res.partner',
        string='Contacto',
        # required=True,
        domain=[('is_company', '=', False)],
        tracking=True
    )

    email = fields.Char(
        string='Email',
        related='partner_id.email',
        readonly=True
    )

    phone = fields.Char(
        string='Teléfono',
        related='partner_id.phone',
        readonly=True
    )

    mobile = fields.Char(
        string='Móvil',
        related='partner_id.mobile',
        readonly=True
    )

    # Sales Information
    commission_rate = fields.Float(
        string='Tasa de Comisión (%)',
        compute='_compute_commission_rate',
        store=False,
        currency_field='currency_id',
        help='Suma total de comisiones generadas por este gestor'
    )

    sales_team_id = fields.Many2one(
        'crm.team',
        string='Equipo de Ventas',
        tracking=True
    )

    manager_id = fields.Many2one(
        'pyxel.sales.manager',
        string='Gestor Superior',
        tracking=True,
        help='Gestor de ventas superior en la jerarquía'
    )

    # Dates
    date_start = fields.Date(
        string='Fecha de Inicio',
        default=fields.Date.context_today,
        tracking=True
    )

    date_end = fields.Date(
        string='Fecha de Fin',
        tracking=True
    )

    # Relations
    customer_ids = fields.Many2many(
        'res.partner',
        'pyxel_sales_manager_partner_rel',
        'manager_id',
        'partner_id',
        string='Clientes Asignados',
        domain=[('customer_rank', '>', 0)],
        tracking=True
    )

    sale_order_ids = fields.One2many(
        'sale.order',
        'sales_manager_id',
        string='Órdenes de Venta'
    )

    invoice_ids = fields.One2many(
        'account.move',
        'sales_manager_id',
        string='Facturas',
        domain=[('move_type', 'in', ['out_invoice', 'out_refund'])]
    )

    # Computed Fields
    sale_order_count = fields.Integer(
        string='# Órdenes de Venta',
        compute='_compute_sale_order_count'
    )

    invoice_count = fields.Integer(
        string='# Facturas',
        compute='_compute_invoice_count'
    )

    customer_count = fields.Integer(
        string='# Clientes',
        compute='_compute_customer_count'
    )

    total_sales = fields.Monetary(
        string='Total Ventas',
        compute='_compute_total_sales',
        currency_field='currency_id'
    )

    total_invoiced = fields.Monetary(
        string='Total Facturado',
        compute='_compute_total_invoiced',
        currency_field='currency_id'
    )

    currency_id = fields.Many2one(
        'res.currency',
        string='Moneda',
        default=lambda self: self.env.company.currency_id
    )

    # Notes
    notes = fields.Text(
        string='Notas'
    )

    # Company
    company_id = fields.Many2one(
        'res.company',
        string='Compañía',
        default=lambda self: self.env.company,
        required=True
    )

    # Control de visibilidad
    show_sales_manager = fields.Boolean(
        compute='_compute_show_sales_manager',
        string='Mostrar Gestor'
    )

    @api.depends('sale_order_ids.commission_amount')
    def _compute_commission_rate(self):
        for manager in self:
            sale_lines = self.env['sale.order.line'].search([
                ('sales_manager_id', '=', manager.id),
                ('order_id.state', 'in', ['sale', 'done'])
            ])
            manager.commission_rate = sum(sale_lines.mapped('commission_amount'))

    @api.model_create_multi
    def create(self, vals_list):
        """Override create para generar código y sincronizar partner"""
        for vals in vals_list:
            if vals.get('code', _('Nuevo')) == _('Nuevo'):
                vals['code'] = self.env['ir.sequence'].next_by_code('pyxel.sales.manager') or _('Nuevo')

            # Si no viene partner_id, crear uno automáticamente
            if not vals.get('partner_id'):
                partner_vals = {
                    'name': vals.get('name', 'Gestor de Ventas'),
                    'is_sales_manager': True,
                    'active_sales_manager': vals.get('active', True),
                }
                partner = self.env['res.partner'].create(partner_vals)
                vals['partner_id'] = partner.id

        # Crear los registros
        managers = super(SalesManager, self).create(vals_list)

        # Sincronizar con res.partner
        for manager in managers:
            manager._sync_partner_as_sales_manager()

        return managers

    def write(self, vals):
        """Override write para sincronizar cambios con partner"""
        result = super(SalesManager, self).write(vals)

        # Si se cambió el estado active o el partner_id, sincronizar
        if 'active' in vals or 'partner_id' in vals:
            for manager in self:
                manager._sync_partner_as_sales_manager()

        return result

    def _sync_partner_as_sales_manager(self):
        """
        Sincroniza el partner asociado para marcarlo como gestor de ventas
        y establecer los campos correspondientes
        """
        self.ensure_one()

        if not self.partner_id:
            return

        # Preparar valores para actualizar el partner
        partner_vals = {
            'is_sales_manager': True,
            'active_sales_manager': self.active,
        }

        # Actualizar el partner con contexto especial para evitar loop
        self.partner_id.with_context(
            from_sales_manager_sync=True,
            tracking_disable=True  # Desactivar tracking para evitar mensajes duplicados
        ).write(partner_vals)

    @api.depends('sale_order_ids')
    def _compute_sale_order_count(self):
        for record in self:
            record.sale_order_count = len(record.sale_order_ids)

    @api.depends('invoice_ids')
    def _compute_invoice_count(self):
        for record in self:
            record.invoice_count = len(record.invoice_ids)

    @api.depends('customer_ids')
    def _compute_customer_count(self):
        for record in self:
            record.customer_count = len(record.customer_ids)

    @api.depends('sale_order_ids', 'sale_order_ids.amount_total')
    def _compute_total_sales(self):
        for record in self:
            record.total_sales = sum(record.sale_order_ids.filtered(
                lambda so: so.state in ['sale', 'done']
            ).mapped('amount_total'))

    @api.depends('invoice_ids', 'invoice_ids.amount_total')
    def _compute_total_invoiced(self):
        for record in self:
            record.total_invoiced = sum(record.invoice_ids.filtered(
                lambda inv: inv.state == 'posted' and inv.move_type == 'out_invoice'
            ).mapped('amount_total'))

    @api.constrains('date_start', 'date_end')
    def _check_dates(self):
        for record in self:
            if record.date_end and record.date_start and record.date_end < record.date_start:
                raise ValidationError(_('La fecha de fin no puede ser anterior a la fecha de inicio.'))

    @api.constrains('commission_rate')
    def _check_commission_rate(self):
        for record in self:
            if record.commission_rate < 0 or record.commission_rate > 100:
                raise ValidationError(_('La tasa de comisión debe estar entre 0 y 100.'))

    def action_view_sale_orders(self):
        self.ensure_one()
        return {
            'name': _('Órdenes de Venta'),
            'type': 'ir.actions.act_window',
            'res_model': 'sale.order',
            'view_mode': 'tree,form',
            'domain': [('sales_manager_id', '=', self.id)],
            'context': {'default_sales_manager_id': self.id}
        }

    def action_view_invoices(self):
        self.ensure_one()
        return {
            'name': _('Facturas'),
            'type': 'ir.actions.act_window',
            'res_model': 'account.move',
            'view_mode': 'tree,form',
            'domain': [
                ('sales_manager_id', '=', self.id),
                ('move_type', 'in', ['out_invoice', 'out_refund'])
            ],
            'context': {'default_sales_manager_id': self.id}
        }

    def action_view_customers(self):
        self.ensure_one()
        return {
            'name': _('Clientes Asignados'),
            'type': 'ir.actions.act_window',
            'res_model': 'res.partner',
            'view_mode': 'tree,form',
            'domain': [('id', 'in', self.customer_ids.ids)],
        }

    @api.depends_context('company')
    def _compute_show_sales_manager(self):
        show = self.env['ir.config_parameter'].sudo().get_param(
            'pyxel_sales_managers.enable_sales_managers',
            default=False
        )
        for record in self:
            record.show_sales_manager = show