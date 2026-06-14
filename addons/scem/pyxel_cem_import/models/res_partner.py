# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

from odoo import models, fields, api
from odoo.exceptions import ValidationError


class ResPartner(models.Model):
    _inherit = 'res.partner'

    # Hacer que el campo email no sea obligatorio
    email = fields.Char(
        string='Email',
        required=False
    )

    @api.constrains('email')
    def _check_email(self):
        """Sobrescribir la validación del email para que no sea obligatorio"""
        # No hacer nada - esto evita la validación original
        pass

    @api.model
    def create(self, vals):
        """Al crear un partner, si no viene email, no forzar error"""
        # Si no hay email en vals, lo dejamos vacío
        if 'email' not in vals:
            vals['email'] = False
        return super(ResPartner, self).create(vals)

    def write(self, vals):
        """Al modificar, permitir email vacío"""
        return super(ResPartner, self).write(vals)