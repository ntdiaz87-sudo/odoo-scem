from odoo import models, fields, api


class WebsiteExtended(models.Model):
    _inherit = 'website'

    # Campo para acceder a la configuración multi-sitio
    multi_website_config_ids = fields.One2many(
        'multi.website.config',
        'website_id',
        string='Configuraciones Multi Sitio',
        help="Configuraciones específicas para este sitio web"
    )

    # Campo computado para obtener la configuración principal
    multi_website_config_id = fields.Many2one(
        'multi.website.config',
        string='Configuración Principal',
        compute='_compute_multi_website_config',
        store=False,
        help="Configuración principal del sitio web"
    )

    @api.depends('multi_website_config_ids')
    def _compute_multi_website_config(self):
        """Obtiene la configuración principal del sitio web"""
        for website in self:
            if website.multi_website_config_ids:
                website.multi_website_config_id = website.multi_website_config_ids[0].id
            else:
                website.multi_website_config_id = False

    # Método para obtener o crear configuración
    def get_or_create_multi_website_config(self):
        """Obtiene o crea configuración para el sitio web actual"""
        self.ensure_one()

        if not self.multi_website_config_ids:
            # Crear configuración por defecto
            config = self.env['multi.website.config'].create({
                'website_id': self.id,
                'company_name': self.company_id.name,
                'contact_email': self.company_id.email,
            })
            return config

        return self.multi_website_config_ids[0]

    # Método para aplicar configuración específica
    def apply_custom_config(self):
        """Retorna configuración personalizada del sitio web"""
        config = self.get_or_create_multi_website_config()

        # Obtener configuraciones específicas
        config_values = {
            'website_name': self.name,
            'custom_title': config.custom_title or self.name,
            'custom_css': config.custom_css or '',
            'custom_js': config.custom_js or '',
            'company_name': config.company_name or self.company_id.name,
            'contact_email': config.contact_email or self.company_id.email,
            'contact_phone': config.contact_phone or self.company_id.phone,
            'google_analytics_key': config.google_analytics_key or '',
            'facebook_pixel_id': config.facebook_pixel_id or '',
            'social_media': config.social_media_ids.filtered(lambda r: r.is_active),
            'has_custom_favicon': bool(config.custom_favicon),
            'custom_favicon': config.custom_favicon,
        }

        return config_values

    # Método para inyectar recursos en el website
    def inject_custom_assets(self):
        """Inyecta CSS y JS personalizados en el sitio web"""
        config = self.get_or_create_multi_website_config()

        assets = {
            'css': config.custom_css or '',
            'js': config.custom_js or '',
        }

        return assets