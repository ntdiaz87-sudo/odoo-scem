# -*- coding: utf-8 -*-
import logging

from odoo import models, fields


_logger = logging.getLogger(__name__)


class HrEmployee(models.Model):
    _inherit = "hr.employee"

    submayor_count = fields.Float(
        compute="_compute_submayor_count", string="Días Acumulados"
    )

    def _compute_submayor_count(self):
        for employee in self:
            submayor_records = self.env["hr.submayor"].search(
                [("employee_id", "=", employee.id)]
            )
            employee.submayor_count = sum(submayor_records.mapped("work_days"))

    def action_view_submayor(self):
        self.ensure_one()
        submayor_ids = (
            self.env["hr.submayor"].search([("employee_id", "=", self.id)]).ids
        )
        action = self.env.ref(
            "l10n_cu_hr_payroll_submayor.action_hr_submayor_general"
        ).read()[0]
        if len(submayor_ids) > 1:
            action["domain"] = [("id", "in", submayor_ids)]
        elif len(submayor_ids) == 1:
            action["views"] = [
                (
                    self.env.ref(
                        "l10n_cu_hr_payroll_submayor.action_hr_submayor_general"
                    ).id,
                    "form",
                )
            ]
            action["res_id"] = submayor_ids[0]
        return action
