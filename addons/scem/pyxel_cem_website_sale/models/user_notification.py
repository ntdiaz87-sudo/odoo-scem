from odoo import models, fields, api

class UserNotification(models.Model):
    _name = 'user.notification'
    _description = 'User Notifications'
    _order = 'create_date desc'

    user_id = fields.Many2one('res.users', string='User', index=True)
    partner_id = fields.Many2one('res.partner', string='Partner', index=True)
    message = fields.Char(string='Message', required=True)
    is_read = fields.Boolean(default=False, index=True)
    notification_type = fields.Selection([
        ('portal', 'Portal'),
        ('internal', 'Internal'),
    ], string='Type', required=True)
    order_id = fields.Many2one('sale.order', string='Related Order', index=True)
    # Campo alternativo para referencia a la orden
    order_reference = fields.Char(string='Order Reference', index=True)

    def action_view_order(self):
        """Acción para buscar la orden relacionada"""
        self.ensure_one()
        if self.order_reference:
            order = self.env['sale.order'].search([('name', '=', self.order_reference)], limit=1)
            if order:
                return {
                    'type': 'ir.actions.act_window',
                    'name': 'Ver Orden',
                    'res_model': 'sale.order',
                    'res_id': order.id,
                    'view_mode': 'form',
                    'target': 'current',
                }
        return False
