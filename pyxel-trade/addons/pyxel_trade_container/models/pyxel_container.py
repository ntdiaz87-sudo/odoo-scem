# -*- coding: utf-8 -*-

from odoo import api, fields, models

# Capacidades aproximadas de contenedor marítimo estándar. Volumen en m³,
# carga útil en kg. Se dejan como constantes y no como datos editables
# porque son propiedades físicas del contenedor, no configuración.
CAPACIDADES = {
    '20gp': {'volumen': 33.2, 'peso': 28200.0},
    '40gp': {'volumen': 67.7, 'peso': 28800.0},
    '40hq': {'volumen': 76.4, 'peso': 28600.0},
}

# Odoo guarda volumen y peso en la unidad que tenga configurada la
# instalación, no siempre en m³ y kg. Sin normalizar, la ocupación del
# contenedor saldría mal por un factor de 35 en volumen o de 2,2 en peso.
PIE_CUBICO_EN_M3 = 0.0283168
LIBRA_EN_KG = 0.45359237


class PyxelContainer(models.Model):
    """Una operación de consolidación: varios productos, un contenedor.

    Es la respuesta al problema real del mercado cubano — rara vez hace
    falta un contenedor entero del mismo artículo — y a la vez lo que un
    mayorista con almacén propio no puede ofrecer, porque necesita mover
    lotes grandes de cada referencia.
    """
    _name = 'pyxel.container'
    _description = 'Contenedor mixto'
    _order = 'id desc'

    name = fields.Char(string="Referencia", required=True, copy=False,
                       default="Nuevo")
    state = fields.Selection([
        ('draft', "Borrador"),
        ('open', "Admitiendo carga"),
        ('closed', "Cerrado"),
        ('shipped', "Embarcado"),
    ], string="Estado", default='draft', required=True)

    container_type = fields.Selection([
        ('20gp', "20' GP"),
        ('40gp', "40' GP"),
        ('40hq', "40' HQ"),
    ], string="Tipo de contenedor", default='40hq', required=True)

    port_id = fields.Many2one(
        'pyxel.port', string="Puerto de origen",
        help="Consolidar sólo tiene sentido con carga que sale del mismo "
             "puerto: es lo que decide qué productos pueden compartir viaje.")

    line_ids = fields.One2many('pyxel.container.line', 'container_id',
                               string="Carga")
    note = fields.Text(string="Notas")

    # ── Capacidad ───────────────────────────────────────────────────
    capacity_volume = fields.Float(
        string="Volumen del contenedor (m³)",
        compute='_compute_capacidad', store=True, digits=(10, 2))
    capacity_weight = fields.Float(
        string="Carga útil (kg)",
        compute='_compute_capacidad', store=True, digits=(10, 2))

    used_volume = fields.Float(string="Volumen ocupado (m³)",
                               compute='_compute_ocupacion', store=True,
                               digits=(10, 3))
    used_weight = fields.Float(string="Peso cargado (kg)",
                               compute='_compute_ocupacion', store=True,
                               digits=(10, 2))
    free_volume = fields.Float(string="Volumen libre (m³)",
                               compute='_compute_ocupacion', store=True,
                               digits=(10, 3))
    volume_pct = fields.Float(string="Ocupación en volumen (%)",
                              compute='_compute_ocupacion', store=True,
                              digits=(5, 1))
    weight_pct = fields.Float(string="Ocupación en peso (%)",
                              compute='_compute_ocupacion', store=True,
                              digits=(5, 1))
    overloaded = fields.Boolean(string="Sobrecargado",
                                compute='_compute_ocupacion', store=True)

    supplier_count = fields.Integer(string="Proveedores distintos",
                                    compute='_compute_ocupacion', store=True)

    @api.depends('container_type')
    def _compute_capacidad(self):
        for contenedor in self:
            datos = CAPACIDADES.get(contenedor.container_type) or {}
            contenedor.capacity_volume = datos.get('volumen', 0.0)
            contenedor.capacity_weight = datos.get('peso', 0.0)

    @api.depends('line_ids.volume_m3', 'line_ids.weight_kg',
                 'line_ids.supplier_id', 'capacity_volume', 'capacity_weight')
    def _compute_ocupacion(self):
        for contenedor in self:
            volumen = sum(contenedor.line_ids.mapped('volume_m3'))
            peso = sum(contenedor.line_ids.mapped('weight_kg'))
            contenedor.used_volume = volumen
            contenedor.used_weight = peso
            contenedor.free_volume = max(contenedor.capacity_volume - volumen, 0.0)
            contenedor.volume_pct = (
                volumen / contenedor.capacity_volume * 100.0
                if contenedor.capacity_volume else 0.0)
            contenedor.weight_pct = (
                peso / contenedor.capacity_weight * 100.0
                if contenedor.capacity_weight else 0.0)
            # Un contenedor se llena por volumen o por peso, lo que llegue
            # antes: la carga ligera y voluminosa agota el espacio mucho
            # antes que la báscula, y al revés con baterías o herramienta.
            contenedor.overloaded = (
                volumen > contenedor.capacity_volume
                or peso > contenedor.capacity_weight)
            contenedor.supplier_count = len(
                set(contenedor.line_ids.mapped('supplier_id').ids))


