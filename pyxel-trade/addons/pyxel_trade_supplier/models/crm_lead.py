# -*- coding: utf-8 -*-

from odoo import fields, models


class CrmLead(models.Model):
    """Datos del fabricante chino que llegan por la puerta del proveedor.

    Se guardan en crm.lead y no en un modelo propio: una solicitud de
    proveedor es una oportunidad comercial, y el embudo, la mensajería y
    la asignación a comercial ya existen ahí.
    """
    _inherit = 'crm.lead'

    pyxel_supplier_type = fields.Selection([
        ('manufacturer', "Fabricante"),
        ('oem_odm', "Fabricante OEM / ODM"),
        ('brand_owner', "Propietario de marca"),
        ('export_company', "Empresa exportadora"),
        ('distributor', "Distribuidor"),
    ], string="Tipo de proveedor")

    pyxel_categories = fields.Char(
        string="Categorías ofrecidas",
        help="Categorías que el proveedor marcó en el formulario.")

    pyxel_form_lang = fields.Selection([
        ('es', "Español"),
        ('en', "English"),
        ('zh', "简体中文"),
    ], string="Idioma del formulario",
       help="Idioma en el que el proveedor rellenó la solicitud. Determina "
            "en qué idioma conviene responderle.")
