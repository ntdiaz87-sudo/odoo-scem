# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
from odoo.exceptions import UserError, ValidationError


class AccountMove(models.Model):
    _inherit = 'account.move'

    # Campos de Gestor de Ventas Externo
    # Campos computados del gestor (ambos Char)
    sales_manager_code_char = fields.Char(
        string='Código de Gestor',
        compute='_compute_sales_manager_fields',
        store=True,
        readonly=True,
        help='Código del gestor de ventas externo'
    )

    sales_manager_name_char = fields.Char(
        string='Nombre del Gestor',
        compute='_compute_sales_manager_fields',
        store=True,
        readonly=True,
        help='Nombre del gestor de ventas externo'
    )

    @api.depends('sales_manager_id', 'sales_manager_id.code', 'sales_manager_id.name')
    def _compute_sales_manager_fields(self):
        """Computar código y nombre del gestor"""
        for record in self:
            if record.sales_manager_id:
                record.sales_manager_code_char = record.sales_manager_id.code or ''
                record.sales_manager_name_char = record.sales_manager_id.name or ''
            else:
                record.sales_manager_code_char = ''
                record.sales_manager_name_char = ''

    sales_proof = fields.Binary(
        string='Comprobante de Venta',
        attachment=True,
        copy=False,
        help='Comprobante de venta o ticket del gestor (PDF o imagen)'
    )

    sales_proof_filename = fields.Char(
        string='Nombre del Comprobante',
        copy=False
    )

    # Campo existente del módulo
    sales_manager_id = fields.Many2one(
        'pyxel.sales.manager',
        string='Gestor de Ventas',
        tracking=True,
        copy=False,
        help='Gestor de ventas responsable de esta factura'
    )

    commission_amount = fields.Monetary(
        string='Comisión Total',
        compute='_compute_commission_amount',
        store=True,
        currency_field='currency_id',
        copy=False,
        help='Monto total de comisión para el gestor'
    )

    # Control de visibilidad
    show_sales_manager = fields.Boolean(
        compute='_compute_show_sales_manager',
        string='Mostrar Campos de Gestor'
    )





    def _compute_show_sales_manager(self):
        """Mostrar campos solo si está habilitado en configuración"""
        enabled = self.env['ir.config_parameter'].sudo().get_param(
            'pyxel_sales_managers.enable_sales_managers',
            default='False'
        )
        show = enabled == 'True'
        for record in self:
            record.show_sales_manager = show

    @api.depends('sales_manager_id', 'sales_manager_id.commission_rate', 'invoice_line_ids.commission_amount')
    def _compute_commission_amount(self):
        """Calcular comisión total de la factura"""
        for move in self:
            if move.move_type in ('out_invoice', 'out_refund'):
                # Sumar comisiones de las líneas
                move.commission_amount = sum(move.invoice_line_ids.mapped('commission_amount'))
            else:
                move.commission_amount = 0.0

    @api.constrains('sales_manager_code_char', 'sales_manager_name_char')
    def _check_sales_manager_fields(self):
        """Validar que si se llena uno, se llene el otro también"""
        for move in self:
            # Solo validar en facturas de cliente
            if move.move_type in ('out_invoice', 'out_refund'):
                # Si uno está lleno pero el otro no, lanzar error
                if bool(move.sales_manager_code_char) != bool(move.sales_manager_name_char):
                    raise ValidationError(_(
                        'Error de Gestor de Ventas:\n'
                        'Si especifica un gestor, debe llenar tanto el campo "Código de Gestor" '
                        'como el campo "Gestor de Venta".\n\n'
                        'Ambos campos son obligatorios cuando se asigna un gestor.'
                    ))
    def _post(self, soft=True):
        """Validar comprobante antes de publicar y guardar snapshot de comisión por producto"""
        for move in self:
            if move.move_type in ('out_invoice', 'out_refund'):
                # Validar si está habilitado el módulo
                if move.show_sales_manager:
                    # Validar que AMBOS campos estén llenos
                    if move.sales_manager_code_char and move.sales_manager_name_char:
                        # Validar que el comprobante esté subido
                        if not move.sales_proof:
                            raise UserError(_(
                                'No se puede confirmar la factura.\n'
                                'Debe subir el comprobante de venta cuando se especifica un gestor de ventas.'
                            ))
                    elif move.sales_manager_code_char or move.sales_manager_name_char:
                        # Si solo uno está lleno, error
                        raise UserError(_(
                            'Error de Gestor de Ventas:\n'
                            'Debe llenar tanto "Código de Gestor" como "Gestor de Venta".\n'
                            'Ambos campos son obligatorios.'
                        ))

                # Guardar comisión POR PRODUCTO en cada línea al confirmar
                if move.sales_manager_code_char and move.sales_manager_name_char:
                    for line in move.invoice_line_ids.filtered(lambda l: not l.display_type):
                        if line.product_id and not line.product_commission_snapshot:
                            # Guardar la comisión del producto actual
                            product_commission = line.product_id.sales_manager_commission or 0.0
                            line.product_commission_snapshot = product_commission

        return super(AccountMove, self)._post(soft=soft)

    def button_draft(self):
        """Permitir volver a borrador"""
        res = super(AccountMove, self).button_draft()
        # Aquí podrías agregar lógica adicional si es necesario
        return res


class AccountMoveLine(models.Model):
    _inherit = 'account.move.line'

    commission_rate_snapshot = fields.Float(
        string='Comisión Vendedor (%)',
        related='product_id.sales_manager_commission',
        digits=(16, 2),
        readonly=True,
        store=True,
        copy=False,
        help='Tasa de comisión del gestor basada en el producto'
    )

    commission_amount = fields.Monetary(
        string='Comisión Vendedor',
        compute='_compute_commission_amount',
        store=True,
        currency_field='currency_id',
        copy=False,
        help='Monto de comisión para esta línea de factura'
    )

    @api.depends('price_subtotal', 'commission_rate_snapshot')
    def _compute_commission_amount(self):
        """Calcular comisión de la línea"""
        for line in self:
            if line.commission_rate_snapshot:
                line.commission_amount = line.price_subtotal * (line.commission_rate_snapshot / 100)
            else:
                line.commission_amount = 0.0