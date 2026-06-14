# -*- coding: utf-8 -*-
{
    'name': "Pyxel CEM Price Management",

    'summary': "",

    'description': """
    """,

    'author': "Pyxel Solutions",
    'contributors': [
        'Romelia Yania Maristany Hastie <romeliamaristany00@gmail.com>',
    ],
    'website': "http://www.pyxelsolutions.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Website/ECommerce Wholesaler',
    'version': '17.0',

    'depends': [
        'pyxel_cem_sale',
    ],

    'data': [
       "views/product_views.xml",
    ],

 
    'installable': True,
    'auto_install': False,
    'application': False,
}
