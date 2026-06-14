# -*- coding: utf-8 -*-
from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    def get_alternative_products_data(self):
        """
        Método que retorna toda la información necesaria para mostrar
        productos alternativos de forma dinámica
        """
        self.ensure_one()

        products_data = []


        for alt_product in self.alternative_product_ids[:8]:
            # Obtener información de precio (método correcto para Odoo 17)
            price_info = self._get_price_info(alt_product)

            # Obtener la primera categoría pública
            category_name = alt_product.public_categ_ids[0].name if alt_product.public_categ_ids else 'Sin Categoría'

            # Calcular días de entrega
            delivery_days = self._get_delivery_days(alt_product)

            # Información de stock
            stock_info = self._get_stock_info(alt_product)

            # WhatsApp message personalizado
            whatsapp_message = self._get_whatsapp_message(alt_product)

            product_data = {
                'id': alt_product.id,
                'name': alt_product.name,
                'url': alt_product.website_url or f'/shop/product/{alt_product.id}',
                'image_url': f'/web/image/product.template/{alt_product.id}/image_256',

                # Precios
                'price': price_info['price'],
                'list_price': price_info['list_price'],
                'has_discount': price_info['has_discount'],
                'currency_symbol': alt_product.currency_id.symbol or '$',

                # Stock y disponibilidad
                'qty_available': int(alt_product.qty_available) if alt_product.qty_available > 0 else 0,
                'is_available': alt_product.qty_available > 0,
                'stock_message': stock_info['message'],
                'stock_class': stock_info['class'],

                # Orden mínima
                'min_qty': self._get_min_qty(alt_product),
                'has_min_qty': self._get_min_qty(alt_product) > 1,

                # Categoría
                'category': category_name,
                'category_color': self._get_category_color(
                    alt_product.public_categ_ids[0]) if alt_product.public_categ_ids else '#FFF3CD',

                # Entrega
                'delivery_days': delivery_days,
                'delivery_text': f"{delivery_days} días" if delivery_days else "Consultar",
                'show_truck_icon': bool(delivery_days),

                # WhatsApp
                'whatsapp_url': whatsapp_message,

                # Rating
                'rating': self._get_product_rating(alt_product),

                # Badges/Etiquetas especiales
                'badges': self._get_product_badges(alt_product),

                # Atributos adicionales
                'is_published': alt_product.is_published,
                'is_new': self._is_new_product(alt_product),
                'has_variants': len(alt_product.product_variant_ids) > 1,
            }

            products_data.append(product_data)

        return products_data

    def _get_price_info(self, product):
        """
        Obtiene información de precio (compatible con Odoo 17)
        """
        try:
            # Obtener precio con pricelist si está disponible
            pricelist = self.env.context.get('pricelist')
            if pricelist:
                pricelist_obj = self.env['product.pricelist'].browse(pricelist)
                price = pricelist_obj._get_product_price(product, 1.0)
            else:
                price = product.list_price

            # Verificar si hay descuento
            has_discount = False
            if hasattr(product, 'compare_list_price') and product.compare_list_price:
                has_discount = product.compare_list_price > price
                list_price = product.compare_list_price
            else:
                list_price = product.list_price

            return {
                'price': price,
                'list_price': list_price,
                'has_discount': has_discount,
            }
        except Exception as e:
            _logger.warning(f"Error getting price info for {product.name}: {e}")
            return {
                'price': product.list_price,
                'list_price': product.list_price,
                'has_discount': False,
            }

    def _get_min_qty(self, product):
        """
        Obtiene la cantidad mínima de venta
        """
        # Intentar obtener de sale_min_qty (si existe el módulo sale)
        if hasattr(product, 'sale_min_qty') and product.sale_min_qty > 1:
            return int(product.sale_min_qty)

        # Intentar obtener de packaging
        if hasattr(product, 'packaging_ids') and product.packaging_ids:
            return int(product.packaging_ids[0].qty)

        return 1

    def _get_delivery_days(self, product):
        """
        Calcula los días de entrega basado en diferentes fuentes
        """
        try:
            # 1. Si el producto tiene tiempo de manufactura
            if hasattr(product, 'produce_delay') and product.produce_delay:
                return int(product.produce_delay)

            # 2. Si el producto tiene proveedor con tiempo de entrega
            if hasattr(product, 'seller_ids') and product.seller_ids:
                seller = product.seller_ids[0]
                if hasattr(seller, 'delay') and seller.delay:
                    return int(seller.delay)

            # 3. Valor por defecto
            if hasattr(self.env.company, 'security_lead'):
                return int(self.env.company.security_lead) if self.env.company.security_lead else 10

            return 10
        except Exception as e:
            _logger.warning(f"Error getting delivery days: {e}")
            return 10

    def _get_stock_info(self, product):
        """
        Retorna información de stock con mensaje y clase CSS
        """
        qty = product.qty_available

        if qty <= 0:
            return {
                'message': 'Sin stock',
                'class': 'text-danger'
            }
        elif qty < 10:
            return {
                'message': f'¡Solo {int(qty)} disponibles!',
                'class': 'text-warning'
            }
        else:
            return {
                'message': f'{int(qty)} Unidades disponibles',
                'class': 'text-success'
            }

    def _get_whatsapp_message(self, product):
        """
        Genera URL de WhatsApp con mensaje personalizado
        """
        try:
            company_phone = self.env.company.phone or ''
            # Limpiar el teléfono (solo números)
            phone = ''.join(filter(str.isdigit, company_phone))

            message = f"Hola, me interesa: {product.name} - ${product.list_price:.2f}"

            # URL encode del mensaje
            import urllib.parse
            encoded_message = urllib.parse.quote(message)

            if phone:
                return f"https://wa.me/{phone}?text={encoded_message}"
            else:
                return f"https://wa.me/?text={encoded_message}"
        except Exception as e:
            _logger.warning(f"Error generating WhatsApp URL: {e}")
            return f"https://wa.me/?text=Hola"

    def _get_category_color(self, category):
        """
        Retorna color del badge según la categoría
        """
        color_map = {
            'Frutas': '#FFF3CD',
            'Verduras': '#D4EDDA',
            'Carnes': '#F8D7DA',
            'Lácteos': '#D1ECF1',
            'Panadería': '#FCE8D0',
        }

        # Si la categoría tiene un campo de color personalizado
        if hasattr(category, 'badge_color') and category.badge_color:
            return category.badge_color

        # Buscar en el mapa de colores
        return color_map.get(category.name, '#FFF3CD')

    def _get_product_rating(self, product):
        """
        Obtiene el rating del producto si está disponible
        """
        try:
            if hasattr(product, 'rating_avg') and product.rating_avg:
                return {
                    'average': round(product.rating_avg, 1),
                    'count': product.rating_count if hasattr(product, 'rating_count') else 0,
                    'stars': int(product.rating_avg),
                }
        except Exception as e:
            _logger.warning(f"Error getting rating: {e}")

        return None

    def _get_product_badges(self, product):
        """
        Retorna badges/etiquetas especiales del producto
        """
        badges = []

        try:
            # Nuevo (menos de 30 días)
            if self._is_new_product(product):
                badges.append({
                    'text': 'Nuevo',
                    'class': 'badge-success',
                    'color': '#28a745'
                })

            # En oferta (ribbon de website)
            if hasattr(product, 'website_ribbon_id') and product.website_ribbon_id:
                ribbon_text = product.website_ribbon_id.html if hasattr(product.website_ribbon_id, 'html') else 'Oferta'
                badges.append({
                    'text': ribbon_text,
                    'class': 'badge-danger',
                    'color': '#dc3545'
                })

            # Producto destacado
            if hasattr(product, 'is_featured') and product.is_featured:
                badges.append({
                    'text': 'Destacado',
                    'class': 'badge-primary',
                    'color': '#007bff'
                })

            # Envío gratis
            if hasattr(product, 'free_delivery') and product.free_delivery:
                badges.append({
                    'text': 'Envío Gratis',
                    'class': 'badge-info',
                    'color': '#17a2b8'
                })
        except Exception as e:
            _logger.warning(f"Error getting badges: {e}")

        return badges

    def _is_new_product(self, product):
        """
        Verifica si el producto es nuevo (menos de 30 días)
        """
        try:
            if not product.create_date:
                return False

            from datetime import datetime, timedelta
            thirty_days_ago = datetime.now() - timedelta(days=30)

            # Manejar timezone
            create_date = product.create_date
            if hasattr(create_date, 'replace'):
                create_date = create_date.replace(tzinfo=None)

            return create_date > thirty_days_ago
        except Exception as e:
            _logger.warning(f"Error checking if product is new: {e}")
            return False