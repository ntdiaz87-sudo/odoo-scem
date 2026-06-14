# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import re
import logging

_logger = logging.getLogger(__name__)


class ProductTemplateSeo(models.Model):
    _inherit = 'product.template'

    seo_meta_description = fields.Char(
        string='Meta descripción',
        size=160,
        help='Meta descripción SEO (recomendado: 50-160 caracteres)'
    )
    seo_custom_title = fields.Char(
        string='Título SEO personalizado',
        size=70,
        help='Etiqueta de título personalizada para la entrada del blog (recomendado: 50-60 caracteres)'
    )
    seo_h1_text = fields.Char(string='Etiqueta H1 personalizada', help='Reemplaza la etiqueta H1 predeterminada en la página del producto.')
    seo_focus_keyword = fields.Char(string='Palabra clave principal', help='Palabra clave principal para la que deseas optimizar este producto')
    seo_canonical_url = fields.Char(string='URL canónica', help='Especifica la URL canónica para evitar contenido duplicado')

    @api.constrains('seo_meta_description')
    def _check_meta_description_length(self):
        for record in self:
            if record.seo_meta_description:
                length = len(record.seo_meta_description)
                if length > 160:
                    raise ValidationError(_('La meta descripción no puede exceder los 160 caracteres'))
                elif length < 50 and length > 0:
                    _logger.warning(f'La meta descripción del producto {record.name} es demasiado corta (caracteres {length})')

    def _suggest_meta_description(self):
        """Auto-generate meta description from product data"""
        self.ensure_one()
        if self.seo_meta_description:
            return self.seo_meta_description

        description_parts = [self.name]

        if self.description_sale:
            clean_desc = re.sub(r'<[^>]+>', ' ', self.description_sale)
            clean_desc = ' '.join(clean_desc.split())
            if clean_desc:
                description_parts.append(clean_desc[:100])

        if self.public_categ_ids:
            categories = ', '.join(self.public_categ_ids[:3].mapped('name'))
            if categories:
                description_parts.append(f'Available in {categories}')

        description = ' - '.join(description_parts)
        if len(description) > 155:
            description = description[:152] + '...'

        return description

    def _get_seo_meta_description(self):
        self.ensure_one()
        return self._suggest_meta_description()

    def _get_seo_title(self):
        self.ensure_one()
        if self.seo_custom_title:
            return self.seo_custom_title[:65]

        website = self.env['website'].get_current_website()
        website_name = website.name if website else 'Shop'

        title_parts = [self.name]
        if self.public_categ_ids:
            title_parts.append(self.public_categ_ids[0].name)
        title_parts.append(website_name)

        title = ' | '.join(title_parts)
        return title[:65]