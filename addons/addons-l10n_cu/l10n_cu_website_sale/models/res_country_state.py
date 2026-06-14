# -*- coding: utf-8 -*-

from odoo import models


class ResCountryState(models.Model):
    _inherit = 'res.country.state'

    def get_website_sale_municipalities(self, mode='billing'):
        res = self.sudo().res_municipality_id
        if mode == 'shipping':
            municipalities = self.env['res.municipality']
            dom = ['|', ('state_ids', 'in', self.id), ('state_ids', '=', False), ('website_published', '=', True)]
            delivery_carriers = self.env['delivery.carrier'].sudo().search(dom)

            for carrier in delivery_carriers:
                if not carrier.state_ids or not carrier.municipality_ids:
                    municipalities = res
                    break
                municipalities |= carrier.municipality_ids
            res = res & municipalities
        return res
