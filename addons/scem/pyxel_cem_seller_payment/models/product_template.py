# -*- coding: utf-8 -*-
from odoo import models, fields, api


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    cif_cost = fields.Float(
        string="Indicador de Costo CIF (%)",
        digits=(16, 4),        
        tracking=True,         
        help="Porcentaje usado como indicador de costo CIF."
    )