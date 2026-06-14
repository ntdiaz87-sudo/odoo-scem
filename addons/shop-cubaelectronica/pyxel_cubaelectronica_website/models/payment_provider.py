# -*- coding: utf-8 -*-
from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class PaymentProvider(models.Model):
    _inherit = 'payment.provider'

    # ── Configuración del paso de pago de la tienda CEVENDE ──
    cv_in_checkout = fields.Boolean(
        string="Mostrar en checkout CEVENDE", default=False,
        help="Si está marcado, este mecanismo aparece en el paso de pago de la tienda "
             "(minorista y mayorista).")
    cv_display_name = fields.Char(
        string="Nombre en checkout",
        help="Nombre mostrado al cliente en el paso de pago. Si se deja vacío se usa "
             "el nombre del proveedor.")
    cv_requires_proof = fields.Boolean(
        string="Pedir comprobante de pago", default=False,
        help="Muestra una vista con las instrucciones de pago y permite al cliente subir "
             "el comprobante (transferencia bancaria, Zelle).")
    cv_instructions = fields.Html(
        string="Instrucciones de pago", translate=True, sanitize=False,
        help="Datos/instrucciones que se muestran al cliente al elegir este mecanismo: "
             "número de cuenta bancaria, correo o teléfono de Zelle, etc.")
    cv_sort = fields.Integer(string="Orden en checkout", default=10)

    @api.model
    def _cevende_setup_payment_methods(self):
        """Prepara los mecanismos de pago del checkout CEVENDE de forma idempotente:
        marca Transferencia, Tropipay y Laberinto ('Pasarela del Parque'), y crea el
        proveedor Zelle copiando el de Transferencia si aún no existe. Solo asigna
        valores por defecto cuando el campo está vacío (no pisa lo que el usuario
        haya editado en Odoo)."""
        ref = self.env.ref

        def marca(provider, display, requires_proof, sort, instr=None):
            if not provider:
                return
            vals = {'cv_in_checkout': True, 'cv_requires_proof': requires_proof, 'cv_sort': sort}
            if not provider.cv_display_name:
                vals['cv_display_name'] = display
            if instr and not provider.cv_instructions:
                vals['cv_instructions'] = instr
            provider.write(vals)

        transfer = ref('payment.payment_provider_transfer', raise_if_not_found=False)
        marca(transfer, 'Transferencia bancaria', True, 10,
              '<p>Realiza una transferencia bancaria a la siguiente cuenta y sube el '
              'comprobante para que verifiquemos tu pago:</p>'
              '<p><strong>Banco:</strong> —<br/>'
              '<strong>Titular:</strong> —<br/>'
              '<strong>Número de cuenta:</strong> —</p>')

        tpp = ref('pyxel_link_payment_tropipay.payment_provider_upi', raise_if_not_found=False)
        marca(tpp, 'Pasarela de pago Tropipay', False, 20)

        lbto = ref('pyxel_lbto_payment_gateway.payment_provider_lbto', raise_if_not_found=False)
        marca(lbto, 'Pasarela del Parque', False, 30)

        # Zelle: no existe como proveedor; se crea copiando el de transferencia
        # (así hereda todos los campos requeridos) la primera vez.
        zelle = ref('pyxel_cubaelectronica_website.payment_provider_zelle', raise_if_not_found=False)
        if not zelle and transfer:
            try:
                # Se resetean los campos cv_* del copiado para que se rellenen
                # como Zelle (si no, heredaría el nombre/instrucciones de transfer).
                zelle = transfer.copy({
                    'name': 'Zelle', 'state': 'enabled',
                    'cv_in_checkout': False, 'cv_display_name': False,
                    'cv_instructions': False, 'cv_requires_proof': False,
                })
                self.env['ir.model.data'].create({
                    'module': 'pyxel_cubaelectronica_website',
                    'name': 'payment_provider_zelle',
                    'model': 'payment.provider',
                    'res_id': zelle.id,
                    'noupdate': True,
                })
            except Exception as e:
                _logger.warning("No se pudo crear el proveedor Zelle: %s", e)
                zelle = False
        marca(zelle, 'Zelle', True, 40,
              '<p>Envía el pago por Zelle a la siguiente cuenta y sube el comprobante '
              'para que verifiquemos tu pago:</p>'
              '<p><strong>Nombre:</strong> —<br/>'
              '<strong>Correo/Teléfono Zelle:</strong> —</p>')
