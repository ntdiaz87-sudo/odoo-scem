# -*- coding: utf-8 -*-

from odoo import models


class SalesManagerReconciliationXlsxReport(models.AbstractModel):
    _name = 'report.pyxel_sm.reconciliation_xlsx'
    _description = 'Reporte XLSX de Conciliación de Gestores'

    def _get_report_values(self, docids, data=None):
        """Preparar datos para el reporte Excel

        Nota: Este método está aquí por consistencia con la estructura de reportes,
        pero la generación real del Excel se hace en el wizard usando xlsxwriter
        directamente, sin depender del módulo report_xlsx.
        """
        docs = self.env['sales.manager.reconciliation.wizard'].browse(docids)

        return {
            'doc_ids': docids,
            'doc_model': 'sales.manager.reconciliation.wizard',
            'docs': docs,
            'data': data,
        }