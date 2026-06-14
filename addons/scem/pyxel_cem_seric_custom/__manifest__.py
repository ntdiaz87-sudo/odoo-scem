# -*- coding: utf-8 -*-
{
    'name': "Customized SERIC Wholesale Store",

    'summary': "",

    'description': """
    """,

    'author': "Pyxel Solutions",
    'contributors': [
        'Romelia Yania Maristany Hastie <romeliamaristany00@gmail.com>',
    ],
    'website': "http://www.pyxelsolutions.com",

    'category': 'Website/ECommerce',
    'version': '17.0',

    'depends': ['pyxel_cem_website_sale'],

    'data': [
        'views/home_page_config.xml',
        'views/home_template.xml',
        # 'views/footer.xml',
        # 'views/about_us.xml',
        'views/navbar.xml',
        'views/shop_page.xml',
        
    ],

    'assets': {
        'web.assets_frontend': [
            'pyxel_cem_seric_custom/static/src/css/home_page.scss',
            'pyxel_cem_seric_custom/static/src/js/home_some_products.js',
            'pyxel_cem_seric_custom/static/src/js/home_counter_qty.js',
            'pyxel_cem_seric_custom/static/src/js/home_reviews_carrusel.js',
            'pyxel_cem_seric_custom/static/src/js/home_categories.js',
            'pyxel_cem_seric_custom/static/src/js/home_banner.js',
            # 'pyxel_cem_seric_custom/static/src/css/footer.scss',
            # 'pyxel_cem_seric_custom/static/src/css/about_us.scss',
            # 'pyxel_cem_seric_custom/static/src/js/about_us.js',
            'pyxel_cem_seric_custom/static/src/css/nav.scss',
            'pyxel_cem_seric_custom/static/src/css/custom.scss',
            
            
        ]
    },

    'installable': True,
    'auto_install': False,
}
