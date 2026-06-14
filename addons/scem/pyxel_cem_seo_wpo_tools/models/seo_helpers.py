# -*- coding: utf-8 -*-
from odoo import models, api
import re


class SeoHelpers(models.AbstractModel):
    _name = 'seo.helpers'
    _description = 'SEO Helper Methods'

    @api.model
    def get_seo_meta_description(self, record):
        """Get meta description for a record"""
        if not record:
            return ''

        model_name = record._name
        if model_name == 'product.template' and hasattr(record, '_get_seo_meta_description'):
            return record._get_seo_meta_description()
        elif model_name == 'blog.post' and record.website_meta_description:
            return record.website_meta_description
        elif model_name == 'website.page' and hasattr(record, '_get_seo_meta_description'):
            return record._get_seo_meta_description()

        return ''

    @api.model
    def get_seo_title(self, record):
        """Get SEO title for a record"""
        if not record:
            return ''

        model_name = record._name
        if model_name == 'product.template' and hasattr(record, '_get_seo_title'):
            return record._get_seo_title()
        elif model_name == 'blog.post' and hasattr(record, '_get_seo_title'):
            return record._get_seo_title()
        elif model_name == 'website.page' and record.seo_custom_title:
            return record.seo_custom_title
        elif hasattr(record, 'name'):
            return record.name

        return self.env['website'].get_current_website().name

    @api.model
    def generate_meta_description_from_text(self, text, max_length=160):
        """Generate meta description from text content"""
        if not text:
            return ''

        text = re.sub(r'<[^>]+>', ' ', text)
        text = ' '.join(text.split())
        if len(text) > max_length:
            text = text[:max_length - 3] + '...'

        return text