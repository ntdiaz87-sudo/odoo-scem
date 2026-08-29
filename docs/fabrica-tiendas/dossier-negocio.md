# fábrica. — Dossier de negocio

**Documento base para estudio de mercado**
Fecha: 29 de agosto de 2026 · Estado del producto: plataforma en producción de prueba

> **Cómo leer este documento.** Todo lo que aparece sin corchetes es un hecho
> verificado del proyecto: está construido, medido o decidido. Lo que aparece
> `[entre corchetes]` es una decisión pendiente o un dato que hay que
> investigar o validar en el estudio de mercado — no lo rellenes con
> suposiciones. La sección 12 lista explícitamente lo que NO sabemos.

---

## 1. Qué es el negocio en una frase

Una **fábrica de tiendas online**: una plataforma donde cualquier comerciante
crea, publica y opera su tienda de comercio electrónico en minutos, desde el
móvil, sin programadores y sin agencia — y donde **el diseño de cada tienda es
irrepetible**, generado por IA y retirado del catálogo para siempre una vez
elegido.

No vendemos software para que alguien monte una tienda. Vendemos **la tienda
montada, funcionando y operada por agentes de IA**.

---

## 2. El problema que resuelve

El comerciante pequeño y mediano de Latinoamérica y el Caribe vende hoy por
WhatsApp e Instagram: sin catálogo real, sin carrito, sin control de
inventario, sin pasarela, sin dominio propio y sin marca diferenciada. Cuando
intenta dar el salto se encuentra tres muros:

1. **Coste y fricción técnica.** Las plataformas existentes requieren
   configurar, elegir plantilla, conectar dominio, instalar apps de terceros y,
   muy a menudo, contratar a alguien que lo haga.
2. **Todas las tiendas se parecen.** Las plantillas se reutilizan miles de
   veces. Dos competidores del mismo barrio pueden tener literalmente la misma
   tienda. La marca del comerciante desaparece.
3. **Nadie opera la tienda.** Aunque la tienda exista, hay que redactar fichas,
   responder clientes, vigilar stock y procesar pedidos. El comerciante no
   tiene equipo para eso.

**Nuestra respuesta a cada muro:** creación por clics en minutos · diseño único
garantizado y registrado · agentes de IA que operan la tienda.

---

## 3. Propuesta de valor y diferenciadores

### 3.1 El diferenciador central: diseño irrepetible

El cliente responde una encuesta corta (qué vende, personalidad de su marca,
fondo claro u oscuro) y el sistema le genera propuestas de diseño completas:
paleta, tipografía, forma y nombre propio. **El diseño que elige queda
registrado con una huella única y la fábrica no vuelve a ofrecerlo a nadie**,
ni en web ni en apps. Reutilizar un diseño ya tomado es imposible por diseño
del sistema, no por política.

Esto es defendible y verificable: es una promesa que ningún constructor de
tiendas basado en catálogo de plantillas puede hacer.

**Estado: construido y funcionando.** Hoy opera con un generador determinista
(algorítmico). Cuando se contrate la clave del modelo de IA, la misma encuesta
alimentará al diseñador agéntico sin cambiar la experiencia del cliente.

### 3.2 Los demás diferenciadores

| Diferenciador | Qué significa para el cliente | Estado |
|---|---|---|
| **Multiplataforma por defecto** | Su tienda es web y app instalable en el móvil desde el primer día; apps nativas iOS/Android en planes superiores | PWA funcionando; nativas pendientes de cuentas Apple/Google |
| **Dominio comprado dentro de la plataforma** | No tiene que ir a otro proveedor ni configurar DNS | Pendiente de cuenta de registrador revendedor |
| **Publicación automática** | Publicar = un clic; certificado de seguridad automático por tienda | Funcionando (certificados emitidos al vuelo por tienda) |
| **Agentes de IA incluidos** | Atienden clientes, redactan fichas y avisan qué reponer | Interfaz técnica construida; pendiente de clave del modelo |
| **Operación completa** | Pedidos, inventario, clientes y pagos en un panel pensado para el móvil | Funcionando |
| **Alojado por nosotros** | No contrata hosting, no administra servidores | Funcionando |

---

## 4. Mercado objetivo

### 4.1 Cliente

Comerciantes pequeños y medianos que hoy venden por redes sociales o en local
físico y quieren vender online con marca propia. Perfil operativo:

