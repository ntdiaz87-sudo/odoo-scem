from odoo import http
from odoo.http import request, content_disposition
import json
import logging

_logger = logging.getLogger(__name__)


class MultiWebsiteController(http.Controller):

    @http.route('/multi-website/config', type='json', auth='user', website=True)
    def get_website_config(self, **kwargs):
        """Obtiene configuración específica del sitio web actual"""
        website = request.website
        config = website.apply_custom_config()
        return config

    @http.route('/multi-website/api/config', type='json', auth='public', website=True)
    def get_public_config(self, **kwargs):
        """API pública para obtener configuración del sitio web"""
        website = request.website
        config = website.apply_custom_config()

        # Filtrar información sensible para acceso público
        public_config = {
            'website_name': config.get('website_name', ''),
            'company_name': config.get('company_name', ''),
            'contact_email': config.get('contact_email', ''),
            'contact_phone': config.get('contact_phone', ''),
            'social_media': [
                {
                    'platform': sm.platform,
                    'url': sm.url,
                    'icon_class': sm.icon_class,
                }
                for sm in config.get('social_media', [])
            ],
            'has_custom_favicon': config.get('has_custom_favicon', False),
        }

        return public_config

    @http.route('/multi-website/favicon', type='http', auth='public', website=True)
    def get_custom_favicon(self, **kwargs):
        """Devuelve el favicon personalizado del sitio web"""
        website = request.website
        config_values = website.apply_custom_config()

        if config_values.get('has_custom_favicon'):
            favicon = config_values.get('custom_favicon')
            return request.make_response(
                favicon,
                headers=[
                    ('Content-Type', 'image/x-icon'),
                    ('Content-Disposition', content_disposition('favicon.ico'))
                ]
            )

        # Si no hay favicon personalizado, redirigir al favicon por defecto
        return request.redirect('/web/static/img/favicon.ico')

    @http.route(['/multi-website/site-specific',
                 '/multi-website/site-specific/<int:website_id>'],
                type='http', auth='public', website=True)
    def site_specific_content(self, website_id=None, **kwargs):
        """Contenido específico por sitio web"""
        current_website = request.website

        # Si se especifica un website_id, usar ese
        target_website = current_website
        if website_id:
            target_website = request.env['website'].browse(website_id)
            if not target_website.exists():
                target_website = current_website

        # Determinar qué template mostrar según el sitio web
        template_map = {
            1: 'pyxel_multi_website_manager.template_site_1',
            2: 'pyxel_multi_website_manager.template_site_2',
        }

        template = template_map.get(
            target_website.id,
            'pyxel_multi_website_manager.default_template'
        )

        # Pasar configuración específica al contexto
        values = {
            'website_config': target_website.apply_custom_config(),
            'current_website': target_website,
            'target_website': target_website,
        }

        return request.render(template, values)

    @http.route('/multi-website/assets/css', type='http', auth='public', website=True)
    def get_custom_css(self, **kwargs):
        """Devuelve CSS personalizado del sitio web"""
        website = request.website
        assets = website.inject_custom_assets()

        return request.make_response(
            assets.get('css', ''),
            headers=[
                ('Content-Type', 'text/css'),
                ('Cache-Control', 'public, max-age=86400'),
            ]
        )

    @http.route('/multi-website/assets/js', type='http', auth='public', website=True)
    def get_custom_js(self, **kwargs):
        """Devuelve JavaScript personalizado del sitio web"""
        website = request.website
        assets = website.inject_custom_assets()

        return request.make_response(
            assets.get('js', ''),
            headers=[
                ('Content-Type', 'application/javascript'),
                ('Cache-Control', 'public, max-age=86400'),
            ]
        )