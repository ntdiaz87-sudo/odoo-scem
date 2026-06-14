# -*- coding: utf-8 -*-
{
    'name': "Pyxel CEM Sale Format",

    'summary': "",

    'description': """
    """,

    'author': "Pyxel Solutions",
    'contributors': [
        'Romelia Yania Maristany Hastie <romeliamaristany00@gmail.com>',
    ],

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Website/ECommerce',
    'version': '17.0',

    'depends': [
        'website_sale',    
        'pyxel_cem_website_sale',
    ],

    'data': [
        "views/website_product_details.xml",
        "views/product_attribute_views.xml",
        "views/website_shop_cart.xml",
        "views/sale_order_views.xml",
    ],

    'assets': {
        'web.assets_frontend': [
            'pyxel_cem_sale_format/static/src/js/uom_reference.js',
            'pyxel_cem_sale_format/static/src/js/product_price_packaging.js',
            'pyxel_cem_sale_format/static/src/js/stock_uom_details.js',
            'pyxel_cem_sale_format/static/src/js/stock_uom_cart.js',
            'pyxel_cem_sale_format/static/src/css/styles.scss',
            # 'pyxel_cem_sale_format/static/src/js/cart_uom_reference.js',
        ],
    },

    'installable': True,
    'auto_install': False,
    'application': False,
}
