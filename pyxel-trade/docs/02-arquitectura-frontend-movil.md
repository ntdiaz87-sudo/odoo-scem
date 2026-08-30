# Arquitectura: ERP detrás, producto delante

Estudio para decidir cómo combinar Odoo 19 con un frontend moderno y llevar
la plataforma a web, Android e iOS.

---

## 1. Los cuatro datos que deciden esto

No parto de preferencias de moda. Parto de hechos verificados sobre los dos
mercados que hay que servir, porque cada uno tumba alguna opción popular.

### 1.1 En Cuba los datos son carísimos, y no linealmente

Tarifas de ETECSA desde mayo de 2025:

| Paquete | Precio | Coste por GB |
|---|---|---|
| Plan base | 360 CUP / 6 GB | **60 CUP/GB** |
| Paquete adicional | 3.360 CUP / 3 GB | **1.120 CUP/GB** |
| Oferta en divisa | 10 USD / 4 GB | 2,50 USD/GB |

**Agotado el plan base, cada megabyte cuesta 18,7 veces más.** No es un
matiz: significa que el peso de cada página es un coste directo para tu
usuario, y que una aplicación pesada usada a diario empuja a un jefe de
compras al tramo caro.

Las velocidades de Nauta Hogar van de 2 a 10 Mbps, y la calidad del dato
móvil es irregular.

**Consecuencia arquitectónica: el peso del cliente es un requisito
funcional, no una optimización posterior.** Cualquier variante que no
pueda cumplir un presupuesto de kilobytes queda descartada.

### 1.2 iOS es prácticamente indistribuible en Cuba

La App Store está bloqueada en Cuba por las sanciones. Los cubanos no
pueden crear cuentas de iCloud ni instalar aplicaciones sin VPN.

**Consecuencia: una app iOS nativa para el comprador cubano es dinero
tirado.** No porque no se pueda construir, sino porque no se puede
entregar. Esto invalida la premisa de "web, Android e iOS" tal cual está
formulada — al menos para el público cubano.

### 1.3 Google Play sí funciona en Cuba, pero sólo gratis

Las aplicaciones gratuitas de Google Play se descargan en Cuba desde hace
años. Las de pago, no: el embargo impide la transacción. Y la instalación
directa de APK es práctica corriente en la isla.

**Consecuencia: Android sí es un canal viable**, por Play (gratis) y por
APK directo.

### 1.4 En China no existe Google

FCM depende de los Google Play Services, ausentes en la mayoría de
teléfonos vendidos en China continental. Huawei, Xiaomi, OPPO, vivo, Honor
y Meizu tienen cada uno su canal propio de notificaciones.

**Consecuencia: no se puede diseñar la capa de notificaciones sobre
Firebase.** Y se confirma la regla que ya aplicamos: ni fuentes, ni
analítica, ni captcha, ni mapas de Google en ninguna parte.

---

## 2. El planteamiento correcto de la costura

"ERP detrás y front delante" suena bien pero esconde la decisión de verdad,
que es **dónde vive la lógica de negocio**.

Odoo no es una base de datos con pantallas. Es un motor de reglas: precios,
impuestos, disponibilidad, flujos de compra y venta, contabilidad,
acreditación. Si el frontend empieza a reimplementar esas reglas para "ir
más rápido", acabas con dos verdades que divergen — y en una plataforma que
mueve dinero e importaciones, eso es fatal.

La costura correcta:

| Capa | Responsabilidad | Dónde |
|---|---|---|
| Reglas de negocio y datos | Precio, stock, pedido, operación, acreditación, factura | **Odoo. Siempre.** |
| Contrato | Qué se expone, con qué forma y qué tamaño | **API explícita** |
| Presentación e interacción | Navegación, composición, fluidez, offline | **Frontend** |

La regla que lo resume: **el frontend nunca decide nada que tenga
consecuencias contables o legales.** Pregunta y muestra.

---

## 3. Variantes para el frontend web

### A. Monolito Odoo (QWeb + website) — lo que hay hoy

