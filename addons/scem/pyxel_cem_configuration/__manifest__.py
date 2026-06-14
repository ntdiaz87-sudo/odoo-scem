# -*- coding: utf-8 -*-
# Part of Pyxel Solutions. See LICENSE file for full copyright and licensing details.

{
    "name": "Pyxel Scem Configurations",
    "summary": """Module for the installation and automatic creation of configurations""",
    "category": "CRM",
    "version": "1.0.0",
    "author": "Pyxel Solutions",
    'contributors': [
        'Lizander Pupo Marín <david.liz961205@gmail.com>',
    ],
    "license": "LGPL-3",
    "website": "https://pyxelsolution.com",
    "description": """""",
    'depends': ['base', 'contacts', 'pyxel_cem_website_sale'],

    "data": [
        "data/categorias.xml",
        "data/atributos.xml",
        "data/scem_config.xml",
        "data/grupos.xml",
    ],
    'post_init_hook': 'post_init_hook',
    "installable": True,
    "auto_install": True,
}
