# Fábrica de Tiendas Online — Diseño v2 y plan por fases

**Estado:** propuesta de diseño v2 (pendiente de aprobación para arrancar el loop)
**Fecha:** 2026-08-27

## 1. Objetivo

Construir la plataforma de una **empresa fábrica de e-commerce** (sociedad en
constitución en China; el dueño opera también con empresas en EE. UU. y España).
El cliente entra a la web de la empresa y, sin salir de la plataforma y solo
con clics desde móvil o PC:

1. **Prueba un demo** de su tienda al instante.
2. **Compra su producto** según el modelo de negocio/plan que escoja.
3. **Construye su tienda** con plantillas configurables por clics.
4. **Compra su dominio** dentro de la plataforma.
5. **Publica en producción** al estilo Cloudflare (hostname + SSL automáticos),
   alojado en servidores **Hetzner** de la empresa.
6. Obtiene un resultado **multiplataforma**: web + PWA instalable + apps
   iOS/Android (por niveles, ver §5).
7. **Monta sus agentes de IA** para operar la tienda.
8. **Gestiona toda la operación**: pedidos, compras, inventario, clientes.

Restricción de calendario: el dueño quiere **lanzar la plataforma en unos
días**, por lo que la Fase 0 del loop es la web pública con el demo funcionando.

Decisiones ya tomadas por el dueño:
- **Mercado:** global (la sede china no implica vender al mercado doméstico
  chino; la plataforma no crea empresas a los clientes).
- **Apps móviles:** modelo por niveles (§5).
- **Pasarela de cobro de la fábrica:** se decide después; el MVP arranca con
  demo gratis y activación manual de planes.
- **Modelos de IA:** la capa agéntica corre sobre modelos chinos (DeepSeek /
  Qwen / Kimi), al mínimo costo, con precio mensual al cliente de
  básico + % de ventas a partir de un umbral (§6.2).

## 2. Stack (investigación agosto 2026)

| Capa | Tecnología | Por qué |
|---|---|---|
| Motor de comercio | **Vendure** (TypeScript, NestJS, GraphQL, MIT) | Channels = multi-tenant nativo: un servidor sirve N tiendas con productos, precios, envíos y administradores propios. Soporta instancia dedicada por cliente si un plan enterprise lo exige. |
| Storefront | **Next.js** multi-tenant | Una app sirve todas las tiendas por hostname; responsive + PWA de serie. |
| Editor visual | **Puck** (MIT, React) | Drag-and-drop con nuestros componentes; plantillas = presets JSON. |
| Web de la empresa + panel Fábrica | Next.js | Landing, planes, registro, demo, wizard de tienda, panel del cliente. |
| Base de datos | PostgreSQL | Conocida por el equipo; nativa en Vendure. |
| Apps móviles | **Expo/React Native + EAS** (app contenedora y apps white-label), PWA | Config dinámica por tenant (`app.config.js`), compilación en la nube y actualizaciones OTA. |
| Dominios | API de registrar revendedor (**OpenSRS / Dynadot / DomainNameAPI**) | Vender y gestionar dominios dentro de la plataforma, marca blanca. |
| Publicación / edge | **Caddy** con on-demand TLS (opcional Cloudflare for SaaS encima) | Custom hostnames + SSL automático a escala (probado con decenas de miles de dominios por máquina). |
| Infraestructura | **Hetzner Cloud** + capa PaaS (**Dokploy o Coolify**) → k3s al escalar | Provisioning por API, deploys reproducibles, coste bajo. |
| Agentes de IA | **MCP + modelos chinos vía router multi-modelo (LiteLLM)** | Un servidor MCP por tienda; agentes sobre DeepSeek / Qwen / Kimi (APIs compatibles OpenAI, contratables desde China) eligiendo siempre el más barato que resuelva. |

**Clave de costes:** "desplegar en producción" NO es un servidor por cliente:
las tiendas comparten la instancia Vendure/storefront (Channels) y publicar =
activar canal + hostname + SSL. Instancia dedicada solo para planes enterprise.

## 3. Arquitectura de la plataforma

```
                    WEB DE LA EMPRESA (Next.js)
   landing · planes por modelo de negocio · registro · "Probar demo"
                              │
              ┌───────────────┼────────────────────┐
              ▼               ▼                    ▼
        PANEL CLIENTE    CONSTRUCTOR          PANEL AGENTES IA
        planes·dominio   wizard + Puck        montar agentes (MCP)
              │               │                    │
              └───────┬───────┴────────────────────┘
                      ▼  Admin API (GraphQL)
              VENDURE (Channels: 1 por tienda)
        productos · pedidos · inventario · compras · clientes
                      │  Shop API
                      ▼
        STOREFRONT Next.js  ──►  PWA  ──►  App contenedora iOS/Android
        (resuelve tenant         (todos)   (todos los planes)
         por hostname)                     App propia white-label (premium)
                      │
                      ▼
        EDGE: Caddy on-demand TLS  ·  DNS/dominios (registrar API)
        INFRA: Hetzner Cloud + Dokploy/Coolify (API de provisioning)
```

