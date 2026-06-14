from odoo import models, fields


class ResCity(models.Model):
    _name = 'res.city'
    _description = 'Municipios de Cuba'
    _order = 'name'

    name = fields.Char(string="Municipio", required=True)
    zipcode = fields.Char(string="Código Postal")
    state_id = fields.Many2one('res.country.state', string="Provincia", required=True)
    country_id = fields.Many2one('res.country', string="País", required=True, default=lambda self: self.env.ref('base.cu'))

