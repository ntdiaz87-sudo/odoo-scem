# -*- coding: utf-8 -*-
{
    'name': 'Pyxel Tropipay Link Payment',
    'category': 'Accounting/Payment Acquirers',
    'version': '17.0',
    'description': """Tropipay Payment Gateway V2""",
    'Summary': """Tropipay Payment Gateway V2""",
    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",
    'maintainer': 'Pyxel Solutions',
    'depends': ['payment', 'sale'],
    'data': [
        'security/ir.model.access.csv',

        'data/payment_method_data.xml',
        'data/payment_provider_data.xml',
        'data/sale_email_template_data.xml',

        'views/payment_template.xml',
        'wizards/pay_tpp_link_wizard_views.xml',
        'views/sale_order_views.xml',
        'views/res_config_settings_views.xml',

    ],
    'post_init_hook': 'post_init_hook',
    'uninstall_hook': 'uninstall_hook',
    'images': ['static/description/tropipaylogo.png'],
    'license': 'LGPL-3',
    'installable': True,
    'application': True,
    'auto_install': False,
}
