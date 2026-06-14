# -*- coding: utf-8 -*-

import logging

from odoo.http import request
from odoo.addons.theme_scita.controllers.main import ScitaShop

_logger = logging.getLogger(__name__)


class ScitaShopFix(ScitaShop):

    def _prepare_product_values(self, product, category, search, **kwargs):
        res = super(ScitaShop, self)._prepare_product_values(
            product, category, search, **kwargs
        )

        attrib_values = res.get('attrib_values', [])

        domain = self._get_shop_domain(search, category, attrib_values)

        products = request.env['product.template'].search(
            domain,
            order=self._get_search_order(kwargs)
        ).ids

        if product.id not in products:
            _logger.warning(
                "[ScitaShopFix] Product %s is not in shop products list. "
                "Skipping prev/next navigation. Domain: %s",
                product.id,
                domain,
            )
            return res

        prod_index = products.index(product.id)

        if prod_index != len(products) - 1:
            res['next_product'] = products[prod_index + 1]

        if prod_index != 0:
            res['prev_product'] = products[prod_index - 1]

        return res