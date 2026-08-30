# -*- coding: utf-8 -*-
{
    'name': "Pyxel Trade Supplier Gateway",
    'summary': "Puerta del proveedor chino: dossier trilingüe y captación de fabricantes",
    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",
    'category': 'Website',
    'version': '19.0.1.0.0',
    'license': 'LGPL-3',

    'depends': [
        'website',
        'crm',
        'pyxel_trade_core',
    ],

    'data': [
        'data/crm_tag.xml',
        'views/supplier_templates.xml',
    ],

    'assets': {
        'web.assets_frontend': [
            'pyxel_trade_supplier/static/src/scss/supplier.scss',
        ],
    },

    'installable': True,
    'application': False,
}
