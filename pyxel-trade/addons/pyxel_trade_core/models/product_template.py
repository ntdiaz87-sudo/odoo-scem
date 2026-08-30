# -*- coding: utf-8 -*-

from odoo import api, fields, models


class ProductTemplate(models.Model):
    """Datos comerciales B2B que el catálogo público necesita mostrar.

    El proveedor y el plazo de entrega NO se replican aquí: ya viven en
    product.supplierinfo (campo seller_ids). Duplicarlos daría dos verdades
    para el mismo dato.
    """
    _inherit = 'product.template'

    # ── Condiciones comerciales ─────────────────────────────────────────
    pyxel_incoterm_id = fields.Many2one(
        'account.incoterms', string="Incoterm",
        help="Condición de entrega del precio publicado, normalmente FOB o EXW.")
    pyxel_port_id = fields.Many2one('pyxel.port', string="Puerto de origen")

    # Cantidad mínima de pedido. Se guarda como cantidad + unidad, y no como
    # texto libre, para poder filtrar y agregar demanda de varios compradores.
    pyxel_moq_qty = fields.Float(string="Cantidad mínima (MOQ)", digits='Product Unit of Measure')
    pyxel_moq_uom_id = fields.Many2one('uom.uom', string="Unidad del MOQ")

    # ── Precio indicativo ───────────────────────────────────────────────
    # Es un RANGO orientativo de catálogo, no un precio en firme: el precio
    # en firme sale de una cotización. Se separa de list_price para no
    # interferir con la venta normal de Odoo.
    pyxel_price_min = fields.Float(string="Precio indicativo mínimo", digits='Product Price')
    pyxel_price_max = fields.Float(string="Precio indicativo máximo", digits='Product Price')
    pyxel_price_unit_label = fields.Char(
        string="Unidad del precio", translate=True,
        help="Unidad en la que se expresa el precio publicado: W, unidad, "
             "palé, juego. Ejemplo: 0,18 – 0,21 USD / W.")

    # ── Señal de demanda en Cuba ────────────────────────────────────────
    pyxel_demand_signal = fields.Selection([
        ('high', "Alta demanda"),
        ('rising', "Demanda en alza"),
        ('opportunity', "Oportunidad"),
        ('normal', "Normal"),
    ], string="Señal de demanda", default='normal',
       help="Alimenta Cuba Market Pulse y las insignias del catálogo.")

    # ── Compatibilidad eléctrica con la red cubana ──────────────────────
    # China: 220 V / 50 Hz.  Cuba: 110 V y 220 V, siempre a 60 Hz.
    # La frecuencia es lo crítico: un motor de 50 Hz gira mal a 60 Hz, y un
    # inversor solar de 50 Hz no sincroniza con la red cubana.
    pyxel_power_spec = fields.Selection([
        ('none', "Sin componente eléctrico"),
        ('110_60', "110 V / 60 Hz"),
        ('220_60', "220 V / 60 Hz"),
        ('220_50', "220 V / 50 Hz"),
        ('dual', "Multitensión (100–240 V, 50/60 Hz)"),
    ], string="Especificación eléctrica", default='none', required=True)

    pyxel_cuba_power_fit = fields.Selection([
        ('na', "No aplica"),
        ('ok', "Compatible"),
        ('partial', "Compatible parcial"),
        ('adapt', "Requiere adaptación"),
    ], string="Compatibilidad en Cuba",
       compute='_compute_pyxel_cuba_power_fit', store=True,
       help="Se deriva de la especificación eléctrica. Es el dato que se "
            "muestra al comprador cubano y por el que puede filtrar.")

    @api.depends('pyxel_power_spec')
    def _compute_pyxel_cuba_power_fit(self):
        equivalencias = {
            'none': 'na',
            # 110 V/60 Hz es la red doméstica mayoritaria en Cuba.
            '110_60': 'ok',
            'dual': 'ok',
            # Existe red de 220 V en Cuba, pero no en toda instalación.
            '220_60': 'partial',
            # Estándar chino: tensión y frecuencia equivocadas.
            '220_50': 'adapt',
        }
        for producto in self:
            producto.pyxel_cuba_power_fit = equivalencias.get(
                producto.pyxel_power_spec, 'na')
