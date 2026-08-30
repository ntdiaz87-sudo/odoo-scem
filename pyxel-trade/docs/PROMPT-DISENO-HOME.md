# Prompt para ChatGPT — Diseño de la Home de PYXEL Cuba Trade OS

> **Cómo usarlo:** copia todo lo que hay bajo la línea y pégalo en ChatGPT.
> Adjunta también la imagen `06-v2-trade-os-direction.png` del handoff.
> Cuando responda, pásame su entrega completa y yo la implemento en Odoo.

---

Actúa como diseñador de producto senior especializado en plataformas B2B.
Vas a entregar la especificación de diseño de una pantalla que **otra persona
va a implementar en código**. No necesito inspiración ni moodboards: necesito
una especificación tan precisa que se pueda construir sin volver a preguntarte.

## El producto

**PYXEL — Cuba Trade OS.** Plataforma digital B2B que conecta fabricantes y
proveedores chinos con empresas, importadores, distribuidores y mayoristas de
Cuba. No es sólo un marketplace: combina descubrimiento de producto,
verificación de proveedores, solicitudes de cotización, operaciones de
importación, consolidación de contenedores mixtos, logística e inteligencia
de mercado.

Posicionamiento: **Your Digital Gateway to the Cuban Market**
Promesa corta: **Source. Import. Distribute. Sell.**

La plataforma tiene **dos públicos opuestos y dos puertas de entrada**:

1. **Comprador cubano** (empresa, importador, mayorista) — es **la pantalla
   que vas a diseñar ahora**. Quiere encontrar producto, comparar, cotizar y
   montar una importación.
2. **Proveedor chino** (fabricante, OEM/ODM, marca) — puerta distinta, en
   inglés y chino, que se diseñará después. **En esta pantalla sólo necesita
   existir su punto de entrada en la cabecera** (algo tipo "Vender en Cuba"),
   visible pero sin competir con el flujo del comprador.

## Restricciones técnicas innegociables

Esto se implementa en **Odoo 19**, con plantillas QWeb y **Bootstrap 5**.
Diseña dentro de esas reglas o el trabajo no será implementable:

- **Rejilla de 12 columnas de Bootstrap 5.** Puntos de ruptura estándar:
  576 / 768 / 992 / 1200 / 1400 px. No propongas una rejilla propia.
- **No uses nombres de clase de Tailwind.** Expresa el diseño en valores
  concretos (px, rem, hex) y en variables CSS. Yo escribo el SCSS.
- **Nada de Google.** Ni Fonts, ni reCAPTCHA, ni Analytics, ni Maps. Están
  bloqueados o son inestables en China y medio público objetivo no cargaría
  la página. Elige tipografías **autoalojables** con licencia libre
  (Inter, Manrope, Plus Jakarta Sans, Source Sans 3 o similar) e indica el
  archivo exacto y el peso.
- **Pila tipográfica china obligatoria** como respaldo, para 简体中文:
  `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC"`.
  Comprueba que la jerarquía sigue funcionando con caracteres han, que
  ocupan un ancho distinto al alfabeto latino.
- **Sin CDN externos.** Todo se sirve desde el propio dominio.
- **Ancho de contenido:** 1320 px como máximo (contenedor de Bootstrap).

## Decisiones de producto ya tomadas — no las cuestiones

- **Los precios y el MOQ son públicos**, visibles sin iniciar sesión.
- Los precios son **rangos indicativos FOB** (`US$ 0.18 – 0.21 / W`), no
  precios en firme. El precio en firme llega por cotización. Diséñalos de
  forma que se lea claramente que son orientativos.
- La moneda es **USD**. Las unidades son B2B: por unidad, por vatio, por
  palé, por contenedor.

## Lo que quiero

- Mucho espacio negativo y jerarquía tipográfica fuerte.
- Fotografía realista de producto y logística.
- Tarjetas amplias con bordes sutiles.
- Azul PYXEL como color de acción, no como relleno.
- Verde para señales de oportunidad y demanda. Naranja para logística.
- Microanimaciones discretas.
- La búsqueda por intención como protagonista de la pantalla.
- Personalidad propia.

## Lo que no quiero

- Panel de control lleno de mini-gráficas.
- Barra lateral en la home pública.
- Glassmorphism, gradientes gratuitos, quince colores compitiendo.
- Hero corporativo genérico.
- Parecerse a Alibaba, Amazon, Temu o Made-in-China.
- Mobile como desktop comprimido.
- La IA representada sólo como una burbuja de chat flotante.

## Entregables

Numéralos igual que aquí.

### 1. Tokens de diseño
Tabla con **valores hexadecimales exactos**, listos para copiar como
variables CSS. Incluye: fondo, superficie, borde, texto primario, texto
secundario, texto atenuado, azul PYXEL (y sus estados hover/active), azul IA,
verde oportunidad, naranja logística, rojo error. Añade escala tipográfica en
`rem`, escala de espaciado, radios de borde y sombras.

### 2. Rejilla y comportamiento responsive
Cómo se recompone cada sección en 1440 / 1280 / 992 / 768 / 390 px. Di el
número de columnas por sección en cada punto de ruptura y qué elementos se
ocultan, se reordenan o se convierten en carrusel.