Todo dentro de Odoo, plantillas del servidor.

**A favor:** un solo sistema y un solo despliegue; sesión, permisos, i18n y
SEO ya resueltos; encaja con el equipo, que es de Odoo; es lo más rápido
para llegar a algo usable.

**En contra:** el paquete de estáticos de Odoo es pesado — del orden de más
de un megabyte en la primera carga, y hay que medirlo en el servidor real.
El techo de fluidez llega pronto: construir el constructor de contenedores
o la comparación de cotizaciones en QWeb es pelear con el framework.

### B. Odoo + islas OWL

Páginas de Odoo con componentes OWL en las zonas realmente interactivas.

**A favor:** conserva todo lo del monolito y sube el techo de interacción
donde hace falta.

**En contra:** OWL es conocimiento específico de Odoo, poco transferible y
difícil de contratar; no reduce el peso del paquete base.

### C. Headless: frontend SSR propio contra Odoo por JSON-RPC

**A favor:** control total del peso y de la experiencia; el mismo código
sirve a web y alimenta el móvil.

**En contra:** el JSON-RPC de Odoo no es una API de producto — es acceso al
ORM. Es hablador, expone más de lo que debería, y acoplas tu frontend a los
nombres internos de los modelos. Cada cambio en Odoo puede romper el
cliente.

### D. Headless con una capa de API explícita ← **la buena**

Igual que C, pero el frontend nunca habla con el ORM: habla con endpoints
diseñados para él.

**A favor:** cargas útiles pequeñas y a medida (decisivo en Cuba); caché y
ETag; contrato estable y versionable; el mismo contrato sirve para web y
móvil; Odoo puede evolucionar por dentro sin romper nada.

**En contra:** una pieza más que escribir y mantener.

### E. Separación total: base propia + Odoo como back-office

**Descartada.** Dos fuentes de verdad y una sincronización que mantener,
para un producto que aún no ha validado su mercado. Es la arquitectura que
parece seria y hunde proyectos de este tamaño.

### Evaluación

| | A. Monolito | B. +OWL | C. Headless crudo | **D. Headless + API** | E. Separación |
|---|---|---|---|---|---|
| Peso controlable (Cuba) | ✗ | ✗ | ✓ | **✓✓** | ✓✓ |
| Fluidez | ✗ | ✓ | ✓✓ | **✓✓** | ✓✓ |
| Encaje con el equipo | ✓✓ | ✓ | ✗ | **✓** | ✗ |
| Tiempo hasta algo usable | ✓✓ | ✓✓ | ✗ | **✗** | ✗✗ |
| Reutilizable en móvil | ✗ | ✗ | ✓ | **✓✓** | ✓✓ |
| Coste de mantenimiento | ✓✓ | ✓ | ✗ | **~** | ✗✗ |
| Riesgo de dos verdades | ✓✓ | ✓✓ | ✓ | **✓✓** | ✗✗ |

---

## 4. Variantes para el móvil

| Opción | Cuba | China | Código | Veredicto |
|---|---|---|---|---|
| **Nativo Swift + Kotlin** | iOS no se entrega | Requiere tiendas OEM | Dos bases | **No.** El doble de coste para el peor alcance |
| **React Native / Expo** | Android sí, iOS no | Push por FCM roto | Una base | Válido más adelante |
| **Flutter** | Android sí, iOS no | Push por FCM roto | Una base | Buen rendimiento en gama baja, pero lenguaje nuevo para el equipo |
| **PWA** | **Sin tienda: se instala desde la web** | Funciona | **Compartida con la web** | **Sí** |
| **PWA + Capacitor** | Añade APK para Play y descarga directa | Permite tiendas OEM | La misma | **Sí, cuando haga falta tienda** |

**La PWA gana por una razón que no es técnica: es la única que sortea el
problema de distribución.** Se instala desde el navegador, sin tienda, sin
cuenta de Apple, sin cuenta de Google. En un país donde la App Store está
bloqueada y donde ya se instalan APK a mano, la vía del navegador es la que
menos fricción tiene.

