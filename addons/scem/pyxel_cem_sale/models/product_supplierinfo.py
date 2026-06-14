from odoo import api, fields, models, _
from markupsafe import Markup, escape


class ProductSupplierInfo(models.Model):
    _inherit = "product.supplierinfo"

    def _get_related_product_template(self):
        self.ensure_one()
        return self.product_tmpl_id or self.product_id.product_tmpl_id

    def _post_supplier_change_message(self):
        for rec in self:
            product_tmpl = rec._get_related_product_template()
            if not product_tmpl:
                continue

            user_name = self.env.user.name or "-"
            supplier_name = rec.partner_id.display_name or "-"
            currency_name = rec.currency_id.name or ""
            new_price = rec.price or 0.0

            change_date = fields.Datetime.context_timestamp(
                rec, fields.Datetime.now()
            ).strftime("%d/%m/%Y %H:%M:%S")

            body = Markup(
                """
                <b>%s</b><br/>
                <b>%s</b> %s<br/>
                <b>%s</b> %s<br/>
                <b>%s</b> %s %s<br/>
                <b>%s</b> %s
                """
            ) % (
                escape(_("Cambio en información de compra")),
                escape(_("Usuario:")),
                escape(user_name),
                escape(_("Proveedor:")),
                escape(supplier_name),
                escape(_("Precio nuevo:")),
                escape(f"{new_price:.2f}"),
                escape(currency_name),
                escape(_("Fecha:")),
                escape(change_date),
            )

            product_tmpl.message_post(
                body=body,
                subtype_xmlid="mail.mt_note",
            )

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records._post_supplier_change_message()
        return records

    def write(self, vals):
        tracked_fields = {"partner_id", "price", "currency_id"}

        res = super().write(vals)

        if tracked_fields.intersection(vals):
            self._post_supplier_change_message()

        return res