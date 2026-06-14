# -*- coding: utf-8 -*-
{
    'name': 'Pyxel CEM Virtul Contract',
    'category': 'Sales/ECommerce Wholesaler',
    'version': '17.0',
    'description': """Pyxel CEM Virtual Contract""",
    'Summary': """Pyxel CEM Virtual Contract""",
    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",
    'maintainer': 'Pyxel Solutions',
    # TODO ver la dependencia a 'pyxel_cem_website_account' , 'pyxel_cem_configuration'
    'depends': ['base', 'crm', 'contacts', 'pyxel_cem_website_account', 'pyxel_cem_configuration'],
    'data': [
        'security/ir.model.access.csv',
        'data/ir_sequence_data.xml',
        'data/ir_cron_data.xml',
        'data/vc_manag_email_template_data.xml',
        'data/vc_send_email_template_data.xml',
        'data/vc_exp_client_email_template_data.xml',
        'data/vc_exp_salesm_email_template_data.xml',

        'views/cem_virtual_contract.xml',
        'views/res_config_settings_views.xml',
        'views/res_partner_views.xml',
        'views/crm_stage_views.xml'
    ],
    'post_init_hook': 'post_init_hook_vc_menu',
    'license': 'LGPL-3',
    'installable': True,
    'application': True,
    'auto_install': False,
}
