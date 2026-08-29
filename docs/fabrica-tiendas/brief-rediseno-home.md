# Brief: rediseñar el home de «fábrica»

> **Cómo usar este archivo:** cópialo entero y pégalo en ChatGPT (mejor con GPT-5
> o el modelo más capaz que tengas). Al final está el mensaje exacto con el que
> arrancar. Cuando ChatGPT te devuelva el código, pásamelo tal cual y yo lo
> integro, lo pruebo y lo despliego.

---

## 1. Qué es el producto

**fábrica** es una plataforma (SaaS) donde cualquier comerciante crea su tienda
online en minutos, desde el móvil, sin programadores. Lo que la diferencia:

- **Diseños irrepetibles.** El cliente responde una encuesta corta (qué vende,
  cómo quiere que se sienta su marca, claro u oscuro) y la plataforma le genera
  varias propuestas de diseño. **La que elige queda registrada a su nombre y se
  retira para siempre**: ninguna otra tienda del mundo tendrá ese diseño.
- **Todo incluido:** catálogo, carrito, checkout, pedidos, inventario, panel de
  gestión pensado para el móvil.
- **Multiplataforma por defecto:** cada tienda es web y app instalable (PWA), y
  en planes premium apps nativas iOS/Android.
- **Dominio propio comprado dentro de la plataforma**, publicado con certificado
  de seguridad automático.
- **Agentes de IA** que atienden clientes, redactan fichas de producto y avisan
  cuándo reponer stock.
- **Precio:** base mensual + un porcentaje de las ventas a partir de cierto
  umbral. Los importes todavía son placeholders (`[precio]`, `[umbral]`).

La plataforma ya está viva y funcionando en producción. Esto es un **rediseño
visual del home** (la página pública de venta), no un cambio de producto.

## 2. A quién le habla el home

Comerciantes pequeños y medianos de **Latinoamérica y Cuba**, muchos vendiendo
hoy por WhatsApp o Instagram. Perfil clave:

- Entran **desde el móvil** (mayoría absoluta). El diseño se juzga primero en una
  pantalla de 390 px de ancho.
- **No son técnicos.** Palabras como «deploy», «hosting» o «plantilla
  responsive» no significan nada para ellos. Hablan de «mi tienda», «mis
  productos», «mis clientes», «cobrar».
- Desconfían de lo que suena caro o complicado. El home tiene que transmitir:
  *esto lo puedo hacer yo, hoy, gratis, y se ve profesional*.
- Compiten con Shopify/Tiendanube en la cabeza del cliente, pero el argumento
  ganador es: **«tu tienda no se va a parecer a ninguna otra»**.

**Objetivo único de la página:** que el visitante pulse **«Probar demo gratis»**
y llegue a `/demo`. Todo lo demás es secundario.

## 3. Restricciones técnicas (obligatorias)

El código tiene que entrar tal cual en el proyecto real. Es:

- **Next.js 15, App Router, React Server Components.** El home es
  `app/page.tsx`, un componente servidor **sin `'use client'`** y sin estado.
  Nada de `useState`, `useEffect`, ni librerías de animación en JS.
- **CSS plano** en `app/globals.css`. **No hay Tailwind instalado**, no lo uses.
  No uses CSS-in-JS ni styled-components. Estilos inline de React sí valen para
  detalles puntuales (ya se usan).
- **Fuentes: solo Google Fonts**, cargadas con un `<link>` en `app/layout.tsx`.
  Hoy están: `Bricolage Grotesque` (títulos), `Public Sans` (texto),
  `Source Serif 4` (reservada para tiendas). Puedes cambiarlas, pero entonces
  dime exactamente qué `<link>` poner.
- **Sin imágenes externas.** No hay CDN de imágenes ni fotos de stock
  disponibles. Todo lo visual se construye con **CSS, gradientes, SVG inline o
  Canvas**. (Las «mini-tiendas» actuales del hero son puro CSS: sigue esa idea).
- **Sin librerías nuevas.** Nada de npm install.
- **Animación:** solo CSS (`transition`, `@keyframes`, `animation`), y siempre
  respetando `@media (prefers-reduced-motion: reduce)`.
- **Idioma: español neutro** (que se lea bien en México, Cuba, Colombia,
  España). Nada de tuteo raro ni jerga local.
- **Accesibilidad:** contraste real (AA), foco visible en enlaces y botones,
  áreas táctiles de mínimo 44 px de alto, jerarquía correcta de `h1`/`h2`/`h3`.

### Clases CSS que NO puedes eliminar ni renombrar

`globals.css` es compartido con el asistente de creación de tiendas (`/demo`) y
otras pantallas. Estas clases las usan otras páginas; puedes **mejorar su
aspecto**, pero deben seguir existiendo y funcionando:

