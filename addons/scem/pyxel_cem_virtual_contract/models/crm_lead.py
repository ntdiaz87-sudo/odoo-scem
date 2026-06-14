# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, models, _
import logging

_logger = logging.getLogger(__name__)

class Lead(models.Model):
    _inherit = 'crm.lead'

    def _send_notif_mail_stage(self, stage):
        if stage.cem_manag_contract:
            # Send email to salesman
            template = self.env.ref('pyxel_cem_virtual_contract.mail_template_vc_manag_notify', raise_if_not_found=True)
            if template:
                salesmans = self.env['res.users'].search([
                    ('company_ids', 'in', self.env.company.id),
                    ('groups_id', 'in', self.env.ref('pyxel_cem_configuration.group_comerciales').id)])
                emails = set(r.email_formatted for r in salesmans if r.email_formatted)
                if emails:
                    email_values = {'email_to': ','.join(emails)}
                    template.sudo().send_mail(self.id, force_send=True,
                                              email_values=email_values,
                                              email_layout_xmlid='mail.mail_notification_light')

    def _send_notif_mail(self):
        for lead in self:
            if lead.stage_id:
                lead._send_notif_mail_stage(lead.stage_id)

    @api.model_create_multi
    def create(self, vals_list):
        leads = super(Lead, self).create(vals_list)
        leads._send_notif_mail()
        return leads

    def write(self, vals):
        # Verificar primero si hay cambio de etapa para aprobación
        needs_approval_notification = False
        if 'stage_id' in vals:
            new_stage = self.env['crm.stage'].browse(vals['stage_id'])
            if new_stage.cem_vcontract_approved_hiring_process:
                needs_approval_notification = True

        # Ejecutar el write original
        res = super(Lead, self).write(vals)

        self._send_notif_mail()

        # Crear notificación solo si es necesario
        if needs_approval_notification:
            self._create_approval_notifications()

        return res

    def _create_approval_notifications(self):
        """Crear notificaciones de aprobación según el tipo de usuario"""
        for lead in self:
            try:
                if not lead.partner_id or not lead.partner_id.user_ids:
                    continue

                # Obtener todos los IDs de usuarios primero
                user_ids = lead.partner_id.user_ids.ids

                for user_id in user_ids:
                    user = self.env['res.users'].browse(user_id)
                    if not user.partner_id:
                        continue

                    # Obtener el partner usando el ID directamente
                    partner = self.env['res.partner'].browse(user.partner_id.id)
                    if not partner.exists():
                        continue

                    notification_type = 'portal' if user.has_group('base.group_portal') else 'internal'
                    self._create_crm_lead_notification(
                        lead,
                        partner,
                        notification_type,
                        _('<span class="notif-order-name">Usted ha sido aprobado en nuestra cartera de cliente y está en proceso de contratación. Lo mantendremos informado por esta vía o por correo. Gracias.</span>')
                    )

            except Exception as e:
                _logger.error(f"Error: {str(e)}")

    def _create_crm_lead_notification(self, lead, partner, notification_type, message):
        """Crear una notificación individual"""
        # Buscar la orden de venta relacionada si existe
        sale_order = self.env['sale.order'].search([
            ('opportunity_id', '=', lead.id)
        ], limit=1)

        notification_vals = {
            'partner_id': partner.id,
            'user_id': partner.user_ids[0].id if partner.user_ids else False,
            'message': message,
            'notification_type': notification_type,
        }

        # Añadir referencia a la orden si existe
        if sale_order:
            notification_vals['order_id'] = sale_order.id
            notification_vals['order_reference'] = sale_order.name

        self.env['user.notification'].sudo().create(notification_vals)