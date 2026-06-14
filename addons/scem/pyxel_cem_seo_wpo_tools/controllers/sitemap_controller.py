# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from datetime import datetime
import logging

_logger = logging.getLogger(__name__)


class SeoController(http.Controller):

    @http.route('/sitemap.xml', type='http', auth="public", website=True)
    def sitemap_xml(self):
        """Generate dynamic sitemap.xml"""
        website = request.website

        if not website.seo_enable_sitemap:
            return request.not_found()

        base_url = website.get_base_url()
        sitemap_urls = []

        # ── Website pages ──────────────────────────────────────────────────
        pages = request.env['website.page'].sudo().search([
            ('is_published', '=', True),
            ('website_id', '=', website.id),
        ])
        for page in pages:
            if not page.seo_no_index:
                sitemap_urls.append({
                    'loc': f"{base_url}{page.url}",
                    'lastmod': page.write_date or page.create_date or datetime.now(),
                    'changefreq': website.seo_sitemap_changefreq,
                    'priority': website.seo_sitemap_priority,
                })

        # ── Products ───────────────────────────────────────────────────────
        products = request.env['product.template'].sudo().search([
            ('website_published', '=', True),
            ('sale_ok', '=', True),
        ])
        for product in products:
            priority = '0.7'
            if product.qty_available <= 0:
                priority = '0.4'
            elif hasattr(product, 'sales_count') and product.sales_count and product.sales_count > 100:
                priority = '0.8'

            slug = getattr(product, 'website_slug', None) or f"/shop/product/{product.id}"
            loc = f"{base_url}{slug}" if slug.startswith('/') else f"{base_url}/{slug}"

            sitemap_urls.append({
                'loc': loc,
                'lastmod': product.write_date or product.create_date or datetime.now(),
                'changefreq': 'weekly',
                'priority': priority,
            })

        # ── Categories ─────────────────────────────────────────────────────
        categories = request.env['product.public.category'].sudo().search([])
        published_cat_ids = request.env['product.template'].sudo().search([
            ('website_published', '=', True),
        ]).mapped('public_categ_ids').ids

        for category in categories:
            if category.id not in published_cat_ids:
                continue
            slug = getattr(category, 'website_slug', None) or f"/shop/category/{category.id}"
            loc = f"{base_url}{slug}" if slug.startswith('/') else f"{base_url}/{slug}"
            sitemap_urls.append({
                'loc': loc,
                'lastmod': category.write_date or category.create_date or datetime.now(),
                'changefreq': 'weekly',
                'priority': '0.6',
            })

        # ── Blog posts ─────────────────────────────────────────────────────
        blog_posts = request.env['blog.post'].sudo().search([
            ('website_published', '=', True),
            ('active', '=', True),
        ], order='create_date desc')

        for idx, post in enumerate(blog_posts):
            priority = '0.6'
            if idx < 10:
                priority = '0.8'
            elif idx < 30:
                priority = '0.7'

            slug = getattr(post, 'website_slug', None) or f"/blog/{post.blog_id.id}/post/{post.id}"
            loc = f"{base_url}{slug}" if slug.startswith('/') else f"{base_url}/{slug}"
            sitemap_urls.append({
                'loc': loc,
                'lastmod': post.write_date or post.create_date or datetime.now(),
                'changefreq': 'weekly',
                'priority': priority,
            })

        # ── Blogs (índice) ─────────────────────────────────────────────────
        # CORREGIDO: blog.blog usa 'is_published' o 'active', NO 'website_published'
        blogs = request.env['blog.blog'].sudo().search([
            ('active', '=', True),  # 'active' es el campo correcto para blog.blog
        ])
        for blog in blogs:
            sitemap_urls.append({
                'loc': f"{base_url}/blog/{blog.id}",
                'lastmod': blog.write_date or blog.create_date or datetime.now(),
                'changefreq': 'weekly',
                'priority': '0.5',
            })

        # ── Generar XML ────────────────────────────────────────────────────
        xml_lines = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ]

        for url_data in sitemap_urls:
            xml_lines.append('  <url>')
            xml_lines.append(f'    <loc>{url_data["loc"]}</loc>')

            lastmod = url_data.get('lastmod')
            if lastmod:
                if isinstance(lastmod, datetime):
                    lastmod = lastmod.strftime('%Y-%m-%d')
                elif hasattr(lastmod, 'strftime'):
                    lastmod = lastmod.strftime('%Y-%m-%d')
                xml_lines.append(f'    <lastmod>{lastmod}</lastmod>')

            if url_data.get('changefreq'):
                xml_lines.append(f'    <changefreq>{url_data["changefreq"]}</changefreq>')

            if url_data.get('priority'):
                xml_lines.append(f'    <priority>{url_data["priority"]}</priority>')

            xml_lines.append('  </url>')

        xml_lines.append('</urlset>')
        xml_content = '\n'.join(xml_lines)

        try:
            website.sudo().write({'seo_last_sitemap_generation': datetime.now()})
        except Exception as e:
            _logger.warning(f"Could not update sitemap generation time: {e}")

        return request.make_response(
            xml_content,
            headers=[
                ('Content-Type', 'application/xml; charset=utf-8'),
                ('Cache-Control', 'public, max-age=3600'),
            ]
        )

    @http.route('/robots.txt', type='http', auth="public", website=True)
    def robots_txt(self):
        """Serve dynamic robots.txt"""
        website = request.website
        base_url = website.get_base_url()

        default_robots = (
            "User-agent: *\n"
            "Allow: /$\n"
            "Allow: /shop$\n"
            "Allow: /shop/product/\n"
            "Allow: /shop/category/\n"
            "Allow: /blog/\n"
            "Allow: /page/\n"
            "\n"
            "Disallow: /web/\n"
            "Disallow: /website/\n"
            "Disallow: /web/dataset/\n"
            "Disallow: /web/action/\n"
            "Disallow: /web/session/\n"
            "Disallow: /web/login/\n"
            "Disallow: /mail/\n"
            "\n"
            "Disallow: /*?*\n"
            "Disallow: /*page=\n"
            "Disallow: /*limit=\n"
            "Disallow: /*sort=\n"
            "\n"
            "Crawl-delay: 1\n"
            f"\nSitemap: {base_url}/sitemap.xml\n"
        )

        robots_content = website.seo_custom_robots or default_robots

        if 'Sitemap:' not in robots_content:
            robots_content += f"\nSitemap: {base_url}/sitemap.xml\n"

        return request.make_response(
            robots_content,
            headers=[
                ('Content-Type', 'text/plain; charset=utf-8'),
                ('Cache-Control', 'public, max-age=3600'),
            ]
        )
