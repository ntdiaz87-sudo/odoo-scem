# Qué backend necesita de verdad una tienda de fábrica. en China

**Fecha:** 30 de agosto de 2026
**Escrito desde:** el código desplegado y el comerciante chino real, no desde el
índice de Shopify.

Segundo estudio sobre el mismo tema. Coincido con el anterior en el principio
—un commerce core operable por interfaz y por lenguaje natural, sobre las mismas
APIs— y discrepo en casi todo lo demás.

---

## 0. En qué discrepo, y por qué importa

El estudio anterior es un **inventario de funcionalidades de Shopify traducido
al chino**. Está bien ordenado y es útil como lista de comprobación a tres años.
Como plan, tiene tres fallos que lo hacen inejecutable.

### 1. Su propio P0 es Shopify entero

Dice, con razón, que fábrica «no debe ser una copia de Shopify con cientos de
pantallas». Y a continuación propone un árbol de **17 secciones** y un P0 con
quince bloques: dashboard, productos, variantes, inventario, pedidos, clientes,
descuentos, storefront, canales, pagos, envíos, dominios, ajustes, usuarios y
permisos, analítica.

Eso **es** Shopify. Para este equipo son dos años antes de la primera venta.

### 2. No mide contra lo que ya existe

No dice en ningún punto qué está hecho y qué no. Es la información más útil que
podía dar, porque cambia por completo el orden de ataque. La incluyo en la §2.

### 3. Le falta el comerciante, y le falta China

El documento no describe a nadie. ¿Quién usa esto? Un comerciante de Youzan o
Weimob no es un usuario avanzado de Shopify: lleva su tienda **desde el móvil**,
a menudo entre atender clientes.

Y más grave: en las 39 secciones **no aparecen ni una vez** las palabras que
definen el comercio chino de pequeño comerciante —**分销, 拼团, 砍价, 秒杀,
储值**—. Loyalty y membresías salen en P2, como una idea occidental de
fidelización. En China esas mecánicas no son marketing: **son el motor de
adquisición**. Un comerciante chino sin 分销 y sin 拼团 no tiene tráfico.

Un plan de producto para China que prioriza B2B, POS, Media Library y Markets
por delante de 拼团 y 分销 está ordenado por el índice de un competidor
occidental, no por lo que hace vender a su cliente.

---

## 1. Quién es el comerciante

Antes de decidir pantallas, hay que saber para quién.

**Perfil objetivo:** comercio pequeño o mediano chino, de 1 a 20 personas.
Vende ropa, comida, cosmética, artesanía, café. Su tráfico no viene de Google:
viene de **WeChat** —grupos, momentos, su propia lista de clientes— y de que sus
clientes compartan.

**Cómo trabaja:**

- Opera **desde el teléfono**, casi siempre. El escritorio es la excepción.
- No distingue «producto» de «variante». Distingue «esta camiseta, en rojo, M».
- No va a configurar zonas de envío ni reglas de impuestos. Va a escribir
  «envío gratis a partir de 99».
- Su métrica no es la tasa de conversión. Es **cuánto entró hoy**.

**Qué le quita el sueño:**

1. Que el dinero llegue a su cuenta. Sin esto no hay nada más.
2. Que el pedido salga y el cliente no reclame.
3. Que entre gente nueva sin gastar en publicidad.

**Consecuencia de diseño:** el back office se juzga en un móvil de 390 px, y
cada pantalla tiene que responder a una de esas tres cosas. Lo demás, aunque
sea estándar competitivo, es peso muerto hasta que lo pida alguien que paga.

---

## 2. Qué tiene fábrica hoy (la línea de partida que faltaba)

Inventario del código desplegado, no de las intenciones.

