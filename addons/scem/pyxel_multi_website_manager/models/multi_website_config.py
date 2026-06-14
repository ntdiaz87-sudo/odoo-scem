from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError


class MultiWebsiteConfig(models.Model):
    _name = 'multi.website.config'
    _description = 'Configuración Multi Sitio'
    _rec_name = 'website_id'
    _order = 'website_id'

    # Relación con website
    website_id = fields.Many2one(
        'website',
        string='Sitio Web',
        required=True,
        ondelete='cascade',
        index=True
    )

    # Añadir estos campos para mejorar la relación
    website_name = fields.Char(
        string='Nombre del Sitio',
        related='website_id.name',
        store=True,
        readonly=True
    )

    website_domain = fields.Char(
        string='Dominio',
        related='website_id.domain',
        store=True,
        readonly=True
    )

    # Configuraciones específicas por sitio
    custom_title = fields.Char(
        string='Título Personalizado',
        help="Título específico para este sitio web"
    )

    custom_favicon = fields.Binary(
        string='Favicon Personalizado',
        help="Favicon específico para este sitio web",
        attachment=True
    )

    custom_css = fields.Text(
        string='CSS Personalizado',
        help="CSS adicional específico para este sitio web"
    )

    custom_js = fields.Text(
        string='JavaScript Personalizado',
        help="JavaScript adicional específico para este sitio web"
    )

    # Configuraciones de negocio
    company_name = fields.Char(
        string='Nombre de Empresa',
        help="Nombre de empresa específico para este sitio web"
    )

    contact_email = fields.Char(
        string='Email de Contacto',
        help="Email de contacto específico para este sitio web"
    )

    contact_phone = fields.Char(
        string='Teléfono de Contacto',
        help="Teléfono específico para este sitio web"
    )

    # Configuraciones avanzadas
    google_analytics_key = fields.Char(
        string='Clave Google Analytics',
        help="Clave específica de Google Analytics para este sitio web"
    )

    facebook_pixel_id = fields.Char(
        string='ID Facebook Pixel',
        help="ID específico de Facebook Pixel para este sitio web"
    )

    social_media_ids = fields.One2many(
        'website.social.media',
        'config_id',
        string='Redes Sociales'
    )

    # Campos computados
    has_custom_config = fields.Boolean(
        string='Tiene Configuración Personalizada',
        compute='_compute_has_custom_config',
        store=True
    )

    # Campo para el badge en la vista tree
    config_status = fields.Selection(
        [('configurado', 'Configurado'),
         ('parcial', 'Parcial'),
         ('sin_configurar', 'Sin Configurar')],
        string='Estado',
        compute='_compute_config_status',
        store=True
    )

    @api.depends('custom_title', 'custom_css', 'custom_js', 'company_name',
                 'contact_email', 'contact_phone', 'google_analytics_key',
                 'facebook_pixel_id', 'social_media_ids.is_active')
    def _compute_has_custom_config(self):
        for config in self:
            config.has_custom_config = any([
                config.custom_title,
                config.custom_css,
                config.custom_js,
                config.company_name,
                config.contact_email,
                config.contact_phone,
                config.google_analytics_key,
                config.facebook_pixel_id,
                config.social_media_ids.filtered(lambda r: r.is_active)
            ])

    @api.depends('custom_title', 'custom_css', 'custom_js', 'company_name',
                 'contact_email', 'contact_phone', 'google_analytics_key',
                 'facebook_pixel_id', 'social_media_ids.is_active')
    def _compute_config_status(self):
        """Calcula el estado para mostrar en el badge"""
        for config in self:
            # Contar configuraciones activas
            config_count = sum([
                1 if config.custom_title else 0,
                1 if config.custom_css else 0,
                1 if config.custom_js else 0,
                1 if config.company_name else 0,
                1 if config.contact_email else 0,
                1 if config.contact_phone else 0,
                1 if config.google_analytics_key else 0,
                1 if config.facebook_pixel_id else 0,
                1 if config.social_media_ids.filtered(lambda r: r.is_active) else 0
            ])

            if config_count >= 3:  # Si tiene 3 o más configuraciones
                config.config_status = 'configurado'
            elif config_count >= 1:  # Si tiene al menos 1 pero menos de 3
                config.config_status = 'parcial'
            else:  # Sin configuraciones
                config.config_status = 'sin_configurar'

    # Restricciones
    @api.constrains('website_id')
    def _check_unique_website(self):
        for config in self:
            existing = self.search([
                ('website_id', '=', config.website_id.id),
                ('id', '!=', config.id)
            ])
            if existing:
                raise ValidationError(_(
                    'Ya existe una configuración para el sitio web %s. '
                    'Cada sitio web solo puede tener una configuración.'
                ) % config.website_id.name)

    # Métodos de acción
    def action_open_website(self):
        """Abre el sitio web asociado"""
        self.ensure_one()
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        website_url = f"{base_url}"
        return {
            'type': 'ir.actions.act_url',
            'url': website_url,
            'target': 'new',
        }

    def action_apply_configuration(self):
        """Aplica la configuración al sitio web"""
        self.ensure_one()

        try:
            # Invalidar caché para forzar recálculo
            self.env['website'].search([]).invalidate_model(['multi_website_config_ids'])

            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Configuración Aplicada'),
                    'message': _('La configuración ha sido aplicada al sitio web %s.') % self.website_id.name,
                    'type': 'success',
                    'sticky': False,
                }
            }
        except Exception as e:
            raise UserError(_('Error al aplicar configuración: %s') % str(e))

    def copy(self, default=None):
        """Evita duplicar configuraciones para el mismo sitio web"""
        default = dict(default or {})
        if 'website_id' not in default:
            raise UserError(_('No se puede duplicar una configuración de sitio web. '
                              'Cree una nueva configuración para otro sitio web.'))
        return super().copy(default)

    @api.model
    def create(self, vals):
        """Crea configuración asegurando unicidad"""
        if 'website_id' in vals:
            existing = self.search([('website_id', '=', vals['website_id'])])
            if existing:
                raise UserError(_('Ya existe una configuración para este sitio web.'))
        return super().create(vals)


