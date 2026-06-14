# -*- coding: utf-8 -*-
{
    'name': "Pyxel CEM Website Account",

    'summary': "",

    'description': """
    """,

    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Website/ECommerce Wholesaler',
    'version': '17.0',

    'depends': ['account', 'auth_signup', 'crm', 'account_edi_ubl_cii'],

    'data': [
        'views/register_template.xml',
        'views/res_user.xml',
        'views/res_partner_views.xml',
        'views/portal_my_details_fields.xml',

        # 'data/states_data.xml',
        # 'data/cities_data.xml',

        'data/new_user_template_data.xml',

        # 'security/ir.model.access.csv',
    ],

    'assets': {
        'web.assets_frontend': [
            'pyxel_cem_website_account/static/src/css/registration.css',
            'pyxel_cem_website_account/static/src/js/registration.js',
        ]
    },

    'post_init_hook': 'pre_init_hook',
    'post_init_hook': 'post_init_hook',

    'installable': True,
    'auto_install': False,
}
