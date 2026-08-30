# -*- coding: utf-8 -*-

from odoo import fields, models


class PyxelMarketSignal(models.Model):
    """Una señal de demanda del mercado cubano — Cuba Market Pulse.

    Es el dato que ningún competidor puede replicar, porque sale de las
    ventas reales de los canales del grupo. Se cura a mano al principio;
    cuando haya histórico suficiente, se calculará.
    """
    _name = 'pyxel.market.signal'
    _description = 'Señal de demanda del mercado cubano'
    _order = 'sequence, id'

    name = fields.Char(string="Producto o categoría", required=True, translate=True)
    sequence = fields.Integer(default=10)
    active = fields.Boolean(default=True)

    trend = fields.Selection([
        ('high', "Demanda alta"),
        ('rising', "Demanda en alza"),
        ('opportunity', "Oportunidad"),
    ], string="Tendencia", required=True, default='rising')

    variation = fields.Float(
        string="Variación (%)",
        help="Variación respecto al periodo anterior. Se muestra junto a la "
             "señal; déjalo a cero si aún no hay histórico que lo respalde.")

    public_category_id = fields.Many2one(
        'product.public.category', string="Categoría del catálogo",
        help="Enlaza la señal con la categoría, para que el visitante pueda "
             "pasar del dato al producto.")

    note = fields.Text(string="Contexto", translate=True)
