# -*- coding: utf-8 -*-
{
    'name': "pyxel_cem_bank_provider",

    'summary': """
        Short (1 phrase/line) summary of the module's purpose, used as
        subtitle on modules listing or apps.openerp.com""",

    'description': """
        Long description of module's purpose
    """,

    'author': "My Company",
    'website': "https://www.yourcompany.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/16.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': [
        'pyxel_cem_sale',
        'pyxel_cem_website_account',
    ],

    # always loaded
    'data': [
        'views/res_bank.xml',
        'views/res_partner_views.xml',
        'views/sale_order_views.xml',
        'views/account_move_views.xml',
        'report/report_invoice.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
}
