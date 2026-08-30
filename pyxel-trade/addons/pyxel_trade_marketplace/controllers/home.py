# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request


class PyxelMarketplaceHome(http.Controller):
    """Portada del marketplace, dirigida al COMPRADOR CUBANO.

    La puerta del proveedor chino es distinta (/suppliers, en inglés y
    chino) y se construye aparte: son dos embudos opuestos y una sola
    portada no puede servir a los dos.

    La ruta es /market y no /, para no pisar el enrutado de la portada del
    módulo `website`. Para que sea la página de inicio, basta con apuntar
    ahí la URL de inicio del sitio (ver README).
    """

    # Orden de los productos destacados según la pestaña elegida.
    ORDENES = {
        'popular': 'website_sequence asc, id desc',
        'precio': 'pyxel_price_min asc, id desc',
        'nuevos': 'id desc',
        'demanda': 'pyxel_demand_signal asc, id desc',
    }

    def _productos_destacados(self, orden, limite=5):
        criterio = self.ORDENES.get(orden, self.ORDENES['popular'])
        dominio = [('is_published', '=', True), ('sale_ok', '=', True)]
        if orden == 'demanda':
            dominio.append(('pyxel_demand_signal', 'in', ('high', 'rising')))
        return request.env['product.template'].sudo().search(
            dominio, order=criterio, limit=limite)

    def _metricas(self):
        """Cifras de respaldo. Se cuentan de la base, no se inventan: al
        principio serán pequeñas, y eso es preferible a un número falso que
        el primer comprador que pregunte va a desmontar."""
        Partner = request.env['res.partner'].sudo()
        Producto = request.env['product.template'].sudo()
        return {
            'proveedores': Partner.search_count([
                ('pyxel_is_supplier', '=', True), ('pyxel_verified', '=', True)]),
            'productos': Producto.search_count([('is_published', '=', True)]),
            'empresas': Partner.search_count([
                ('is_company', '=', True), ('country_id.code', '=', 'CU')]),
        }

    @http.route('/market', type='http', auth='public', website=True, sitemap=True)
    def marketplace_home(self, orden='popular', **kw):
        Categoria = request.env['product.public.category'].sudo()
        Senal = request.env['pyxel.market.signal'].sudo()

        valores = {
            'categorias': Categoria.search([('parent_id', '=', False)], limit=6),
            'destacados': self._productos_destacados(orden),
            'orden_activo': orden if orden in self.ORDENES else 'popular',
            'senales': Senal.search([], limit=4),
            'metricas': self._metricas(),
        }
        return request.render('pyxel_trade_marketplace.home', valores)