- Entran y gestionan **desde el móvil** (mayoría absoluta).
- **No son técnicos**: el vocabulario del producto evita cualquier tecnicismo.
- Sensibles al precio y desconfiados de compromisos largos.
- Rubros de arranque previstos: moda y accesorios, comida y dulces, plantas y
  jardín, belleza, artesanía y hogar, tecnología.

### 4.2 Geografía

- **Mercado declarado: global**, con foco natural en **Latinoamérica y Cuba**
  por red de contactos y por el idioma del producto (español neutro).
- La sede corporativa en China **no implica** vender al mercado doméstico
  chino: eso exigiría licencia ICP, presencia local y ecosistema WeChat, y no
  está en el plan.
- Alojamiento en Alemania (Hetzner), fuera de China, sin requisito de ICP.

### 4.3 Tamaño de mercado

`[POR INVESTIGAR — es el hueco principal de este dossier]`
Datos a levantar en el estudio: número de pymes y micronegocios con intención
de vender online por país objetivo; penetración actual de comercio electrónico;
gasto medio en herramientas digitales; tasa de bancarización y métodos de pago
dominantes por país. **No dispongo de cifras verificadas y no debo inventarlas.**

---

## 5. Modelo de negocio

### 5.1 Estructura de precios

Decisión tomada por la propiedad: **cuota base mensual + porcentaje de ventas a
partir de un umbral**. La lógica es que una tienda que se vuelve viral debe
pagar más, pero sin que el coste nos supere nunca.

| Plan | Precio | Incluye |
|---|---|---|
| **Demo** | Gratis, 14 días | Tienda de prueba completa, diseños generados, subdominio gratuito |
| **Tienda** | `US$ [precio]/mes` + `[1–2] %` de ventas sobre `US$ [umbral]/mes` | Tienda real publicada, dominio propio, app instalable, pedidos, inventario y pagos |
| **Tienda + IA** | `US$ [precio]/mes` + `[1–2] %` de ventas sobre `US$ [umbral]/mes` | Todo lo anterior + agentes de IA + app propia iOS/Android |

Los importes exactos **están sin fijar a propósito**: se cerrarán con datos
reales de consumo de las primeras tiendas. Las cifras de referencia manejadas
internamente son cuota base de IA de 10–15 USD/mes y umbral de ~2.000 USD/mes
de ventas, pero **no son un compromiso**.

### 5.2 Por qué el modelo es a prueba de pérdidas

El coste variable real por tienda es la IA. Está medido:

| Escenario de tienda | Actividad mensual | Coste real de IA |
|---|---|---|
| Básica | 150 conversaciones, 100 pedidos, 30 fichas | **~0,60 USD/mes** |
| Media | 1.000 conversaciones, 800 pedidos, 100 fichas | **~3,50 USD/mes** |
| Viral | 20.000 conversaciones, 10.000 pedidos, 500 fichas | **~60 USD/mes** |

Sobre modelos chinos (DeepSeek V4 a ~0,14/0,28 USD por millón de tokens
entrada/salida; Qwen-Flash aún más barato para el 90 % del volumen). Incluso
una tienda viral cuesta decenas de dólares al mes.

Tres blindajes explícitos contra pérdidas:

1. **Excedentes por bloques con margen fijado por diseño**: p. ej. 5 USD por
   1.000 conversaciones extra cuyo coste real es ~2,5 USD.
2. **Tope de gasto de IA por tienda con degradación elegante**: el agente pasa
   a modo económico o a cola; nunca factura ilimitado.
3. **Router multi-modelo**: los precios se revisan cada trimestre; si un
   proveedor sube, se conmuta a otro sin tocar el producto.

### 5.3 Estructura de costes

- **Infraestructura**: las tiendas **comparten** la misma instancia del motor
  de comercio y del storefront. Publicar una tienda nueva **no** implica un
  servidor nuevo: es activar un canal, un hostname y un certificado. Servidor
  dedicado solo en un eventual plan enterprise. Esto hace que el coste marginal
  por tienda tienda a cero.
- **IA**: variable, medido arriba.
- **Dominios**: coste de registrador, repercutido al cliente con margen.
- **Personal**: `[por definir]`.

### 5.4 Otras líneas de ingreso posibles

`[a validar en el estudio]` — reventa de dominios, plantillas premium, pasarela
propia con comisión, plan enterprise con instancia dedicada, marketplace de
agentes.