### Ciclo de vida del cliente

1. **Demo:** clic en "Probar demo" → tienda sandbox instantánea (canal temporal
   con datos de ejemplo, subdominio efímero, sin tarjeta). Caduca a los N días.
2. **Producto:** escoge plan según su modelo de negocio → la sandbox se
   convierte en su tienda real (mismos datos). MVP: activación manual del pago;
   después, pasarela self-service (pendiente de decisión: Paddle/Airwallex/
   Tropipay).
3. **Producción:** compra o conecta su dominio → DNS + SSL automáticos →
   tienda publicada en Hetzner. Todo sin salir de la plataforma.

## 4. Dominios y publicación estilo Cloudflare

- **Subdominio gratis** (`mitienda.<dominio-fabrica>.com`) en todos los planes.
- **Compra de dominio propio** integrada vía API de registrar revendedor
  (candidatos: OpenSRS, Dynadot, DomainNameAPI; se elige en la fase 4 por
  precios y cobertura de TLDs). Requiere tener resuelto el cobro (o cobro
  manual al inicio).
- **Conectar dominio existente:** el cliente apunta un CNAME/A; Caddy emite el
  certificado on-demand y enruta por hostname.
- Cloudflare for SaaS queda como opción encima si más adelante hace falta
  CDN/anti-DDoS global.

## 5. Multiplataforma: web + iOS + Android

Modelo **por niveles**, compatible con la regla 4.2.6 de Apple (rechaza apps
de plantilla subidas por la fábrica; permite el modelo "contenedora"):

- **Todos los planes:** storefront web responsive + **PWA instalable** con
  icono y push, y presencia en la **app contenedora de la fábrica** (una sola
  app iOS/Android de la empresa, tipo marketplace, donde vive cada tienda).
- **Plan premium:** **app propia white-label** del cliente (Expo + EAS, config
  dinámica por tenant), compilada por la plataforma y publicada con la cuenta
  Apple Developer / Google Play **del propio cliente** (Apple lo exige). OTA
  updates para no recompilar por cada cambio de diseño.

## 6. Agentes de IA (visión agéntica)

Decisión del dueño: la capa agéntica corre sobre **modelos chinos** (DeepSeek,
Qwen, Kimi, GLM), no sobre Anthropic, buscando el mínimo costo. El costo de IA
se traslada al cliente con un precio mensual (ver §6.2).

### 6.1 Arquitectura de agentes

- Cada tienda expone un **servidor MCP** (catálogo, pedidos, inventario,
  clientes como herramientas). MCP es un protocolo abierto y agnóstico del
  modelo: funciona igual con modelos chinos.
- **Router multi-modelo (LiteLLM)** con APIs compatibles OpenAI: por defecto
  el modelo más barato que resuelva la tarea, con la posibilidad de cambiar de
  proveedor cuando bajen los precios (en 2026 los laboratorios chinos han
  recortado precios varias veces).
- Asignación por tarea (precios agosto 2026, por millón de tokens entrada/salida):
  - **Soporte al cliente y operación de pedidos** (el 90 % del volumen):
    DeepSeek V4 (~0,14 / 0,28 USD) o Qwen-Flash (~0,05–0,10 / 0,40 USD).
  - **Redacción de fichas y marketing** (poco volumen, más calidad):
    Qwen-Plus (~0,40 / 1,20 USD) o Kimi K2.5 (~0,60 / 3,00 USD).
- Panel "Agentes": el cliente activa agentes preconfigurados: redactor de
  fichas, atención al cliente, reposición de stock, análisis de ventas.
- Preparación para **vender a agentes compradores** (ACP de Stripe/OpenAI,
  UCP de Google) cuando el mercado lo pida.

### 6.2 Consumo estimado, costo y precio al cliente

Estimación de consumo mensual por tienda (supuestos: conversación de soporte
~16k tokens entrada + 2k salida con contexto; ficha de producto ~2k entrada +
0,6k salida; pedido procesado por agente ~3k entrada + 0,3k salida; análisis
diario ~20–40k tokens):

| Escenario | Actividad mensual | Tokens aprox. | Costo (DeepSeek V4) |
|---|---|---|---|
| Básica | 150 conversaciones, 100 pedidos, 30 fichas, análisis ligero | ~3,4M ent + 0,4M sal | **~0,6 USD/mes** |
| Media | 1.000 conversaciones, 800 pedidos, 100 fichas, análisis diario | ~20M ent + 2,4M sal | **~3,5 USD/mes** |
| Viral | 20.000 conversaciones, 10.000 pedidos, 500 fichas | ~355M ent + 44M sal | **~60 USD/mes** (menos con caché de prompts) |

Conclusión: incluso una tienda viral cuesta decenas de USD al mes en IA. El
margen es enorme si el precio se estructura bien.

**Modelo de precio al cliente (decidido por el dueño: básico + % de ventas):**

