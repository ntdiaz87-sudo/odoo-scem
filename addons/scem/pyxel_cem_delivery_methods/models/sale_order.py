# -*- coding: utf-8 -*-

from odoo import models, fields
from odoo.http import request

class SaleOrder(models.Model):
    _inherit = "sale.order"


    need_home_delivery = fields.Boolean(
        string="Need Home Delivery",
        default=True,
    )

    # -------------------------------------------------------------------------
    # Logica para permitir la venta de varios almacenes en el sitio web
    # ------------------------------------------------------------------------
    def _delivery_allowed_warehouses(self):
        """Warehouses que entregan al municipio seleccionado en sesión."""
        self.ensure_one()
        municipality_id = request.session.get("delivery_city") or request.session.get("delivery_municipality_id")
        if not municipality_id:
            return self.env["stock.warehouse"]
        wds = self.env["warehouse.delivery"].sudo().search([("municipality_id", "=", int(municipality_id))])
        return wds.mapped("warehouse_id")


    def _get_cart_and_free_qty(self, product, line=None, **kwargs):
        """Hace que website_sale considere stock sumado de varios warehouses (según municipio)."""
        product_qty_in_cart, _available_qty = super()._get_cart_and_free_qty(product, line=line, **kwargs)

        warehouses = self._delivery_allowed_warehouses()
        if warehouses:
            available_qty = 0.0
            for wh in warehouses:
                available_qty += product.with_context(warehouse=wh.id).free_qty
            return product_qty_in_cart, available_qty

        return product_qty_in_cart, _available_qty
    
    
    def action_confirm(self):
        res = super().action_confirm()

        self._assign_source_warehouse_to_lines()
        self._fix_moves_locations_by_line_warehouse()
        self._split_pickings_one_per_product()

        for order in self:
            pickings = order.picking_ids.filtered(
                lambda p: p.state not in ("done", "cancel")
                and p.move_ids.filtered(
                    lambda m: m.state not in ("done", "cancel")
                    and m.product_id
                    and m.product_id.type == "product"
                )
            )

            if pickings:
                pickings._sync_header_locations_from_moves()
                pickings.action_assign()

        return res

    
    def _fix_moves_locations_by_line_warehouse(self):
        for order in self:
            for picking in order.picking_ids.filtered(lambda p: p.state not in ("done", "cancel")):
                for mv in picking.move_ids.filtered(lambda m: m.sale_line_id and m.product_id.type == "product"):
                    wh = mv.sale_line_id.source_warehouse_id
                    if not wh or not wh.lot_stock_id:
                        continue

                    # Cambiar origen al stock location del warehouse
                    if mv.location_id != wh.lot_stock_id:
                        mv.write({"location_id": wh.lot_stock_id.id})

                    # También actualizar move lines (operaciones detalladas)
                    for ml in mv.move_line_ids:
                        if ml.location_id != wh.lot_stock_id:
                            ml.write({"location_id": wh.lot_stock_id.id})

    
    def _assign_source_warehouse_to_lines(self):
        for order in self:
            allowed_whs = order._delivery_allowed_warehouses()
            for line in order.order_line.filtered(lambda l: l.product_id and l.product_id.type == "product"):
                if line.source_warehouse_id:
                    continue

                # elegir el primer warehouse que tenga stock suficiente
                chosen = False
                for wh in allowed_whs:
                    if line.product_id.with_context(warehouse=wh.id).free_qty >= line.product_uom_qty:
                        chosen = wh
                        break

                # fallback: si ninguno cubre completamente, usa el que tenga más free_qty
                if not chosen and allowed_whs:
                    best = max(allowed_whs, key=lambda w: line.product_id.with_context(warehouse=w.id).free_qty)
                    chosen = best

                line.source_warehouse_id = chosen.id if chosen else False


    def _split_pickings_one_per_product(self):
        """
        Crea 1 stock.picking por cada producto/línea del pedido.
        Toma los moves ya creados por Odoo y los redistribuye.
        """
        StockPicking = self.env["stock.picking"]

        for order in self:
            # Solo pickings activos
            pickings = order.picking_ids.filtered(lambda p: p.state not in ("done", "cancel"))
            for picking in pickings:
                # Moves reales (no delivery line) y no scrap
                moves = picking.move_ids.filtered(lambda m: not m.scrapped and m.product_id and m.product_id.type == "product")
                if len(moves) <= 1:
                    continue

                # Agrupar por línea de venta si existe; fallback por producto
                groups = {}
                for mv in moves:
                    key = mv.sale_line_id.id or mv.product_id.id
                    groups.setdefault(key, self.env["stock.move"])
                    groups[key] |= mv

                if len(groups) <= 1:
                    continue

                # Dejamos el primer grupo en el picking original
                keys = list(groups.keys())
                keep_key = keys[0]

                # Por cada grupo extra, clonamos el picking (VACÍO) y movemos los moves
                for k in keys[1:]:
                    mv_set = groups[k]

                    # Crear un picking vacío copiando el actual, sin copiar moves ni move_lines
                    new_picking = picking.copy(default={
                        "move_ids": [],
                        "move_line_ids": [],
                        # opcional: diferenciar el origen
                        "origin": "%s (%s)" % (picking.origin or order.name, mv_set[0].product_id.display_name),
                    })

                    # Reasignar moves al nuevo picking
                    mv_set.write({"picking_id": new_picking.id})
                    mv_set.mapped("move_line_ids").write({"picking_id": new_picking.id})


                    # Confirmar/asignar el nuevo picking
                    if new_picking.move_ids.filtered(
                        lambda m: m.state not in ("done", "cancel")
                        and m.product_id
                        and m.product_id.type == "product"
                    ):
                        if new_picking.state == "draft":
                            new_picking.action_confirm()
                        new_picking.action_assign()

                    if picking.move_ids.filtered(
                        lambda m: m.state not in ("done", "cancel")
                        and m.product_id
                        and m.product_id.type == "product"
                    ):
                        picking.action_assign()



                
class SaleOrderLine(models.Model):
    _inherit = "sale.order.line"

    source_warehouse_id = fields.Many2one(
        "stock.warehouse",
        string="Source Warehouse",
        help="Warehouse seleccionado para abastecer esta línea del pedido."
    )