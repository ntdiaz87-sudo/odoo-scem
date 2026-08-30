# Arquitectura de módulos

## Las dos puertas

La plataforma tiene dos públicos opuestos. Cada uno entra por su sitio y ve
un producto distinto, sobre la misma base de datos.

| | Puerta del comprador | Puerta del proveedor |
|---|---|---|
| **Ruta** | `/` | `/suppliers` |
| **Quién** | Empresa cubana, importador, mayorista | Fabricante chino, OEM/ODM, marca |
| **Idioma** | Español | 中文 e inglés |
| **Qué quiere** | Encontrar producto, cotizar, importar | Vender, y saber qué demanda Cuba |
| **Gancho** | Catálogo y contenedor MIX | Cobra en su banco en China |
| **Estado** | En diseño | Pendiente |

## Aplicaciones estándar de Odoo

Se instalan de Odoo y no se reescriben:

| Módulo | Para qué |
|---|---|
| `website` | Sitio público |
| `website_sale` | Catálogo y descubrimiento de producto |
| `sale_management` | Cotizaciones y pedidos |
| `purchase` | Compra al proveedor chino |
| `stock` | Almacén, volumen y peso (base del contenedor MIX) |
| `crm` | Captación por ambas puertas |
| `account` | Facturación e incoterms |
| `delivery` | Distribución nacional en Cuba |
| `website_sale_wishlist` | Favoritos |
| `website_sale_comparison` | Comparación de productos |

## Módulos propios

| Módulo | Responsabilidad | Estado |
|---|---|---|
| `pyxel_trade_core` | Proveedores, puertos, MOQ, incoterms, señal de demanda y compatibilidad eléctrica | **Escrito** |
| `pyxel_trade_marketplace` | Home pública, descubrimiento, ficha de producto y de proveedor | Espera diseño |
| `pyxel_trade_rfq` | Solicitudes de cotización y comparación de ofertas | Pendiente |
| `pyxel_trade_container` | Mixed Container Builder: volumen, peso, consolidación | Pendiente |
| `pyxel_trade_operations` | Operación de importación con línea de tiempo | Pendiente |
| `pyxel_trade_intelligence` | Cuba Market Pulse | Pendiente |
| `pyxel_trade_supplier` | Puerta del proveedor chino y su panel | Pendiente |

## Decisiones tomadas

**Reutilizar antes que duplicar.** El proveedor de un producto y su plazo de
entrega salen de `product.supplierinfo`, que ya existe. El volumen y el peso
para calcular el contenedor salen de los campos `volume` y `weight` de
`product.template`. No se crean campos paralelos.

**El proveedor es un `res.partner`.** No un modelo aparte: necesita facturas,
pedidos de compra y mensajería, y todo eso ya cuelga del contacto.

**El precio publicado es un rango indicativo.** Se guarda en
`pyxel_price_min` / `pyxel_price_max`, separado de `list_price`, para no
interferir con la venta normal de Odoo. El precio en firme sale de la
cotización.

**La compatibilidad eléctrica se calcula, no se teclea.** Se introduce la
especificación real del producto (`pyxel_power_spec`) y el sistema deriva la
compatibilidad con Cuba. Así nadie puede marcar "compatible" a mano.

| Especificación | Compatibilidad en Cuba |
|---|---|
| 110 V / 60 Hz | Compatible |
| Multitensión 100–240 V, 50/60 Hz | Compatible |
| 220 V / 60 Hz | Compatible parcial |
| **220 V / 50 Hz** (estándar chino) | **Requiere adaptación** |
| Sin componente eléctrico | No aplica |

## Riesgo abierto: la localización cubana

`l10n_cu` existe en este repositorio para Odoo 17. Para facturar en Cuba hace
falta en Odoo 19, y **no está comprobado que exista una versión migrada**. Si
no la hay, migrarla es trabajo previo a facturar, no algo que se resuelva
sobre la marcha. Conviene verificarlo pronto.
