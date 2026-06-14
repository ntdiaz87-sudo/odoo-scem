# -*- coding: utf-8 -*-
{
    'name': 'Pyxel CEM Import Integración',
    'category': 'Sales/ECommerce Wholesaler',
    'version': '17.0',
    'description': """Pyxel CEM Import Integración""",
    'Summary': """Pyxel CEM Import Integración""",
    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",
    'maintainer': 'Pyxel Solutions',
    'depends': [
        'pyxel_cem_sale',
        'pyxel_import_backend'
    ],
    'data': [
        'views/sale_order_views.xml',
        'views/account_move_views.xml',
        'views/res_partner_views.xml',
    ],
    'license': 'LGPL-3',
    'installable': True,
    'application': True,
    'auto_install': True,
}
