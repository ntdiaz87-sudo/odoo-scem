# Dominios para fábrica. en China — segundo estudio

**Fecha:** 30 de agosto de 2026
**Escrito desde:** el código que ya está desplegado, no desde una pizarra en blanco.

Este documento contesta a la misma pregunta que el estudio anterior, y llega a
una recomendación distinta. No porque aquél esté mal escrito —está bien
estructurado y cita fuentes reales— sino porque se salta tres cosas que cambian
la respuesta.

---

## 0. En qué discrepo del estudio anterior

**Lo que acierta y mantengo:** no pedir dominio en el alta; hostname técnico
permanente y `store_id` como clave; el dominio a nombre del comerciante y no de
fábrica; orquestar proveedores en vez de convertirse en registrador; separar
dominio, titularidad, hosting y compliance. Todo eso es correcto y no lo repito.

**Los tres huecos:**

| Hueco | Por qué importa |
|---|---|
| **Ignora lo que ya está construido.** Propone un «SSL Manager» y un «Edge/Router» como si hubiera que hacerlos. Fábrica **ya emite certificados por tienda al vuelo**, en producción, desde hace semanas. | Cambia el tamaño de la Fase 1 de meses a días. |
| **No trae una sola cifra.** Ni de dominios, ni de ICP, ni de constituir una sociedad. | Sin cifras no es una decisión, es un diagrama. |
| **Esquiva la pregunta que decide todo.** Dice que ICP «debe validarse con asesoría legal». La respuesta es pública y es un sí o un no. | De ella depende si el mini programa que fábrica ya genera se puede vender o no. |

Y una discrepancia de fondo: el modelo de datos que propone —`Domain` con
catorce campos, `RegistrantProfile`, `ChinaComplianceCase`— es el esquema de un
producto con miles de comerciantes. Fábrica tiene cero de pago. Construir ese
esquema ahora es diseñar para un problema que aún no existe, y cada campo hay
que migrarlo cuando la realidad no encaje.

---

## 1. La pregunta que decide todo

> **¿Fábrica tiene, o va a tener, una sociedad registrada en China continental?**

Todo lo demás cuelga de ahí. No es un detalle de compliance: es la bifurcación
del producto.

### Lo que está verificado

- **ICP filing es obligatorio para cualquier sitio alojado en servidores de
  China continental**, y el trámite **sigue a la ubicación del servidor, no a la
  extensión del dominio**. Un `.com` alojado en Shanghái necesita ICP; un `.cn`
  alojado en Frankfurt, no.
- **Una empresa extranjera no puede solicitar ICP directamente.** Hace falta una
  entidad china: WFOE, joint venture o un socio local que la patrocine.
- Alojar fuera de China continental (Hong Kong, Singapur, Europa) **evita el
  ICP**, pero entonces **ese sitio no puede obtener ICP** aunque lo quiera.

### Lo que cuesta cruzar esa puerta

| Concepto | Coste | Plazo |
|---|---|---|
| El trámite ICP en sí (MIIT) | **gratis** | 20–60 días hábiles |
| WFOE de servicios/comercio | **8.500–14.000 USD** | 8–12 semanas |
| **De cero a ICP aprobado** | cinco cifras en USD | **3–6 meses** |
| Dominio `.cn` (por comerciante) | ~19–39 CNY el primer año | verificación de identidad 1–5 días |

El dominio es lo barato. Lo caro es la puerta de entrada.

---

## 2. El golpe que el estudio anterior no ve: el mini programa

Fábrica **ya genera el código fuente del mini programa de WeChat** de cada
tienda. Está en el producto, la portada lo promete y hay una pantalla que lo
entrega en 19 ficheros. Esto es lo que decide si eso se puede vender:

- Los **dominios de servidor** que configura un mini programa
  (`requestDomain`) **deben tener ICP**. WeChat lo comprueba al añadirlos.
- **Excepción, y es la buena noticia:** un mini programa de **sujeto extranjero
  con servidor extranjero está exento de 备案**.
