# -*- coding: utf-8 -*-
from odoo import models, api

class AccountMove(models.Model):
    _inherit = "account.move"

    def action_post(self):
        res = super().action_post()

        # Calcular CIF al publicar (confirmar) la factura
        for move in self:
            # Opcional: limita solo a facturas de cliente/proveedor
            if move.move_type not in ("out_invoice", "in_invoice", "out_refund", "in_refund"):
                continue

            lines_to_update = []
            for line in move.invoice_line_ids:
                product = line.product_id
                if not product:
                    continue

                cif_cost = product.product_tmpl_id.cif_cost or 0.0
                if cif_cost <= 0:
                    cif_value = 0.0
                else:
                    # Si cif_cost es un % (ej: 20 = 20%), usa esta:
                    # cif_value = (line.price_unit * 100.0) / cif_cost

                    # Si tú lo quieres literal "precio / cif_cost", usa esta en su lugar:
                    cif_value = line.price_unit / cif_cost

                lines_to_update.append((line, cif_value))

            # Escribimos en batch
            for line, cif_value in lines_to_update:
                line.cif_value = cif_value

        return res