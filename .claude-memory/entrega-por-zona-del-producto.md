---
name: entrega-por-zona-del-producto
description: La entrega ya NO usa el modal de zona; cada producto lleva su provincia/municipio de entrega
metadata: 
  node_type: memory
  type: project
  originSessionId: cb90c8a5-95b3-464f-8afd-896816f6cd1a
---

**Cambio de modelo (jun-2026):** se eliminó el modal "Seleccione dirección de envío" (selección de provincia/municipio del cliente al entrar). Antes filtraba el catálogo por la zona elegida (guardada en `session['delivery_city']`). Ahora **la zona la lleva cada producto** y se muestra en su detalle.

Implementación (en `shop-cubaelectronica/pyxel_cubaelectronica_website`):
- **Campos en `product.template`:** `delivery_state_id` (res.country.state) y `delivery_municipality_id` (res.municipality). Editables en el form del producto. Migración: todos los productos existentes quedaron con Provincia = La Habana, municipio vacío.
- **Detalle del producto:** bloque "Entrega en: Provincia – Municipio" (template `cevende_product_delivery_info` que hereda `pyxel_cem_website_sale.product`, antes de `#product_documents`). CSS `.cv-product-delivery`.
- **Modal eliminado:** se DESACTIVÓ la vista `pyxel_cem_delivery_methods.layout` (que SOLO inyecta los 2 modales en el body vía t-call). NO desactivar el modal directamente (`delivery_modal`) → da 500 porque un t-call lo llama. El botón de zona de la cabecera (`select_delivery_zone`) se MANTIENE activo porque el buscador se ancla en él; se oculta por CSS (`.desktop_delivery_button` / `.mobile_delivery_button`).
- **Catálogo muestra todo:** se redefinió `_compute_available_in_delivery_zone` / `_search_available_in_delivery_zone` (product_template.py de mi módulo) para que `available_in_delivery_zone` dependa solo del STOCK, no de la sesión. Así `/shop` muestra todos los productos en existencia sin elegir zona.
- **Costo de envío por zona del producto:** override de `delivery.carrier._compute_order_standard_delivery_price` (models/delivery_carrier.py de mi módulo): suma una tarifa de `warehouse.delivery` por cada municipio distinto entre los productos del carrito. Hoy da 0 (todas las tarifas de La Habana están en 0 = gratis, y los municipios por producto están vacíos).

**Why:** el dueño quería que el cliente no tuviera que elegir zona al entrar; cada producto indica dónde se entrega.
**How to apply:** para que el envío cobre, hay que poner municipio a los productos y precio>0 en `warehouse.delivery`. Ver [[flujo-compra-minorista-mayorista]].