- **La mala:** un mini programa de sujeto extranjero pierde cosas que para
  comercio no son accesorias — no puede obtener el número de móvil del usuario
  vía WeChat, no puede hacer directos, y **las categorías de WeChat Pay
  disponibles para sujeto extranjero son limitadas**; en la mayoría de casos hay
  que integrar pasarela por fuera.

**Traducción a producto:** por la vía extranjera el mini programa existe, pero
es un catálogo bonito sin la forma de pago que usa todo el mundo en China. Y el
comerciante chino que se lo compre no podrá poner su propio sujeto sin ICP.

Esto no es un riesgo futuro. Es una promesa que hoy está en la portada.

---

## 3. Lo que fábrica ya tiene (y el estudio anterior da por construir)

Antes de planificar nada conviene mirar el código desplegado:

| Pieza | Estado | Dónde |
|---|---|---|
| Hostname técnico por tienda | **hecho** | `slug.fabrica.enetradex.com`, se crea con la tienda |
| Certificado TLS por tienda, al vuelo | **hecho y en producción** | Caddy con `on_demand_tls` |
| Guardia contra emisión abusiva de certificados | **hecho** | `/api/tls-check`: 200 solo si esa tienda existe |
| Enrutado host → tienda | **hecho, pero solo subdominios** | `tenantFromHost` en `lib/tenant.ts` |
| Dominio propio del comerciante | **no** | — |

Es decir: **la maquinaria difícil ya está**. Emitir un certificado para
`lumina.cn` usa exactamente el mismo camino que ya emite para
`lumina.fabrica.enetradex.com`. Lo que falta son tres cosas concretas:

1. Un campo `dominio` en el canal de la tienda.
2. Que `/api/tls-check` diga 200 también para ese dominio.
3. Que `tenantFromHost` sepa resolver un host que no es subdominio.

Más el bloque de Caddy que acepte cualquier host, y la verificación de que el
comerciante controla de verdad ese dominio.

**Eso son días, no meses.** El estudio anterior lo pone en la Fase 1 junto a un
«SSL Manager» que ya existe.

---

## 4. Los dos caminos, con sus consecuencias

### Camino A — sin entidad china (lo que fábrica es hoy)

```
Alojamiento fuera de China · sin ICP · dominios globales y .cn sin filing
```

- ✅ Se puede hacer **ya**, sin gastar un dólar en estructura.
- ✅ El comerciante conecta su `.com` o su `.cn` y funciona con certificado.
- ⚠️ **Latencia desde China.** Hoy el servidor está en Alemania. Para un
  comerciante chino vendiendo a clientes chinos, eso se nota y se paga en
  conversión. Mitigable moviendo el borde a Hong Kong o Singapur —sin ICP— pero
  no se resuelve del todo.
- ❌ Mini programa **capado**: sin ICP no hay sujeto chino, y sin sujeto chino
  no hay WeChat Pay en condiciones.
- ❌ No se puede prometer «tienda en China» sin asterisco.

### Camino B — con entidad china

```
WFOE · alojamiento continental · ICP por tienda · mini programa completo
```

- ✅ Producto íntegro: el mini programa, WeChat Pay, el rendimiento.
- ✅ Un `.cn` con ICP es lo que un comerciante chino espera ver.
- ❌ **3–6 meses y cinco cifras** antes de la primera tienda.
- ❌ El ICP **no es uno para fábrica**: cada tienda con dominio propio necesita
  el suyo, con documentación del comerciante. Es un flujo operativo permanente,
  con personas revisando papeles. No se automatiza del todo.

### Mi recomendación

**Camino A ahora, con el producto contado con honestidad, y Camino B como
decisión de negocio separada y con fecha.**

Razones:

1. Fábrica no tiene comerciantes de pago. Gastar 10.000 USD y cuatro meses en
   una estructura antes de la primera venta es financiar una hipótesis.
2. El trabajo de dominio propio del Camino A **no se tira** si mañana se abre
   el B: el campo, la verificación y el enrutado son los mismos.
