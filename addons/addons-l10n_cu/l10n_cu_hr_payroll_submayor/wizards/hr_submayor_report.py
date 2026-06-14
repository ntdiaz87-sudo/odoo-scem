# -*- coding: utf-8 -*-

from odoo import models, fields, _
from odoo.tools.float_utils import float_round


class HrSubmayorReport(models.TransientModel):
    _name = "hr.submayor.report"
    _description = _("HrSubmayorReport")

    employee_id = fields.Many2one(
        "hr.employee",
        string="Empleado",
    )

    def add(self):
        total_days = 0
        total_amount = 0
        submayor = self.env["hr.submayor"]
        if self.employee_id:
            submayor = (
                self.env["hr.submayor"]
                .sudo()
                .search([("employee_id", "=", self.employee_id.id)])
            )
            if submayor:
                for s in submayor:
                    # Rounding individual work_days to 2 decimals (or 0 if whole days only)
                    rounded_day = float_round(s.work_days, precision_digits=2)
                    s.work_days = (
                        rounded_day  # Updating the record with the rounded day value
                    )
                    total_days += s.work_days
                    total_amount += s.amount

                rounded_total_days = float_round(total_days, precision_digits=2)
                rounded_total_amount = float_round(total_amount, precision_digits=2)
        data = {
            "submayor": submayor.ids,  # Never pass full recordsets in data — they don’t survive JSON serialization.
            "total_days": rounded_total_days,
            "total_amount": rounded_total_amount,
            "employee_name": self.employee_id.name,
        }
        return self.env.ref(
            "l10n_cu_hr_payroll_submayor.report_hr_submayor_report_view"
        ).report_action(self, data=data)