| Capacidad | Estado | Detalle |
|---|---|---|
| Motor multi-tienda | ✅ | Vendure, un canal por tienda, aislado |
| Alta de tienda en minutos | ✅ | Asistente, plantilla o diseño exclusivo |
| Escaparate por tienda | ✅ | Con los tokens de diseño de cada cliente |
| Mercado por tienda | ✅ | Idioma y moneda que elige el comerciante |
| Carrito y checkout | ✅ | Con confirmación y número de pedido |
| Back office propio | ✅ | Resumen, productos, pedidos, ajustes |
| Productos con fotos | ✅ | Hasta 8, portada, galería en la tienda |
| Pedidos: cobrar y enviar | ✅ | Marcado manual por el comerciante |
| Dominio propio y certificado | ⚠️ | La maquinaria existe; falta el dominio del cliente |
| Mini programa de WeChat | ⚠️ | Genera el código; **sin sujeto chino no cobra** |
| MCP por tienda | ⚠️ | 5 herramientas: ver catálogo, pedidos, precio, stock |
| **Pagos chinos** | ❌ | **Esqueleto.** `TODO(credenciales)`: sin credenciales no cobra |
| **Variantes** | ❌ | El panel no las gestiona; una variante por producto |
| **Inventario** | ❌ | Solo un número de existencias |
| **Clientes / CRM** | ❌ | No hay pantalla |
| **Descuentos y promociones** | ❌ | Nada |
| **分销 / 拼团 / 会员** | ❌ | Nada |
| **Envíos** | ❌ | Sin zonas, tarifas ni seguimiento real |
| **Equipo de IA / Command** | ❌ | **Prometido en la portada. No existe. Sin clave de modelo.** |
| Analítica | ❌ | Cuatro cifras del día |

**Lectura:** fábrica tiene resuelto lo difícil de arrancar —crear la tienda y
que se vea bien— y le falta casi todo lo de **hacer caja**. El estudio anterior
no lo ve porque no mira el código.

---

## 3. Las tres promesas que hoy no se pueden cumplir

Esto va primero que cualquier funcionalidad nueva, porque es riesgo, no backlog.

| La portada promete | La realidad |
|---|---|
| «Equipo de IA» con tres agentes | No hay ninguno. No hay clave de modelo. |
| «fábrica. Command», gestionar con una frase | Es una demostración de interfaz |
| Mini programa de WeChat | Se genera, pero **sin sujeto chino no hay WeChat Pay** |

Y una cuarta, más callada pero peor: **el checkout ofrece 微信支付 y 支付宝 y no
cobra**. El pedido queda «autorizado» y el comerciante concilia a mano. Para una
demo vale. Para un comerciante que paga, es el fallo que hace que se vaya y lo
cuente.

**Regla que propongo:** ninguna funcionalidad nueva antes de que lo prometido
sea verdad o esté marcado como lo que es.

---

## 4. Lo que en China vende, y no está en el estudio anterior

Esto es lo que un comerciante de Youzan usa a diario y decide si se queda.

### 分销 — reventa con comisión

El comerciante recluta **分销员** (clientes, amigos, micro-influencers). Cada uno
tiene su enlace. Si alguien compra por su enlace, cobra comisión.

Es **el motor de adquisición del comercio privado chino**. No es un extra de
marketing: es cómo entra el tráfico sin pagar publicidad.

Mínimo viable: enlace por distribuidor, atribución del pedido, porcentaje de
comisión, y una pantalla donde el distribuidor vea lo que ha ganado.

### 拼团 — compra en grupo

«Este producto cuesta 99, pero si os juntáis tres, 79.» El comprador se convierte
en vendedor: comparte para completar el grupo.

Mínimo viable: precio de grupo, tamaño, plazo, y estado del grupo en la ficha.

### 秒杀 y 砍价 — flash y regateo social

秒杀: precio bajo, ventana corta, contador. 砍价: cada amigo que participa baja
un poco el precio.

### 会员储值 — saldo prepago

El cliente carga 500 y recibe 550 de saldo. El comerciante cobra por adelantado
y el cliente vuelve porque tiene dinero dentro.

Es financiación y fidelización a la vez. En China es normal; en occidente,
raro. Por eso el estudio anterior lo mete en P2 como «loyalty».

### 优惠券 — cupones

Lo más básico y lo primero que preguntan.

**Ninguna de estas cinco aparece en el P0 ni el P1 del estudio anterior.** Yo
pondría 优惠券 + 拼团 + 分销 por delante de clientes, analítica, media library,
automatizaciones, B2B, POS y Markets. Sin ellas, la tienda es un catálogo que
nadie visita.

---

## 5. El corte: qué construir y qué no

Mi criterio, en orden:

