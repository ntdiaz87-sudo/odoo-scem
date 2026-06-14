# -*- coding: utf-8 -*-
from odoo import models, _
from odoo.exceptions import UserError


class StockPicking(models.Model):
    _inherit = "stock.picking"

    def write(self, vals):
        res = super().write(vals)

        pickings = self.filtered(lambda p: p.state not in ("done", "cancel"))

        # 1) Si el usuario cambió ubicación origen/destino en la cabecera,
        #    sincronizamos moves y move lines.
        if "location_id" in vals or "location_dest_id" in vals:
            for picking in pickings:
                new_src = picking.location_id
                new_dst = picking.location_dest_id

                # Actualiza MOVES
                updates_move = {}
                if "location_id" in vals and new_src:
                    updates_move["location_id"] = new_src.id
                if "location_dest_id" in vals and new_dst:
                    updates_move["location_dest_id"] = new_dst.id
                if updates_move:
                    picking.move_ids.write(updates_move)

                # Actualiza MOVE LINES
                updates_ml = {}
                if "location_id" in vals and new_src:
                    updates_ml["location_id"] = new_src.id
                if "location_dest_id" in vals and new_dst:
                    updates_ml["location_dest_id"] = new_dst.id
                if updates_ml and picking.move_line_ids:
                    picking.move_line_ids.write(updates_ml)

                picking.action_assign()

        return res

    def button_validate(self):
        for picking in self:
            picking._check_source_location_not_view()
        return super().button_validate()

    def _check_source_location_not_view(self):
        # Aplica solo a entregas
        if self.picking_type_code != "outgoing":
            return

        if not self.move_line_ids:
            raise UserError(_("No hay operaciones detalladas. Usa 'Operaciones detalladas' y define 'Tomar de'."))

        for ml in self.move_line_ids.filtered(lambda l: l.product_id and l.product_id.type == "product"):
            src = ml.location_id

            # Bloquear ubicaciones tipo Vista
            if src and src.usage == "view":
                raise UserError(_(
                    "La ubicación origen '%s' es de tipo Vista. Selecciona una ubicación interna real."
                ) % src.display_name)

    def _sync_header_locations_from_moves(self):
        """
        Fuerza que picking.location_id/location_dest_id reflejen las ubicaciones de sus moves.
        Si hay varias ubicaciones distintas (caso raro), toma la más frecuente.
        """
        for picking in self:
            moves = picking.move_ids.filtered(lambda m: m.state not in ("done", "cancel"))
            if not moves:
                continue

            srcs = moves.mapped("location_id")
            dsts = moves.mapped("location_dest_id")

            # Si todos iguales, perfecto.
            if len(srcs) == 1:
                picking.location_id = srcs.id
            else:
                # tomar la ubicación más repetida
                picking.location_id = max(srcs, key=lambda l: sum(m.location_id == l for m in moves)).id

            if len(dsts) == 1:
                picking.location_dest_id = dsts.id
            else:
                picking.location_dest_id = max(dsts, key=lambda l: sum(m.location_dest_id == l for m in moves)).id

