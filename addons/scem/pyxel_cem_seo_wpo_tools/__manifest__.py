# -*- coding: utf-8 -*-
{
    'name': 'Pyxel CEM - SEO & WPO Tools',
    'version': '17.0.1.0.0',
    'summary': 'Herramientas de optimización SEO y rendimiento web (WPO) para la tienda online',
    'description': """
        Módulo de optimización SEO y Web Performance Optimization (WPO).
        ================================================================
        - Carga diferida de imágenes (lazy loading) en listado y detalle de producto.
        - Aplicación del atributo loading="lazy" en imágenes QWeb heredadas
          de pyxel_cem_website_sale para mejorar el tiempo de carga de página
          (LCP, FID, CLS - Core Web Vitals).
        - Optimización de etiquetas H1, title y meta description
        - Validación automática de SEO on-page
    """,
    'author': 'Pyxel',
    'category': 'Website/eCommerce',
    'depends': [
        'pyxel_cem_website_sale',
        'website_blog',
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/seo_wpo_products_item_views.xml',
        'views/seo_wpo_product_detail_views.xml',
        'data/seo_cron_data.xml',
        'data/robots_templates.xml',
        'views/seo_widget_templates.xml',
        'views/seo_website_views.xml',
        'views/seo_product_views.xml',
        'views/seo_blog_views.xml',
        'views/seo_website_layout_extension.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'pyxel_cem_seo_wpo_tools/static/src/js/seo_validation.js',
        ],
        'web.assets_frontend': [
            'pyxel_cem_seo_wpo_tools/static/src/js/seo_frontend.js',
        ],
    },
    'installable': True,
    'auto_install': False,
    'application': False,
    'license': 'LGPL-3',
}
