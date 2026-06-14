# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import ValidationError


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    sales_manager_commission = fields.Float(
        string='Comisión del Gestor',
        digits=(16, 2),
        help='Porcentaje de comisión para el gestor de ventas',
        default=0.0
    )

    show_sales_manager = fields.Boolean(
        compute='_compute_show_sales_manager',
        string='Mostrar Gestor'
    )

    @api.depends_context('company')
    def _compute_show_sales_manager(self):
        """Determina si se debe mostrar el campo de gestor de ventas"""
        show = self.env['ir.config_parameter'].sudo().get_param(
            'pyxel_sales_managers.enable_sales_managers',
            default=False
        )
        # Convertir a booleano correctamente
        show_bool = show == 'True' if isinstance(show, str) else bool(show)

        for record in self:
            record.show_sales_manager = show_bool

    @api.constrains('sales_manager_commission')
    def _check_sales_manager_commission(self):
        """Validar que el porcentaje sea válido"""
        for record in self:
            if record.sales_manager_commission < 0 or record.sales_manager_commission > 100:
                raise ValidationError(
                    'La comisión del gestor debe estar entre 0% y 100%'
                )