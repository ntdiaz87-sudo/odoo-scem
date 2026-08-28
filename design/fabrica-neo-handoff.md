# Fábrica Neo — Documento de traspaso de diseño

Documento para continuar mejorando el diseño de la home en otra herramienta (ChatGPT u otra).
Incluye contexto de producto, sistema de diseño, arquitectura del código y mejoras pendientes.
El fichero fuente completo es `fabrica-neo.html` (un solo archivo HTML autocontenido: CSS + JS inline, sin librerías externas).

---

## 1. Qué es el producto

**"fábrica."** es una plataforma SaaS: una **fábrica de comercio electrónico agéntico**.
Un emprendedor responde una encuesta sencilla y una IA le genera **diseños de tienda online únicos e irrepetibles**; elige uno, queda **registrado a su nombre y retirado del catálogo para siempre**, y publica su tienda con dominio propio en **web + apps iOS/Android**, con **agentes de IA** que atienden clientes, redactan productos y avisan de reposiciones.

- Idioma de la página: **español**.
- Marca: wordmark `fábrica.` (el punto final lleva el degradado de acento).
- Los precios son marcadores de posición deliberados: `US$ [precio]`, `[1–2] %`, `US$ [umbral]`, `[dominio.com]`. **No inventar cifras**: se sustituirán cuando el negocio decida precios y dominio.

## 2. Dirección de arte (decisiones ya tomadas con el cliente)

