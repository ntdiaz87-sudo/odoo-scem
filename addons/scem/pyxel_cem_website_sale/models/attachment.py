from odoo import models, fields, api, _


class IrAttachment(models.Model):
    _inherit = 'ir.attachment'

    document_type = fields.Selection([
        ('documento_constitutivo', 'Documento constitutivo'),
        ('documento_existencia', 'Documento de existencia legal'),
        ('documento_registro_mercantil', 'Registro mercantil'),
        ('documento_registro_contribuyente', 'Registro de contribuyente'),
        ('documento_licencia_comercio', 'Licencia de Cámara de Comercio'),
        ('documento_carta_timbrada', 'Carta timbrada'),
        ('documento_carnet_acorec', 'Carnet de ACOREC'),
        ('documento_perfil_cliente', 'Perfil del cliente'),
        ('otros', 'Otros documentos')
    ], string='Tipo de Documento', default='otros')