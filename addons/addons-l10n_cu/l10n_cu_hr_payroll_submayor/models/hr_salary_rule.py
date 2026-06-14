# -*- coding: utf-8 -*-
from odoo import models


class HrSalaryRule(models.Model):
    _inherit = "hr.salary.rule"

    def acumular_submayor(self, days, acumulado, nomina):
        if nomina:
            submayor = (
                self.env["hr.submayor"].sudo().search([("payslip_id", "=", nomina.id)])
            )
            if submayor:
                submayor.write(
                    {
                        "work_days": submayor.work_days + days,
                        "amount": submayor.amount + acumulado,
                    }
                )
            else:
                submayor.create(
                    {
                        "name": nomina.name,
                        "employee_id": nomina.employee_id.id,
                        "payslip_id": nomina.id,
                        "work_days": days,
                        "amount": acumulado,
                    }
                )
        return True

    def _satisfy_condition(self, localdict):
        """Override para asegurar que ASIG_VACACIONES pase la condición"""
        if self.code == "ASIG_VACACIONES":
            return True
        
        return super()._satisfy_condition(localdict)

    def _compute_rule(self, localdict):
        """Override para manejar ASIG_VACACIONES correctamente"""
        if self.code == "ASIG_VACACIONES":
            try:
                payslip_id = localdict.get('payslip')
                if isinstance(payslip_id, (int, float)):
                    entrada = self.env['hr.payslip.input'].search(
                        [('payslip_id', '=', int(payslip_id)), ('code', '=', 'ASIG_VACACIONES')],
                        limit=1
                    )
                    monto = entrada.amount if entrada else 0.0
                else:
                    entrada = payslip_id.input_line_ids.filtered(
                        lambda x: x.code == "ASIG_VACACIONES"
                    )
                    monto = entrada[0].amount if entrada else 0.0
                
                localdict['result'] = monto
                return float(monto), 1.0, 100.0
            except Exception:
                localdict['result'] = 0.0
                return 0.0, 1.0, 100.0
        
        return super()._compute_rule(localdict)



