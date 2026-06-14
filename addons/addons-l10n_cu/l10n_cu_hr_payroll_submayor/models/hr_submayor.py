# -*- coding: utf-8 -*-
import logging

from odoo import models, fields, _


_logger = logging.getLogger(__name__)


class HrSubmayor(models.Model):
    _name = "hr.submayor"
    _description = "Submayor de Vacaciones"

    name = fields.Char(_("Name"))
    employee_id = fields.Many2one(
        "hr.employee",
        string="Empleado",
    )
    payslip_id = fields.Many2one(
        "hr.payslip",
        string="Nomina",
    )
    work_days = fields.Float(string="Dias Acumulados")
    amount = fields.Float(string="Acumulado")
    date_from = fields.Date("Fecha Desde")
    date_to = fields.Date("Fecha Hasta")
    note = fields.Text("Descripcion")
