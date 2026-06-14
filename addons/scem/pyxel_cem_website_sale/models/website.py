# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.http import request
from odoo.exceptions import ValidationError
from odoo.osv import expression
import re
import logging

_logger = logging.getLogger(__name__)


class Website(models.Model):
    _inherit = 'website'

    mobile_number = fields.Char(string='Whatsapp number')
    acreditation_url = fields.Char(
        string="Accreditation URL",
        help="URL for the accreditation process in the CRM.",
    )
    immediate_payment = fields.Boolean(string='Habilitar pago inmediato para personas naturales')

    import_request_url = fields.Char(
        string='URL de solicitud de importación',
        help='URL para solicitudes de importación (solo para productos in-bond)'
    )

    @api.constrains('import_request_url')
    def _check_import_request_url(self):
        for record in self:
            if record.import_request_url:
                # Patrón para validar URLs (permite con y sin protocolo)
                url_pattern = re.compile(
                    r'^(https?://)?'  # http:// o https:// (opcional)
                    r'([A-Za-z0-9-]+\.)+[A-Za-z]{2,}'  # dominio
                    r'(:[0-9]+)?'  # puerto opcional
                    r'(/.*)?$',  # ruta opcional
                    re.IGNORECASE
                )

                if not url_pattern.match(record.import_request_url):
                    raise ValidationError("Por favor ingrese una URL válida")

    @api.model
    def _format_price_es(self, price, currency_symbol=''):
        """Formatea un precio con formato español (punto para miles, coma para decimales)"""
        if not price:
            price = 0.0

        # Formatear con separador de miles (punto) y decimales (coma)
        formatted = f"{price:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        if currency_symbol:
            return f"{currency_symbol} {formatted}"
        return formatted

    @api.model
    def _parse_price_es(self, price_str):
        """Parsea un string con formato español a número"""
        if not price_str:
            return 0.0
        # Eliminar símbolo de moneda y espacios
        cleaned = price_str.replace("CUP", "").replace("€", "").replace("$", "").strip()
        # Eliminar puntos de miles y reemplazar coma decimal por punto
        cleaned = cleaned.replace(".", "").replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    # ------------------------------------------------------------------
    # Pricelist — fuente de verdad: sesión del servidor
    # ------------------------------------------------------------------

    def _get_current_pricelist(self):
        """
        Prioridad estricta en contexto web:
          1. Sesión HTTP  (website_sale_current_pl)
          2. Default del website  (website.pricelist_id o primera disponible)

        NUNCA llama a super() en contexto web porque super() lee
        partner_id.property_product_pricelist, que es la pricelist del cliente,
        y eso pisa la selección manual del usuario.

        super() solo se usa cuando no hay request (cron, shell, etc.).
        """
        self.ensure_one()

        # Sin contexto HTTP → comportamiento nativo de Odoo (cron, shell…)
        try:
            session = request.session
        except RuntimeError:
            return super()._get_current_pricelist()

        available = self.get_pricelist_available(show_visible=True)
        if not available:
            # Sin pricelists disponibles: dejar que Odoo maneje el caso
            return super()._get_current_pricelist()

        # 1. Leer sesión
        session_pl_id = session.get('website_sale_current_pl')
        if session_pl_id:
            pl = self.env['product.pricelist'].sudo().browse(session_pl_id)
            if pl.exists() and pl in available:
                return pl
            # La pricelist de sesión ya no existe o dejó de estar disponible
            _logger.warning(
                "_get_current_pricelist: pl %s inválida para website %s, limpiando sesión",
                session_pl_id, self.id,
            )
            session.pop('website_sale_current_pl', None)

        # 2. Default del website — NUNCA del partner
        default_pl = (
            self.pricelist_id
            if self.pricelist_id and self.pricelist_id in available
            else available[0]
        )
        session['website_sale_current_pl'] = default_pl.id
        session.modified = True
        _logger.debug(
            "_get_current_pricelist: sin sesión → inicializando con website default %s (%s)",
            default_pl.id, default_pl.currency_id.name,
        )
        return default_pl

    def sale_get_order(self, *args, **kwargs):
        """
        Garantiza que la orden de carrito siempre use la pricelist de sesión,
        incluso cuando update_pricelist=True intenta pisarla con la del partner.

        Flujo:
          1. Asegurar que la sesión tenga una pricelist válida ANTES del super().
          2. Llamar super() (puede cambiar la pricelist de la orden).
          3. Re-aplicar la pricelist de sesión si fue pisada.
        """
        try:
            session = request.session
        except RuntimeError:
            return super().sale_get_order(*args, **kwargs)

        # Paso 1: garantizar sesión inicializada
        session_pl_id = session.get('website_sale_current_pl')
        if not session_pl_id:
            # _get_current_pricelist escribe en sesión como side-effect
            self._get_current_pricelist()
            session_pl_id = session.get('website_sale_current_pl')

        # Paso 2: llamar al super (puede pisar la pricelist)
        order = super().sale_get_order(*args, **kwargs)
        if not order:
            return order

        # Paso 3: re-aplicar si fue pisada
        if session_pl_id and order.pricelist_id.id != session_pl_id:
            pl = self.env['product.pricelist'].sudo().browse(session_pl_id)
            if pl.exists():
                order.sudo().write({'pricelist_id': pl.id})
                order.sudo().invalidate_recordset(['amount_untaxed', 'amount_tax', 'amount_total'])
                _logger.debug(
                    "sale_get_order: restaurando pricelist %s (%s) en orden %s",
                    pl.id, pl.currency_id.name, order.name,
                )

        return order

    # ------------------------------------------------------------------
    # Resto del modelo — sin cambios funcionales
    # ------------------------------------------------------------------

    def sale_product_domain(self):
        original_domain = super().sale_product_domain()
        provider_domain = []
        category_domain = []
        try:
            if request and hasattr(request, 'httprequest') and request.httprequest:
                provider_id = request.httprequest.args.get('provider')
                if provider_id and provider_id.isdigit():
                    provider_domain = [('provider_id', '=', int(provider_id))]
                category_id = request.httprequest.args.get('category')
                if category_id and category_id.isdigit():
                    category_domain = [('public_categ_ids', 'in', int(category_id))]
        except RuntimeError:
            pass

        combined = original_domain
        if provider_domain:
            combined = expression.AND([combined, provider_domain])
        if category_domain:
            combined = expression.AND([combined, category_domain])
        return combined

    def _search_get_details(self, search_type, order, options):
        result = super()._search_get_details(search_type, order, options)
        if search_type in ['products', 'products_only', 'all']:
            if 'nom_code' in self.env['product.template']._fields:
                for detail in result:
                    if detail.get('model') == 'product.template':
                        detail['search_fields'].append('nom_code')
        return result