class WebsiteSocialMedia(models.Model):
    _name = 'website.social.media'
    _description = 'Redes Sociales por Sitio Web'
    _order = 'sequence, id'

    config_id = fields.Many2one(
        'multi.website.config',
        string='Configuración',
        ondelete='cascade',
        required=True
    )

    sequence = fields.Integer(
        string='Secuencia',
        default=10,
        help="Define el orden de aparición"
    )

    platform = fields.Selection([
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter'),
        ('instagram', 'Instagram'),
        ('linkedin', 'LinkedIn'),
        ('youtube', 'YouTube'),
        ('tiktok', 'TikTok'),
        ('whatsapp', 'WhatsApp'),
        ('telegram', 'Telegram'),
    ], string='Plataforma', required=True)

    url = fields.Char(
        string='URL',
        required=True,
        help="URL completa de la red social"
    )

    is_active = fields.Boolean(
        string='Activo',
        default=True,
        help="Mostrar esta red social en el sitio web"
    )

    icon_class = fields.Char(
        string='Clase del Icono',
        compute='_compute_icon_class',
        store=True
    )

    @api.depends('platform')
    def _compute_icon_class(self):
        """Calcula la clase CSS del icono según la plataforma"""
        icon_map = {
            'facebook': 'fa-facebook-f',
            'twitter': 'fa-twitter',
            'instagram': 'fa-instagram',
            'linkedin': 'fa-linkedin-in',
            'youtube': 'fa-youtube',
            'tiktok': 'fa-tiktok',
            'whatsapp': 'fa-whatsapp',
            'telegram': 'fa-telegram',
        }
        for social in self:
            social.icon_class = icon_map.get(social.platform, 'fa-share-alt')

    @api.constrains('url')
    def _check_url_format(self):
        """Valida el formato de la URL"""
        for social in self:
            if social.url and not social.url.startswith(('http://', 'https://')):
                raise ValidationError(_(
                    'La URL debe comenzar con http:// o https://'
                ))

    _sql_constraints = [
        ('unique_platform_per_config',
         'UNIQUE(config_id, platform)',
         'Cada plataforma solo puede aparecer una vez por configuración.'),
    ]