1. **Rechazado**: el concepto verde/teal original y cualquier "raya" o filamento vertical en el fondo.
2. **Aprobado**: estética "IA" — **violeta eléctrico → cian** con toque magenta, sobre **degradado azul oscuro → negro**.
3. **Aprobado**: hero con **dispositivos fotorrealistas** (MacBook + iPad + iPhone) mostrando **tiendas de clientes reales funcionando** dentro. Nada de mockups planos "de dibujo".
4. **Aprobado**: patrón **scroll-storytelling estilo Apple** (referencia del cliente: https://apple-watch-collection.webflow.io/ — producto fijado en pantalla que se transforma por etapas al hacer scroll).
5. Obligatorio: **modo claro y modo oscuro** con toggle en la nav (el oscuro es el principal/por defecto).
6. Objetivo emocional: que **enganche desde el primer segundo** ("wow" futurista, nivel Awwwards).

## 3. Sistema de diseño

### Paleta (tokens CSS en `:root`, diseño *dark-first*)

Modo oscuro (base):

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#05070d` | fondo de página |
| `--bg-raise` | `#0c1222` | tarjetas/superficies |
| `--glass` | `rgba(13,18,36,.60)` | paneles glassmorphism |
| `--glass-line` | `rgba(139,148,255,.16)` | bordes de vidrio |
| `--ink` | `#e9edf8` | texto principal |
| `--muted` | `#9aa5c4` | texto secundario |
| `--faint` | `#6a7494` | texto terciario |
| `--line` | `#1a2340` | bordes/divisores |
| `--accent` | `#8b7cff` | violeta principal |
| `--accent2` | `#22d3ee` | cian secundario |
| `--magenta` | `#e254b6` | acento terciario (puntual) |
| `--grad` | `linear-gradient(115deg,#7c5cff,#22d3ee)` | botones primarios |
| `--grad-text` | `linear-gradient(100deg,#8b7cff,#22d3ee 60%,#e254b6 115%)` | texto degradado |
| `--glow` | `rgba(124,92,255,.22)` | sombras/brillos violeta |
| `--dev-shadow` | `rgba(0,0,0,.6)` | sombras de dispositivos |

Modo claro: fondo `#f5f5fc` (blanco lavanda), tinta `#171a30`, acentos `#6d4aff` / `#0891b2` / `#c02d92`, mismas estructuras.

Estructura de theming (3 estados): `:root` = paleta oscura completa; `@media (prefers-color-scheme: light){ :root:not([data-theme="dark"]) }` = clara; `:root[data-theme="light"]` = clara (el toggle gana en ambas direcciones). El toggle JS escribe `data-theme` en `<html>` y persiste en `localStorage` (clave `fabrica-theme`, con try/catch).

### Tipografía (Google Fonts)

- **Display** (títulos): `Bricolage Grotesque` 500/600/700 — personalidad, letter-spacing −0.02em en H1.
- **Cuerpo**: `Public Sans` 400–700.
- **Datos/etiquetas**: `IBM Plex Mono` 400/500 — eyebrows en mayúsculas con letter-spacing 0.16–0.18em, precios, chips, rail de progreso, dominios.

### Fondo del hero (WebGL)

Shader GLSL propio (sin librerías): **nebulosa** de fbm con domain-warping — manchas suaves de violeta/cian/magenta fluyendo sobre degradado vertical `#0b1226 → #04070d`. **Sin líneas ni rayas** (el cliente las rechazó). Uniform `u_dark` (0–1) interpola la paleta clara/oscura con transición suave al cambiar de tema. Con `prefers-reduced-motion` se dibuja un solo frame estático.

## 4. Estructura de la página (orden de secciones)

1. **Nav fija** (glass + blur): wordmark, enlaces (Cómo funciona / Diseños únicos / Planes), toggle de tema (sol/luna), CTA "Probar demo gratis" con degradado.
2. **Hero** (100vh, canvas WebGL de fondo):
   - Izquierda: eyebrow "FÁBRICA DE TIENDAS ONLINE · CON IA", H1 "Tu tienda online, diseñada por IA, *vendiendo en minutos.*" (la parte final con degradado de texto), subtítulo, CTAs, nota "Sin tarjeta… 60 segundos".
   - Derecha: **trío de dispositivos realistas** (ver §5) con chip HUD "Diseñador agéntico · en vivo", pill de dominio publicado y botón **"Generar otro diseño"** que regenera la tienda en los 3 dispositivos a la vez (fade+blur 300 ms).
3. **Scrollytelling "Mira cómo nace una tienda"** (`height: 460vh`, contenido pinned con `position: sticky`): iPhone realista fijado al centro-derecha; 4 etapas al hacer scroll con rail de progreso 01–04:
   - **01 Encuesta** — pantalla de encuesta (chips "¿Qué vendes? / ¿Cómo debe sentirse?").
   - **02 Propuestas** — "Generando propuestas…", hilos animados (loom), lista de 3 propuestas; **3 tarjetas se despliegan en abanico** detrás del teléfono (KORA/NOCTA/ATLAS).
   - **03 Elección** — tienda elegida (LUMEN) con sello de candado "Registrado a tu nombre. Retirado del catálogo para siempre."
   - **04 Publicada** — tienda completa con productos y pill "lumen.store · publicada".
   - Con `prefers-reduced-motion`: fallback estático (clase `.static`, etapas en lista vertical).
4. **Diseños únicos** — copy "Ninguna tienda se parece a otra" + 3 tarjetas con tilt 3D (KORA rosa, NOCTA negra/oro, ATLAS azul/naranja) + línea de candado "Tu diseño, bloqueado para ti".
5. **Todo incluido** — 4 tarjetas glass: Web+apps, Dominio comprado aquí, Agentes de IA, Pedidos/inventario/pagos.
6. **Planes** — Demo (gratis) / **Tienda** (destacado: fondo oscuro, borde degradado violeta→cian, pill "Más elegido") / Tienda + IA. Placeholders de precio intactos.
7. **CTA final** — "La próxima tienda única de la fábrica puede ser *la tuya*" (degradado).
8. **Footer** — wordmark + `[dominio.com]` + Términos/Privacidad/Contacto.

## 5. Dispositivos fotorrealistas (CSS puro, sin imágenes)

- **MacBook** (negro espacial, ~640 px): tapa con borde de aluminio en degradado (`#666b7c→#0c0d12`), bisel negro con **cámara** (punto con brillo azulado), pantalla con **reflejo de cristal** diagonal (pseudo-elemento con `linear-gradient(112deg, rgba(255,255,255,.10), …)`), **barra de navegador** (semáforo rojo/ámbar/verde + candado + dominio), **base/deck** con muesca de apertura y highlight inferior. `filter: drop-shadow(0 38px 46px var(--dev-shadow))`.
- **iPhone** (~178 px): **anillo de titanio** (degradado multicolor gris), **Dynamic Island** con lente de cámara (radial-gradient), **botones laterales físicos** (3 izquierda + 1 derecha), pantalla con reflejo, **barra de estado** (9:41 + señal/wifi/batería en SVG), **tab bar** inferior (home activo en acento, búsqueda, carrito con badge, perfil). Animación de flotación `bob` 6 s.
- **iPad** (~232 px): anillo de titanio, cámara frontal, reflejo. Flotación 7 s.
- **Suelo**: elipse radial difuminada bajo el trío (`.devices::before`).
- **Parallax**: tilt 3D del grupo entero con el ratón (±5°), desactivado con `pointer: coarse` o `prefers-reduced-motion`.

## 6. Tiendas demo ("clientes reales") — datos en JS

Array `designs` con 4 tiendas; el render genera el HTML de las 3 pantallas (laptop completa, tablet media, móvil app). Cada tienda define: nombre, dominio, announce bar, paleta propia (pageBg/ink/sub/line/searchBg/accent), hero (kicker, H1, sub, escena, emoji, tag) y 4 productos `[emoji, nombre, rating, nºreseñas, precio, precio tachado, fondo de escena]`.

| Tienda | Vertical | Look | Dominio |
|---|---|---|---|
| **LUMEN** | tecnología/audio | azul marino oscuro + cian | lumen.store |
| **KORA** | cosmética | crema rosada + frambuesa | kora.shop |
| **NOCTA** | moda nocturna | negro + oro | nocta.shop |
| **ATLAS** | deporte | blanco azulado + naranja | atlas.run |

Realismo de las tiendas: announce bar, nav con buscador ("Buscar en lumen…"), wishlist y **carrito con contador**, hero de colección con **"foto" de producto** (radial-gradient tipo iluminación de estudio + **emoji grande con drop-shadow rotado −8°** como producto + viñeta con pseudo-elemento), tarjetas con **ratings ★ 4.8 (231)**, **precios con tachado** y botón "Añadir".

> Nota: los emoji funcionan como fotos de producto porque el CSP de los artifacts de Claude bloquea imágenes externas. **Si continúas fuera de ese entorno (ChatGPT/hosting propio), puedes sustituirlos por fotos reales de producto (Unsplash/render 3D) — es la mejora nº 1.**

## 7. Motores JS (vanilla, sin dependencias)

- **Tema**: `effTheme()` = `data-theme` o `prefers-color-scheme`; toggle invierte y persiste.
- **Reveals**: IntersectionObserver añade `.in` (fade + translateY 26 px, cubic-bezier(0.16,1,0.3,1)), con `transition-delay` escalonado inline.
- **Scrollytelling**: listener de scroll con rAF; progreso `p = -rect.top/(alto−vh)`; `seg = p*4`; opacidad por etapa con bordes de fundido 0.22; abanico en etapa 2 (translateX ±(36+spread·168), rotate, easeOutCubic); teléfono "respira" (rotateY 9°·sin, rotateX 2.2°·sin); rail con fill de altura `p·100%`.
- **Generador**: `render(design)` reconstruye innerHTML de `#storeLap/#storeTab/#storePh` + dominios; swap con `.swapping` (opacity 0 + blur 8px, 300 ms).
- **Shader**: fragment shader con `hash/noise/fbm` (5 octavas), domain warp `q`, tres capas de color mezcladas con `smoothstep`; DPR limitado a 1.6; pausa cuando el canvas sale del viewport (IO).

## 8. Accesibilidad y calidad

- `prefers-reduced-motion`: sin animaciones, scrolly estático, shader a 1 frame.
- `:focus-visible` con outline de acento; botones/enlaces reales (`<a>`, `<button>`).
- Contraste revisado en ambos temas; ningún color definido solo dentro de un bloque de tema.
- Responsive: ≤1080 px hero en columna; ≤980 px scrolly reordenado (texto arriba, escena escalada 0.72), grids a 1–2 col; ≤640 px iPad oculto, iPhone más pequeño.
- `text-wrap: balance` en títulos; `tabular-nums` no aplicado aún a precios (mejora menor).

## 9. Historial de versiones (decisiones)

- v1: concepto verde/teal, hilos tejidos → **verde rechazado**.
- v2: scrollytelling añadido (referencia Apple Watch) → **patrón aprobado**.
- v3: paleta IA + multi-dispositivo plano → dispositivos "parecían un dibujo".
- v4: shader sin rayas (nebulosa) → **aprobado**.
- v5 (actual): dispositivos fotorrealistas CSS + tiendas densas de detalle, verificado con bucle de Playwright (capturas en ambos temas, 4 etapas del scrolly, tienda clara KORA).

## 10. Mejoras pendientes (backlog sugerido)

1. **Fotos reales de producto** en las tiendas demo (fuera del CSP de artifacts): Unsplash/renders; mantener la iluminación de estudio.
2. **Más etapas o zoom-out final** en el scrolly: en la etapa 04, alejar la cámara y mostrar la tienda también en laptop/tablet ("en todos tus dispositivos").
3. **Sección de testimonios/casos**: carrusel de tiendas "reales" con métricas (ventas, países), con los mismos frames de dispositivo.
4. **Micro-demo interactiva**: mini-encuesta funcional de 2 preguntas que genere una tienda con paleta aleatoria (nombre + colores procedurales) en vez de ciclar 4 fijas.
5. **Header scroll-aware**: nav que se compacta y gana borde al hacer scroll.
6. **Lenis-style smooth scroll** + GSAP ScrollTrigger si se migra a hosting propio (fuera de artifacts se pueden usar CDNs).
7. **Cursor personalizado / magnetic buttons** en CTAs.
8. **SEO/meta + Open Graph** al pasarlo a producción (título, descripción, og:image).
9. Sustituir placeholders `[precio]/[umbral]/[dominio.com]` cuando haya decisión de negocio.
10. `font-variant-numeric: tabular-nums` en precios y contadores.

## 11. Cómo trabajar con el fichero

- Todo vive en `fabrica-neo.html`: `<style>` único, HTML semántico por secciones comentadas (`<!-- ==== NAV ==== -->`, etc.) y un `<script>` IIFE al final.
- Para previsualizar: envolver en `<!doctype html><html><head><meta charset="utf-8">…` (los artifacts de Claude añaden ese esqueleto solos; fuera de ese entorno hay que añadirlo).
- Restricción original (solo si se sigue publicando como artifact de Claude): sin scripts/imágenes externas salvo Google Fonts y CDNs concretos (cdnjs/jsdelivr); por eso todo es inline. En hosting propio esta restricción desaparece.

## 12. Prompt sugerido para continuar en ChatGPT

> Te paso `fabrica-neo.html`, la home de "fábrica." (SaaS que genera tiendas online únicas con IA, en español). Lee el documento de traspaso adjunto y respeta: paleta violeta #7c5cff → cian #22d3ee sobre azul oscuro #0b1226→negro, tipografías Bricolage Grotesque + Public Sans + IBM Plex Mono, modo claro/oscuro con el patrón de tokens existente, dispositivos fotorrealistas del hero y el scrollytelling de 4 etapas. No uses verde, no añadas rayas verticales al fondo, no inventes precios (mantén [precio]/[umbral]). Mejora ahora: [elige del backlog §10].
