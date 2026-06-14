# -*- coding: utf-8 -*-
from odoo import api, fields, models
from odoo.http import request


class ProductTemplate(models.Model):
    _inherit = 'product.template'
 
    free_delivery = fields.Boolean(string='Free delivery')
    available_in_delivery_zone = fields.Boolean(
        string='Available in delivery zone',
        compute='_compute_available_in_delivery_zone',
        search='_search_available_in_delivery_zone'
    )
    freeze_sale_below_qty_available = fields.Integer(default=0)


    @api.depends('qty_available')
    def _compute_available_in_delivery_zone(self):
        municipality_id = request.session.get('delivery_city')
        try:
            municipality_id = int(municipality_id) if municipality_id else False
        except Exception:
            municipality_id = False

        if not municipality_id:
            for rec in self:
                rec.available_in_delivery_zone = False
            return

        wh_with_city = self.env['warehouse.delivery'].sudo().search([
            ('municipality_id', '=', municipality_id)
        ]).mapped('warehouse_id')

        for rec in self:
            ok = False
            for wh in wh_with_city:
                free = rec.with_context(warehouse=wh.id).virtual_available
                if free > rec.freeze_sale_below_qty_available:
                    ok = True
                    break
            rec.available_in_delivery_zone = ok

    def _search_available_in_delivery_zone(self, operator, value):
        municipality_id = request.session.get('delivery_city')
        try:
            municipality_id = int(municipality_id) if municipality_id else False
        except Exception:
            municipality_id = False

        if not municipality_id:
            return [('id', 'in', [])]

        whs = self.env['warehouse.delivery'].sudo().search([
            ('municipality_id', '=', municipality_id)
        ]).mapped('warehouse_id')

        product_ids = []
        for wh in whs:
            prods = self.sudo().with_context(warehouse=wh.id).search([
                ('virtual_available', '>', 0),
            ]).ids
            product_ids += prods

        return [('id', 'in', list(set(product_ids)))]
   