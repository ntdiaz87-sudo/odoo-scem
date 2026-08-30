# -*- coding: utf-8 -*-
{
    'name': "Pyxel Trade Core",
    'summary': "Datos comerciales B2B del eje China → Cuba: proveedores, "
               "puertos, MOQ, incoterms y compatibilidad eléctrica",
    'author': "Pyxel Solutions",
    'website': "http://www.pyxelsolutions.com",
    'category': 'Sales',
    'version': '19.0.1.0.0',
    'license': 'LGPL-3',

    # 'account' aporta el modelo account.incoterms; 'product' el catálogo.
    'depends': ['base', 'product', 'account'],

    'data': [
        'security/ir.model.access.csv',
    ],

    'installable': True,
    'application': False,
}
