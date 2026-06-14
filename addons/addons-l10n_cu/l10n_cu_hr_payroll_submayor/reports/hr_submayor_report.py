# reports/custom_hr_submayor_report.py
import logging
from odoo import models
from odoo.tools.float_utils import float_round

logger = logging.getLogger(__name__)


class HrSubmayorReportAbstract(models.AbstractModel):
    _name = "report.l10n_cu_hr_payroll_submayor.report_hr_submayor"  # Must match the name of the report
    _description = "Submayor Report"

    def _get_report_values(self, docids, data=None):
        """_Overrides report default values with custom data for submayor reports generation_

        Returns:
            _dict_: _dictionary with custom data for submayor report generation_
        """

        # If data its been passed from wizard, i USE IT directly
        if data and all(
            k in data
            for k in ["employee_name", "submayor", "total_days", "total_amount"]
        ):
            # Passing 'submayor' as .ids and now converting back to records
            submayor_records = self.env["hr.submayor"].browse(data["submayor"])
            return {
                "employee_name": data["employee_name"],
                "submayor": submayor_records,
                "total_days": data["total_days"],
                "total_amount": data["total_amount"],
            }

        # Fallback: if called another way (e.g., from employee), compute from employee_id
        employee_id = data.get("employee_id") if data else None
        employee = self.env["hr.employee"].browse(employee_id) if employee_id else None

        logger.warning(
            "Submayor report fallback triggered for employee %s (ID: %s). "
            "Consider calling via wizard for consistent results.",
            employee.name,
            employee.id,
        )

        total_days = 0
        total_amount = 0
        submayor_records = self.env["hr.submayor"]
        if employee:
            submayor_records = (
                self.env["hr.submayor"]
                .sudo()
                .search([("employee_id", "=", employee.id)])
            )
            for s in submayor_records:
                total_days += s.work_days
                total_amount += s.amount

            rounded_total_days = float_round(total_days, precision_digits=2)
            rounded_total_amount = float_round(total_amount, precision_digits=2)

        return {
            "employee_name": employee.name if employee else "",
            "submayor": submayor_records,
            "total_days": rounded_total_days,
            "total_amount": rounded_total_amount,
        }
