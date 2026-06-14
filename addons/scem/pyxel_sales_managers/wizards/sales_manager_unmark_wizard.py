# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class SalesManagerUnmarkWizard(models.TransientModel):
    _name = 'sales.manager.unmark.wizard'
    _description = 'Asistente para Desmarcar/Desactivar Gestor de Ventas'

    partner_id = fields.Many2one(
        'res.partner',
        string='Contacto',
        required=True,
        readonly=True
    )

    validation_result = fields.Selection([
        ('allow', 'Permitir desmarcar'),
        ('deactivate_active', 'Solo desactivar - Documentos activos'),
        ('deactivate_cancelled', 'Solo desactivar - Documentos cancelados')
    ], string='Resultado de Validación', required=True, readonly=True)

    message = fields.Html(
        string='Mensaje',
        compute='_compute_message',
        sanitize=False
    )

    @api.depends('validation_result')
    def _compute_message(self):
        """Generar mensaje según el resultado de validación"""
        for wizard in self:
            if wizard.validation_result == 'deactivate_active':
                wizard.message = _(
                    '<div style="text-align: center; padding: 15px;">'
                    '<i class="fa fa-exclamation-triangle fa-4x" style="color: #f0ad4e; margin-bottom: 20px;"></i>'
                    '<h3 style="color: #856404;">Documentos Activos Detectados</h3>'
                    '<p style="font-size: 14px; margin: 15px 0;">'
                    'Este gestor tiene <strong>documentos activos</strong> por lo que no puede ser '
                    'desvinculado como gestor. <strong>Solo se puede desactivar.</strong>'
                    '</p>'
                    '</div>'
                )
            elif wizard.validation_result == 'deactivate_cancelled':
                wizard.message = _(
                    '<div style="text-align: center; padding: 15px;">'
                    '<i class="fa fa-exclamation-circle fa-4x" style="color: #f0ad4e; margin-bottom: 20px;"></i>'
                    '<h3 style="color: #856404;">Documentos Cancelados Detectados</h3>'
                    '<p style="font-size: 14px; margin: 15px 0;">'
                    'Este gestor contiene <strong>documentos cancelados</strong> por lo que no puede desmarcarse. '
                    '<strong>Solo se puede desactivar.</strong>'
                    '</p>'
                    '</div>'
                )
            else:
                wizard.message = _(
                    '<div style="text-align: center; padding: 15px;">'
                    '<i class="fa fa-check-circle fa-4x" style="color: #5cb85c; margin-bottom: 20px;"></i>'
                    '<h3 style="color: #0c5460;">Sin Documentos Asociados</h3>'
                    '<p style="font-size: 14px; margin: 15px 0;">'
                    'Este gestor <strong>no tiene documentos asociados</strong>.'
                    '</p>'
                    '<p style="font-size: 13px; color: #666;">'
                    'Se desmarcará completamente como gestor de ventas.'
                    '</p>'
                    '</div>'
                )

    def action_confirm(self):
        """BOTÓN ACEPTAR - Confirmar y cerrar wizard"""
        self.ensure_one()

        ctx = dict(self.env.context, from_unmark_wizard=True)

        if self.validation_result == 'allow':
            # Sin documentos: desmarcar ambos campos
            self.partner_id.with_context(ctx).write({
                'is_sales_manager': False,
                'active_sales_manager': False
            })
        else:
            # Con documentos: solo desactivar
            self.partner_id.with_context(ctx).write({
                'active_sales_manager': False
            })

        # Cerrar el wizard
        return {'type': 'ir.actions.act_window_close'}

    def action_cancel(self):
        """BOTÓN CANCELAR - Cerrar sin cambios"""
        return {'type': 'ir.actions.act_window_close'}