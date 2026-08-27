# Fábrica de Tiendas Online — Diseño y plan por fases

**Estado:** propuesta de diseño (Fase 0 pendiente de OK)
**Fecha:** 2026-08-27

## 1. Objetivo

Construir una **fábrica de tiendas online**: una plataforma donde un cliente,
desde su móvil o PC y solo con clics, crea su propia tienda de e-commerce
básica en minutos, sin contratar una empresa de software. Cada tienda incluye:

- Plantillas de diseño configurables por clics (colores, logo, secciones).
- Catálogo de productos, carrito y checkout.
- Gestión de pedidos de venta, compras a proveedores e inventario.
- Multiplataforma por defecto (web responsive + PWA instalable).

Visión a futuro: la fábrica y las tiendas serán **gestionadas por agentes de
IA**, y evolucionarán hacia **e-commerce agéntico** (tiendas capaces de vender
a agentes compradores mediante protocolos como ACP/UCP/AP2).

## 2. Decisión de tecnología (investigación agosto 2026)

No se construye sobre Odoo. Se evaluaron las plataformas headless open source
líderes (Medusa, Saleor, Vendure, Spree, Bagisto) y los constructores visuales
(Puck, GrapesJS, Webstudio).

### Stack elegido

| Capa | Tecnología | Por qué |
|---|---|---|
| Motor de comercio | **Vendure** (TypeScript, NestJS, GraphQL, MIT) | Sus **Channels** son multi-tenant nativo: un solo servidor sirve N tiendas, cada una con sus productos, precios, envíos, promociones y administradores propios. Es exactamente el modelo "fábrica". |
| Storefront | **Next.js** multi-tenant (React) | Una sola app sirve todas las tiendas por subdominio (`tienda1.midominio.com`); responsive y PWA por defecto → multiplataforma. |
| Editor visual | **Puck** (MIT, React) | Editor drag-and-drop embebible que usa nuestros propios componentes y guarda la página como JSON → las plantillas son presets JSON configurables por clics. |
| Panel "Fábrica" | Next.js (mismo monorepo) | Wizard de alta: nombre, subdominio, plantilla, logo, colores → provisiona el Channel en Vendure vía Admin API. |
| Base de datos | PostgreSQL | Ya la conocemos del proyecto Odoo; Vendure la usa nativamente. |
| Infraestructura | Docker Compose (igual que hoy) | Mismo flujo de trabajo que el proyecto actual; escalable a Kubernetes más adelante. |
| Pagos | Tropipay (experiencia previa en `pyxel_link_payment_tropipay`) + métodos manuales (transferencia) | Contexto Cuba; arquitectura de pagos enchufable para añadir EnZona u otros. |
| Capa agéntica (futuro) | MCP + Claude Agent SDK | Todo es API-first (GraphQL); se expone un servidor MCP por tienda para que agentes de IA la operen. |

### Alternativa considerada y descartada (por ahora)

- **Medusa 2.x**: el framework JS más popular, pero la multi-tenancy no es
  nativa (habría que construir el aislamiento por `store_id` a mano). Vendure
  lo trae de serie con Channels. Si algún día hace falta aislamiento duro,
  Vendure también soporta una instancia + BD por tenant con el mismo código.
- **Odoo multi-website** (módulo `pyxel_multi_website_manager` existente):
  válido para pocas tiendas gestionadas por nosotros, pero no para autoservicio
  masivo por clics ni para gestión por agentes (API menos amigable, escalado
  por instancia pesado).

## 3. Arquitectura

```
                        ┌─────────────────────────────┐
  Cliente (móvil/PC) →  │  FÁBRICA (panel Next.js)    │  "Crear mi tienda" en clics
                        │  wizard + editor Puck       │
                        └──────────┬──────────────────┘
                                   │ Admin API (GraphQL)
                        ┌──────────▼──────────────────┐
                        │  VENDURE (1 servidor)       │  Channels = 1 por tienda
                        │  productos · pedidos ·      │  roles de admin por tenant
                        │  inventario · compras       │
                        └──────────┬──────────────────┘
                                   │ Shop API (GraphQL)
                        ┌──────────▼──────────────────┐
  Comprador (cualquier  │  STOREFRONT (Next.js)       │  tiendaX.midominio.com
  dispositivo) ───────→ │  multi-tenant por subdominio│  PWA instalable
                        │  render de plantilla JSON   │
                        └─────────────────────────────┘

  Futuro: servidor MCP por tienda ←→ agentes IA (gestión y venta agéntica)
```

