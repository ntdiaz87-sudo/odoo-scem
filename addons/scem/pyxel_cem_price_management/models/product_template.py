from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class ProductTemplate(models.Model):
    _inherit = 'product.template'
    
    use_reference_price = fields.Boolean("Usar Precio Referencia")
    reference_price = fields.Float(string='Precio Referencia', digits='Product Price', tracking=True)
    
    @api.constrains('use_reference_price', 'reference_price')
    def _check_reference_price_when_enabled(self):
        for rec in self:
            if rec.use_reference_price and rec.reference_price == 0.0:
                raise ValidationError(
                    _("Si 'Usar Precio Referencia' está activado, el campo 'Precio Referencia' debe ser diferente de 0.")
                )
                

    @api.depends(
        'wholesale_price',
        'sale_margin',
        'use_reference_price',
        'reference_price',
        'standard_price'
    )
    def _compute_list_price(self):
        for template in self:
            if template.use_reference_price and template.reference_price > 0:
                margin = template.sale_margin or 0.0
                margin_amount = template.reference_price * (margin / 100.0)
                template.list_price = template.wholesale_price + margin_amount
            elif template.wholesale_price and template.wholesale_price > 0:
                margin = template.sale_margin or 0.0
                percent = (100.0 - margin) if margin < 100.0 else 1.0
                template.list_price = template.wholesale_price * 100.0 / percent
            else:
                template.list_price = template.standard_price
    