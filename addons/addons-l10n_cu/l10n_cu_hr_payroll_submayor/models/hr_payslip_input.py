# -*- coding: utf-8 -*-
import logging

from odoo import models, fields

_logger = logging.getLogger(__name__)


class HrPayslipInput(models.Model):
    _inherit = "hr.payslip.input"

    days_payment = fields.Float()
