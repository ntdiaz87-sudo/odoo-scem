# -*- coding: utf-8 -*-
from collections import defaultdict
from datetime import timedelta
from pytz import utc
from odoo import api, fields, models
from odoo.tools import float_utils

# This will generate 16th of days
ROUNDING_FACTOR = 16


class HrPayslip(models.Model):
    _inherit = "hr.payslip"

    dias_vacaciones_acumuladas = fields.Boolean(
        compute="_compute_dias_vacaciones_acumuladas"
    )

    def compute_sheet(self):
        """Override para calcular el slip"""
        return super().compute_sheet()

    @api.onchange("employee_id")
    def _compute_dias_vacaciones_acumuladas(self):
        for rec in self:
            acumulado = 0
            payslip = (
                self.env["hr.submayor"]
                .sudo()
                .search([("employee_id", "=", rec.employee_id.id)])
            )
            if payslip:
                dias_vacaciones = sum(line.work_days for line in payslip)
                acumulado = int(dias_vacaciones)
            if acumulado > 19:
                rec.dias_vacaciones_acumuladas = True
            else:
                rec.dias_vacaciones_acumuladas = False

    def action_payslip_done(self):
        days = 0
        amount = 0
        submayor_pay = 0
        for line in self.line_ids:
            if line.code == "ACUMULADO_DIAS":
                days = line.total
            if line.code == "PROVISIONES_VACACIONES":
                amount = line.total
            if line.code == "ASIG_VACACIONES":
                submayor_pay = 1

        submayor = self.env["hr.submayor"].sudo().search([("payslip_id", "=", self.id)])
        if submayor:
            submayor.write(
                {
                    "work_days": submayor.work_days + days,
                    "amount": submayor.amount + amount,
                }
            )
        else:
            if days >= 2.2:
                days = 2.2
            submayor.sudo().create(
                {
                    "name": self.name,
                    "employee_id": self.employee_id.id,
                    "payslip_id": self.id,
                    "work_days": days,
                    "amount": round(amount, 2),
                    "date_from": self.date_from,
                    "date_to": self.date_to,
                    "note": "Dias por pagar",
                }
            )
        if submayor_pay == 1:
            for rec in self.input_line_ids:
                if rec.code == "ASIG_VACACIONES":
                    self.env["hr.submayor"].sudo().create(
                        {
                            "employee_id": self.employee_id.id,
                            "payslip_id": self.id,
                            "name": self.name,
                            "work_days": rec.days_payment * -1,
                            "amount": rec.amount * -1,
                            "date_from": self.date_from,
                            "date_to": self.date_to,
                            "note": "Dias pagados",
                        }
                    )

        confirm = super(HrPayslip, self).action_payslip_done()
        return confirm

    def compute_vacaciones(self):
        context = {
            "default_employee_id": self.employee_id.id,  # ID del empleado
            "default_payslip_id": self.id,  # ID del modelo en el que se ejecuta el botón
        }
        return {
            "type": "ir.actions.act_window",
            "res_model": "hr.payroll.vacaciones",
            "view_type": "form",
            "view_mode": "form",
            "target": "new",
            "context": context,
        }


class ResourceMixin(models.AbstractModel):
    _inherit = "resource.mixin"

    def get_work_days_data(
        self,
        from_datetime,
        to_datetime,
        compute_leaves=True,
        calendar=None,
        domain=None,
    ):
        """
        By default the resource calendar is used, but it can be
        changed using the `calendar` argument.

        `domain` is used in order to recognise the leaves to take,
        None means default value ('time_type', '=', 'leave')

        Returns a dict {'days': n, 'hours': h} containing the
        quantity of working time expressed as days and as hours.
        """
        resource = self.resource_id
        calendar = calendar or self.resource_calendar_id or self.company_id.resource_calendar_id

        # naive datetimes are made explicit in UTC
        if not from_datetime.tzinfo:
            from_datetime = from_datetime.replace(tzinfo=utc)
        if not to_datetime.tzinfo:
            to_datetime = to_datetime.replace(tzinfo=utc)

        # total hours per day: retrieve attendances with one extra day margin,
        # in order to compute the total hours on the first and last days
        from_full = from_datetime - timedelta(days=1)
        to_full = to_datetime + timedelta(days=1)
        intervals = calendar._attendance_intervals_batch(from_full, to_full, resource)
        day_total = defaultdict(float)
        for start, stop, meta in intervals:
            day_total[start.date()] += (stop - start).total_seconds() / 3600

        # actual hours per day
        if compute_leaves:
            intervals = calendar._work_intervals_batch(
                from_datetime, to_datetime, resource, domain
            )
        else:
            intervals = calendar._attendance_intervals_batch(
                from_datetime, to_datetime, resource
            )
        day_hours = defaultdict(float)
        for start, stop, meta in intervals:
            day_hours[start.date()] += (stop - start).total_seconds() / 3600

        # compute number of days as quarters
        days = sum(
            float_utils.round(ROUNDING_FACTOR * day_hours[day] / day_total[day])
            / ROUNDING_FACTOR
            for day in day_hours
        )
        return {
            "days": days,
            "hours": sum(day_hours.values()),
        }
