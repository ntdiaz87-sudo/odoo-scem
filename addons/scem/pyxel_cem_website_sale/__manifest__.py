# -*- coding: utf-8 -*-
{
    'name': "Pyxel CEM Website Sales",

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
        'website',
        'website_sale',
        'pyxel_cem_sale',
        'theme_scita',
        'bus',
        'sale',
        # 'account',
        # 'payment',
    ],

    'data': [
        'views/product_detail_page.xml',
        'views/custom_confirm_button.xml',
        'data/mail_process_order.xml',
        'data/mail_comercial.xml',
        'data/disable_theme_pages.xml',
        'views/website_views.xml',
        'views/shop_page.xml',
        'views/shop_cart.xml',
        'views/crm_stage_views.xml',
        'views/order_request.xml',
        # 'views/my_account_inherit.xml',
        'views/tracking_order_view.xml',
        'views/my_profile.xml',
        'views/notification_bell.xml',
        'views/alternative_products.xml',
        'views/sale_views.xml',
        'views/res_partner_views.xml',
        # 'data/mail_templates_contract.xml',
    ],

    'assets': {
        'web.assets_frontend': [
            'pyxel_cem_website_sale/static/src/js/dynamic_cities.js',
            'pyxel_cem_website_sale/static/src/css/shop_layout.scss',
            'pyxel_cem_website_sale/static/src/css/product_detail.scss',
            'pyxel_cem_website_sale/static/src/js/product_card_counter.js',
            'pyxel_cem_website_sale/static/src/js/pricelist_change.js',
            'pyxel_cem_website_sale/static/src/js/product_quantity_validator.js',
            'pyxel_cem_website_sale/static/src/js/shop_cart.js',
            'pyxel_cem_website_sale/static/src/js/lead_validation.js',
            'pyxel_cem_website_sale/static/src/js/portal_notification_bell.js',
            'pyxel_cem_website_sale/static/src/css/notification.scss',
            'pyxel_cem_website_sale/static/src/css/order_request.scss',
            'pyxel_cem_website_sale/static/src/css/my_account.scss',
            'pyxel_cem_website_sale/static/src/css/tracking_order.scss',
            'pyxel_cem_website_sale/static/src/css/shop_cart.scss',
            'pyxel_cem_website_sale/static/src/css/my_profile.scss',
            'pyxel_cem_website_sale/static/src/css/alternative.scss',
            'pyxel_cem_website_sale/static/src/js/order_request_payment.js',
            'pyxel_cem_website_sale/static/src/css/order_request_payment.scss',
            'pyxel_cem_website_sale/static/src/css/rating.scss',
            'pyxel_cem_website_sale/static/src/js/toggle_password.js',
            'pyxel_cem_website_sale/static/src/js/kepp_password.js',
            'pyxel_cem_website_sale/static/src/js/price_range_slider_native.js',
            'pyxel_cem_website_sale/static/src/js/divep_inbond_modal.js',
            'pyxel_cem_website_sale/static/src/js/divep_cart_type_validator.js',
            'pyxel_cem_website_sale/static/src/js/progress_bar.js',
            'pyxel_cem_website_sale/static/src/css/progress_bar.scss',

            # 'pyxel_cem_website_sale/static/src/js/contract_upload.js',
            # 'pyxel_cem_website_sale/static/src/css/contract_upload.scss',

        ],
        # 'web.assets_backend': [
        #    'pyxel_cem_website_sale/static/src/js/portal_notification_bell.js',
        #    'pyxel_cem_website_sale/static/src/css/notification.scss',
        #  ],
    },

    'installable': True,
    'auto_install': False,
    'application': False,
}
