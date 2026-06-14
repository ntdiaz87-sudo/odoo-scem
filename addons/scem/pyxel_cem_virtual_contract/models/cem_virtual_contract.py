# Part of Odoo. See LICENSE file for full copyright and licensing details.
import logging
import re
import base64
import os
from dateutil.relativedelta import relativedelta
from mimetypes import guess_extension

from odoo import api, models, fields, _
from odoo.exceptions import ValidationError, RedirectWarning, UserError

_logger = logging.getLogger(__name__)

states = [('pending', 'Pending'), ('sent', 'Sent'), ('accepted', 'Accepted'), ('confirmed', 'Confirmed'),
          ('expired', 'Expired'), ('canceled', 'Canceled')]

# TODO implementar validación que no se puede eliminar un contrato virtual despúes que fue cancelado

class CEMVirtualContract(models.Model):
    _name = 'cem.virtual.contract'
    _description = 'CEM Virtual Contract'
    _rec_name = 'code'
    _order = 'confirm_date desc'

    code = fields.Char(string='Code', required=True, copy=False,
                       default=lambda self: _('New') if self.env.company.cem_vc_code_gen_type == 'auto' else '')
    partner_id = fields.Many2one('res.partner', string="Partner", required=True,
                                 domain="[('is_hireable', '=', True)]")
    company_id = fields.Many2one('res.company', 'Company', default=lambda self: self.env.company, index=True,
                                 required=True)
    state = fields.Selection(selection=states, string="State", required=True, default='pending')
    upload_date = fields.Date(string='Upload Date')
    confirm_date = fields.Date(string='Confirmation Date', index=True)
    expiry_date = fields.Date(string='Expiry Date', compute='_compute_expiry_date', store=True)
    validity_perc = fields.Float(string='% Validity', compute='_compute_expiry_date', store=True)
    contract_file = fields.Binary(string="File", attachment=True, copy=False, help="Formatos permitidos: PDF, JPG, JPEG, PNG, GIF, BMP, TIFF. Tamaño máximo: 10MB")
    contract_filename = fields.Char(string="File Name")

    code_gen_type = fields.Selection(related="company_id.cem_vc_code_gen_type")

    _sql_constraints = [
        ('code_uniq', 'unique(code)', "Code must be unique!."),
    ]

    @api.depends('confirm_date', 'state')
    def _compute_expiry_date(self):
        for rec in self:
            if rec.state == 'confirmed' and rec.confirm_date:
                rec.expiry_date = rec.confirm_date + \
                                  relativedelta(months=self.env.company.cem_virtual_contract_duration)
                rec.validity_perc = 100
            elif rec.state != 'confirmed':
                rec.validity_perc = 0

    def action_approve_contract(self, uploaded_file, filename=None):
        """Approve contract after file upload - VERSIÓN MEJORADA"""
        self.ensure_one()
        if self.state != 'sent':
            raise UserError(_('Only contracts in "Sent" state can be accepted.'))

        # ✅ Asegurar que uploaded_file es string base64 válido
        if isinstance(uploaded_file, bytes):
            uploaded_file = uploaded_file.decode('utf-8')

        # Validar que es base64 válido
        try:
            import base64
            # Intentar decodificar para verificar que es base64 válido
            base64.b64decode(uploaded_file.split(',')[-1] if ',' in uploaded_file else uploaded_file)
        except Exception:
            raise UserError(_('El archivo no está en formato válido.'))

        # Actualizar campos
        update_vals = {
            'contract_file': uploaded_file,
            'upload_date': fields.Date.context_today(self),
            'state': 'accepted'
        }

        # ✅ Guardar el nombre original del archivo si se proporciona
        if filename:
            update_vals['contract_filename'] = filename

        self.write(update_vals)

        # Enviar notificación por email al comercial
        self._send_approval_notification()

        return True

    def _send_approval_notification(self):
        """Send email notification to all commercial users in the system"""
        self.ensure_one()

        try:
            # Buscar TODOS los usuarios del grupo de comerciales
            commercial_users = self.env['res.users'].search([
                ('company_ids', 'in', self.env.company.id),
                ('groups_id', 'in', self.env.ref('pyxel_cem_configuration.group_comerciales').id),
                ('active', '=', True),
                ('email', '!=', False),
            ])

            # commercial_users = self.env['res.users'].search([
            #     ('groups_id', 'in', self.env.ref('sales_team.group_sale_salesman').ids),
            #     ('active', '=', True),
            #     ('email', '!=', False),
            # ])

            # Si no hay comerciales, buscar administradores como fallback
            if not commercial_users:
                _logger.warning("No commercial users found. Notifying administrators.")
                commercial_users = self.env['res.users'].search([
                    ('company_ids', 'in', self.env.ref('base.group_system').ids),
                    ('active', '=', True),
                    ('email', '!=', False),
                ], limit=5)  # Limitar a 5 administradores para no spammear

            # Si aún no hay destinatarios, salir
            if not commercial_users:
                _logger.error("No commercial users or administrators found for notification")
                return

            # Obtener todos los emails únicos de los comerciales
            commercial_emails = list(set(commercial_users.mapped('email')))

            # También incluir al usuario que subió el contrato en CC
            cc_emails = []
            if self.env.user.email and self.env.user.email not in commercial_emails:
                cc_emails.append(self.env.user.email)

            # Incluir email de la empresa si existe y es diferente
            company_email = self.env.company.email
            if company_email and company_email not in commercial_emails and company_email not in cc_emails:
                cc_emails.append(company_email)

            subject = _("Contrato aceptado: %s - %s", self.code, self.partner_id.name)

            # Crear el cuerpo del email
            body = _("""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2C3E50;">Notificación de aprobación del contrato</h2>

                        <p>Hello <strong>Equipo de ventas</strong>,</p>

                        <p>El contrato  <strong>%s</strong> ha sido aprobado por el cliente <strong>%s</strong>.</p>

                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                            <p><strong>Código de contrato:</strong> %s</p>
                            <p><strong>Cliente:</strong> %s</p>
                            <p><strong>Correo electrónico del cliente:</strong> %s</p>
                            <p><strong>Teléfono del cliente:</strong> %s</p>
                            <p><strong>Fecha de envío:</strong> %s</p>
                            <p><strong>Fecha de vencimiento:</strong> %s</p>
                            <p><strong>Estado:</strong> <span style="color: #28a745;">Accepted</span></p>
                        </div>

                        <p>Puedes revisar el contrato en el sistema haciendo clic en el siguiente enlace:</p>

                        <div style="text-align: center; margin: 20px 0;">
                            <a href="%s" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Ver contrato en el sistema
                            </a>
                        </div>

                        <p>Atentamente,<br/>
                        <strong>%s Sistema</strong></p>
                    </div>
                    """) % (
                self.code,
                self.partner_id.name,
                self.code,
                self.partner_id.name,
                self.partner_id.email or 'Not provided',
                self.partner_id.phone or 'Not provided',
                self.upload_date,
                self.expiry_date,
                self.get_contract_url(),
                self.company_id.name
            )

            # Preparar valores para el email
            mail_values = {
                'subject': subject,
                'body_html': body,
                'email_to': ', '.join(commercial_emails),
                'email_cc': ', '.join(cc_emails) if cc_emails else False,
                'email_from': self.env.company.email or self.env.user.email or 'noreply@company.com',
            }

            # Enviar email
            mail = self.env['mail.mail'].sudo().create(mail_values)
            mail.send()

            _logger.info("Contract approval notification sent to %d commercial users: %s",
                         len(commercial_emails), commercial_emails)

        except Exception as e:
            _logger.error("Failed to send contract approval email: %s", str(e))

    def get_contract_url(self):
        """Get URL to access the contract in the backend"""
        self.ensure_one()
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        return f"{base_url}/web#id={self.id}&model=cem.virtual.contract&view_type=form"

    def _get_redirect_action(self, prev_vc_id):
        vc_form_view_id = self.env.ref('pyxel_cem_virtual_contract.cem_virtual_contract_form_view').id
        action_data = {
            'name': _('Active virtual contract'),
            'type': 'ir.actions.act_window',
            'res_model': 'cem.virtual.contract',
            'views': [(vc_form_view_id, 'form')],
            'domain': [('id', '=', prev_vc_id)],
            'res_id': prev_vc_id
        }
        return action_data

    @api.constrains('confirm_date', 'state', 'contract_file')
    def _check_confirm_state(self):
        for rec in self:
            if rec.state == 'confirmed' and (not rec.confirm_date or not rec.contract_file):
                raise ValidationError(_("Must specify Confirmation Date and Contract File."))

    @api.constrains('partner_id', 'state')
    def _check_unique_confirmed_vc_partner(self):
        domain = [('state', 'not in', ['expired', 'canceled']), ('partner_id', 'in', self.partner_id.ids)]
        groupby = ['partner_id']
        records = self._read_group(domain, groupby, having=[('__count', '>', 1)])
        parners_name = []
        for _group_key in records:
            parners_name.append(_group_key[0].name)
        if records:
            raise ValidationError(_(
                "Only can be active a unique virtual contract for these partners: %s.", ', '.join(parners_name)))

    @api.onchange('partner_id', 'state')
    def on_change_partner_state(self):
        for record in self:
            if record.state == 'confirmed' and not record._origin.state != 'accepted':
                raise ValidationError(_("Only can confirm virtual contract from Accepted state."))
            if not record.partner_id or not record.state:
                return
            domain = [('state', 'not in', ['expired', 'canceled']), ('partner_id', '=', record.partner_id.id)]
            prev_vcs = self.search(domain)
            for prev_ in prev_vcs:
                if prev_.id != record.id:
                    warning_msg = _("Only can be active a unique virtual contract for this partner. "
                                    "You can review the existing contract.")
                    action = self._get_redirect_action(prev_.id)
                    raise RedirectWarning(warning_msg, action, _('View active contract'))

    def action_sent(self):
        self.ensure_one()
        if not self.contract_file:
            raise UserError(_('The contract document must be specified.'))

        # Validar formato del archivo antes de enviar
        if self.contract_file:
            # Obtener nombre del archivo desde el attachment
            filename = self.contract_filename or _('contract')
            try:
                self._validate_file_format(self.contract_file, filename)
            except UserError as e:
                raise UserError(_('No se puede enviar el contrato: %s', str(e)))

        mail_temp = self.env.ref('pyxel_cem_virtual_contract.mail_template_vc_send_doc', raise_if_not_found=True)
        domain = [
            ('res_model', '=', self._name),
            ('res_field', '=', 'contract_file'),
            ('res_id', 'in', self.ids),
        ]
        attach_data_id = self.env['ir.attachment'].sudo().search(domain)

        # ✅ OBTENER EL NOMBRE ORIGINAL DEL ARCHIVO
        original_filename = self._get_original_filename()

        if not original_filename:
            # Si no se encuentra nombre original, crear uno por defecto
            original_filename = _('Virtual Contract %s', self.code)
            # Añadir extensión si se puede determinar
            if attach_data_id and attach_data_id.mimetype:
                extension = guess_extension(attach_data_id.mimetype) or '.pdf'
                original_filename = f"{original_filename}{extension}"

        # Limpiar nombre de archivo
        invalid_fname_patt = r"^[ .]|[/<>:\"\\|?*]+|[ .]$"
        filename = re.sub(invalid_fname_patt, "-", original_filename)

        # ✅ GUARDAR EL NOMBRE ORIGINAL EN EL CONTRATO
        self.write({'contract_filename': filename})

        dup_attach_id = attach_data_id.copy(default={'name': filename})
        mail_temp.attachment_ids = [(6, 0, dup_attach_id.ids)]
        mail_temp.sudo().send_mail(self.id, force_send=True, email_layout_xmlid='mail.mail_notification_light')
        self.write({'state': 'sent'})
        # remove attachment from template
        mail_temp.attachment_ids = [(3, dup_attach_id.id)]
        # remove attachment
        dup_attach_id.unlink()

    def _get_original_filename(self):
        """Obtener el nombre original del archivo desde los attachments"""
        self.ensure_one()

        # Buscar el attachment asociado al contrato
        domain = [
            ('res_model', '=', self._name),
            ('res_field', '=', 'contract_file'),
            ('res_id', '=', self.id),
        ]
        attachment = self.env['ir.attachment'].sudo().search(domain, limit=1)

        if attachment and attachment.name:
            return attachment.name

        return None

    def action_accept(self, upload_date, contract_file_content, filename=None):
        """
        Para cambiar el contrato a aceptado por parte del cliente
        :param upload_date: fecha de subida del contrato
        :param contract_file_content: contenido del contrato codificado en base64
        :param filename: nombre original del archivo (opcional)
        """
        self.ensure_one()
        update_vals = {
            'state': 'accepted',
            'upload_date': upload_date,
            'contract_file': contract_file_content
        }

        if filename:
            update_vals['contract_filename'] = filename

        self.write(update_vals)

    def action_confirm(self):
        self.ensure_one()
        if not self.confirm_date or not self.contract_file:
            raise UserError(_('Must specify the confirm_date and contract file.'))
        self.write({'state': 'confirmed'})

    def action_cancel(self):
        """Cancel contract and notify relevant users"""
        previous_state = self.state

        self.write({'state': 'canceled', 'expiry_date': False})

        # Notificaciones solo si el contrato estaba en estado activo
        if previous_state in ['sent', 'accepted', 'confirmed']:
            # 1. Notificación para el cliente (portal/users asociados al partner)
            self._create_cancellation_notification()

            # 2. Notificación interna para el equipo comercial
            # self._create_commercial_team_notification()

        return True

    def _send_mail_to_users_group(self, template, group_id):
        # Send email to salesman
        if template:
            salesmans = self.env['res.users'].search([
                ('company_ids', 'in', self.env.company.id), ('groups_id', 'in', group_id)])
            emails = set(r.email_formatted for r in salesmans if r.email_formatted)
            if emails:
                email_values = {'email_to': ','.join(emails)}
                template.sudo().send_mail(self.id, force_send=True,
                                          email_values=email_values,
                                          email_layout_xmlid='mail.mail_notification_light')

    @api.model
    def _update_vc_validity(self):
        today_ = fields.Date.context_today(self)
        exp_vcs = self.sudo().search([('expiry_date', '<=', today_), ('state', '=', 'confirmed')])
        exp_vcs.write({'state': 'expired', 'validity_perc': 0})
        msg = f">>>>    Virtual contracts expired: {len(exp_vcs)}."
        _logger.info(msg)
        exp_vc_stage = self.env['crm.stage'].sudo().search([('cem_vcontract_expired', '=', True)], limit=1)
        client_mail_temp = self.env.ref('pyxel_cem_virtual_contract.mail_template_client_vc_exp_doc',
                                        raise_if_not_found=True)
        salesm_mail_temp = self.env.ref('pyxel_cem_virtual_contract.mail_template_salem_vc_exp_doc',
                                        raise_if_not_found=True)
        if exp_vc_stage:
            currenct_leads = self.env['crm.lead'].sudo().search([('partner_id', 'in', exp_vcs.partner_id.ids)])
            currenct_leads.write({'stage_id': exp_vc_stage.id})
        salesman = self.env.ref('pyxel_cem_configuration.group_comerciales').id
        for evc in exp_vcs:
            client_mail_temp.sudo().send_mail(evc.id, force_send=True,
                                              email_layout_xmlid='mail.mail_notification_light')
            evc._send_mail_to_users_group(salesm_mail_temp, salesman)

        val_vcs = self.sudo().search([('state', '=', 'confirmed')])
        for rec in val_vcs:
            life_days = (rec.expiry_date - rec.confirm_date).days
            rec.validity_perc = ((rec.expiry_date - today_).days / life_days) * 100 if life_days else 0
        msg = f">>>>    Virtual contracts updated: {len(val_vcs)}."
        _logger.info(msg)

    @api.model
    def _get_view(self, view_id=None, view_type='form', **options):
        read_att_value = "state in ['confirmed', 'expired', 'canceled']"
        def make_fields_readonly(node):
            for child in node.iterchildren():
                if child.tag == 'field':
                    read_att_xml = child.attrib.get('readonly', "")
                    val_att = f"{read_att_xml} or {read_att_value}" if read_att_xml else read_att_value
                    child.set('readonly', val_att)
                else:
                    make_fields_readonly(child)
            return node

        arch, view = super()._get_view(view_id, view_type, **options)
        if view_type == 'form':
            arch = make_fields_readonly(arch)
        return arch, view


    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if self.env.company.cem_vc_code_gen_type == 'auto':
                suffix = self.env['ir.sequence'].next_by_code('cem.virtual.contract') or _("New")
                partner = self.env['res.partner'].browse(vals.get('partner_id'))
                comp_ = self.env.company

                if comp_.cem_vc_code_gen_type == 'auto':
                    if comp_.cem_vc_prefix_code == 'reeup':
                        prefix = partner.reeup
                        msg_field = _('the REEUP code')
                    else:
                        abb = partner.cem_abbreviations
                        prefix = abb and abb[0: min(len(abb), 5)]
                        msg_field = _('the abbreviations')

                    if not prefix:
                        raise ValidationError(_('Must specify %s for %s', msg_field, partner.name))

                    vals['code'] = prefix + suffix

        return super().create(vals_list)

    def write(self, vals):
        allowed_mimetypes = {
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/webp',
        }

        allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.webp'}

        # 🔒 VALIDAR SOLO SI SE ACTUALIZA EL ARCHIVO
        if 'contract_file' in vals and vals.get('contract_file'):
            filename = vals.get('contract_filename') or self.contract_filename

            # 1️⃣ Validar extensión
            if filename:
                ext = '.' + filename.lower().rsplit('.', 1)[-1]
                if ext not in allowed_extensions:
                    raise ValidationError(
                        _("Solo se permiten archivos PDF o imágenes (PNG, JPG, JPEG, WEBP).")
                    )

            # 2️⃣ Validar base64
            try:
                import base64
                base64.b64decode(
                    vals['contract_file'].split(',')[-1]
                    if ',' in vals['contract_file']
                    else vals['contract_file']
                )
            except Exception:
                raise ValidationError(_("El archivo no está en un formato válido."))

            # 3️⃣ Validar mimetype real
            attachment = self.env['ir.attachment'].sudo().create({
                'name': filename or 'temp_contract_file',
                'datas': vals['contract_file'],
                'res_model': self._name,
                'res_id': self.id,
            })

            mimetype = attachment.mimetype
            attachment.unlink()

            if mimetype not in allowed_mimetypes:
                raise ValidationError(
                    _("Formato de archivo no válido. Solo se permiten archivos PDF e imágenes (JPG, JPEG, PNG, GIF, BMP, TIFF).")
                )

        return super().write(vals)

    def _create_cancellation_notification(self):
        """Crear notificación para el cliente cuando el contrato es cancelado"""
        self.ensure_one()

        try:
            # Buscar todos los usuarios asociados al partner (cliente)
            users = self.env['res.users'].search([
                ('partner_id', '=', self.partner_id.id),
                ('active', '=', True)
            ])

            # Si no hay usuarios específicos, crear notificación general para el partner
            if not users:
                self._create_partner_notification()
                return

            # Crear notificación para cada usuario encontrado
            for user in users:
                self._create_user_specific_notification(user)

            _logger.info("Cancellation notifications created for contract %s, partner %s (%d users)",
                         self.code, self.partner_id.name, len(users))

        except Exception as e:
            _logger.error("Error creating cancellation notification for contract %s: %s",
                          self.code, str(e))

    def _create_partner_notification(self):
        """Crear notificación general para el partner (sin usuario específico)"""

        message = _(
            '<span class="notif-order-name">Su contrato virtual %s ha sido cancelado. Si tiene alguna pregunta, póngase en contacto con nuestro equipo comercial.</span>',
            self.code
        )

        notification_vals = {
            'partner_id': self.partner_id.id,
            'message': message,
            'notification_type': 'portal',  # Por defecto para partners
            'is_read': False,
        }

        self.env['user.notification'].sudo().create(notification_vals)
        _logger.info("General partner notification created for contract %s", self.code)

    def _create_user_specific_notification(self, user):
        """Crear notificación específica para un usuario"""
        message = _(
            '<span class="notif-order-name">Su contrato virtual %s ha sido cancelado. Si tiene alguna pregunta, póngase en contacto con nuestro equipo comercial.</span>',
            self.code
        )

        # Determinar el tipo de notificación basado en los grupos del usuario
        notification_type = self._determine_notification_type(user)

        notification_vals = {
            'user_id': user.id,
            'partner_id': self.partner_id.id,
            'message': message,
            'notification_type': notification_type,
            'is_read': False,
        }

        self.env['user.notification'].sudo().create(notification_vals)
        _logger.debug("User-specific notification created for user %s, contract %s",
                      user.name, self.code)

    def _determine_notification_type(self, user):
        """Determinar el tipo de notificación basado en los grupos del usuario"""
        # Verificar si es usuario portal (cliente externo)
        if user.has_group('base.group_portal'):
            return 'portal'

        # Verificar si es usuario interno (pero no administrador del sistema)
        elif user.has_group('base.group_user') and not user.has_group('base.group_system'):
            return 'internal'

        # Para administradores del sistema, usar 'internal' también
        elif user.has_group('base.group_system'):
            return 'internal'

        # Por defecto, usar portal
        return 'portal'

