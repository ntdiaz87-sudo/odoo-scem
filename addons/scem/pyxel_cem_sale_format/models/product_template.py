# -*- coding: utf-8 -*-
import json
import logging
from odoo import fields, models

_logger = logging.getLogger(__name__)


class ProductTemplate(models.Model):
    _inherit = "product.template"


    def _get_combination_info(self, combination=False, product_id=False, add_qty=1, **kwargs):
        res = super()._get_combination_info(
            combination=combination,
            product_id=product_id,
            add_qty=add_qty,
            **kwargs
        )

        self.ensure_one()
        Ptav = self.env["product.template.attribute.value"]
        Pav = self.env["product.attribute.value"]

        def _extract_ids(val):
            """Extrae IDs desde recordset / int / list / json-string / list[dict]."""
            if not val:
                return []
            if hasattr(val, "ids"):
                return val.ids
            if isinstance(val, int):
                return [val]
            if isinstance(val, str):
                try:
                    val = json.loads(val)
                except Exception:
                    return []
            if isinstance(val, (list, tuple)):
                ids = []
                for it in val:
                    if isinstance(it, int):
                        ids.append(it)
                    elif isinstance(it, dict):
                        # Odoo puede mandar dicts con id/value_id
                        if it.get("id"):
                            ids.append(it["id"])
                        elif it.get("value_id"):
                            ids.append(it["value_id"])
                return ids
            if isinstance(val, dict):
                if val.get("id"):
                    return [val["id"]]
                if val.get("value_id"):
                    return [val["value_id"]]
            return []

        # 1) Recolectar IDs potenciales desde múltiples llaves (Odoo cambia nombres según flujo)
        candidate_ids = set()
        candidate_ids.update(_extract_ids(combination))
        for k in (
            "no_variant_attribute_values",
            "no_variant_attribute_value_ids",
            "product_template_attribute_value_ids",
            "attribute_value_ids",
            "parent_combination",
        ):
            candidate_ids.update(_extract_ids(kwargs.get(k)))

        candidate_ids = list(candidate_ids)

        # 2) Intento A: tratarlos como PTAV
        ptavs = Ptav.browse(candidate_ids).exists()
        packaging_ptav = ptavs.filtered(lambda v: v.attribute_id.is_packaging_attribute)[:1]

        # 3) Intento B: si no apareció, tratarlos como PAV y mapear a PTAV del template actual
        if not packaging_ptav:
            pavs = Pav.browse(candidate_ids).exists()
            packaging_pav = pavs.filtered(lambda v: v.attribute_id.is_packaging_attribute)[:1]
            if packaging_pav:
                packaging_ptav = Ptav.search([
                    ("product_tmpl_id", "=", self.id),
                    ("product_attribute_value_id", "=", packaging_pav.id),
                ], limit=1)

        # 4) Fallback render inicial: valor “por defecto” de la línea del template
        packaging_line = self.valid_product_template_attribute_line_ids.filtered(
            lambda l: l.attribute_id.is_packaging_attribute
        )[:1]
        has_packaging = bool(packaging_line)

        if not packaging_ptav and packaging_line:
            packaging_ptav = (
                packaging_line.product_template_value_ids._only_active()[:1]
                or packaging_line.product_template_value_ids[:1]
            )

        res.update({
            "has_packaging_attribute": bool(has_packaging),
            "packaging_uom_min": int(packaging_ptav.uom_min or 0) if packaging_ptav else 0,
            "packaging_ptav_id": packaging_ptav.id if packaging_ptav else False,
        })

        return res