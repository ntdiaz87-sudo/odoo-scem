from odoo import models, fields, api, _
from odoo.http import request


class MultiWebsiteMixin(models.AbstractModel):
    """Mixin para agregar funcionalidades multi-sitio a cualquier modelo"""
    _name = 'multi.website.mixin'
    _description = 'Mixin Multi Sitio'

    website_id = fields.Many2one(
        'website',
        string='Sitio Web',
        help="Registro asociado a un sitio web específico"
    )

    def get_current_website(self):
        """Obtiene el sitio web actual desde el request"""
        return request.website if request else False

    def filter_by_current_website(self):
        """Filtra registros por el sitio web actual"""
        website = self.get_current_website()
        if not website:
            return self
        return self.filtered(lambda r: r.website_id.id == website.id)

    def is_visible_in_current_website(self):
        """Verifica si el registro es visible en el sitio web actual"""
        website = self.get_current_website()
        if not website:
            return True
        return not self.website_id or self.website_id.id == website.id

    @api.model
    def create_website_specific(self, vals):
        """Crea registro específico para el sitio web actual"""
        website = self.get_current_website()
        if website:
            vals['website_id'] = website.id
        return self.create(vals)


class MultiWebsiteTools(models.AbstractModel):
    """Herramientas generales para gestión multi-sitio"""
    _name = 'multi.website.tools'
    _description = 'Herramientas Multi Sitio'

    @api.model
    def get_website_config(self, website_id=None):
        """Obtiene configuración de un sitio web"""
        website_obj = self.env['website']

        if not website_id:
            website = request.website if request else None
            website_id = website.id if website else False

        if website_id:
            website = website_obj.browse(website_id)
            return website.apply_custom_config()
        return {}

    @api.model
    def render_template_by_website(self, template_map, default_template, values=None):
        """Renderiza template según el sitio web"""
        if not request:
            return self.env['ir.ui.view']._render_template(default_template, values or {})

        website_id = request.website.id
        template = template_map.get(website_id, default_template)

        # Agregar configuración del sitio web
        if values is None:
            values = {}
        values.update({
            'website_config': self.get_website_config(website_id),
            'current_website': request.website,
        })

        return request.render(template, values)

    @api.model
    def get_all_websites_data(self):
        """Obtiene datos de todos los sitios web"""
        websites = self.env['website'].search([])
        result = []

        for website in websites:
            config = self.get_website_config(website.id)
            result.append({
                'id': website.id,
                'name': website.name,
                'domain': website.domain,
                'config': config,
            })

        return result