```
.btn  .btn-primary  .btn-outline  .btn-block
.wizard  .field  .hint  .error-box  .back-link
.chip-row  .chip  .chip-on
.design-options  .design-card  .design-head  .design-body  .design-name
```

Las clases **solo del home** son tuyas para rehacer o sustituir por completo:

```
.wrap .nav .brand .nav-links
.hero .hero-ctas .hero-note .hero-visual .mini .mini-head .mini-body .mini-label
.section .section-alt .grid-3 .grid-4
.step .step-num .feature .unique .badge
.plans .plans-sub .plan .plan-feat .plan-price .plan-note .plan-featured .plan-tag
.footer
```

### Paleta y tokens actuales (punto de partida, puedes cambiarlos)

```css
--bg: #f5f8f7;        /* fondo general, verde muy desaturado */
--surface: #ffffff;   /* tarjetas */
--ink: #16262a;       /* texto principal, casi negro verdoso */
--ink-soft: #4a5c5e;  /* texto secundario */
--ink-faint: #7b8b8c; /* texto terciario */
--line: #d8e2e0;      /* bordes */
--accent: #0e8a7b;    /* verde azulado de marca */
--accent-dark: #0b6f63;
--accent-soft: #e0f0ec;
--dark: #16262a;      /* fondo de la sección de planes */
```

Si cambias la paleta, entrégala como bloque de tokens en `:root` igual que este.

## 4. Cómo es el home hoy (contenido real)

Esta es la estructura y el texto actuales. **El contenido es bueno, el problema
es que se ve genérico.** Puedes reescribir los textos para que suenen mejor,
pero tienen que decir lo mismo y mantener el tono claro y sin tecnicismos.

**Barra superior:** logo `fábrica.` · enlaces: Cómo funciona / Diseños únicos /
Planes · botón «Probar demo gratis».

**Hero (dos columnas en escritorio):**
- H1: «Tu tienda online, hecha por ti en minutos.»
- Párrafo: «Responde unas preguntas y nuestra IA crea un diseño único para tu
  negocio: nadie más tendrá uno igual. Publícala con tu dominio, en web y como
  app, con agentes de IA que atienden a tus clientes. Sin contratar
  programadores.»
- Botones: «Probar demo gratis» (primario) y «Ver planes» (secundario).
- Nota: «Sin tarjeta. Tu tienda demo lista en 60 segundos.»
- Visual: tres maquetas de tienda en miniatura, hechas con CSS, cada una con una
  identidad distinta — *Verdealto* (verde, plantas), *NOCTA* (negro y dorado,
  moda), *Casa Terra* (terracota, cerámica). **Este visual es el corazón del
  argumento** («cada tienda es distinta»): consérvalo o sustitúyelo por algo que
  demuestre lo mismo con más fuerza.

**Sección «De la idea a vender, en tres pasos»** (3 tarjetas numeradas):
1. **Prueba el demo** — «Un clic y tienes una tienda de prueba con productos de
   ejemplo, en tu móvil o PC. Sin registro complicado ni tarjeta.»
2. **Hazla tuya** — «Responde una encuesta sencilla y la IA te propone varios
   diseños creados solo para ti. Eliges uno, subes tus productos y listo.»
3. **Publícala y vende** — «Compra tu dominio aquí mismo y publica con un clic:
   web, app instalable y certificado seguro, alojado por nosotros.»

**Sección «Ninguna tienda se parece a otra»** (etiqueta «Diseñador con IA»):
- «Aquí no hay plantillas repetidas. Cuéntanos qué vendes, cómo quieres que se
  sienta tu marca y quién es tu cliente; nuestra IA genera varios diseños
  creados solo para ti. El que elijas queda registrado a tu nombre y se retira
  para siempre: nadie más lo tendrá, ni en la web ni en las apps.»
- Remate: «Tu diseño, bloqueado para ti.»
- 4 tarjetas: «Web + apps iOS y Android» · «Tu dominio, comprado aquí» ·
  «Agentes de IA incluidos» · «Pedidos, inventario y pagos».

**Sección «Planes según tu modelo de negocio»** (fondo oscuro, 3 planes):
- Subtítulo: «Empieza gratis. Paga solo cuando tu tienda sea de verdad.»
- **Demo** — Gratis · 14 días de prueba · tienda de prueba completa, diseños
  generados para ti, subdominio gratuito · botón «Empezar ahora».
- **Tienda** (destacado, etiqueta «Más elegido») — `US$ [precio]/mes` +
  `[1–2] % de ventas a partir de US$ [umbral]/mes` · tu tienda real publicada,
  dominio propio y app instalable, pedidos/inventario/pagos · botón «Crear mi
  tienda».
- **Tienda + IA** — `US$ [precio]/mes` + mismo porcentaje · todo lo del plan
  Tienda, agentes de IA, app propia iOS/Android · botón «Hablar con nosotros».

> ⚠️ Los importes son placeholders a propósito: **deja `[precio]`, `[umbral]` y
> `[1–2] %` tal cual entre corchetes.** Igual con `[dominio.com]` del pie.

