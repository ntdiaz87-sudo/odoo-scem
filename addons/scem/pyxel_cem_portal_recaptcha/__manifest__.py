# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.
{
    'name': 'Portal reCAPTCHA for CEM',
    'version': '1.0',
    'author': 'Pyxel Solutions',
    'contributors': [
        'Adnielys Abday Rojas Tadeo <adnielys.rojas89@gmail.com>',
    ],
    'license': 'LGPL-3',
    'website': "https://pyxelsolution.com",
    'category': 'Website',
    'summary': 'Integración de reCAPTCHA en el portal',
    'description': """
        Este módulo integra Google reCAPTCHA en el portal de Odoo para mejorar la seguridad.
    """,
    'depends': ['base', 
                'web', 
                'auth_signup', 
                'google_recaptcha', 
            ],
    'data': [
        # 'views/assets.xml',
        'data/recaptcha_assets.xml',
        'views/login_recaptcha_template.xml',
        # 'views/auth_signup_template.xml'
        # 'views/res_config_settings_view.xml',

    ],
    'assets': {
        'web.assets_frontend': [
            'pyxel_cem_portal_recaptcha/static/src/js/recaptcha_loader.js',
            'pyxel_cem_portal_recaptcha/static/src/scss/recaptcha.scss',
        ],
    },
    'installable': True,
    'auto_install': False,
}


