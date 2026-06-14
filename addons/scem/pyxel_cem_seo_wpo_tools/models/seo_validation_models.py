# -*- coding: utf-8 -*-
from odoo import models, api, _
import re
from bs4 import BeautifulSoup


class SeoValidationWizard(models.TransientModel):
    _name = 'seo.validation.wizard'
    _description = 'SEO Validation Tool'

    @api.model
    def validate_h1_tags(self):
        """Validate that each published page has exactly one H1 tag."""
        issues = []

        pages = self.env['website.page'].search([('is_published', '=', True)])
        for page in pages:
            if page.content:
                soup = BeautifulSoup(page.content, 'html.parser')
                h1_count = len(soup.find_all('h1'))

                if h1_count == 0:
                    issues.append({
                        'type': 'error',
                        'object': f'Page: {page.url}',
                        'message': 'No H1 tag found on page',
                    })
                elif h1_count > 1:
                    issues.append({
                        'type': 'error',
                        'object': f'Page: {page.url}',
                        'message': f'Multiple H1 tags found ({h1_count} tags)',
                    })

        return issues

    @api.model
    def validate_meta_descriptions(self):
        """Validate meta descriptions length across products and pages."""
        issues = []

        # ── Products ──────────────────────────────────────────────────────
        products = self.env['product.template'].search([('website_published', '=', True)])
        for product in products:
            # FIXED: llamada correcta al método de instancia
            desc = product.seo_meta_description or product._suggest_meta_description()
            length = len(desc) if desc else 0

            if length == 0:
                issues.append({
                    'type': 'warning',
                    'object': f'Product: {product.name}',
                    'message': 'No meta description found',
                })
            elif length < 50:
                issues.append({
                    'type': 'warning',
                    'object': f'Product: {product.name}',
                    'message': f'Meta description too short ({length}/50 chars)',
                })
            elif length > 160:
                issues.append({
                    'type': 'error',
                    'object': f'Product: {product.name}',
                    'message': f'Meta description too long ({length}/160 chars)',
                })

        # ── Website pages ─────────────────────────────────────────────────
        pages = self.env['website.page'].search([('is_published', '=', True)])
        for page in pages:
            desc = page._get_seo_meta_description()
            length = len(desc) if desc else 0

            if length == 0:
                issues.append({
                    'type': 'warning',
                    'object': f'Page: {page.url}',
                    'message': 'No meta description found',
                })
            elif length < 50:
                issues.append({
                    'type': 'warning',
                    'object': f'Page: {page.url}',
                    'message': f'Meta description too short ({length}/50 chars)',
                })
            elif length > 160:
                issues.append({
                    'type': 'error',
                    'object': f'Page: {page.url}',
                    'message': f'Meta description too long ({length}/160 chars)',
                })

        # ── Blog posts ────────────────────────────────────────────────────
        posts = self.env['blog.post'].search([
            ('website_published', '=', True),
            ('active', '=', True),
        ])
        for post in posts:
            desc = post.website_meta_description or ''
            length = len(desc)

            if length == 0:
                issues.append({
                    'type': 'warning',
                    'object': f'Blog post: {post.name}',
                    'message': 'No meta description found',
                })
            elif length < 50:
                issues.append({
                    'type': 'warning',
                    'object': f'Blog post: {post.name}',
                    'message': f'Meta description too short ({length}/50 chars)',
                })
            elif length > 160:
                issues.append({
                    'type': 'error',
                    'object': f'Blog post: {post.name}',
                    'message': f'Meta description too long ({length}/160 chars)',
                })

        return issues

    @api.model
    def run_full_seo_audit(self):
        """Run all validations and return consolidated report."""
        issues = []
        issues.extend(self.validate_h1_tags())
        issues.extend(self.validate_meta_descriptions())

        errors = [i for i in issues if i['type'] == 'error']
        warnings = [i for i in issues if i['type'] == 'warning']

        return {
            'total': len(issues),
            'errors': len(errors),
            'warnings': len(warnings),
            'issues': issues,
        }