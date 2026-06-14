# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from dateutil.relativedelta import relativedelta

from odoo import api, models, fields, _, exceptions


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    cem_print_paid_waterm = fields.Boolean(related="company_id.cem_print_paid_waterm", readonly=False)

    cem_show_invoice_taxes = fields.Boolean(related="company_id.cem_show_invoice_taxes", readonly=False)

    supplier_management = fields.Boolean(
        string="Supplier Management",
        config_parameter="pyxel_cem_sale.supplier_management",
    )