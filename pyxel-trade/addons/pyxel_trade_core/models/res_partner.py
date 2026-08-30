# -*- coding: utf-8 -*-

from odoo import fields, models


class ResPartner(models.Model):
    """Perfil comercial del proveedor chino.

    Se extiende res.partner en lugar de crear un modelo aparte: el proveedor
    ya es un contacto de Odoo y necesita facturas, pedidos de compra y
    mensajería. Un modelo propio obligaría a duplicar todo eso.
    """
    _inherit = 'res.partner'

    pyxel_is_supplier = fields.Boolean(
        string="Proveedor del marketplace", default=False,
        help="Marca a este contacto como proveedor publicable en el "
             "marketplace de PYXEL.")

    pyxel_supplier_type = fields.Selection([
        ('manufacturer', "Fabricante"),
        ('oem_odm', "Fabricante OEM / ODM"),
        ('brand_owner', "Propietario de marca"),
        ('export_company', "Empresa exportadora"),
        ('distributor', "Distribuidor"),
    ], string="Tipo de proveedor")

    # La verificación es una promesa pública: si un proveedor verificado
    # entrega mal, el desprestigio lo asume PYXEL. Por eso se guarda quién
    # verificó y cuándo, no sólo un booleano.
    pyxel_verified = fields.Boolean(string="Proveedor verificado", default=False)
    pyxel_verified_date = fields.Date(string="Fecha de verificación", readonly=True)
    pyxel_verified_by_id = fields.Many2one(
        'res.users', string="Verificado por", readonly=True)
    pyxel_verification_notes = fields.Text(
        string="Notas de verificación",
        help="Qué se comprobó: licencia de exportación, visita a fábrica, "
             "certificaciones, referencias comerciales.")

    pyxel_port_id = fields.Many2one(
        'pyxel.port', string="Puerto de embarque habitual")

    def action_pyxel_verify(self):
        """Marca el proveedor como verificado dejando traza de quién y cuándo."""
        self.write({
            'pyxel_verified': True,
            'pyxel_verified_date': fields.Date.context_today(self),
            'pyxel_verified_by_id': self.env.user.id,
        })

    def action_pyxel_unverify(self):
        self.write({
            'pyxel_verified': False,
            'pyxel_verified_date': False,
            'pyxel_verified_by_id': False,
        })