**Pie:** logo · enlaces Planes / Cómo funciona · `[dominio.com]`.

**Rutas reales de los enlaces:** el botón de demo va a `/demo` (usa
`<Link href="/demo">` de `next/link`); los enlaces de sección son anclas
`#como-funciona`, `#disenos`, `#planes`.

## 5. Qué queremos del rediseño

**El problema actual:** el home funciona y está limpio, pero se ve *como
cualquier landing de SaaS generada con IA*. No transmite la promesa central —
que aquí cada tienda es única — ni tiene una personalidad que se recuerde.

**Lo que buscamos:**

1. **Que el hero sea una demostración, no una promesa.** Que en los primeros dos
   segundos, en un móvil, se *vea* que aquí salen tiendas distintas entre sí.
2. **Personalidad tipográfica propia.** Una pareja de fuentes con carácter, una
   escala tipográfica clara, jerarquía fuerte. Que no parezca la tipografía
   por defecto de todo el mundo.
3. **Mobile-first de verdad.** Diseña primero los 390 px y luego el escritorio,
   no al revés. Cero scroll horizontal. Botones grandes y pulgar-friendly.
4. **Una sola apuesta visual audaz**, y el resto tranquilo alrededor. Mejor un
   golpe de efecto bien ejecutado que cinco efectos compitiendo.
5. **Credibilidad.** Tiene que verse como una plataforma seria en la que dejar
   tu negocio, no como una demo de fin de semana.
6. **Modo claro y modo oscuro** bien resueltos, con tokens (`:root`,
   `@media (prefers-color-scheme: dark)`), sin colores sueltos que solo
   funcionen en un tema.

**Evita** (esto es lo que hace que un diseño «huela a IA»): fondo crema con
serif y acento terracota; degradado morado-a-azul; Inter o Space Grotesk como
apuesta tipográfica; emojis como iconos de sección; todo centrado; bordes
redondeados idénticos en todo; barritas de acento en tarjetas; un hero gigante
con una sola frase enorme y nada más.

## 6. Qué tienes que entregar

Devuélvelo en este orden y con estos bloques exactos, porque se pega directo en
el proyecto:

1. **Concepto (máx. 8 líneas).** Qué idea visual elegiste y por qué encaja con
   «cada tienda es única». Nombra la paleta (4–6 hex con su función) y las dos
   tipografías con su papel.
2. **`app/page.tsx` completo**, listo para reemplazar el archivo actual.
   Componente servidor, sin `'use client'`, importando `Link` de `next/link`.
3. **`app/globals.css` completo**, listo para reemplazar el actual —
   **incluyendo las clases compartidas de la lista de la sección 3** (puedes
   restilizarlas, pero tienen que estar).
4. **El `<link>` de Google Fonts** que hay que poner en `app/layout.tsx`, y el
   `metadata` (title y description) si propones cambiarlos.
5. **Notas de implementación:** cualquier cosa que haga falta saber (variables
   nuevas, orden del CSS, algo que pueda chocar con `/demo`).

**No entregues** capturas, ni descripciones sin código, ni pseudocódigo, ni
código parcial con `// ...resto igual`. Archivos completos.

## 7. Criterios de aceptación (revísalos antes de entregar)

- [ ] El home carga sin JavaScript de cliente: es un componente servidor puro.
- [ ] En 390 px de ancho no hay scroll horizontal en ninguna sección.
- [ ] Todas las clases compartidas de la sección 3 siguen existiendo.
- [ ] Los CTA llevan a `/demo` con `<Link>`; las anclas apuntan a
      `#como-funciona`, `#disenos`, `#planes`, y esas secciones tienen esos `id`.
- [ ] Los placeholders `[precio]`, `[umbral]`, `[1–2] %` y `[dominio.com]` están
      intactos.
- [ ] Ningún color está definido *solo* dentro de un `@media` de tema oscuro.
- [ ] Contraste AA en texto sobre todos los fondos, incluida la sección oscura
      de planes.
- [ ] Hay `@media (prefers-reduced-motion: reduce)` si usaste animación.
- [ ] Cero dependencias nuevas, cero Tailwind, cero imágenes externas.

---

## 8. Mensaje para arrancar en ChatGPT

Pega esto justo después de este documento (o al final del mismo mensaje):

> Actúa como director de arte y desarrollador front-end senior. Acabas de leer
> el brief de arriba. Antes de escribir código, dime en 3 frases el concepto
> visual que propones y por qué no se parece a una landing de SaaS genérica. Si
> me convence te digo «adelante» y entonces me entregas los archivos completos
> del punto 6. Si tienes dudas que cambien el diseño, pregúntamelas ahora —
> máximo tres.

Y cuando te entregue el código, mándamelo aquí y yo lo integro, corro las
pruebas y lo despliego.