**Aislamiento de datos:** cada tienda es un Channel de Vendure con sus propios
administradores (roles restringidos al canal). El storefront resuelve el tenant
por hostname. La configuración visual (plantilla JSON de Puck, colores, logo)
vive en una tabla propia de la fábrica indexada por tienda.

**Ubicación del código:** la fábrica es un producto nuevo; se desarrollará en
una carpeta `factory/` de este repositorio (monorepo) para arrancar rápido,
con opción de moverla a repositorio propio cuando madure. El Odoo actual
(cubaelectronica) sigue funcionando aparte, sin tocarse.

## 4. El loop de trabajo (fases)

Cada fase es una vuelta del loop: **implementar → desplegar demo → tú lo
pruebas con clics → feedback → siguiente fase**. Ninguna fase empieza sin
cerrar la demo de la anterior.

### Fase 0 — Cimientos (1 vuelta)
- Monorepo `factory/` con Docker Compose: PostgreSQL + Vendure + storefront.
- Dos tiendas demo precargadas accesibles por subdominios locales.
- **Demo:** levantar con `docker compose up` y ver 2 tiendas distintas.

### Fase 1 — Fábrica MVP: crear tienda en clics
- Wizard público (móvil/PC): registro, nombre de tienda, subdominio,
  plantilla base, logo y colores.
- Provisioning automático: Channel + admin del cliente + datos semilla.
- Tienda navegable al terminar el wizard; el cliente añade productos y ve
  pedidos desde su panel.
- **Demo:** crear una tienda real de punta a punta desde un móvil.

### Fase 2 — Plantillas y editor visual
- 3–5 plantillas (JSON Puck) elegibles y cambiables con un clic.
- Editor Puck embebido: secciones, banners, textos e imágenes por drag-and-drop.
- Publicación instantánea de cambios.
- **Demo:** personalizar el diseño de una tienda sin escribir código.

### Fase 3 — Operación completa de e-commerce
- Inventario con stock por tienda, compras a proveedores y recepción.
- Flujo de pedido completo (pago → preparación → envío → entrega).
- Pagos: Tropipay + transferencia manual; métodos de envío configurables.
- Reportes básicos de ventas.
- **Demo:** ciclo completo comprar-vender-reponer en una tienda.

### Fase 4 — Multiplataforma reforzada
- PWA instalable con icono y notificaciones push por tienda.
- Evaluar app nativa generada por tienda (Capacitor/Expo) si hace falta.
- **Demo:** instalar una tienda como app en un móvil.

### Fase 5 — Capa agéntica
- Servidor MCP por tienda (catálogo, pedidos, inventario como herramientas).
- Agentes operadores (Claude Agent SDK): describir productos, responder
  clientes, reponer stock.
- Preparación para vender a agentes compradores (ACP/UCP) cuando el mercado
  lo pida.
- **Demo:** un agente de IA administra una tienda por instrucciones en
  lenguaje natural.

## 5. Preguntas abiertas (no bloquean la Fase 0)

1. **Hosting:** ¿dónde vivirá la fábrica en producción? (VPS propio, cloud;
   afecta a dominios wildcard y a las push notifications).
2. **Dominio:** ¿qué dominio raíz usaremos para los subdominios de las tiendas?
3. **Pagos:** ¿Tropipay es el objetivo principal? ¿Hace falta EnZona /
   Transfermóvil desde el inicio o basta transferencia manual en el MVP?
4. **Modelo de negocio:** ¿las tiendas pagarán suscripción desde el inicio?
   (afecta a si la Fase 1 incluye planes/facturación de la fábrica).
