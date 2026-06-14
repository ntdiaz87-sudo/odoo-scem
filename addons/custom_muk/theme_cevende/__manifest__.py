# -*- coding: utf-8 -*-
{
    'name': 'CEVENDE Theme',
    'description': 'Tema ecommerce premium para CEVENDE (B2C minorista + B2B mayorista). '
                   'Electrodomésticos y energía solar. Inspirado en Tesla Energy, Apple, Home Depot Pro.',
    'category': 'Theme/eCommerce',
    'version': '17.0.1.0.0',
    'author': 'CEVENDE',
    'license': 'LGPL-3',
    'depends': [
        'website',
        'website_sale',
    ],
    'data': [
        # Vistas y plantillas
        'views/layout.xml',
        # Snippets (cada bloque reutilizable)
        'snippets/hero_split.xml',
        'snippets/solutions_grid.xml',
        'snippets/solar_calculator.xml',
        'snippets/featured_products.xml',
        'snippets/wholesale_order.xml',
        'snippets/success_cases.xml',
        'snippets/brands.xml',
        'snippets/newsletter.xml',
        'snippets/footer.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'theme_cevende/static/src/scss/_variables.scss',
            'theme_cevende/static/src/scss/theme.scss',
            'theme_cevende/static/src/js/solar_calculator.js',
        ],
    },
    'images': [
        'static/description/cover.png',
    ],
    'application': False,
}
