from odoo import http
from odoo.http import request
import logging

_logger = logging.getLogger(__name__)


class SignupControllerDivep(http.Controller):

    @http.route('/get_documentos_requeridos', type='json', auth='public', website=True)
    def get_documentos_requeridos(self, entity_type, **kwargs):
        documentos = request.env['res.partner'].sudo().get_documentos_by_type(entity_type)
        return {
            'documentos': documentos,
            'entity_type': entity_type,
        }