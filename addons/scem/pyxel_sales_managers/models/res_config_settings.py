# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    enable_sales_managers = fields.Boolean(
        string='Gestores de Ventas',
        config_parameter='pyxel_sales_managers.enable_sales_managers',
        help='Habilitar la gestión de gestores de ventas en el sistema'
    )

    # Campo temporal para evitar error de otro módulo
    wa_sale_template_id = fields.Many2one(
        'mail.template',
        string='WhatsApp Sale Template',
        config_parameter='pyxel_sales_managers.wa_sale_template_id'
    )

    def set_values(self):
        """Sobrescribir para gestionar el grupo Y el menú"""
        res = super(ResConfigSettings, self).set_values()

        # Obtener el menú
        menu = self.env.ref('pyxel_sales_managers.menu_sales_manager_reconciliation', raise_if_not_found=False)

        if menu:
            # Activar/desactivar el menú según el checkbox
            menu.active = self.enable_sales_managers

        # Código existente del grupo...
        group = self.env.ref('pyxel_sales_managers.group_sales_manager_user', raise_if_not_found=False)

        if group:
            if self.enable_sales_managers:
                internal_users = self.env['res.users'].search([('share', '=', False)])
                group.users = [(6, 0, internal_users.ids)]
            else:
                group.users = [(5, 0, 0)]

        return res


class ResUsers(models.Model):
    _inherit = 'res.users'

    @api.model_create_multi
    def create(self, vals_list):
        """Al crear usuarios, agregarlos al grupo si está habilitado"""
        users = super(ResUsers, self).create(vals_list)

        # Verificar si el módulo está habilitado
        enabled = self.env['ir.config_parameter'].sudo().get_param(
            'pyxel_sales_managers.enable_sales_managers',
            default=False
        )

        if enabled:
            group = self.env.ref('pyxel_sales_managers.group_sales_manager_user', raise_if_not_found=False)
            if group:
                # Agregar usuarios internos al grupo
                internal_users = users.filtered(lambda u: not u.share)
                if internal_users:
                    group.users = [(4, user.id) for user in internal_users]

        return users