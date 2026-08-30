# -*- coding: utf-8 -*-
{
    'name': "Pyxel Trade Marketplace",
    'summary': "Portada pública del marketplace B2B China → Cuba",
    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",
    'category': 'Website',
    'version': '19.0.1.0.0',
    'license': 'LGPL-3',

    'depends': [
        'website',
        'website_sale',
        'pyxel_trade_core',
    ],

    'data': [
        'security/ir.model.access.csv',
        'views/home_templates.xml',
        'data/market_signal_data.xml',
    ],

    'assets': {
        'web.assets_frontend': [
            'pyxel_trade_marketplace/static/src/scss/marketplace.scss',
            'pyxel_trade_marketplace/static/src/js/marketplace.js',
        ],
    },

    'installable': True,
    'application': True,
}
