# -*- coding: utf-8 -*-
from odoo import api, SUPERUSER_ID


def pre_init_hook(cr):
    """
    Hook que se ejecuta antes de la instalación/actualización del módulo
    """
    env = api.Environment(cr, SUPERUSER_ID, {})

    # Verificar si el módulo l10n_cu_address está instalado
    l10n_cu_module = env['ir.module.module'].search([
        ('name', '=', 'l10n_cu_address'),
        ('state', 'in', ['installed', 'to upgrade'])
    ], limit=1)

    if l10n_cu_module:
        # Si está instalado, actualizar las dependencias del módulo actual
        current_module = env['ir.module.module'].search([
            ('name', '=', 'pyxel_cem_website_account')
        ], limit=1)

        if current_module:
            # Quitar l10n_cu_address de las dependencias si está presente
            current_module.dependencies_id.filtered(
                lambda d: d.name == 'l10n_cu_address'
            ).unlink()