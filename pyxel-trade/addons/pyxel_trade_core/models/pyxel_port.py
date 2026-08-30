# -*- coding: utf-8 -*-

from odoo import fields, models


class PyxelPort(models.Model):
    """Puerto de origen de la mercancía (Shenzhen, Ningbo, Qingdao...).

    Se usa para agrupar productos de proveedores distintos que pueden
    consolidarse en un mismo contenedor: consolidar sólo tiene sentido si
    la carga sale del mismo puerto.
    """
    _name = 'pyxel.port'
    _description = 'Puerto de origen'
    _order = 'country_id, name'

    name = fields.Char(string="Puerto", required=True, translate=True)
    code = fields.Char(
        string="Código UN/LOCODE", size=5,
        help="Código de cinco caracteres de Naciones Unidas, por ejemplo "
             "CNSZX para Shenzhen.")
    country_id = fields.Many2one('res.country', string="País", required=True)
    active = fields.Boolean(default=True)

    # Odoo 19 retiró el atributo _sql_constraints: las restricciones se
    # declaran como atributos de clase de tipo models.Constraint.
    _code_uniq = models.Constraint(
        'UNIQUE(code)',
        "Ya existe un puerto con ese código UN/LOCODE.",
    )