Y trae de regalo lo que más falta hace con conectividad intermitente: un
service worker que cachea el catálogo y deja la aplicación utilizable sin
red.

---

## 5. Arquitectura propuesta

```
┌──────────────────────────────────────────────────────────────┐
│  CLIENTES — una sola base de código                          │
│                                                              │
│   Web (SSR)      PWA instalable      APK (Capacitor)         │
│   navegador      móvil, offline      Play y descarga directa │
└───────────────────────────┬──────────────────────────────────┘
                            │  HTTPS · JSON · cargas pequeñas
┌───────────────────────────▼──────────────────────────────────┐
│  CAPA DE API  (módulo Odoo propio, no el JSON-RPC crudo)     │
│  Endpoints diseñados para el cliente · paginación · ETag     │
│  Token de sesión · límite de peticiones · versionado         │
└───────────────────────────┬──────────────────────────────────┘
┌───────────────────────────▼──────────────────────────────────┐
│  ODOO 19 — sistema de registro y motor de reglas             │
│  Catálogo · proveedores · RFQ · operaciones · contenedor     │
│  Acreditación · compras · almacén · facturación              │
└───────────────────────────┬──────────────────────────────────┘
                    ┌───────▼───────┐
                    │ PostgreSQL 16 │
                    └───────────────┘
```

### Decisiones concretas

**La API va dentro de Odoo, como módulo propio.** No un FastAPI aparte.
Razones: un proceso menos en un servidor compartido; reutiliza el ORM, los
permisos y las traducciones; y el equipo ya escribe Python de Odoo. Un
servicio separado añadiría un segundo modelo de autenticación a cambio de
poco.

**El frontend, SSR primero.** Recomiendo **Next.js con App Router y
componentes de servidor**: lo que se renderiza en el servidor no envía
JavaScript al cliente, que es exactamente lo que necesita un usuario que
paga 1.120 CUP por giga. React, además, es lo más contratable.

**Una sola base de código para los tres destinos.** Web, PWA y APK salen
del mismo proyecto. Nada de mantener tres.

**Notificaciones: Web Push con VAPID, no Firebase.** Funciona en Android y
escritorio sin depender de Google. Para China, canales OEM a través de un
agregador el día que haga falta.

---

## 6. Presupuesto de rendimiento

Sin números, "que se mueva fluido" no es un requisito, es un deseo. Propongo
estos, medidos en el despliegue real y no en local:

| Métrica | Objetivo | Por qué |
|---|---|---|
| JS del primer render, catálogo | **≤ 150 KB** comprimido | Cada MB tiene precio |
| Peso total de la primera visita | **≤ 500 KB** | Media página del tramo caro |
| Visita repetida | **≤ 50 KB** | Todo lo demás, del service worker |
| Primer contenido pintado, 3G lento | **≤ 2,5 s** | Es la red real |
| Imagen de producto en listado | **≤ 25 KB**, AVIF o WebP | Es el 80 % del peso |

### Medición real — 30 de agosto de 2026

`scripts/measure.sh https://trade.enetradex.com/market`, con Odoo 19 recién
desplegado y la portada todavía sin imágenes de producto. Los tamaños son
**en red**, es decir ya comprimidos por Caddy:

| Recurso | Crudo | En red |
|---|---|---|
| Documento HTML | 6,7 KB | 6,7 KB |
| `web.assets_frontend_minimal.min.js` | 31 KB | 9,2 KB |
| `web.assets_frontend.min.css` | 1,0 MB | 142,5 KB |
| `web.assets_frontend_lazy.min.js` | 2,5 MB | 597,8 KB |
| **Total primera visita** | **3,5 MB** | **756,2 KB** |

Contra el presupuesto: el JS del primer render va a **607 KB frente a los
150 KB** del objetivo, cuatro veces por encima; y la primera visita a
**756 KB frente a 500 KB**. Y esto es el suelo, no el techo: aún no hay ni
una foto de producto.

