# -*- coding: utf-8 -*-

from odoo import models


class SalesManagerReconciliationPdfReport(models.AbstractModel):
    _name = 'report.pyxel_sm.reconciliation'

    _description = 'Reporte PDF de Conciliación de Gestores'

    def _get_report_values(self, docids, data=None):
        """Preparar datos para el reporte PDF"""
        docs = self.env['sales.manager.reconciliation.wizard'].browse(docids)

        return {
            'doc_ids': docids,
            'doc_model': 'sales.manager.reconciliation.wizard',
            'docs': docs,
            'data': data,
        }