import logging
import requests
import werkzeug.utils

from odoo import http, _
from odoo.http import request
from odoo.addons.auth_signup.controllers.main import AuthSignupHome
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class AuthSignupRecaptcha(AuthSignupHome):
    @http.route()
    def web_login(self, *args, **kw):
        """Extiende el login para agregar validación con reCAPTCHA."""
        _logger.info("Entró al controller AuthSignupRecaptcha Login")

        recaptcha_public_key = request.env['ir.config_parameter'].sudo().get_param('recaptcha_public_key')
        recaptcha_private_key = request.env['ir.config_parameter'].sudo().get_param('recaptcha_private_key')

        _logger.info(f"Clave Pública reCAPTCHA: {recaptcha_public_key}")

        if 'g-recaptcha-response' in kw:
            recaptcha_response = kw.get('g-recaptcha-response')

            # Verificar el token de reCAPTCHA con Google
            verify_url = 'https://www.google.com/recaptcha/api/siteverify'
            data = {'secret': recaptcha_private_key, 'response': recaptcha_response}
            result = requests.post(verify_url, data=data).json()

            if result.get('success'):
                # Si reCAPTCHA es válido, proceder con la autenticación
                login = kw.get('login')
                password = kw.get('password')

                if login and password:
                    try:
                        request.session.authenticate(request.env.cr.dbname, login, password)
                        return request.redirect('/web')
                    except Exception:
                        return request.render('web.login', {
                            'error': 'Las credenciales son incorrectas. Por favor, inténtalo de nuevo.',
                            'recaptcha_public_key': recaptcha_public_key
                        })
                else:
                    return request.render('web.login', {
                        'error': 'Por favor, ingresa un nombre de usuario y contraseña.',
                        'recaptcha_public_key': recaptcha_public_key
                    })
            else:
                _logger.warning("Fallo la verificación de reCAPTCHA.")
                return request.render('web.login', {
                    'error': 'La verificación de reCAPTCHA falló. Inténtalo de nuevo.',
                    'recaptcha_public_key': recaptcha_public_key
                })

        # Si no hay reCAPTCHA en la request, renderiza el login normal
        response = super(AuthSignupRecaptcha, self).web_login(*args, **kw)
        _logger.info("hasattr qcontext in response: %s", hasattr(response, 'qcontext'))

        if hasattr(response, 'qcontext'):
            response.qcontext['recaptcha_public_key'] = recaptcha_public_key

        return response


# El captcha para el sign up esta en la pagina del formulario de registro personalizado
    # @http.route('/web/signup', type='http', auth='public', website=True, sitemap=False)
    # def web_auth_signup(self, *args, **kw):
    #     _logger.info("Entró al controller AuthSignupRecaptcha signup!")

    #     # Obtener claves de reCAPTCHA desde los parámetros del sistema
    #     recaptcha_secret_key = request.env['ir.config_parameter'].sudo().get_param('recaptcha_private_key')
    #     recaptcha_public_key = request.env['ir.config_parameter'].sudo().get_param('recaptcha_public_key')

    #     # Verificar si el reCAPTCHA está habilitado y validar la respuesta
    #     if recaptcha_secret_key and 'g-recaptcha-response' in kw:
    #         recaptcha_response = kw.get('g-recaptcha-response')
    #         verify_url = 'https://www.google.com/recaptcha/api/siteverify'
    #         data = {'secret': recaptcha_secret_key, 'response': recaptcha_response}
    #         result = requests.post(verify_url, data=data).json()

    #         if not result.get('success'):
    #             _logger.warning("Validación de reCAPTCHA fallida.")
    #             return request.render('auth_signup.signup', {
    #                 'error': _('La verificación reCAPTCHA falló. Inténtalo nuevamente.'),
    #                 'recaptcha_public_key': recaptcha_public_key
    #             })

    #     else:
    #         _logger.warning("No se encontró el reCAPTCHA en la solicitud.")
    #         return request.render('auth_signup.signup', {
    #             'error': _('Debes completar la verificación reCAPTCHA.'),
    #             'recaptcha_public_key': recaptcha_public_key
    #         })

    #     # Llamar al método original para continuar con el proceso de signup
    #     response = super(AuthSignupRecaptcha, self).web_auth_signup(*args, **kw)

    #     # Obtener el usuario recién creado
    #     login = kw.get('login')
    #     if login:
    #         user = request.env['res.users'].sudo().search([('login', '=', login)], limit=1)
    #         if user:
    #             # Autenticar automáticamente al usuario después del registro
    #             request.session.authenticate(request.env.cr.dbname, login, kw.get('password'))
    #             _logger.info(f"Usuario {login} autenticado automáticamente después del registro.")
    #             return request.redirect('/web')  # Redirigir al portal

    #     return response