Qué significa: **el paquete de Odoo no cabe en el presupuesto y podarlo no
va a bastar.** Los 597 KB son `web.assets_frontend_lazy`, el bulto del
frontend de Odoo, que no se puede recortar a la tercera parte sin romper
website. La fase 1 sirve para validar el negocio, pero la decisión de la
fase 2 ya está tomada por el número: **el catálogo público tendrá que salir
de Odoo** si se quiere cumplir el objetivo en la red cubana. Lo que sigue en
pie es la condición de la fase 1: la lógica en modelos Python, para que ese
día el frontend nuevo tenga de dónde leer.

Pendiente de medir con navegador: la visita repetida. Los assets llevan
hash en la URL y `Cache-Control: public, max-age=31536000, immutable`
(comprobado), así que el objetivo de ≤ 50 KB debería cumplirse solo.

Y una función de producto, no sólo técnica: **un modo de bajo consumo**
visible, que sirva miniaturas y desactive imágenes de fondo. En Cuba eso no
es un ajuste escondido, es una razón para elegir tu plataforma.

---

## 7. Plan por fases

**Ir hoy a headless sería un error.** No hay proveedores, ni compradores, ni
flujos validados. Se tardarían meses en API y frontend antes de que nadie
pudiera usar nada. El orden correcto:

### Fase 1 — Validar dentro de Odoo *(ahora)*
Portada y catálogo en QWeb, como está. Objetivo: primeros proveedores y
primeras operaciones reales.

Con dos condiciones que abaratan la fase 2:
- **Toda la lógica en modelos Python, nunca en plantillas.** Lo que hoy
  calcula una vista, mañana no se puede reutilizar desde una API.
- **Medir el peso real** del paquete de Odoo y podarlo. Puede que baste.

### Fase 2 — La API, contra un consumidor real
Escribir el módulo de API sirviendo primero a **la puerta del proveedor
chino**. Es la superficie más pequeña y la que más sufre la latencia hasta
Alemania: buen banco de pruebas, riesgo bajo.

### Fase 3 — Frontend propio donde se note
Migrar a Next.js sólo el descubrimiento del comprador y el constructor de
contenedores: lo que se usa a diario y lo que tiene techo en QWeb. El
back-office se queda en Odoo para siempre.

### Fase 4 — PWA y APK
Service worker, instalable, modo de bajo consumo. APK por Capacitor cuando
haya demanda de tienda. **iOS sólo si aparece un público que pueda
instalarlo** — diáspora o proveedores chinos, no el comprador cubano.

---

## 8. Lo que no haría

- **Apps nativas separadas.** Doble coste para el peor alcance.
- **Exponer el JSON-RPC de Odoo al cliente.** Acopla el frontend a los
  nombres internos de los modelos.
- **Base de datos propia junto a la de Odoo.** Dos verdades.
- **Firebase para nada.** Ni push, ni analítica, ni hosting.
- **Renderizado sólo en cliente.** Una pantalla en blanco mientras se
  descarga un megabyte de JavaScript es, en Cuba, un usuario perdido.
- **Migrar todo Odoo a headless.** El back-office en Odoo es una ventaja,
  no una deuda.

---

## 9. Riesgos abiertos

**Latencia hasta China.** El servidor está en Alemania. Para los
proveedores chinos, la distancia y la inspección de tráfico añaden retardo.
Habrá que medirlo de verdad; si molesta, un borde en Hong Kong o Singapur
para la puerta del proveedor. Alojar dentro de China continental exige
licencia ICP.

**WeChat.** El canal real de un fabricante chino no es un navegador, es
WeChat. Un Mini Program sería lo culturalmente correcto, pero registrarlo
exige entidad y licencia comercial chinas. Decisión de negocio antes que
técnica.

**Recursos del GEX44.** Es compartido. Añadir un proceso Node de SSR en la
fase 3 hay que presupuestarlo, no improvisarlo.

**Sin medir todavía.** El peso real del paquete de Odoo 19 y la latencia
China → Alemania son los dos números que faltan, y ambos pueden mover la
fase 3 hacia adelante o hacia atrás. Se miden el día que el servidor esté
en pie.