1. **Cuota básica mensual** del módulo IA (p. ej. 10–15 USD/mes) que incluye
   una cuota de uso (p. ej. 500 conversaciones + operación completa). Cubre
   ~10–20× el costo real del escenario básico/medio.
2. **A partir de un umbral de ventas** (p. ej. 2.000 USD/mes), se añade un
   **% de ventas** (p. ej. 1–2 %). Una tienda viral genera mucho más ingreso
   por este % de lo que crece su costo de IA (el costo crece sublinealmente
   gracias a caché y modelos baratos).
3. **Blindaje anti-pérdidas** (el costo NUNCA supera el ingreso):
   - Excedente de cuota cobrado por bloques (p. ej. 5 USD por 1.000
     conversaciones extra, cuyo costo real es ~2,5 USD → margen garantizado
     por diseño en cada bloque).
   - Tope de gasto de IA por tienda con degradación elegante (el agente pasa
     a modo económico o cola, nunca factura ilimitado).
   - Los precios de modelos se revisan trimestralmente en el router; si un
     proveedor sube precios, se conmuta a otro sin tocar el producto.

Los números exactos de planes se fijan en la Fase 6 (facturación) con datos
reales de consumo de las primeras tiendas; las cifras anteriores permiten
publicar precios provisionales desde la Fase 0 sin riesgo de pérdida.

## 7. Nota sobre el lanzamiento desde China

Hospedar en Hetzner (fuera de China) no requiere licencia ICP. El acceso desde
China continental suele funcionar pero puede ser lento o inestable (GFW); si
los usuarios en China son relevantes, se probará el acceso real en el
lanzamiento y, de hacer falta, se añade un punto de presencia en Hong Kong o
un CDN con cobertura en Asia. Vender al mercado doméstico chino (ICP, WeChat,
Alipay) queda fuera de alcance salvo decisión futura.

## 8. El loop de trabajo (fases v2)

Cada fase es una vuelta: **implementar → desplegar demo → el dueño la prueba
con clics → feedback → siguiente fase**.

### Fase 0 — Lanzamiento exprés: web de la empresa + demo (días)
- Landing pública: propuesta de valor, planes por modelo de negocio, registro.
- "Probar demo" crea una tienda sandbox al instante (Vendure + storefront con
  2 plantillas, datos de ejemplo, subdominio efímero).
- Deploy real en un servidor Hetzner con Dokploy/Coolify.
- **Demo:** entrar a la web desde un móvil en China y crear una tienda demo.

### Fase 1 — Fábrica MVP: de demo a tienda real
- Registro/login, panel del cliente, wizard completo (nombre, subdominio,
  plantilla, logo, colores).
- Conversión sandbox → tienda persistente; activación manual de planes.
- El cliente gestiona productos y ve pedidos.
- **Demo:** un cliente real crea su tienda de punta a punta desde el móvil.

### Fase 2 — Plantillas y editor visual
- 3–5 plantillas intercambiables; editor Puck embebido (secciones, banners,
  textos, imágenes); publicación instantánea.
- **Demo:** personalizar el diseño completo sin código.

### Fase 3 — Operación completa de e-commerce
- Inventario por tienda, compras a proveedores, flujo de pedido completo,
  métodos de pago de las tiendas (Tropipay + transferencia), envíos, reportes.
- **Demo:** ciclo comprar-vender-reponer completo.

### Fase 4 — Dominios y publicación en producción
- Compra de dominio en la plataforma (API de registrar elegida) + conectar
  dominio propio; Caddy on-demand TLS; pipeline demo → producción.
- **Demo:** publicar una tienda bajo un dominio comprado en la plataforma.

### Fase 5 — Apps móviles
- PWA con push por tienda; app contenedora de la fábrica en App Store/Play;
  generación white-label premium (EAS) con cuenta del cliente.
- **Demo:** la misma tienda como PWA, dentro de la contenedora y como app propia.

### Fase 6 — Facturación self-service de la fábrica
- Integrar la pasarela que se decida (Paddle MoR / Airwallex / Tropipay),
  planes, upgrades, cobro de dominios y hosting.
- **Demo:** alta y pago de un plan sin intervención manual.

### Fase 7 — Capa agéntica
- MCP por tienda + panel de agentes sobre modelos chinos con router
  multi-modelo (§6); medición de consumo real por tienda y ajuste de precios;
  preparación ACP/UCP.
- **Demo:** un agente administra una tienda por instrucciones en lenguaje natural.

## 9. Decisiones pendientes (no bloquean las fases 0–3)

1. **Pasarela de cobro de la fábrica** (necesaria a más tardar en la fase 4
   para vender dominios; la fase 6 la generaliza).
2. **Registrar revendedor de dominios** (se compara en la fase 4).
3. **Dominio raíz de la fábrica** para los subdominios de las tiendas y la web
   de la empresa (hace falta ya en la fase 0).
4. **Nombre/marca de la empresa** para la landing de la fase 0.
