# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from odoo.addons.website_sale.controllers.main import WebsiteSale


class WebsiteSaleCem(WebsiteSale):

    @http.route()
    def shop(self, page=0, category=None, search='', ppg=False, **post):
        # Llamamos al super normalmente
        response = super().shop(
            page=page,
            category=category,
            search=search,
            ppg=ppg,
            **post
        )

        # Inyectamos current_min_rating en el qcontext del template
        if hasattr(response, 'qcontext'):
            try:
                min_rating = int(float(request.params.get('min_rating', 0)))
            except (ValueError, TypeError):
                min_rating = 0
            response.qcontext['current_min_rating'] = min_rating

        return response

    def _get_search_domain(self, search, category, attrib_values, pricelist=None):
        """
        Override para agregar filtro por rating mínimo.
        IMPORTANTE: leer de request.params directamente porque
        este método no recibe los post params.
        """
        domain = super()._get_search_domain(
            search, category, attrib_values, pricelist
        )

        try:
            min_rating = float(request.params.get('min_rating', 0))
        except (ValueError, TypeError):
            min_rating = 0

        if min_rating > 0:
            domain += [('rating_avg', '>=', min_rating)]

        return domain