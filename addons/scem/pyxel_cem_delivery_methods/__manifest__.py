# -*- coding: utf-8 -*-
{
    'name': "CEM Delivery Methods",

    'summary': "Establishes the locations available for delivery and their prices",

    'description': """
        - The products displayed on the website depend on the location selected.
        - Set new delivery types (flash, express, by_seller)
    """,
    "category": "Website",
    "version": "1.0.0",
    "author": "Pyxel Solutions",
    'contributors': [
        'Romelia Yania Maristany Hastie <romeliamaristany00@gmail.com>',
    ],
    "license": "LGPL-3",
    "website": "https://pyxelsolution.com",
    
    'depends': [
        'l10n_cu_address',
        'stock', 
        'website',
        'website_sale',
        'base_address_extended',
        'delivery',
        'pyxel_cem_website_sale',
    ],

    'data': [
        "security/ir.model.access.csv",
        "views/stock_warehouse.xml",
        "views/warehouse_delivery_view.xml",
        "views/delivery_modal.xml",
        "views/address_template.xml",
        "data/delivery_data.xml",
        "views/website_pay_page.xml",
    ],
    'assets': {
        'web.assets_frontend': [
            'pyxel_cem_delivery_methods/static/src/scss/delivery_style.scss',
            'pyxel_cem_delivery_methods/static/src/js/address.js',
            'pyxel_cem_delivery_methods/static/src/js/delivery_modal_button.js',
            'pyxel_cem_delivery_methods/static/src/js/phone_prefix.js',
            'pyxel_cem_delivery_methods/static/src/js/checkout_delivery_toggle.js',
        ],
    },
}