---

## 6. Competencia

Competidores directos por categoría (posicionamiento; **los precios y cuotas
de mercado hay que verificarlos en el estudio, no los doy por ciertos**):

| Competidor | Posición | Nuestra diferencia frente a él |
|---|---|---|
| **Shopify** | Líder global, ecosistema enorme de apps | Nosotros: diseño irrepetible, agentes incluidos, precio ligado a ventas, sin necesidad de apps de terceros ni de un partner para montarla |
| **Tiendanube / Nuvemshop** | Líder en Latinoamérica | Nosotros: diseño único garantizado, operación por IA, app nativa por niveles |
| **Wix / Squarespace** | Constructores web con comercio | Nosotros: comercio primero, no web primero; operación y agentes |
| **WooCommerce** | Autogestionado sobre WordPress | Nosotros: cero administración técnica; ellos exigen hosting y mantenimiento |
| **Ecwid, Jumpseller, Empretienda** | Regionales / ligeros | Nosotros: diseño único + capa agéntica |
| **Instagram/WhatsApp Business** | El competidor real hoy del cliente | Nosotros: catálogo, carrito, inventario, dominio y marca propios |

**La pregunta clave para el estudio:** ¿cuánto pesa realmente "mi tienda no se
parece a ninguna otra" en la decisión de compra del comerciante, frente a
precio y facilidad? Es nuestra apuesta central y debe validarse con clientes
reales, no asumirse.

---

## 7. Producto: qué está construido hoy

La plataforma está **viva en producción de prueba** en un servidor propio, con
despliegue continuo automático.

### 7.1 Funcionando y verificado

- **Web pública** con la propuesta de valor, planes y demo.
- **Creación de tienda en minutos**: encuesta → propuestas de diseño únicas →
  la tienda queda creada con su subdominio, su catálogo de ejemplo y su
  certificado de seguridad.
- **Cuenta de dueño por tienda**: cada cliente entra a su panel y ve
  únicamente su tienda (productos, pedidos, clientes). Aislamiento verificado.
- **Escaparate de tienda**: plantilla única dirigida por los tokens de diseño
  de cada cliente — misma calidad para todos, apariencia distinta para cada uno.
- **Carrito y checkout completos** con envío y pago manual (transferencia o
  contra entrega); el pedido llega al panel del dueño.
- **Tienda instalable como app** en el móvil (PWA con icono y colores propios).
- **Servidor MCP por tienda**: un agente de IA puede operar catálogo, precios,
  stock y pedidos de esa tienda y solo de esa tienda.
- **Registro de unicidad de diseños** en funcionamiento.
- **Accesibilidad garantizada en el origen**: el generador no puede producir un
  diseño que incumpla el contraste mínimo AA. Verificado sobre 2.800 diseños
  generados: mínimo 4,80:1.

### 7.2 Calidad verificada

**79 pruebas automáticas, todas en verde**, ejecutadas en escritorio (1440 px) y
móvil (390 px): 34 de flujos completos, 18 de casos límite y ataques (XSS, SQL,
entradas hostiles, stock agotado, aislamiento entre tiendas), 10 del panel del
dueño, 17 de humo, más una batería multicompañía que mide contraste real en el
navegador con paletas generadas al azar.

### 7.3 Lo que falta y por qué

| Falta | Bloqueado por |
|---|---|
| Diseñador con IA real (hoy determinista) | Contratar clave de modelo (DeepSeek/Qwen) |
| Agentes operando tiendas | Misma clave |
| Cobro con tarjeta y facturación automática | Decidir pasarela |
| Compra de dominio en plataforma | Cuenta de registrador revendedor |
| Apps nativas iOS/Android | Cuentas de desarrollador Apple y Google |

Ninguno es un problema técnico abierto: son decisiones comerciales y altas de
cuentas.

---

## 8. Tecnología (resumen no técnico)

- **Motor de comercio**: Vendure — permite que un solo servidor sirva muchas
  tiendas, cada una con sus productos, precios, envíos y administradores. Esta
  decisión es la que hace que el coste por tienda sea marginal.
- **Escaparate**: Next.js, una sola aplicación que sirve todas las tiendas.
- **Publicación**: certificados de seguridad emitidos automáticamente por
  tienda, al estilo Cloudflare.
