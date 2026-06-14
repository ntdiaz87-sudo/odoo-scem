import logging
from odoo import api, fields, models, _


class Website(models.Model):
    _inherit = 'website'

    use_brand_filter = fields.Boolean(
        string='Usar filtro de marcas en la tienda',
        help='Si se activa, se mostrará un filtro de marcas en la tienda.'
    )


class CarouselCustomization(models.Model):
    _name = 'carousel.customization'
    _description = 'Carousel Customization'

    image_1920 = fields.Image("Image", required=True)

    active = fields.Boolean('Active', default=True,
                            help="If the active field is set to False, "
                                 "it will allow you to hide the resource "
                                 "record without removing it."
                            )

    description = fields.Text('Description', translate=True)