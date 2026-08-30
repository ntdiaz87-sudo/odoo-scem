# -*- coding: utf-8 -*-
{
    'name': "Pyxel Trade Mixed Container",
    'summary': "Contenedor mixto: consolidar productos de varios proveedores "
               "en una misma operación de importación",
    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",
    'category': 'Inventory',
    'version': '19.0.1.0.0',
    'license': 'LGPL-3',
    'depends': ['pyxel_trade_core'],
    'data': [
        'security/ir.model.access.csv',
        'views/container_views.xml',
    ],
    'installable': True,
    'application': False,
}
