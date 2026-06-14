# -*- coding: utf-8 -*-
#############################################################################
#
#   TropiPay.
#   soporte@tropipay.com
#
#
#############################################################################

import logging
import requests
from datetime import timedelta
import pytz
# from dateutil import parser

from odoo import fields, models, api, _
from odoo.exceptions import UserError
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT

from odoo.addons.pyxel_link_payment_tropipay.const import API_URLS, token_action, payment_action, TROPIPAY_CODE

_logger = logging.getLogger(__name__)


class PaymentProvider(models.Model):
    _inherit = 'payment.provider'

    code = fields.Selection(
        selection_add=[(TROPIPAY_CODE, "Tropipay Payment")],
        ondelete={TROPIPAY_CODE: 'set default'}
    )
    client_id = fields.Char(string='Client Id')
    client_secret = fields.Char(string='Password')

    def get_tpp_provider(self):
        return self.search([('code', '=', TROPIPAY_CODE)])

    def _get_tropipay_api_url(self, action=payment_action):
        self.ensure_one()
        environment = 'production' if self.state == 'enabled' else 'test'
        return API_URLS[environment][action]

    def _get_tropipay_pay_tpp_url(self):
        """ Obtener la url para generar el link de pago por Tropipay.
        """

        return self._get_tropipay_api_url(action=payment_action)

    def _tropipay_get_token_url(self):
        return self._get_tropipay_api_url(action=token_action)

    @api.model
    def _get_payment_method_information(self):
        res = super()._get_payment_method_information()
        res[TROPIPAY_CODE] = {'mode': 'unique', 'domain': [('type', '=', 'bank')]}
        return res

    def _get_tropipay_login_response(self):
        tpp_provider = self.get_tpp_provider()
        url = f"{tpp_provider._tropipay_get_token_url()}"
        try:
            response = requests.post(url, json={
                "grant_type": "client_credentials",
                "client_id": f"{tpp_provider.client_id}",
                "client_secret": f"{tpp_provider.client_secret}",
            })
            data = response.json()
            if response.status_code != requests.codes.ok:
                raise UserError(f'STATUS CODE: {response.status_code} ({str(data)})')

        except UserError as e:
            _logger.error(f"ERROR:  {e.__str__()}")
            raise e
        except requests.ConnectionError as e:
            _logger.error(f"ERROR:  {e.__str__()}")
            raise UserError(_("Failed connection. Please, check your connection to Tropipay."))
        except Exception as e:
            _logger.error(f"ERROR:  {e.__str__()}")
            raise UserError("Failed connection.")

        return data

    def _get_tropipay_token(self):
        """Retorna una tupla (token_type, access_token)"""
        res = self._get_tropipay_login_response()
        return res.get('token_type'), res.get('access_token')

    def _check_tpp_credentials(self):
        if not self.client_id or not self.client_secret:
            raise ValueError(_("Please configure the Tropipay credentials."))

    def test_connection_2_tropipay(self):
        """Prueba la conexión con la API utilizando las credenciales configuradas."""
        self.ensure_one()

        if self.code != TROPIPAY_CODE:
            return
        self._check_tpp_credentials()
        try:
            token = self._get_tropipay_token()
        except Exception as e:
            raise UserError(str(e))

        if token:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _("Successful Connection"),
                    'message': _("The connection test was successful."),
                    'type': 'success',
                    'sticky': False,
                }
            }
        else:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _("Failed Connection"),
                    'message': _("Unable to establish a connection. Please check your credentials."),
                    'type': 'danger',
                    'sticky': False,
                }
            }

    def _generate_pay_tpp_link(self, **kwargs):
        """Generación del link de pago por Tropipay para el usuario comprador"""
        tpp_provider = self.get_tpp_provider()
        if not tpp_provider:
            return

        try:
            odoo_base_url = self.env['ir.config_parameter'].get_param('web.base.url')
            token_type, token = self._get_tropipay_token()
            pay_tpp_url = self._get_tropipay_pay_tpp_url()
            headers = {
                "Accept": 'application/json',
                "Content-Type": 'application/json',
                "Authorization": f'{token_type} {token}'
            }
            client_data = kwargs.get('client', {})
            lang_ = kwargs.get('lang', '')
            if lang_:
                lang_tkns = lang_.split('_') or lang_.split('-') or lang_.split('@')
                lang_ = lang_tkns and lang_tkns[0] or ''
            if not lang_:
                raise UserError(_("Must specify language in partner data."))
            phone = client_data.get('phone')
            if not phone:
                raise UserError(_("Must specify phone in partner data."))
            address = client_data.get('address')
            if not address:
                raise UserError(_("Must spcify address in client data."))
            country_iso = client_data.get('countryIso')
            if not country_iso:
                raise UserError(_("Must spcify country in client data."))
            tz = client_data.get('client_tz') or self.env.user.tz or 'UTC'
            exp_date_local = fields.Datetime.now() + timedelta(hours=self.env.company.link_exp_hours)
            exp_date_tpp = exp_date_local.replace(tzinfo=pytz.UTC).astimezone(pytz.timezone(tz)).replace(tzinfo=None)
            # Por si la plataforma tropipay está en otra zona horaria
            exp_date_tpp = exp_date_tpp + timedelta(hours=self.env.company.time_diff)
            payload = {
                "reference": kwargs.get('reference'),
                "concept": kwargs.get('concept'),
                "favorite": True,
                "description": kwargs.get('description'),
                # > En Tropipay el amount se expresa en centavos
                "amount": round(kwargs.get('amount') * 100, 2),
                "currency": kwargs.get('currency'),
                "singleUse": True,
                "reasonId": 34,
                # "expirationDays": 3,
                "expirationDate": exp_date_tpp.strftime(DEFAULT_SERVER_DATETIME_FORMAT),
                "lang": lang_,

                # TODO ver cómo configurar
                # "urlNotification": f"{odoo_base_url}/tpp/webhook",

                'directPayment': False,
                "client": {
                    "name": client_data.get('name'),
                    "lastName": client_data.get('lastName'),
                    "address": address,
                    "phone": phone,
                    "email": client_data.get('email'),
                    "countryIso": country_iso,
                    "termsAndConditions": client_data.get('termsAndConditions'),
                    "city": client_data.get('city'),
                    "postCode": client_data.get('postCode'),
                    "dateOfBirth": client_data.get('dateOfBirth')
                },
                "paymentMethods": [
                    "EXT",
                    "TPP"
                ],
                'serviceDate': fields.Date.today().strftime("%Y-%m-%d")
            }
            response = requests.post(pay_tpp_url, json=payload, headers=headers)
            pay_link = None
            if response.status_code == requests.codes.ok:
                tpp_res = response.json()
                pay_link = tpp_res.get('shortUrl')
                # exp_date = tpp_res.get('expirationDate')
                # if exp_date:
                #     try:
                #         exp_date = parser.parse(exp_date, ignoretz=True)
                #     except:
                #         pass
            if not pay_link:
                raise UserError(_("The link generation failed. %s", response.json().get('error')))
            return {'pay_link': pay_link, 'exp_date': exp_date_local}
        except Exception as e:
            raise UserError(str(e))
