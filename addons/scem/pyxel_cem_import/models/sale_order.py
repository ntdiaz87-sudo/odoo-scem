# Part of Odoo. See LICENSE file for full copyright and licensing details.
import base64

from odoo import api, models, fields, _
from odoo.exceptions import UserError


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    so_cem_order_type = fields.Selection([('shop', 'Shop'), ('import', 'Importation')], string="Order Source",
        default='import')

    @api.onchange('so_cem_order_type')
    def onchange_so_cem_order_type(self):
        if self.so_cem_order_type == 'import':
            self.payment_prov_id = False
            self.payment_meth_id = False

    def run_on_confirm(self):
        for order in self:
            if order.order_type != 'evaluation_final' and order.so_cem_order_type != 'import':
                super(SaleOrder, self).run_on_confirm()
