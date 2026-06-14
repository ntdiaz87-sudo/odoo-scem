# -*- coding: utf-8 -*-
{
    'name': 'Pyxel Sales Managers',
    'version': '17.0.1.0.0',
    'category': 'Sales/Sales',
    'summary': 'Gestión completa de gestores de ventas con funcionalidades extendidas',
    'description': """
        Módulo para la gestión de gestores de ventas
        =============================================
        
        Este módulo proporciona:
        * Gestión de gestores de ventas asociados a contactos
        * Configuración de gestores en ajustes
        * Integración con ventas y facturación
        * Reportes y análisis de gestores
        * Historial de actividades por gestor
    """,
    'author': 'Pyxel <Annobel Maceo Castellanos>',
    'website': 'https://www.odoo.pyxelsolution.com',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'contacts',
        'sale_management',
        'account',
        'crm',
        'sale',
        'pyxel_cem_sale',

    ],
    'data': [
        # Security
        'security/sales_manager_security.xml',
        'security/ir.model.access.csv',
        
        # Data
        'data/sales_manager_data.xml',
        
        # Views
        'views/sales_manager_views.xml',
        'views/res_partner_views.xml',
        'views/sale_order_views.xml',
        'views/account_move_views.xml',
        'views/res_config_settings_views.xml',
        'views/product_template_views.xml',

        # Wizards
        'wizards/sales_manager_reconciliation_wizard.xml',
        'wizards/sales_manager_unmark_wizard.xml',

        # Templates
        'templates/sales_manager_reconciliation_report_template.xml',
        
        # Menus
        'views/menu_views.xml',
    ],
    'demo': [
        'demo/sales_manager_demo.xml',
    ],
    'images': ['static/description/icon.png'],
    'installable': True,
    'application': True,
    'auto_install': False,
}
