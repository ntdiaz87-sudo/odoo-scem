# -*- coding: utf-8 -*-
{
    'name': 'Pyxel CEM Contact CRM Synchronization',
    'category': 'CRM',
    'version': '17.0',
    'description': """Pyxel CEM Contact CRM Synchronization""",
    'Summary': """Pyxel CEM Contact CRM Synchronization""",
    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",
    'maintainer': 'Pyxel Solutions',
    'depends': ['base', 'crm'],
    'data': [
        'security/ir.model.access.csv',
        'views/res_config_settings_views.xml',

    ],
    'license': 'LGPL-3',
    'installable': True,
    'application': True,
    'auto_install': False,
}
