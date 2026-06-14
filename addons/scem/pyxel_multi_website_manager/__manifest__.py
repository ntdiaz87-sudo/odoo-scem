# -*- coding: utf-8 -*-
{
    'name': "Pyxel Multi-Site Management",

    'summary': "Gestión de múltiples sitios web desde un solo backend",

    'description': """
    Módulo para gestionar múltiples sitios web en una sola base de datos Odoo.
    Permite configurar y administrar diferentes sitios web con dominios,
    temas y configuraciones específicas..
    """,

    'author': "My Company",
    'website': "https://www.yourcompany.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['website', 'web'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/multi_website_views.xml',
        'views/menu_views.xml',
        'views/templates.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'pyxel_multi_website_manager/static/src/scss/website_selector.scss',
        ],
    },
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}