### 3. Especificación de la Home, sección por sección
Estas nueve, en este orden. Para cada una: altura o espaciado vertical,
composición, tamaños tipográficos, y qué ocurre al pasar el ratón.

1. **Cabecera** — logo, navegación (Productos · Proveedores · Importar ·
   Mercado Cuba · Cómo funciona · Servicios), selector de idioma ES/EN/中文,
   entrada de proveedor chino, Iniciar sesión, Crear cuenta. Fija al hacer
   scroll.
2. **Hero con búsqueda por intención** — titular "De China a Cuba. Una
   plataforma para hacerlo realidad.", subtítulo, campo de búsqueda con
   marcador de posición y cuatro ejemplos pulsables.
3. **¿Qué quieres hacer hoy?** — cuatro tarjetas: Encontrar productos ·
   Encontrar fabricante · Crear una importación · Crear contenedor MIX.
4. **Explora oportunidades por categoría** — seis tarjetas fotográficas:
   Energía Solar, Electrodomésticos, Movilidad Eléctrica, Electrónica,
   Hogar y Ferretería, Equipamiento Empresarial.
5. **Productos destacados** — con filtros (Popular · Mejor precio · Nuevos ·
   Alta demanda).
6. **Cuba Market Pulse** — señales de demanda del mercado cubano. **Trátalo
   como una sección principal, no como un widget lateral:** es el dato que
   ningún competidor puede replicar y es la razón por la que un fabricante
   chino se registra. Editorial e inteligente, no una gráfica.
7. **Trade Builder / Contenedor MIX** — tipo de contenedor, volumen ocupado,
   espacio restante, recomendación inteligente.
8. **Confianza** — métricas de respaldo, presentes pero no protagonistas.
9. **Pie de página** — Marketplace · Trade · Proveedores · Empresa · Legal ·
   selector de idioma.

### 4. Componentes con todos sus estados
Para cada uno: reposo, hover, foco de teclado, activo, deshabilitado,
cargando, vacío y error.

`Header` · `LanguageSwitcher` · `IntentSearch` · `QuickActionCard` ·
`CategoryCard` · `ProductCard` · `SupplierBadge` · `MarketPulseItem` ·
`TradeBuilderSummary` · `Button` (primario, secundario, fantasma)

### 5. La tarjeta de producto, en detalle
Es el componente que más se repite en toda la plataforma. Especifica la
posición exacta de cada dato:

- Imagen, insignia de estado (Alta demanda / Recomendado / Nuevo / Oferta)
- Marca y nombre del producto
- Rango de precio indicativo con su unidad
- MOQ, incoterm y puerto de origen
- Plazo de entrega
- Distintivo de fabricante verificado
- **Insignia de compatibilidad eléctrica** (ver abajo)
- CTA `Solicitar cotización` y acción secundaria `Añadir a operación`
- Acción de favorito

### 6. La insignia de compatibilidad eléctrica
Esto no está en ninguna referencia y es un requisito nuevo. Diséñalo bien,
porque es el detalle que más nos diferencia.

**El problema real:** en China la red es 220 V / 50 Hz. En Cuba es
110 V y 220 V, a **60 Hz**. Un electrodoméstico chino estándar llega a Cuba y
funciona mal o se destruye. Con motores (neveras, aires, lavadoras) la
frecuencia es crítica, y un inversor solar de 50 Hz sencillamente no
sincroniza con la red cubana.

Diseña una insignia con **cuatro estados**, legible de un vistazo y que
funcione también para daltónicos (no sólo por color):

- `Compatible` — 110 V/60 Hz o multitensión. Verde.
- `Compatible parcial` — 220 V/60 Hz, sólo para instalaciones de 220 V.
- `Requiere adaptación` — 220 V/50 Hz. Naranja, con aviso.
- `No aplica` — producto sin componente eléctrico. Neutro.

Diseña también su versión como **filtro** en la búsqueda.

### 7. Accesibilidad
Contraste mínimo AA (4.5:1 en texto normal, 3:1 en texto grande) — dame los
ratios calculados de las combinaciones principales. Anillo de foco visible
para navegación por teclado. Área táctil mínima de 44 × 44 px.

### 8. Textos en tres idiomas
Tabla con **todos** los textos visibles de la pantalla, en tres columnas:
**Español · English · 简体中文**. Incluye titulares, subtítulos, etiquetas de
navegación, marcadores de posición, CTAs, insignias y estados vacíos.
El chino debe ser comercial y natural, no traducción literal.

### 9. Renders
Imágenes de la home completa a **1440 px**, **768 px** y **390 px**.

## Formato de entrega

Un único documento en Markdown con los nueve entregables numerados, más las
imágenes. Tablas para tokens y textos. Valores concretos siempre: nada de
"un azul vivo" — dame `#1B63F5`. Nada de "espaciado generoso" — dame `96px`.

## Criterio de aceptación

Debo poder implementar la pantalla completa a partir de tu documento **sin
hacerte una sola pregunta de seguimiento**. Si al terminar detectas que algo
queda ambiguo, resuélvelo tú y déjalo escrito.