class IrUiMenu(models.Model):
    _inherit = 'ir.ui.menu'

    @api.model
    def _adjust_vc_menu_parent(self):
        """Ajusta dinámicamente la ubicación del menú de Contratos Virtuales"""
        try:
            # Buscar el menú de Virtual Contracts
            vc_menu = self.env.ref(
                'pyxel_cem_virtual_contract.cem_vc',
                raise_if_not_found=False
            )

            if not vc_menu:
                _logger.warning("Menú 'Virtual Contracts' no encontrado")
                return

            # Verificar si el módulo pyxel_import_backend está instalado
            module_installed = self.env['ir.module.module'].sudo().search([
                ('name', '=', 'pyxel_import_backend'),
                ('state', '=', 'installed')
            ], limit=1)


            # Determinar el menú padre según el módulo instalado
            if module_installed:
                # Si está instalado, ponerlo en Contactos
                parent_menu = self.env.ref(
                    'contacts.menu_contacts',
                    raise_if_not_found=False
                )
                new_parent_name = 'Contacts'
            else:
                # Si no está instalado, ponerlo en CRM/Sales
                parent_menu = self.env.ref(
                    'crm.crm_menu_sales',
                    raise_if_not_found=False
                )
                new_parent_name = 'Sales'

            if not parent_menu:
                _logger.error("Menú padre no encontrado")
                return

            # Solo mover si es necesario
            if vc_menu.parent_id.id != parent_menu.id:
                _logger.info(
                    "Moviendo menú 'Virtual Contracts' de '%s' a '%s'",
                    vc_menu.parent_id.complete_name or 'None',
                    parent_menu.complete_name
                )

                # Usar sudo para asegurar permisos
                vc_menu.sudo().write({
                    'parent_id': parent_menu.id,
                    'sequence': 50,  # Ajustar secuencia si es necesario
                })

                _logger.info(
                    "Menú 'Virtual Contracts' movido exitosamente a %s",
                    new_parent_name
                )

        except Exception as e:
            _logger.error("Error ajustando el menú Virtual Contracts: %s", str(e))

