# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import json


class PortalNotificationController(http.Controller):

    @http.route('/user/notifications', type='json', auth='user', website=True)
    def get_notifications(self):
        user = request.env.user
        Notification = request.env['user.notification'].sudo()

        try:
            if user.has_group('base.group_portal'):
                notifications = Notification.search([
                    ('partner_id', '=', user.partner_id.id),
                    ('is_read', '=', False)
                ], limit=10, order='create_date DESC')
            else:
                notifications = Notification.search([
                    ('user_id', '=', user.id),
                    ('is_read', '=', False)
                ], limit=10, order='create_date DESC')

            return {
                'count': len(notifications),
                'notifications': [{
                    'id': notif.id,
                    'message': notif.message,
                    'create_date': notif.create_date.strftime('%Y-%m-%d %H:%M:%S'),
                    'is_read': notif.is_read,
                    'notification_type': notif.notification_type
                } for notif in notifications]
            }
        except Exception as e:
            return {
                'error': {
                    'code': 500,
                    'message': str(e)
                }
            }

    @http.route('/user/notifications/mark_read', type='json', auth='user', website=True)
    def mark_notifications_read(self, notification_id=False):
        user = request.env.user
        Notification = request.env['user.notification'].sudo()

        try:
            domain = [('is_read', '=', False)]
            if user.has_group('base.group_portal'):
                domain.append(('partner_id', '=', user.partner_id.id))
            else:
                domain.append(('user_id', '=', user.id))

            if notification_id:
                domain.append(('id', '=', int(notification_id)))

            notifications = Notification.search(domain)
            notifications.write({'is_read': True})
            return {'status': 'success'}
        except Exception as e:
            return {
                'error': {
                    'code': 500,
                    'message': str(e)
                }
            }

    @http.route('/user/notifications/order', type='json', auth='user', website=True)
    def get_order_notifications(self):
        """Endpoint adicional para notificaciones con referencia a órdenes"""
        user = request.env.user
        domain = [('is_read', '=', False)]

        if user.has_group('base.group_portal'):
            domain.append(('partner_id', '=', user.partner_id.id))
        else:
            domain.append(('user_id', '=', user.id))

        notifications = request.env['user.notification'].search(domain, limit=10)

        return {
            'notifications': [{
                'id': notif.id,
                'message': notif.message,
                'order_ref': notif.order_reference,
                'date': notif.create_date.strftime('%Y-%m-%d %H:%M')
            } for notif in notifications]
        }

    # user = request.env.user
    # notifs = [
    #     ('partner_id', '=', user.partner_id.id),
    #     ('is_read', '=', False)
    # ]
    # # Si se proporciona un ID específico, marcar solo esa notificación
    # if notification_id:
    #     notifs.append(('id', '=', int(notification_id)))
    #
    # notifs = request.env['portal.notification'].sudo().search(notifs)
    # notifs.write({'is_read': True})
    # return {'status': 'ok'}

    # @http.route('/portal/notifications/mark_all_as_read', type='json', auth='user')
    # def mark_all_as_read(self):
    #     request.env['portal.notification'].sudo().search([
    #         ('message', '=', 'notification'),
    #         ('partner_id', 'in', [request.env.user.partner_id.id]),
    #         ('is_read', '=', False)
    #     ]).set_message_done()
