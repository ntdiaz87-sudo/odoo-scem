# -*- coding: utf-8 -*-
from odoo import models, fields

class StockPicking(models.Model):
    _inherit = 'stock.warehouse'

    name_mp = fields.Char(string="Nombre para el Marketplace")
    address_mp = fields.Char(string="Dirección")
    phone_mp = fields.Char(string="Teléfono")
    mobile_mp = fields.Char(string="Móvil")
    
    has_express_delivery = fields.Boolean(string="Permite Envío Express", default=False)
    is_pick_up_in_store = fields.Boolean(string="Permite recogida en tienda", default=False)
    horary_mp = fields.Char(string="Horario de recogida")