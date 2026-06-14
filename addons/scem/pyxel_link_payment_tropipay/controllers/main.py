# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import logging

from odoo import http, tools, _
from odoo.http import request
from http import HTTPStatus

_logger = logging.getLogger(__name__)


def get_webhook_request_payload():
    if not request:
        return None
    try:
        payload = request.get_json_data()
    #  data = json.loads(request.httprequest.data)
        _logger.info(f"    >>>>Data received from Webhook")
        _logger.info("     >>>>> %s", payload)
    except ValueError:
        payload = {**request.httprequest.args}
        _logger.error(f"    PAYLOAD ERROR:  {payload}")
    return payload


class WebHookController(http.Controller):

    @http.route(['/tpp/webhook'], type='json', auth='public', methods=['POST'], csrf=False)
    def webhook_listener(self):
        tpp_header = request.httprequest.headers.get(
            'x-tropipay-signature')
        try:
            data = get_webhook_request_payload()
        except Exception: # noqa: BLE001
            return request.make_json_response({'status': 'error'}, status=HTTPStatus.INTERNAL_SERVER_ERROR)
        return request.make_json_response({'status': 'ok'}, status=HTTPStatus.OK)
