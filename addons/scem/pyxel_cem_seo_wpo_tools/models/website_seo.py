# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import logging
import re

_logger = logging.getLogger(__name__)


class WebsiteSeoConfig(models.Model):
    _inherit = 'website'

    seo_enable_sitemap = fields.Boolean(
        string='Generar mapa del sitio',
        default=True,
        help='Genera y sirve automáticamente el archivo sitemap.xml'
    )
    seo_sitemap_priority = fields.Selection([
        ('0.1', '0.1'), ('0.2', '0.2'), ('0.3', '0.3'),
        ('0.4', '0.4'), ('0.5', '0.5'), ('0.6', '0.6'),
        ('0.7', '0.7'), ('0.8', '0.8'), ('0.9', '0.9'), ('1.0', '1.0'),
    ], string='Prioridad predeterminada del mapa del sitio', default='0.5')
    seo_sitemap_changefreq = fields.Selection([
        ('always', 'Always'), ('hourly', 'Hourly'), ('daily', 'Daily'),
        ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly'), ('never', 'Never'),
    ], string='Frecuencia de cambio predeterminada', default='weekly')
    seo_last_sitemap_generation = fields.Datetime(string='Última generación del mapa del sitio')
    seo_custom_robots = fields.Text(
        string='Reglas personalizadas de robots.txt',
        help='Agregar reglas personalizadas al archivo robots.txt',
        default="""User-agent: *
Allow: /$
Allow: /shop$
Allow: /shop/product/
Allow: /shop/category/
Allow: /blog/
Allow: /page/

Disallow: /web/
Disallow: /website/
Disallow: /web/dataset/
Disallow: /web/action/
Disallow: /web/session/
Disallow: /web/login/
Disallow: /mail/

Disallow: /*?*
Disallow: /*page=
Disallow: /*limit=
Disallow: /*sort=

Crawl-delay: 1"""
    )

    def _generate_sitemap(self):
        """Method called by cron to regenerate sitemap"""
        for website in self:
            website.write({'seo_last_sitemap_generation': fields.Datetime.now()})
            _logger.info(
                f"Se actualizó la marca de tiempo de generación del mapa del sitio "
                f"para el sitio web {website.name}"
            )


class WebsitePageSeo(models.Model):
    _inherit = 'website.page'

    seo_meta_description = fields.Char(
        string='Meta descripción',
        size=160,
        help='Meta descripción SEO (recomendado: 50-160 caracteres)'
    )
    seo_custom_title = fields.Char(
        string='Título SEO personalizado',
        size=70,
        help='Etiqueta de título personalizada para SEO (recomendado: 50-60 caracteres)'
    )
    seo_h1_text = fields.Char(
        string='Texto de la etiqueta H1',
        help='Texto del encabezado principal de la página'
    )
    seo_no_index = fields.Boolean(
        string='Sin indexación',
        help='Agregar meta etiqueta sin indexación'
    )
    seo_no_follow = fields.Boolean(
        string='Sin seguimiento',
        help='Agregar meta etiqueta sin seguimiento'
    )
    seo_canonical_url = fields.Char(
        string='URL canónica',
        help='Especificar la URL canónica para evitar contenido duplicado'
    )
    seo_focus_keyword = fields.Char(
        string='Palabra clave principal',
        help='Palabra clave principal de esta página'
    )

    @api.constrains('seo_meta_description')
    def _check_meta_description_length(self):
        for record in self:
            if record.seo_meta_description:
                if len(record.seo_meta_description) > 160:
                    raise ValidationError(
                        _('La meta descripción no puede exceder los 160 caracteres')
                    )
                elif len(record.seo_meta_description) < 50:
                    _logger.warning(
                        f'La meta descripción de la página {record.url} '
                        f'es demasiado corta ({len(record.seo_meta_description)} caracteres)'
                    )

    def _get_seo_meta_description(self):
        """
        Devuelve la meta description para esta página.
        Prioridad:
          1. Campo seo_meta_description (manual)
          2. Primeros 150 chars del arch de la vista vinculada (auto)
          3. Cadena vacía
        """
        self.ensure_one()

        if self.seo_meta_description:
            return self.seo_meta_description

        # FIX: website.page no tiene campo 'content'.
        # El HTML está en self.view_id.arch (el arch del ir.ui.view vinculado).
        try:
            arch = self.view_id.arch if self.view_id else ''
            if arch:
                text = re.sub(r'<[^>]+>', ' ', arch)
                text = ' '.join(text.split())
                if text:
                    return text[:150] + ('...' if len(text) > 150 else '')
        except Exception:
            pass

        return ''