class PyxelContainerLine(models.Model):
    _name = 'pyxel.container.line'
    _description = 'Línea de carga del contenedor mixto'
    _order = 'container_id, id'

    container_id = fields.Many2one('pyxel.container', string="Contenedor",
                                   required=True, ondelete='cascade')
    product_id = fields.Many2one('product.product', string="Producto",
                                 required=True)
    supplier_id = fields.Many2one('res.partner', string="Proveedor",
                                  compute='_compute_proveedor', store=True,
                                  readonly=False,
                                  help="Se propone el primer proveedor del "
                                       "producto; puede cambiarse a mano.")
    quantity = fields.Float(string="Cantidad", default=1.0, required=True,
                            digits='Product Unit of Measure')

    volume_m3 = fields.Float(string="Volumen (m³)", compute='_compute_medidas',
                             store=True, digits=(10, 3))
    weight_kg = fields.Float(string="Peso (kg)", compute='_compute_medidas',
                             store=True, digits=(10, 2))
    measures_missing = fields.Boolean(
        string="Sin medidas", compute='_compute_medidas', store=True,
        help="El producto no tiene volumen o peso, así que no cuenta para la "
             "ocupación. Es la causa más común de un cálculo optimista.")

    @api.depends('product_id')
    def _compute_proveedor(self):
        for linea in self:
            proveedores = linea.product_id.seller_ids
            linea.supplier_id = proveedores[:1].partner_id if proveedores else False

    def _factores(self):
        """Devuelve a cuánto equivale una unidad de Odoo en m³ y en kg.

        Odoo puede estar configurado en pies cúbicos y libras. Si estos
        parámetros cambiaran de nombre en una versión futura, el valor por
        defecto mantiene el comportamiento métrico, que es el correcto para
        una operación de importación.
        """
        parametros = self.env['ir.config_parameter'].sudo()
        en_pies = parametros.get_param('product.volume_in_cubic_feet') == '1'
        en_libras = parametros.get_param('product.weight_in_lbs') == '1'
        return (PIE_CUBICO_EN_M3 if en_pies else 1.0,
                LIBRA_EN_KG if en_libras else 1.0)

    @api.depends('product_id', 'quantity')
    def _compute_medidas(self):
        factor_volumen, factor_peso = self._factores()
        for linea in self:
            producto = linea.product_id
            volumen_unitario = producto.volume or 0.0
            peso_unitario = producto.weight or 0.0
            linea.volume_m3 = volumen_unitario * factor_volumen * linea.quantity
            linea.weight_kg = peso_unitario * factor_peso * linea.quantity
            linea.measures_missing = bool(producto) and not (
                volumen_unitario and peso_unitario)