3. Lo que sí hay que hacer **ya**, y es gratis, es **dejar de prometer lo que no
   se puede entregar**. El mini programa con WeChat Pay hoy no es entregable.

---

## 5. Plan de implementación

### Fase 0 — Honestidad en el producto · **inmediato, horas**

Antes de código. La portada promete «mini programa de WeChat» sin matiz, y la
pantalla de canales entrega los pasos como si el comerciante pudiera
completarlos. Con sujeto extranjero, no puede.

- Marcar el mini programa como **lo que es**: código fuente que el comerciante
  sube con su propia cuenta, y que **requiere sujeto chino e ICP** para WeChat
  Pay.
- En la pantalla de canales, decir qué necesita antes de empezar.

Coste: cero. Riesgo de no hacerlo: un comerciante que paga y descubre a mitad
que no puede cobrar.

### Fase 1 — Dominio propio del comerciante · **días**

Lo que ya casi está. Es lo que desbloquea vender a cualquiera fuera de China y
a los chinos que alojen fuera.

1. `dominio` y `dominioVerificado` como campos del canal.
2. `/api/tls-check` acepta el dominio verificado de cualquier tienda.
3. `tenantFromHost` resuelve por dominio propio, con caché — el middleware es
   síncrono y no puede consultar la base en cada petición.
4. Bloque de Caddy que acepte cualquier host con `on_demand`.
5. Verificación de propiedad por registro TXT antes de aceptar nada. **Sin esto
   cualquiera apunta su dominio al servidor y se queda con una tienda ajena.**
6. Pantalla en el panel: pega tu dominio → te digo los dos registros DNS que
   crear → compruebo → listo. Estados de negocio, no jerga.
7. Canónico y redirección: el hostname técnico sigue existiendo pero deja de
   indexarse.

**Prueba que lo fija:** dos tiendas, dos dominios, cada una responde en el suyo
con certificado, y el dominio no verificado de una no sirve a la otra.

### Fase 2 — Comprar el dominio desde fábrica · **semanas, y solo si hay demanda**

Aquí sí hace falta un registrador. **No antes.** Y solo cuando haya
comerciantes pidiéndolo, porque implica facturación, renovaciones y soporte de
por vida.

- Abstracción `ProveedorDominio` con una sola implementación al principio.
- El comerciante es el titular; fábrica, contacto técnico.
- Renovación automática y aviso con antelación: un dominio caducado es una
  tienda caída.

### Fase 3 — China de verdad · **solo tras decidir el Camino B**

- Registrador chino, perfiles de titular con verificación de identidad real.
- ICP como expediente por tienda, con estados y personas detrás.
- Alojamiento continental.

No escribir una línea de esto antes de que exista la sociedad. Es el error más
caro posible: construir el flujo de un trámite que no se puede iniciar.

---

## 6. Modelo de datos: empezar con tres campos

El estudio anterior propone `Domain` con catorce campos, más
`RegistrantProfile`, más `ChinaComplianceCase`. Para la Fase 1 basta con esto,
en el canal que ya existe:

```
dominio            string | null    el dominio propio, si lo hay
dominioVerificado  boolean         ¿demostró que es suyo?
dominioTxt         string | null    el testigo TXT que debe publicar
```

Cuando llegue la Fase 2 se añade lo del registrador. Cuando llegue la Fase 3,
el expediente. Un esquema que no ha visto un caso real no está diseñado, está
adivinado.

---

## 7. Lo que no sé y hay que preguntar

El estudio anterior trae dieciocho preguntas para Alibaba y Tencent. Casi todas
son de la Fase 3 y no hacen falta todavía. Estas cuatro son las que bloquean
una decisión **hoy**:

1. **¿Puede una empresa no china ser el sujeto de un mini programa y usar
   WeChat Pay cross-border para comercio general?** De esto depende si el mini
   programa es vendible por el Camino A. Lo leído dice que las categorías están
   limitadas; hay que saber exactamente cuáles.