1. **¿Sin esto el comerciante no puede cobrar?** → se construye ya.
2. **¿Sin esto no le entran clientes?** → después.
3. **¿Sin esto se va a otra plataforma?** → después.
4. **¿Es estándar competitivo pero nadie lo ha pedido?** → espera.

Aplicado:

| Va | Espera |
|---|---|
| Pagos chinos de verdad | B2B |
| Envío y seguimiento | POS |
| Variantes | Media Library |
| Cupones, 拼团, 分销 | Markets / multi-mercado |
| 会员储值 | Automatizaciones genéricas |
| Dominio propio | Apps y ecosistema |
| Un agente de IA real | Analítica avanzada, cohortes, LTV |

Sobre la analítica: el estudio anterior pide 18 KPIs y un embudo completo en el
dashboard. Un comerciante con 3 pedidos al día no necesita cohortes. Necesita
**cuánto entró hoy y qué tengo que hacer ahora**. Eso ya está.

---

## 6. Plan de ejecución

Seis bloques. Cada uno termina en algo que el comerciante nota, con pruebas y
desplegado. El orden está pensado para llegar al **primer comerciante que paga**
lo antes posible, no para cubrir el índice.

### Bloque 0 — Decir la verdad · días

Sin esto, todo lo demás se construye sobre una promesa falsa.

- Marcar el equipo de IA y Command como **demostración**, o quitarlos hasta que
  existan.
- El mini programa: decir que requiere sujeto chino e ICP para cobrar.
- El checkout: dejar claro que el pago se concilia con la tienda, mientras sea
  así.

*Termina en:* nadie compra esperando lo que no hay.

### Bloque 1 — Que el dinero llegue · semanas

Lo único que separa una demo de un negocio.

- WeChat Pay y Alipay reales, modelo 服务商, cada tienda con su 子商户号.
  **El dinero va directo al comerciante**; fábrica no toca fondos, y así no
  necesita licencia de pago propia. Los manejadores ya están escritos con ese
  molde: faltan las credenciales y cerrar las dos funciones.
- Estado real del pago en el pedido, y conciliación.
- Reembolso, aunque sea total y manual.

*Termina en:* un comerciante cobra en su cuenta sin tocar nada.

*Depende de:* credenciales de 微信支付 y 支付宝 como 服务商. **Es un trámite, no
código, y hay que empezarlo ya porque tarda.**

### Bloque 2 — Que el pedido salga · semanas

- Variantes de verdad: color, talla, con su precio, su stock y su foto.
- Envío: zonas simples y las tres reglas que se usan (gratis a partir de X,
  tarifa fija, por peso).
- Número de seguimiento y estado visible para el cliente.
- Stock que baja al vender y avisa cuando queda poco.

*Termina en:* el comerciante despacha sin salirse del panel.

### Bloque 3 — Que entre gente · semanas

El motor chino. Aquí es donde fábrica deja de parecerse a un Shopify pequeño.

- **优惠券**: código, porcentaje o importe, caducidad, mínimo.
- **拼团**: precio de grupo, tamaño, plazo, y la pantalla de «faltan 2».
- **分销**: enlace por distribuidor, atribución, comisión, liquidación.
- **秒杀**: ventana y contador.

*Termina en:* el comerciante puede lanzar una campaña que se comparte sola.

### Bloque 4 — El primer agente de verdad · semanas

Con el core ya con APIs, la IA deja de ser un adorno. **Uno solo**, bien hecho,
antes que tres a medias.

Mi elección: **小林, operaciones**, porque su trabajo es aburrido, medible y de
bajo riesgo: vigilar stock, detectar lo que no se vende, preparar promociones.
No 小美 (atención al cliente), que es la que más se luce y la que más daño hace
si se equivoca delante de un cliente.

- Niveles de autonomía: recomienda / prepara y espera / ejecuta lo autorizado.
- Registro de actividad con el antes y el después, y deshacer.
- Sobre el MCP que ya existe, ampliando sus 5 herramientas.

*Depende de:* clave de modelo. **Bloqueado hoy.**

*Termina en:* el comerciante aprueba con un botón algo que le ahorra media hora.

### Bloque 5 — Dominio propio y salida · semanas

- Dominio del comerciante con verificación y certificado (ver el estudio de
  dominios: la maquinaria ya está).
