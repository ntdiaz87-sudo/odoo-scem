from odoo import http, _
from odoo.http import request
import json
    
class WebsiteSalePackagingCartQty(http.Controller):

    @http.route('/shop/cart/product_qty_reference/<int:product_id>', type='http', auth='public', website=True, csrf=False)
    def get_product_qty_in_cart_reference(self, product_id, **kwargs):
        order = request.website.sale_get_order()
        qty_ref = 0.0

        if order:
            lines = order.order_line.filtered(lambda l: l.product_id.id == product_id)
            for line in lines:
                ptav = line.product_no_variant_attribute_value_ids.filtered(
                    lambda v: v.attribute_id.is_packaging_attribute
                )[:1]
                mult = float(ptav.uom_min or 1.0) if ptav else 1.0
                if mult <= 0:
                    mult = 1.0
                qty_ref += (line.product_uom_qty or 0.0) * mult

        return request.make_response(
            json.dumps({'product_id': product_id, 'qty_in_cart_reference': qty_ref}),
            headers=[('Content-Type', 'application/json')],
        )