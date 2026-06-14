# -*- coding: utf-8 -*-
{
    'name': "Pyxel CEM Sales",

    'summary': "",

    'description': """
    """,

    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Sales/ECommerce Wholesaler',
    'version': '17.0',

    'depends': [
        'sale_management',
        'sale_stock',
        'crm',
        'purchase',
        'account_edi_ubl_cii'],

    'data': [
        'data/payment_provider_data.xml',
        'data/payment_method_data.xml',
        'data/sale_email_template_data.xml',
        'data/invoice_email_template_data.xml',
        'data/delivery_email_template_data.xml',
        'data/sale_delivered_email_template_data.xml',
        'data/sale_canceled_email_template_data.xml',
        'data/email_template.xml',

        'security/ir.model.access.csv',
        'security/stock_security.xml',

        'views/res_partner_views.xml',
        'views/product_views.xml',
        'views/product_mark_views.xml',
        'views/product_attribute_value_views.xml',
        'views/sale_order_views.xml',
        'wizard/mail_compose_message_views.xml',
        'views/account_move_views.xml',
        'report/report_invoice.xml',
        'report/sale_order_report_templates.xml',
        'views/res_company_views.xml',
        'views/crm_stage_views.xml',
        'views/res_config_settings_views.xml',
        # 'views/report_templates.xml',
    ],

    'assets': {
        'web.assets_backend': [
            'pyxel_cem_sale/static/src/**/*.xml',
            'pyxel_cem_sale/static/src/core/web/chatter_patch.xml',
        ],
    },

    # only loaded in demonstration mode
    'demo': [
    ],

    'installable': True,
    'auto_install': False,
}
