# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class Hr_payroll_vacaciones(models.TransientModel):
    _name = "hr.payroll.vacaciones"
    _description = _("Hr_payroll_vacaciones")

    employee_id = fields.Many2one(
        "hr.employee",
        string="Empleado",
    )

    payslip_id = fields.Many2one(
        "hr.payslip",
        string="Nomina",
    )

    submayor_days = fields.Float(string="Dias Acumulados", compute="_compute_submayor")
    submayor_amount = fields.Float(
        string="Monto Acumulado", compute="_compute_submayor"
    )
    days = fields.Float(string="Dias a pagar")

    payment = fields.Float(string="Segun los dias a pagar el monto es:")

    @api.onchange("employee_id")
    def _compute_submayor(self):
        for record in self:
            days = 0
            amount = 0
            submayor = (
                self.env["hr.submayor"]
                .sudo()
                .search([("employee_id", "=", record.employee_id.id)])
            )
            if submayor:
                for rec in submayor:
                    days += round(rec.work_days, 2)
                    amount += rec.amount
            self.submayor_days = days
            self.submayor_amount = amount

    @api.onchange("days")
    def calculo_a_pagar(self):
        for rec in self:
            if rec.days > rec.submayor_days:
                raise ValidationError(
                    _("Los dias a pagar no pueden ser mayor a los días acumulados")
                )
            else:
                # Calcula el monto a pagar basándose en el monto acumulado histórico
                if rec.submayor_days > 0:
                    # Monto por día = monto acumulado / días acumulados
                    monto_por_dia = rec.submayor_amount / rec.submayor_days
                    # Pago = monto por día × días a pagar (preserva decimales)
                    self.payment = round(monto_por_dia * rec.days, 2)
                else:
                    self.payment = 0.0

    def add(self):
        """
        Transfiere automáticamente el valor de pago del wizard a la entrada
        ASIG_VACACIONES del payslip. Si la entrada no existe, la crea.
        """
        try:
            # Validaciones básicas
            if not self.days or self.days <= 0:
                raise ValidationError(
                    _("Debe ingresar días a pagar (mayor a 0)")
                )
            
            if not self.employee_id:
                raise ValidationError(
                    _("Debe seleccionar un empleado")
                )
            
            if not self.payslip_id:
                raise ValidationError(
                    _("Debe tener un slip de nómina abierto para procesar vacaciones")
                )

            if self.payment <= 0:
                raise ValidationError(
                    _("El monto a pagar debe ser mayor a 0. Revisa los días ingresados.")
                )

            # Buscar entrada ASIG_VACACIONES existente
            entrada_vacaciones = self.payslip_id.input_line_ids.filtered(
                lambda x: x.code == "ASIG_VACACIONES"
            )


            if entrada_vacaciones:
                # Si existe, actualizar la entrada
                entrada_vacaciones.write({
                    "amount": self.payment,
                    "days_payment": self.days,
                })
            else:
                # Si no existe, crear la entrada automáticamente
                # Obtener el contrato del payslip
                contract_id = self.payslip_id.contract_id
                if not contract_id:
                    raise ValidationError(
                        _("El slip no tiene un contrato asociado. Por favor verifica el slip.")
                    )
                
                self.env["hr.payslip.input"].create({
                    "payslip_id": self.payslip_id.id,
                    "contract_id": contract_id.id,
                    "name": "Asignación de Vacaciones",
                    "code": "ASIG_VACACIONES",
                    "amount": self.payment,
                    "days_payment": self.days,
                })
            
            # Recargar el slip desde la BD para obtener la entrada recién creada
            self.payslip_id = self.payslip_id.browse(self.payslip_id.id)
            
            # PASO CRÍTICO: Recalcular las líneas del slip para que la regla se ejecute
            # Forzar recalculado completo
            self.payslip_id.compute_sheet()
                
        except ValidationError as e:
            raise
        except Exception as e:
            raise ValidationError(
                _("Error al procesar vacaciones: %s") % str(e)
            )