- 会员储值: saldo prepago.
- Clientes: ficha, historial, segmentos simples.

### Después, y solo si lo pide alguien que paga

Analítica avanzada, automatizaciones genéricas, B2B, POS, multi-mercado,
marketplaces, apps. Todo eso está en el P0/P1 del estudio anterior y en mi
opinión no debe tocarse hasta tener treinta comerciantes de pago.

---

## 7. Una regla de arquitectura que sí comparto

El estudio anterior la formula bien y la suscribo entera:

> Antes de implementar cualquier pantalla: definir recurso/API, permisos,
> eventos/auditoría, y qué puede la IA consultar, preparar y ejecutar. Después
> construir la interfaz **sobre esa misma API**. Nunca lógica de negocio dentro
> de un componente visual.

Le añado una condición que hoy no se cumple: **la interfaz humana y la IA tienen
que compartir la API de verdad, no parecerse.** Hoy el panel habla con Vendure
por GraphQL desde acciones de servidor, y el MCP habla por su cuenta. Antes del
Bloque 4 hay que unificar eso, o el agente y el panel divergirán.

---

## 8. Lo que no hay que construir

Coincido con el estudio anterior: nada de contabilidad, nóminas, RRHH,
manufactura ni compras complejas. Fábrica manda en el comercio digital; el ERP,
en la administración.

Y añado tres:

- **No construir el árbol de 17 secciones.** Un comerciante en un móvil no
  navega 17 secciones. Cuatro y un buscador.
- **No construir la analítica antes que las ventas.** Medir un negocio que aún
  no vende es decorar.
- **No construir tres agentes de IA a la vez.** Uno que funcione vale más que
  tres que haya que vigilar.

---

## 9. Lo que puede tumbar este plan

| Riesgo | Impacto | Qué hacer |
|---|---|---|
| **No conseguir credenciales de 服务商** | El Bloque 1 no se puede terminar y no hay producto | Empezar el trámite **ya**; explorar un agregador autorizado como plan B |
| **Sin entidad china** | Sin ICP: mini programa capado y sin WeChat Pay pleno | Decisión de negocio con fecha (ver estudio de dominios) |
| **Sin clave de modelo** | El Bloque 4 no arranca y la portada sigue mintiendo | Conseguirla o retirar la promesa |
| **Latencia desde China a Alemania** | Conversión peor y no se sabe cuánto | Medirlo con alguien en China antes de mover nada |
| Construir por índice y no por cliente | Dos años sin ingresar | Este documento |

---

## 10. Resumen

1. El estudio anterior es una buena lista de comprobación y un mal plan: su P0
   es Shopify entero.
2. Fábrica tiene resuelto crear la tienda y que se vea bien. Le falta casi todo
   lo de cobrar.
3. Tres cosas prometidas en la portada no existen. Eso va antes que cualquier
   funcionalidad nueva.
4. En China venden 分销, 拼团, 秒杀, 储值 y 优惠券. No están en el P0 ni el P1
   del estudio anterior, y deberían ir antes que clientes, analítica y B2B.
5. El orden es: decir la verdad → cobrar → despachar → atraer → un agente real →
   dominio propio. Lo demás espera a que alguien pague por ello.
6. Dos bloqueos no son código y hay que empezarlos hoy: **las credenciales de
   pago** y **la decisión sobre la entidad china**.

---

## Fuentes

- Funciones que más usan los comerciantes pequeños en 有赞 y 微盟 —分销, 会员储值,
  拼团, 砍价, 秒杀, 优惠券—:
  [Youzan](https://www.youzan.com/cms/article/46016.html) ·
  [36氪企服点评](https://www.36dianping.com/vs/v8.html) ·
  [知乎](https://zhuanlan.zhihu.com/p/623230906)
- Perfil de comerciante y posicionamiento de cada plataforma:
  [Sohu](https://www.sohu.com/a/1009190456_121129818) ·
  [有赞新零售](https://www.xinlingshou.com/contents/articles/45086.html)
- Restricciones de mini programa de sujeto extranjero, ICP y WeChat Pay: ver
  `docs/fabrica-tiendas/dominios-china.md`, §2 y §7.
- Estado del código: inventario directo del repositorio a 30 de agosto de 2026.
