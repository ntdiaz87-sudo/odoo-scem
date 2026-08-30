# -*- coding: utf-8 -*-

import re

from odoo import http
from odoo.http import request
from odoo.tools.mail import plaintext2html

from ..supplier_content import (
    CONTENIDO, IDIOMAS, IDIOMA_POR_DEFECTO,
    TIPOS_PROVEEDOR, CLAVES_CATEGORIA, ETIQUETAS_TIPO,
)

CORREO_VALIDO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class PyxelSupplierGateway(http.Controller):
    """Puerta del proveedor chino.

    Es la otra mitad del producto: el marketplace mira al comprador cubano
    y esto mira al fabricante. Van en inglés y chino porque ese es el
    idioma de quien tiene que leerlo, y el idioma es un segmento de la URL
    para no depender de que zh_CN esté instalado en la base de datos.
    """

    def _idioma(self, codigo):
        return codigo if codigo in CONTENIDO else IDIOMA_POR_DEFECTO

    def _valores(self, idioma, extra=None):
        valores = {
            'c': CONTENIDO[idioma],
            'idioma': idioma,
            'idiomas': IDIOMAS,
            'tipos': [{'value': v, 'label': ETIQUETAS_TIPO[idioma][v]}
                      for v in TIPOS_PROVEEDOR],
            'categorias_form': [
                {'value': clave, 'label': etiqueta}
                for clave, etiqueta, _ in CONTENIDO[idioma]['categories']['items']
            ],
            'enviado': False,
            'error': None,
            'post': {},
        }
        valores.update(extra or {})
        return valores

    @http.route('/suppliers', type='http', auth='public', website=True,
                sitemap=True)
    def portada(self, **kw):
        return request.render('pyxel_trade_supplier.gateway',
                              self._valores(IDIOMA_POR_DEFECTO))

    @http.route('/suppliers/<string:idioma>', type='http', auth='public',
                website=True, sitemap=True)
    def portada_idioma(self, idioma, **kw):
        if idioma not in CONTENIDO:
            return request.redirect('/suppliers')
        return request.render('pyxel_trade_supplier.gateway',
                              self._valores(idioma, {'enviado': kw.get('ok') == '1'}))

    # ── Formulario ──────────────────────────────────────────────────
    def _descripcion(self, post, idioma):
        """Arma la descripción de la oportunidad escapando lo que escribió
        el visitante: el campo description de crm.lead es HTML."""
        etiquetas = ETIQUETAS_TIPO[idioma]
        categorias = [c for c in post.getlist('categories')
                      if c in CLAVES_CATEGORIA] \
            if hasattr(post, 'getlist') else []
        lineas = [
            "Solicitud desde la puerta del proveedor (/suppliers).",
            "Idioma del formulario: %s" % idioma,
            "Tipo: %s" % etiquetas.get(post.get('supplier_type'), '—'),
            "Categorías: %s" % (', '.join(categorias) or '—'),
            "Sitio web: %s" % (post.get('website') or '—'),
            "",
            post.get('message') or '',
        ]
        return plaintext2html("\n".join(lineas))

    @http.route('/suppliers/<string:idioma>/contact', type='http',
                auth='public', website=True, methods=['POST'], csrf=True,
                sitemap=False)
    def contacto(self, idioma, **post):
        idioma = self._idioma(idioma)
        textos = CONTENIDO[idioma]['form']

        # Trampa para robots: es un campo oculto que una persona nunca
        # rellena. Se responde como si todo hubiera ido bien para no
        # enseñarle al robot que fue detectado.
        if post.get('website_confirm'):
            return request.redirect('/suppliers/%s?ok=1' % idioma)

        empresa = (post.get('company') or '').strip()
        contacto = (post.get('contact') or '').strip()
        correo = (post.get('email') or '').strip()

        if not (empresa and contacto and correo):
            return request.render('pyxel_trade_supplier.gateway',
                                  self._valores(idioma, {
                                      'error': textos['required'],
                                      'post': post,
                                  }))
        if not CORREO_VALIDO.match(correo):
            return request.render('pyxel_trade_supplier.gateway',
                                  self._valores(idioma, {
                                      'error': textos['bad_email'],
                                      'post': post,
                                  }))

        formulario = request.httprequest.form
        categorias = [c for c in formulario.getlist('categories')
                      if c in CLAVES_CATEGORIA]
        tipo = post.get('supplier_type')

        etiqueta = request.env.ref(
            'pyxel_trade_supplier.tag_supplier_china', raise_if_not_found=False)

        request.env['crm.lead'].sudo().create({
            'name': "Proveedor China — %s" % empresa,
            # Se crea como oportunidad y no como iniciativa: si el módulo de
            # CRM no tiene activadas las iniciativas, un lead no aparecería
            # en el embudo y la solicitud se perdería de vista.
            'type': 'opportunity',
            'partner_name': empresa,
            'contact_name': contacto,
            'email_from': correo,
            'phone': (post.get('phone') or '').strip(),
            'website': (post.get('website') or '').strip(),
            'description': self._descripcion(formulario, idioma),
            'tag_ids': [(4, etiqueta.id)] if etiqueta else False,
            'pyxel_supplier_type': tipo if tipo in TIPOS_PROVEEDOR else False,
            'pyxel_categories': ', '.join(categorias) or False,
            'pyxel_form_lang': idioma,
        })

        # Redirección tras el envío para que recargar no repita la solicitud.
        return request.redirect('/suppliers/%s?ok=1' % idioma)
