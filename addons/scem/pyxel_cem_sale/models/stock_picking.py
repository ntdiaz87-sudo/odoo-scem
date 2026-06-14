# -*- coding: utf-8 -*-
from odoo import models, _
from odoo.exceptions import UserError


class StockPicking(models.Model):
    _inherit = "stock.picking"

    def button_validate(self):
        for picking in self:
            if picking.sale_id.so_cem_state == 'no_paid':
                raise UserError(_("Sale order must be paid."))
        return super().button_validate()
