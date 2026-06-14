from odoo import models, fields, api
import inspect


class ResPartner(models.Model):
    _inherit = 'res.partner'

    # amparo_legal = fields.Boolean()

    customer_type = fields.Selection(
        selection=[
            ('default', 'Default'),
            ('juridico', 'Jurídico'),
            ('natural', 'Natural'),
        ],
        string='Tipo de Cliente',
        default='default',
        required=True,
        help='Seleccione el tipo de cliente'
    )

    @api.model
    def create(self, vals):
        if 'customer_type' not in vals:
            vals['customer_type'] = 'default'
        return super(ResPartner, self).create(vals)


class ProductPublicCategory(models.Model):
    _inherit = 'product.public.category'

    def get(self, key, default=None):
        """
        Compatibilidad con templates que esperan comportamiento de diccionario.
        Detecta si es llamado desde template o desde código interno de Odoo.
        """
        # Detectar si estamos en el contexto de renderizado de templates
        frame = inspect.currentframe()
        caller_frames = inspect.getouterframes(frame, 2)

        # Si es llamado desde QWeb/templates (buscar 'ir.qweb' en el stack)
        is_from_template = any('qweb' in str(f.filename).lower() or
                               'template' in str(f.function).lower()
                               for f in caller_frames[:10])

        # Si NO es desde template, usar comportamiento estándar de Odoo
        if not is_from_template:
            # Retornar el atributo real del modelo
            return getattr(self, key, default) if hasattr(self, key) else default

        # Comportamiento personalizado para templates
        try:
            if not self:
                return default

            if key == 'id':
                return self.id
            elif key == 'name':
                return self.name
            elif key == 'parent_id':
                if self.parent_id:
                    return [self.parent_id.id, self.parent_id.name]
                return default if default is not None else False
            elif key == 'child_id':
                if self.child_id:
                    return self.child_id.ids
                return default if default is not None else []
            elif key == 'product_count':
                product_published_field = 'website_published' if 'website_published' in self.env[
                    'product.template']._fields else 'is_published'
                return self.env['product.template'].sudo().search_count([
                    ('public_categ_ids', 'in', self.id),
                    (product_published_field, '=', True)
                ])
            else:
                # Para cualquier otro campo
                if hasattr(self, key):
                    value = getattr(self, key, default)
                    # Si es un recordset vacío, retornar False
                    if hasattr(value, '_name') and not value:
                        return False
                    return value
                return default
        except Exception as e:
            import logging
            _logger = logging.getLogger(__name__)
            _logger.warning(f"Error en get() de ProductPublicCategory: key={key}, error={str(e)}")
            return default

    def __getitem__(self, key):
        """
        Permite acceso con corchetes: category['id']
        Solo para uso en templates
        """
        if not self:
            raise KeyError(key)

        result = self.get(key)
        if result is None:
            raise KeyError(key)
        return result