- **Infraestructura**: servidor propio en Hetzner (Alemania). Coste bajo y
  previsible.
- **Agentes**: estándar MCP sobre modelos chinos, escogiendo siempre el más
  barato que resuelva la tarea.
- **Despliegue**: cada mejora llega sola a producción, con pruebas.

**Implicación de negocio:** la arquitectura permite crecer de decenas a miles
de tiendas sin rehacer nada y sin que el coste crezca linealmente.

---

## 9. Estructura corporativa

- Sociedad **en constitución en China** (vehículo previsto para la plataforma).
- El propietario opera además con sociedades en **Estados Unidos** y **España**.
- **La plataforma no crea empresas a sus clientes**: el cliente aporta su
  propia figura legal. Esto acota nuestra exposición regulatoria.
- `[Por definir: qué entidad factura a qué mercado, y régimen fiscal aplicable
  a cobros recurrentes internacionales.]`

---

## 10. Hoja de ruta

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Web pública + demo instantáneo + tiendas de muestra | **Completada, en producción** |
| 1 | Cuentas de dueño, panel por tienda, límites de demo | **Completada** |
| 2 | Diseñador de diseños únicos | **Núcleo completado** (falta IA real) |
| 3 | Operación completa: carrito, checkout, pedidos, inventario | **Núcleo completado** (falta pasarela) |
| 4 | Compra de dominios y publicación en producción | Pendiente de registrador |
| 5 | Apps móviles | **PWA completada**; nativas pendientes de cuentas |
| 6 | Facturación self-service (planes y cobros automáticos) | Pendiente de pasarela |
| 7 | Capa agéntica: agentes operadores y venta a agentes compradores | **Núcleo completado** (falta clave de IA) |

---

## 11. Riesgos

| Riesgo | Comentario |
|---|---|
| **La unicidad del diseño no mueve la compra** | Es la apuesta central. Si el cliente solo mira precio, el diferenciador pierde fuerza. **A validar en el estudio.** |
| **Dependencia de modelos de IA chinos** | Mitigado con router multi-modelo: se conmuta de proveedor sin tocar el producto. Riesgo residual: restricciones geopolíticas de acceso a esas APIs. |
| **Cobros en Latinoamérica y Cuba** | Baja bancarización y restricciones de pasarelas. Es probablemente el mayor riesgo operativo. `[A investigar por país.]` |
| **Competidor grande copia la unicidad** | Copiable en producto, difícil de retroactivar: quien tiene un catálogo de plantillas ya reutilizadas no puede prometer unicidad hacia atrás. |
| **Soporte a clientes no técnicos** | Volumen de soporte alto por cliente; mitigado en parte por los propios agentes de IA. |
| **Concentración en un solo servidor** | Hoy toda la plataforma vive en una máquina. Escalar exige plan de alta disponibilidad antes de captar volumen. |
| **Calidad percibida del diseño generado** | Mitigado: contraste garantizado por sistema y plantilla profesional común. El riesgo es de gusto, no de accesibilidad. |

---

## 12. Lo que este documento NO responde

Para el estudio de mercado, estos son los huecos reales:

1. **Tamaño de mercado** por país objetivo (número de negocios, penetración de
   comercio electrónico, gasto actual en herramientas).
2. **Precios reales de la competencia** hoy, por país y plan, incluidas
   comisiones ocultas.
3. **Disposición a pagar** del comerciante y sensibilidad al modelo
   base + % de ventas frente a cuota plana.
4. **Métodos de pago dominantes** por país y qué pasarela los cubre.
5. **Coste de adquisición de cliente** estimado por canal.
6. **Validación cualitativa** del diferenciador de unicidad con comerciantes
   reales.
7. **Cifras del propio negocio**: precios finales, umbral, proyecciones,
   necesidad de capital y plazo.

---

## 13. Enlaces del proyecto

- Plataforma en producción de prueba: `https://fabrica.enetradex.com`
- Demo de creación de tienda: `https://fabrica.enetradex.com/demo`
- Tiendas de muestra: `verdealto.fabrica.enetradex.com`, `nocta.fabrica.enetradex.com`
- Panel de administración: `https://fabrica.enetradex.com/dashboard`
- Código: rama `claude/online-store-factory-9cnbb7`, carpeta `factory/`
- Documento técnico completo: `docs/fabrica-tiendas/diseno-y-plan.md`
