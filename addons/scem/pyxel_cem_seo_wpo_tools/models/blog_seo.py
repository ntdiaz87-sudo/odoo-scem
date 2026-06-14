# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class BlogPostSeo(models.Model):
    _inherit = 'blog.post'

    seo_custom_title = fields.Char(
        string='Título SEO personalizado',
        size=70,
        help='Etiqueta de título personalizada para la entrada del blog (recomendado: 50-60 caracteres)'
    )
    seo_h1_text = fields.Char(string='H1 Tag Text', help='Main heading for blog post')
    seo_focus_keyword = fields.Char(string='Palabra clave principal', help='Palabra clave principal para la que desea optimizar esta entrada')

    @api.constrains('website_meta_description')
    def _check_blog_meta_description(self):
        for record in self:
            if record.website_meta_description and len(record.website_meta_description) > 160:
                raise ValidationError(_('La meta descripción no puede exceder los 160 caracteres'))

    def _get_seo_title(self):
        self.ensure_one()
        if self.seo_custom_title:
            return self.seo_custom_title

        website_name = self.env['website'].get_current_website().name
        title = self.name

        if self.blog_id.name:
            title += f' | {self.blog_id.name}'
        title += f' | {website_name}'

        return title[:65]