from odoo import models, fields, api


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    nom_code = fields.Char("Nomenclator Code")
    large_name = fields.Char("Large Name")
    mark_id = fields.Many2one('product.template.mark', "Mark")
    origin_id = fields.Many2one('res.country', "Country Origin")
    provider_id = fields.Many2one('res.partner', "Provider", domain="[('is_provider', '=', True)]")
    uom_sale_id = fields.Many2one('uom.uom', "Sale Uom")
    sale_min_qty = fields.Integer(string="Sale Minimum Quantity", compute='_compute_sale_min_qty', store=True,
                                  readonly=True)
    full_description = fields.Html("Full Description")
    available2sale = fields.Boolean("Available to Sale")
    product_wsale_type = fields.Selection([
        ('in', 'In-bond'),
        ('nac', 'Nationalized'),
        ('con', 'Consigned'),
        ('cfi', 'CFI'),
    ], string='Product Type')
    delivery_time = fields.Char("Delivery Time")
    uom_reference = fields.Text(string='Reference of the quantity')
    terms_cond = fields.Html(string="Terms and conditions", translate=True)
    attribute_value_ids = fields.One2many(
        'product.template.attribute.value',
        'product_tmpl_id',
        string="Template Attribute Values",
    )
    wholesale_price = fields.Float(string='Wholesale Price', digits='Product Price', tracking=True)
    sale_margin = fields.Float(string='Margen comercial (%)', tracking=True)
    list_price = fields.Float(compute='_compute_list_price', digits='Product Price', store=True, string='List price')

    has_warranty = fields.Boolean(
        string='Tiene Garantía',
        help='Indica si el producto tiene garantía',
        default=False
    )

    # Campo computado para determinar si mostrar el checkbox
    show_warranty_field = fields.Boolean(
        compute='_compute_show_warranty_field',
        store=False
    )

    warranty_time = fields.Integer(
        string='Tiempo de Garantía (días)',
        help='Tiempo de garantía del producto en días',
        default=0
    )

    _sql_constraints = [
        ('unique_nom_code', 'unique (nom_code)', 'This code already exists')
    ]

    @api.depends()
    def _compute_show_warranty_field(self):
        """Computa si se debe mostrar el campo de garantía basado en la compañía"""
        for product in self:
            product.show_warranty_field = self.env.company.warranty_management

    @api.depends('attribute_value_ids.uom_min', 'attribute_value_ids.is_uom_min')
    def _compute_sale_min_qty(self):
        for tmpl in self:
            mins = tmpl.attribute_value_ids.filtered(lambda v: v.is_uom_min)
            tmpl.sale_min_qty = mins and mins[0].uom_min or 0

    @api.depends('wholesale_price', 'sale_margin')
    def _compute_list_price(self):
        for template in self:
            if template.wholesale_price and template.wholesale_price > 0:
                margin = template.sale_margin or 0.0
                percent = (100.0 - margin) if margin < 100.0 else 1.0
                template.list_price = template.wholesale_price * 100.0 / percent
            else:
                template.list_price = template.standard_price

    @api.onchange('nom_code')
    def onchange_nom_code(self):
        if not self.default_code:
            self.default_code = self.nom_code


class ProductTempalteMark(models.Model):
    _name = 'product.template.mark'
    _inherit = ['image.mixin']
    _description = 'Product Template Mark'

    name = fields.Char("Name", required=True)
    is_relevant = fields.Boolean("Is relevant", default=False)