2. **¿Cuánto se pierde de verdad en latencia desde China a Hong Kong o Singapur
   frente a Alemania?** Es medible: hace falta alguien en China ejecutando
   `curl -w '%{time_total}'`. Sin ese número, mover el servidor es una corazonada.
3. **¿Un comerciante chino con su propia sociedad puede hacer su ICP apuntando a
   infraestructura de fábrica alojada fuera?** No: el ICP exige servidor
   continental. Pero conviene confirmar si existe alguna figura intermedia.
4. **¿Qué exige exactamente WeChat para un mini programa de sujeto extranjero
   que vende a consumidores chinos?** Categorías, tarifa de certificación anual,
   y qué pasarela queda disponible.

Ninguna la puedo responder yo desde aquí. Las tres primeras las contesta una
llamada; la segunda, un conocido en China con una terminal.

---

## 8. Lo que no hay que construir

Coincido con el estudio anterior y lo subrayo, porque es donde se va el tiempo:

- Ni registrador propio, ni WHOIS, ni autoridad certificadora, ni DNS
  autoritativo. Todo eso ya lo hace alguien mejor y más barato.
- Ni automatización de un trámite regulatorio que aún no se puede iniciar.
- **Ni el esquema de datos completo antes del primer caso real.**

Y añado uno que el otro estudio no dice: **no construir la Fase 2 antes de que
un comerciante la pida**. Vender dominios obliga a facturar, renovar y dar
soporte para siempre. Es un negocio, no una funcionalidad.

---

## 9. Resumen en cinco líneas

1. El dominio es lo fácil y lo barato; la entidad china es la puerta, y cuesta
   3–6 meses y cinco cifras.
2. Fábrica ya tiene la parte difícil hecha: certificados por tienda, al vuelo,
   en producción.
3. Conectar el dominio propio del comerciante son **días**, no meses.
4. El mini programa, hoy, no se puede entregar completo. Hay que decirlo antes
   de cobrarlo.
5. Comprar dominios desde fábrica es un negocio aparte: no se construye hasta
   que alguien lo pida.

---

## Fuentes

Consultadas el 30 de agosto de 2026. Los puntos regulatorios deben confirmarse
con asesoría china antes de producción; lo que sigue es documentación pública,
no un dictamen legal.

- ICP para empresas extranjeras, requisito de entidad onshore, costes y plazos —
  [MS Advisory](https://msadvisory.com/icp-license-china/) ·
  [AppInChina](https://appinchina.co/blog/the-complete-guide-to-chinas-icp-filing/)
- El filing sigue a la ubicación del servidor, no a la extensión del dominio —
  [Nameslink](https://www.nameslink.com/hugo/en/posts/2026-06-10-icp-filing-complete-guide/)
- ICP y mini programas de WeChat; filing de dominios de servidor —
  [MS Advisory](https://msadvisory.com/icp-license-wechat-mini-programs/) ·
  [AppInChina](https://appinchina.co/blog/how-to-get-a-wechat-mini-program-filing-the-complete-guide/)
- Exención de 备案 para sujeto extranjero con servidor extranjero, y requisitos
  de `requestDomain` —
  [微信开放文档](https://developers.weixin.qq.com/doc/oplatform/developers/basic_func/domain.html)
- Limitaciones del mini programa de sujeto extranjero (móvil del usuario,
  directos, categorías de pago) —
  [Azoya](https://www.azoyagroup.com/blog/view/differences-between-domestic-entity-mini-program-and-overseas-entity-faq-about-wechat-mini-program/)
- Coste y plazo de una WFOE —
  [MS Advisory](https://msadvisory.com/wfoe-cost-china/) ·
  [FDI China](https://fdichina.com/blog/wfoe-registration-in-china-2026/)
- Precio y verificación de identidad de `.cn` —
  [Nameslink](https://www.nameslink.com/hugo/en/posts/2026-06-06-cn-domain-registration-guide/)
