from odoo import _, models, fields, api
from datetime import timedelta
import logging
import traceback
from odoo.tools import float_compare
_logger = logging.getLogger(__name__)

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    state = fields.Selection(
        selection_add=[
            ('sent', 'Cotización Enviada'),
            ('sale', 'Terminado')  # Añadir este estado
        ],
        ondelete={'sent': 'set default', 'delivered': 'set default'}
    )
    notification_done_created = fields.Boolean(
        string="Notificación de completado creada",
        default=False
    )

    payment_provider_id = fields.Many2one(
        'payment.provider',
        string='Método de Pago',
        help='Método de pago seleccionado por el cliente',
        domain="[('state', 'in', ['enabled', 'test'])]"
    )
    
        
    is_website_order = fields.Boolean(
        string="Is Website Order",
        compute="_compute_is_website_order",
        store=True,
    )

    ordered_by_user_id = fields.Many2one(
        'res.users',
        string='Ordered By',
        help='Usuario autenticado que realizó el pedido (cuando es diferente del partner)'
    )

    # Campo para saber si el pedido fue hecho por un usuario jurídico con compañía
    is_company_order = fields.Boolean(
        string='Is Company Order',
        compute='_compute_is_company_order',
        store=True
    )

    @api.depends('partner_id', 'ordered_by_user_id')
    def _compute_is_company_order(self):
        for order in self:
            order.is_company_order = bool(
                order.ordered_by_user_id and
                order.ordered_by_user_id.partner_id != order.partner_id
            )

    @api.depends("website_id")
    def _compute_is_website_order(self):
        for order in self:
            order.is_website_order = bool(order.website_id)


    def write(self, vals):

        # Obtener estados previos
        old_states = {order.id: order.state for order in self}
        # old_cem_states = {order.id: order.so_cem_state for order in self}
        # old_notif_flags = {order.id: order.notification_done_created for order in self}

        # Ejecutar el write original
        res = super(SaleOrder, self).write(vals)

        for order in self:
            old_state = old_states.get(order.id)
            # old_cem_state = old_cem_states.get(order.id)
            # new_cem_state = order.so_cem_state
            # was_notified = old_notif_flags.get(order.id, False)

            # Notificación de cotización enviada
            if old_state != 'sent' and order.state == 'sent':
                order._send_quotation_notification()

            # Notificación de terminado (basado en so_cem_state)
            # if new_cem_state == 'delivered' and old_cem_state != 'delivered' and not was_notified:
            #     if order._create_delivered_notification():
            #         order.sudo().write({'notification_done_created': True})

        return res

    def action_delivered(self):
        res = super(SaleOrder, self).action_delivered()

        for order in self:
            # Solo crear notificación si pasa a delivered
            if order.so_cem_state == 'delivered' and not order.notification_done_created:
                if order._create_delivered_notification():
                    order.sudo().write({'notification_done_created': True})

        return res

    def action_confirm(self):
        res = super().action_confirm()
        for order in self:
            # Obtener nombres de productos
            product_names = ', '.join(order.order_line.mapped('product_id.name'))

            if order.user_id:  # Pedido creado por usuario interno
                message = _(
                    '<span class="notif-confirmation">Tu pedido interno ha sido confirmado, ya puedes realizar el pago.</span>\n'
                    '<span class="notif-products"> - Productos: {}</span>'
                ).format(product_names)
                notification_type = 'internal'
            else:  # Pedido de portal
                message = _(
                    '<span class="notif-confirmation">Tu pedido ha sido confirmado, ya puedes realizar el pago.</span>\n'
                    '<span class="notif-products"> - Productos: {}</span>'
                ).format(product_names)
                notification_type = 'portal'

            order.sudo()._create_user_notification(
                message=message,
                notification_type=notification_type
            )
        return res

    def _create_user_notification(self, message, notification_type='portal'):
        """
        Crea una notificación para el usuario adecuado
        """
        vals = {
            'message': message,
            'is_read': False,
            'notification_type': notification_type,
            'order_id': self.id,
            'order_reference': self.name
        }

        if notification_type == 'portal':
            portal_users = self.partner_id.user_ids.filtered(lambda u: u.has_group('base.group_portal'))
            if portal_users:
                vals['partner_id'] = self.partner_id.id
        else:
            if self.user_id:
                vals['user_id'] = self.user_id.id

        # Usamos sudo() para evitar problemas de permisos
        return self.env['user.notification'].sudo().create(vals)

    def _send_quotation_notification(self):
        """Método dedicado para enviar notificación de cotización"""
        for order in self.filtered(lambda o: o.state == 'sent'):
            try:
                # Obtener nombres de productos
                product_names = ', '.join(order.order_line.mapped('product_id.name'))

                # Mensaje de notificación
                message = _(
                    '<span class="notif-order-name">Su pedido {} está siendo procesado.</span>\n'
                    '<span class="notif-products"> - Productos: {}</span>'
                ).format(order.name, product_names)

                # Crear notificación
                notification_vals = {
                    'message': message,
                    'is_read': False,
                    'notification_type': 'portal' if order.partner_id.user_ids else 'internal',
                    'order_reference': order.name  # Campo alternativo si order_id no funciona
                }

                # Añadir relación al usuario/partner según corresponda
                if order.partner_id.user_ids:
                    notification_vals['partner_id'] = order.partner_id.id
                if order.user_id:
                    notification_vals['user_id'] = order.user_id.id

                # Crear la notificación
                self.env['user.notification'].create(notification_vals)

                _logger.info("Notificación creada para orden %s", order.name)

            except Exception as e:
                _logger.error("Error al crear notificación para orden %s: %s", order.name, str(e))

    def _create_invoice_paid_notification(self, invoice):
        """Crea notificación cuando la factura está pagada"""
        message = _(
            '<span class="notif-paid">Gracias por su pago, su factura {invoice_name} ha sido pagada.</span>\n'
            '<span class="notif-products"> - Orden: {order_name}</span>'
        ).format(
            invoice_name=invoice.name,
            order_name=self.name
        )

        self.sudo()._create_user_notification(
            message=message,
            notification_type='portal' if self.partner_id.user_ids else 'internal'
        )

    def _create_delivered_notification(self):
        """Crea notificación de pedido terminado"""
        self.ensure_one()
        try:
            product_names = ', '.join(
                line.product_id.name for line in self.order_line if line.product_id
            ) or _("Varios productos")

            message = _(
                '<span class="notif-sale">Su pedido {order_name} ha sido entregado, gracias por elegirnos.</span>\n'
                '<span class="notif-products"> - Productos: {products}</span>'
            ).format(
                order_name=self.name,
                products=product_names
            )

            notification_vals = {
                'message': message,
                'is_read': False,
                'notification_type': 'portal' if self.partner_id.user_ids else 'internal',
                'order_reference': self.name,
                'order_id': self.id,
                'partner_id': self.partner_id.id if self.partner_id.user_ids else False,
                'user_id': self.user_id.id if self.user_id else False,
            }

            rec = self.env['user.notification'].sudo().create(notification_vals)
            _logger.info("✅ Notificación %s creada para SO %s", rec.id, self.name)
            return True

        except Exception:
            _logger.exception("❌ Error al crear notificación de entrega para SO %s", self.name)
            return False


    def _scem_is_module_installed(self, module_name):
        return bool(
            self.env['ir.module.module'].sudo().search_count([
                ('name', '=', module_name),
                ('state', '=', 'installed'),
            ])
        )


    def _scem_get_partner_user_type(self):
        """
        Retorna el user_type del partner usando la prioridad requerida:

        1. Si pyxel_import_backend está instalado, se usa user_type.
        2. Si pyxel_import_backend NO está instalado pero pyxel_cem_website_account sí,
        se usa el user_type disponible por pyxel_cem_website_account.
        3. Si el campo existe aunque no se detecte módulo, se usa como fallback.
        """
        self.ensure_one()

        partner = self.partner_id.sudo()

        import_backend_installed = self._scem_is_module_installed('pyxel_import_backend')
        website_account_installed = self._scem_is_module_installed('pyxel_cem_website_account')

        if import_backend_installed and 'user_type' in partner._fields:
            return partner.user_type, 'pyxel_import_backend'

        if website_account_installed and 'user_type' in partner._fields:
            return partner.user_type, 'pyxel_cem_website_account'

        if 'user_type' in partner._fields:
            return partner.user_type, 'fallback_user_type_field'

        return False, 'user_type_field_not_found'


    def _scem_amount_total_eur(self):
        self.ensure_one()

        eur_currency = self.env.ref('base.EUR', raise_if_not_found=False)
        if not eur_currency:
            return self.amount_total

        order_currency = self.currency_id
        company = self.company_id or self.env.company
        conversion_date = self.date_order.date() if self.date_order else fields.Date.context_today(self)

        if order_currency != eur_currency:
            return order_currency._convert(
                self.amount_total,
                eur_currency,
                company,
                conversion_date,
            )

        return self.amount_total


    def _scem_can_pay_with_odoo_payment(self, website=None):
        """
        Define si deben mostrarse métodos de pago Odoo.

        Reglas:
        - immediate_payment = False:
            no puede pagar por Odoo.
        - immediate_payment = True + user_type = natural + total EUR <= 2500:
            puede pagar por Odoo.
        - immediate_payment = True + user_type = natural + total EUR > 2500:
            no puede pagar por Odoo.
        - immediate_payment = True + user_type != natural:
            no puede pagar por Odoo.
        """
        self.ensure_one()

        website = website.sudo() if website else self.website_id.sudo()

        can_pay = False
        reason = ''

        partner = self.partner_id.sudo()
        user_type, user_type_source = self._scem_get_partner_user_type()
        amount_total_eur = self._scem_amount_total_eur()
        eur_currency = self.env.ref('base.EUR', raise_if_not_found=False)

        if not website:
            reason = 'no_website'

        elif not website.immediate_payment:
            reason = 'immediate_payment_disabled'

        elif not user_type:
            reason = 'user_type_not_available'

        elif user_type != 'natural':
            reason = 'partner_is_not_natural'

        elif not eur_currency:
            reason = 'eur_currency_not_found'

        elif float_compare(
            amount_total_eur,
            2500.0,
            precision_rounding=eur_currency.rounding,
        ) > 0:
            reason = 'natural_amount_greater_than_2500_eur'

        else:
            can_pay = True
            reason = 'natural_amount_less_or_equal_2500_eur'

        _logger.info(
            "[SCEM CAN PAY ODOO] order=%s | partner=%s | user_type=%s | "
            "user_type_source=%s | currency=%s | amount_total=%s | "
            "amount_total_eur=%s | immediate_payment=%s | can_pay=%s | reason=%s",
            self.name,
            partner.display_name,
            user_type,
            user_type_source,
            self.currency_id.name,
            self.amount_total,
            amount_total_eur,
            website.immediate_payment if website else False,
            can_pay,
            reason,
        )

        return can_pay


    def _scem_show_order_request_button(self, website=None):
        """
        Define si debe mostrarse el botón/enlace Cotizar.

        Reglas:
        - immediate_payment = False:
            mostrar Cotizar siempre.
        - immediate_payment = True + user_type = natural + total EUR <= 2500:
            NO mostrar Cotizar.
        - immediate_payment = True + user_type = natural + total EUR > 2500:
            mostrar Cotizar.
        - immediate_payment = True + user_type != natural:
            mostrar Cotizar.
        - Si no se puede determinar user_type:
            mostrar Cotizar, porque no se debe permitir pago directo.
        """
        self.ensure_one()

        website = website.sudo() if website else self.website_id.sudo()

        partner = self.partner_id.sudo()
        user_type, user_type_source = self._scem_get_partner_user_type()
        amount_total_eur = self._scem_amount_total_eur()
        eur_currency = self.env.ref('base.EUR', raise_if_not_found=False)

        immediate_payment = bool(website.immediate_payment) if website else False

        show_button = False
        reason = ''

        if not immediate_payment:
            show_button = True
            reason = 'immediate_payment_disabled'

        elif not user_type:
            show_button = True
            reason = 'user_type_not_available'

        elif user_type == 'natural':
            if eur_currency and float_compare(
                amount_total_eur,
                2500.0,
                precision_rounding=eur_currency.rounding,
            ) > 0:
                show_button = True
                reason = 'natural_amount_greater_than_2500'
            else:
                show_button = False
                reason = 'natural_amount_less_or_equal_2500'

        else:
            show_button = True
            reason = 'not_natural'

        _logger.info(
            "[SCEM COTIZAR BUTTON] order=%s | partner=%s | user_type=%s | "
            "user_type_source=%s | currency=%s | amount_total=%s | "
            "amount_total_eur=%s | immediate_payment=%s | show_button=%s | reason=%s",
            self.name,
            partner.display_name,
            user_type,
            user_type_source,
            self.currency_id.name,
            self.amount_total,
            amount_total_eur,
            immediate_payment,
            show_button,
            reason,
        )

        return show_button


    def _scem_should_show_payment_limit_modal(self, website=None):
        """
        Muestra el modal solo cuando:
        - immediate_payment = True
        - user_type = natural
        - total EUR > 2500
        """
        self.ensure_one()

        website = website.sudo() if website else self.website_id.sudo()

        partner = self.partner_id.sudo()
        user_type, user_type_source = self._scem_get_partner_user_type()

        eur_currency = self.env.ref('base.EUR', raise_if_not_found=False)
        amount_total_eur = self._scem_amount_total_eur()

        immediate_payment = bool(website.immediate_payment) if website else False

        show_modal = False

        if (
            immediate_payment
            and user_type == 'natural'
            and eur_currency
            and float_compare(
                amount_total_eur,
                2500.0,
                precision_rounding=eur_currency.rounding,
            ) > 0
        ):
            show_modal = True

        _logger.info(
            "[SCEM PAYMENT LIMIT MODAL] order=%s | partner=%s | user_type=%s | "
            "user_type_source=%s | immediate_payment=%s | amount_total=%s | "
            "currency=%s | amount_total_eur=%s | show_modal=%s",
            self.name,
            partner.display_name,
            user_type,
            user_type_source,
            immediate_payment,
            self.amount_total,
            self.currency_id.name,
            amount_total_eur,
            show_modal,
        )

        return show_modal