# fábrica. — Plan de ejecución para China

**Fecha:** 30 de agosto de 2026
**Reúne:** el estudio de backend y el de dominios, en un solo calendario.
**Meta:** el primer comerciante chino que **paga** y **cobra**.

---

## La idea en una página

Fábrica sabe crear una tienda bonita en dos minutos. **No sabe hacer que su
dueño cobre.** Todo lo que sigue está ordenado para cerrar esa distancia, y no
para completar un índice de funcionalidades.

```
HOY                                                          META
tienda creada  →  ???  →  ???  →  ???  →  comerciante que paga
   ✅               ↑       ↑       ↑
                 cobra  despacha  le entran
                                   clientes
```

Dos cosas que **no son código** bloquean todo y hay que arrancarlas esta semana:

1. **Credenciales de 服务商** de WeChat Pay y Alipay. Sin ellas no hay producto.
2. **La decisión sobre la entidad china.** De ella depende si el mini programa
   se puede vender.

Ambas tardan semanas o meses en el mundo real. Cada día que no se empiezan es un
día que se suma al final.

---

## Fase 0 — Decir la verdad · **esta semana**

No es una fase de producto. Es quitar de en medio lo que puede costar un cliente.

| Qué | Por qué |
|---|---|
| Marcar el equipo de IA y Command como demostración, o retirarlos | No existen y la portada los promete |
| El mini programa: avisar de que requiere sujeto chino e ICP para cobrar | Hoy se entrega como si bastara con subirlo |
| El checkout: decir que el pago lo concilia la tienda | Ofrece 微信支付 y no cobra |

**Termina en:** nadie compra esperando lo que no hay.
**Coste:** horas. **Bloqueado por:** nada.

---

## Fase 1 — Que el dinero llegue · **el bloque que decide todo**

Sin esto no hay negocio, solo una demo bonita.

- WeChat Pay y Alipay reales bajo modelo **服务商**: cada tienda con su
  子商户号 y el dinero **directo al comerciante**. Fábrica no toca fondos y por
  tanto no necesita licencia de pago propia — y ese es exactamente el molde con
  el que ya están escritos los manejadores.
- Estado real del pago en el pedido; conciliación.
- Reembolso.

**Termina en:** un comerciante cobra en su cuenta sin tocar nada.
**Bloqueado por:** las credenciales. **El código es lo de menos: faltan dos
funciones y el trámite.**

---

## Fase 2 — Que el pedido salga

- Variantes de verdad (color, talla) con precio, stock y foto propios.
- Envío: zonas simples y las tres reglas que se usan de verdad — gratis a partir
  de X, tarifa fija, por peso.
- Seguimiento visible para el cliente.
- Stock que baja al vender y avisa.

**Termina en:** el comerciante despacha sin salir del panel.

---

## Fase 3 — Que entre gente · **aquí fábrica deja de ser un Shopify pequeño**

El motor del comercio privado chino. Cuatro mecánicas, por orden de lo que
piden:

1. **优惠券** — cupones.
2. **拼团** — compra en grupo: el comprador comparte para completar el grupo.
3. **分销** — reventa con comisión: el motor de adquisición sin publicidad.
4. **秒杀** — flash con contador.

**Termina en:** una campaña que se comparte sola.
**Nota:** ninguna de las cuatro está en el P0 ni el P1 del estudio anterior. En
China son lo que hace que una tienda tenga tráfico.

---

## Fase 4 — Dominio propio

La maquinaria (certificados por tienda, al vuelo) **ya está en producción**.
Faltan tres campos, la verificación TXT y una pantalla.

**Termina en:** `lumina.cn` sirviendo la tienda con su certificado.
**Detalle:** `docs/fabrica-tiendas/dominios-china.md`, §5.

---

## Fase 5 — El primer agente de IA de verdad

Uno solo, bien hecho, antes que tres a medias: **小林, operaciones**. Su trabajo
es aburrido, medible y de bajo riesgo. No 小美, que es la que más se luce y la
que más daño hace si se equivoca delante de un cliente.

- Tres niveles: recomienda / prepara y espera / ejecuta lo autorizado.
- Registro con el antes, el después y deshacer.
- Sobre el MCP que ya existe.

**Bloqueado por:** clave de modelo.
**Requisito previo:** unificar la API. Hoy el panel habla con Vendure por su
lado y el MCP por el suyo; si no se unifica antes, el agente y el panel
divergen.

---

## Fase 6 — Retención

- **会员储值**: saldo prepago. Cobra por adelantado y el cliente vuelve porque
  tiene dinero dentro.
- Clientes: ficha, historial, segmentos simples.

---

## Lo que espera

Analítica avanzada, automatizaciones genéricas, B2B, POS, multi-mercado,
marketplaces, apps, media library. Todo eso está en el P0/P1 del estudio
anterior. **No se toca hasta tener treinta comerciantes de pago.**

Y los extranjeros: la base ya está hecha —tres mercados, moneda por tienda—,
así que abrir fuera de China será cuestión de días cuando toque. No al revés.

---

## Los dos caminos de China

| | Camino A · sin entidad | Camino B · con entidad |
|---|---|---|
| Cuándo | ya | 3–6 meses |
| Coste | 0 | 8.500–14.000 USD |
| Mini programa | capado, sin WeChat Pay pleno | completo |
| Alojamiento | fuera (latencia peor) | continental |
| ICP | no aplica | por tienda, con papeles |

**Recomendación:** Camino A ahora, contado con honestidad. Camino B como
decisión de negocio con fecha, no como requisito técnico. Fábrica no tiene
comerciantes de pago: gastar cinco cifras y cuatro meses antes de la primera
venta es financiar una hipótesis.

---

## Riesgos, y qué hacer con cada uno

| Riesgo | Qué hacer |
|---|---|
| **No conseguir credenciales de 服务商** | Empezar el trámite hoy. Plan B: un agregador autorizado |
| **Sin entidad china** | Decidir con fecha; mientras, no vender lo que no se entrega |
| **Sin clave de modelo** | Conseguirla o retirar la promesa de la portada |
| **Latencia China → Alemania** | Medirla con alguien allí antes de mover el servidor |
| **Construir por índice** | Este plan |

---

## Cómo sabremos que va bien

No por funcionalidades entregadas. Por esto, en orden:

1. Un comerciante cobra **de verdad**, en su cuenta.
2. Un comerciante despacha un pedido sin ayuda.
3. Una campaña de 拼团 trae un cliente que no conocía la tienda.
4. Un comerciante **paga** su segundo mes.

Hasta el punto 1, todo lo demás es preparación.

---

*Detalle en `backend-china-estudio.md` y `dominios-china.md`.*
