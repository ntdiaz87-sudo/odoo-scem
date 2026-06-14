from odoo import http
from odoo.http import request, content_disposition
import base64
import logging
import os

_logger = logging.getLogger(__name__)


class ContractUploadController(http.Controller):

    @http.route('/my/contract/do_upload', type='http', auth="user", website=True, csrf=True)
    def contract_do_upload(self, **post):
        """Handle contract file upload - VERSIÓN MEJORADA CON VALIDACIÓN DE TAMAÑO"""
        partner = request.env.user.partner_id

        # Validar que hay archivo
        if 'contract_file' not in request.httprequest.files:
            return request.redirect('/my/profile?tab=contract-section&error=no_file')

        file = request.httprequest.files['contract_file']
        if not file or not file.filename:
            return request.redirect('/my/profile?tab=contract-section&error=no_file')

        # Buscar contrato
        contract = request.env['cem.virtual.contract'].sudo().search([
            ('partner_id', '=', partner.id),
            ('state', '=', 'sent')
        ], limit=1)

        if not contract:
            return request.redirect('/my/profile?tab=contract-section&error=no_contract')

        try:
            # ✅ VALIDACIÓN DE TAMAÑO ANTES DE LEER EL ARCHIVO
            file.seek(0, 2)  # Ir al final del archivo
            file_size = file.tell()  # Obtener tamaño
            file.seek(0)  # Volver al inicio

            max_size = 10 * 1024 * 1024  # 10MB
            if file_size > max_size:
                return request.redirect('/my/profile?tab=contract-section&error=file_too_large')

            # ✅ VALIDACIÓN DE TIPO DE ARCHIVO - SOLO PDF Y FOTOS
            allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif']
            file_extension = os.path.splitext(file.filename.lower())[1]

            if file_extension not in allowed_extensions:
                return request.redirect('/my/profile?tab=contract-section&error=invalid_format')

            # Leer el archivo
            file_data = file.read()
            original_filename = file.filename

            # ✅ VERIFICAR TAMAÑO DESPUÉS DE LEER
            if len(file_data) > max_size:
                return request.redirect('/my/profile?tab=contract-section&error=file_too_large')

            # ✅ CODIFICACIÓN SEGURA
            if isinstance(file_data, bytes):
                encoded_file = base64.b64encode(file_data).decode('utf-8')
            else:
                encoded_file = base64.b64encode(file_data.encode() if isinstance(file_data, str) else file_data).decode(
                    'utf-8')

            # Aprobar el contrato
            contract.action_approve_contract(encoded_file, original_filename)

            _logger.info("✅ Contract %s approved by user %s, filename: %s, size: %s bytes",
                         contract.code, request.env.user.name, original_filename, len(file_data))

            return request.redirect('/my/profile?tab=contract-section&success=contract_uploaded')

        except MemoryError:
            _logger.error("❌ Memory error uploading contract %s", contract.code)
            return request.redirect('/my/profile?tab=contract-section&error=file_too_large')
        except Exception as e:
            _logger.error("❌ Error uploading contract: %s", str(e))
            return request.redirect('/my/profile?tab=contract-section&error=upload_error')

    @http.route('/my/contract/download/<int:contract_id>', type='http', auth="user", website=True)
    def download_contract(self, contract_id, **kw):
        """Download contract file - VERSIÓN MEJORADA"""
        try:
            contract = request.env['cem.virtual.contract'].sudo().browse(contract_id)

            # Validaciones de seguridad
            if not contract.exists():
                return request.not_found()

            if contract.partner_id != request.env.user.partner_id:
                return request.not_found()

            if not contract.contract_file:
                return request.not_found()

            # Procesar archivo
            file_content = contract.contract_file

            if isinstance(file_content, str):
                file_data = base64.b64decode(file_content)
            elif isinstance(file_content, bytes):
                file_data = base64.b64decode(file_content)
            else:
                return request.not_found()

            # Obtener nombre de archivo
            file_name = contract.contract_filename or f"contract_{contract.code}"

            # Asegurar extensión correcta
            if not os.path.splitext(file_name)[1]:
                file_name += '.pdf'  # Extensión por defecto

            return request.make_response(
                file_data,
                headers=[
                    ('Content-Type', 'application/octet-stream'),
                    ('Content-Disposition', content_disposition(file_name)),
                    ('Content-Length', str(len(file_data))),
                ]
            )

        except Exception as e:
            _logger.error("❌ Error downloading contract %s: %s", contract_id, str(e))
            return request.not_found()