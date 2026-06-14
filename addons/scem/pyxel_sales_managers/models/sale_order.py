# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # Campo principal: el gestor de ventas
    sales_manager_id = fields.Many2one(
        'pyxel.sales.manager',
        string='Gestor de Ventas',
        domain="[('active', '=', True)]",
        tracking=True,
        help='Gestor de ventas responsable de esta orden'
    )

    # Campos computados del gestor (ambos Char)
    sales_manager_code_char = fields.Char(
        string='Código de Gestor',
        related='sales_manager_id.code',
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

    sales_proof = fields.Binary(
        string='Comprobante de Venta',
        attachment=True,
        help='Comprobante de venta o ticket del gestor (PDF o imagen)'
    )

    sales_proof_filename = fields.Char(
        string='Nombre del Comprobante'
    )

    commission_amount = fields.Monetary(
        string='Comisión Total',
        compute='_compute_commission_amount',
        store=True,
        currency_field='currency_id',
        help='Monto total de comisión basado en las comisiones de productos'
    )

    # Control de visibilidad
    show_sales_manager = fields.Boolean(
        compute='compute_show_sales_manager',
        string='Mostrar Campos de Gestor'
    )

    @api.depends('sales_manager_id', 'sales_manager_id.code', 'sales_manager_id.name')
    def _compute_sales_manager_fields(self):
        """Computar código y nombre del gestor"""
        for record in self:
            if record.sales_manager_id:
                # record.sales_manager_code_char = record.sales_manager_id.code or ''
                record.sales_manager_name_char = record.sales_manager_id.name or ''
            else:
                # record.sales_manager_code_char = ''
                record.sales_manager_name_char = ''



    @api.model
    def create(self, vals):
        """Asegurar que los campos del gestor se computen al crear"""
        # Crear el registro
        record = super(SaleOrder, self).create(vals)

        # Forzar el cómputo de los campos del gestor
        if record.sales_manager_id:
            record._compute_sales_manager_fields()

        return record

    def write(self, vals):
        """Asegurar que los campos del gestor se computen al escribir"""
        result = super(SaleOrder, self).write(vals)

        # Si se modificó el gestor, forzar el cómputo
        if 'sales_manager_id' in vals:
            self._compute_sales_manager_fields()

        return result

    def compute_show_sales_manager(self):
        """Mostrar campos solo si está habilitado en configuración"""
        enabled = self.env['ir.config_parameter'].sudo().get_param(
            'pyxel_sales_managers.enable_sales_managers',
            default='False'
        )
        show = enabled == 'True'
        for record in self:
            record.show_sales_manager = show

    @api.depends('order_line.commission_amount')
    def _compute_commission_amount(self):
        """Calcular comisión total del pedido basado en comisiones por producto"""
        for order in self:
            order.commission_amount = sum(order.order_line.mapped('commission_amount'))

    def action_confirm_custom(self):
        """Validar comprobante antes de confirmar - heredado"""
        # Llamar al método padre primero
        res = super(SaleOrder, self).action_confirm_custom()

        for order in self:
            # Validar si está habilitado el módulo
            if order.show_sales_manager:
                # Validar que haya gestor asignado
                if order.sales_manager_id:
                    # Validar que el comprobante esté subido
                    print(order.sales_proof)
                    if not order.sales_proof:
                        raise UserError(_(
                            'No se puede confirmar el pedido.\n'
                            'Debe subir el comprobante de venta cuando se especifica un gestor de ventas.'
                        ))

                    # Validar que los campos computados tengan valores
                    if   not order.sales_manager_name_char:
                        # Forzar recómputo
                        order._compute_sales_manager_fields()

                        if   not order.sales_manager_name_char:
                            raise UserError(_(
                                'Error en los datos del Gestor de Ventas.\n'
                                'El gestor seleccionado no tiene código o nombre asignado.'
                            ))

        return res

    def _prepare_invoice(self):
        """Pasar datos del gestor a la factura"""
        invoice_vals = super(SaleOrder, self)._prepare_invoice()

        # Pasar solo si AMBOS campos están llenos
        if  self.sales_manager_name_char:
            invoice_vals.update({
                'sales_manager_code_char': self.sales_manager_code_char,
                'sales_manager_name_char': self.sales_manager_name_char,
                'sales_proof': self.sales_proof,
                'sales_proof_filename': self.sales_proof_filename,
            })

        # Pasar gestor interno
        if self.sales_manager_id:
            invoice_vals['sales_manager_id'] = self.sales_manager_id.id

        return invoice_vals


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    # NUEVO: Comisión del producto (dato histórico)
    product_commission_snapshot = fields.Float(
        string='Comisión del Producto (%)',
        digits=(16, 2),
        readonly=True,
        copy=False,
        help='Comisión del producto al momento de la confirmación del pedido'
    )

    # NUEVO: Importe de comisión por producto
    product_commission_amount = fields.Monetary(
        string='Comisión del Producto',
        compute='_compute_product_commission_amount',
        store=True,
        currency_field='currency_id',
        copy=False,
        help='Monto de comisión basado en la comisión del producto'
    )

    # Existente: Tasa general del vendedor (legacy)
    commission_rate_snapshot = fields.Float(
        string='Comisión Vendedor (%)',
        related='product_id.sales_manager_commission',
        digits=(16, 2),
        readonly=True,
        store=True,
        copy=False,
        help='Tasa de comisión del gestor basada en el producto'
    )

    # Existente: Comisión por tasa general (legacy)
    commission_amount = fields.Monetary(
        string='Comisión Vendedor (Tasa General)',
        compute='_compute_commission_amount',
        store=True,
        currency_field='currency_id',
        copy=False,
        help='Monto de comisión basado en la tasa general del gestor'
    )

    sales_manager_id = fields.Many2one(
        'pyxel.sales.manager',
        string='Gestor de Ventas',
        compute='_compute_sales_manager_id',
        store=True,
        index=True,
        help='Gestor de ventas asociado a esta línea'
    )

    @api.depends('order_id.sales_manager_id')
    def _compute_sales_manager_id(self):
        """Heredar el gestor de ventas desde el pedido"""
        for line in self:
            line.sales_manager_id = line.order_id.sales_manager_id

    @api.depends('price_subtotal', 'product_commission_snapshot')
    def _compute_product_commission_amount(self):
        """Calcular comisión basada en la comisión del producto"""
        for line in self:
            if line.product_commission_snapshot and not line.display_type:
                line.product_commission_amount = line.price_subtotal * (line.product_commission_snapshot / 100)
            else:
                line.product_commission_amount = 0.0

    @api.depends('price_subtotal', 'commission_rate_snapshot')
    def _compute_commission_amount(self):
        """Calcular comisión basada en la tasa general del vendedor (legacy)"""
        for line in self:
            if line.commission_rate_snapshot and not line.display_type:
                line.commission_amount = line.price_subtotal * (line.commission_rate_snapshot / 100)
            else:
                line.commission_amount = 0.0

    def _prepare_invoice_line(self, **optional_values):
        """Pasar comisiones a la línea de factura"""
        res = super(SaleOrderLine, self)._prepare_invoice_line(**optional_values)

        # Pasar comisión del producto
        if self.product_commission_snapshot:
            res.update({
                'product_commission_snapshot': self.product_commission_snapshot,
            })

        # Pasar comisión del vendedor (legacy)
        if self.commission_rate_snapshot:
            res.update({
                'commission_rate_snapshot': self.commission_rate_snapshot,
            })

        return res