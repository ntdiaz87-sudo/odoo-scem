# -*- coding: utf-8 -*-
{
    'name': "Pyxel CEM Seller Payment",

    'summary': "Sales Report",
    'description':
        """Generate sales reports and reconciliations""",

    'author': "Pyxel Solutions",
    'contributors': [
        'Romelia Yania Maristany Hastie <romeliamaristany00@gmail.com>',
    ],
    'website': "http://www.pyxelsolutions.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Administration',
    'version': '17.0',

    'depends': [
        'base',
        'account',  
        'pyxel_cem_sale',
    ],

    'data': [
        'data/configurations.xml',
        'security/ir.model.access.csv',
        'views/product_template.xml',
        'views/res_partner_views.xml',
        'views/company_pct_views.xml',
        'views/account_move_views.xml',
        'views/pyxel_ptc_views.xml',
        'views/provider_report_views.xml',
        'views/menus.xml',
        'views/conciliation_report_views.xml',
        'reports/company_pct_report.xml',
        'reports/pyxel_pct_report.xml',
        'reports/provider_report_pdf.xml',
        'reports/conciliation_report_template.xml',
    ],

    'installable': True,
    'auto_install': False,
}
