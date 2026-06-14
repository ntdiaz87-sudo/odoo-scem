import logging
import requests
from odoo import api, models, _

_logger = logging.getLogger(__name__)


class Http(models.AbstractModel):
    _inherit = 'ir.http'

    def _verify_request_recaptcha_token(self, action):
        if action in ['signup', 'login']:
            _logger.info(f"Saltando verificación automática de reCAPTCHA para: {action}")
            return True

        return super()._verify_request_recaptcha_token(action)




