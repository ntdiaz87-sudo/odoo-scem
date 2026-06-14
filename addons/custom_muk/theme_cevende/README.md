# Tema CEVENDE — Paquete para Claude Code

Este paquete contiene la **maqueta fiel del diseño aprobado** de CEVENDE y el
**esqueleto de un tema de Odoo 17** listo para que Claude Code lo convierta en
un tema funcional e instalable.

## Qué hay aquí

```
theme_cevende/
├── __manifest__.py              # Manifiesto del tema (depends, assets, data)
├── README.md                    # Este fichero
├── preview/
│   └── index.html               # ★ MAQUETA FIEL AL DISEÑO (fuente de verdad)
├── views/
│   └── layout.xml               # Header/footer que heredan website.layout
├── snippets/                    # Un snippet por bloque (arrastrables en el editor)
│   ├── hero_split.xml           # ★ COMPLETO — usar como patrón para los demás
│   ├── solutions_grid.xml       # esqueleto guiado
│   ├── solar_calculator.xml     # esqueleto guiado
│   ├── featured_products.xml    # esqueleto guiado
│   ├── wholesale_order.xml       # esqueleto guiado
│   ├── success_cases.xml        # esqueleto guiado
│   ├── brands.xml               # esqueleto guiado
│   ├── newsletter.xml           # esqueleto guiado
│   └── footer.xml               # esqueleto guiado
└── static/src/
    ├── scss/
    │   ├── _variables.scss      # ★ COMPLETO — tokens (colores, fuente, sombras)
    │   └── theme.scss           # portar aquí los estilos de preview/index.html
    ├── js/
    │   └── solar_calculator.js  # esqueleto de la lógica de la calculadora
    └── img/                     # imágenes del tema (vacío — añadir aquí)
```

El símbolo ★ marca los ficheros que ya están **completos y son fiables como
referencia**. Abre `preview/index.html` en un navegador: ese es el aspecto
exacto que debe tener el tema.

## Paleta y tipografía (de la especificación)

- Azul oscuro `#071B3A` · Turquesa `#19D3C5` · Azul CTA `#2563EB`
- Blanco `#FFFFFF` · Gris fondo `#F8FAFC`
- Fuente: **Inter** (pesos 400/500/600/700)

Están en `static/src/scss/_variables.scss` como variables `$cv-*` y en el
`:root` de `preview/index.html` como `--cv-*`.

## Orden de las secciones (Home)

Header → Hero B2C/B2B → Soluciones → Calculadora Solar → Productos Destacados →
Compra Rápida Mayorista → Casos Reales → Marcas → Newsletter → Footer.

---

## PROMPT PARA CLAUDE CODE

Copia y pega esto en Claude Code, dentro del proyecto, con este paquete ya
colocado en `addons/`:

```
Tengo un esqueleto de tema Odoo 17 en addons/theme_cevende/. El diseño
aprobado y fiel está en addons/theme_cevende/preview/index.html — ábrelo
y úsalo como FUENTE DE VERDAD para el aspecto visual (colores, espaciados,
tipografía, jerarquía).

Objetivo: convertir el esqueleto en un tema instalable y funcional,
respetando estas reglas:

1. Lee primero preview/index.html y _variables.scss para entender el diseño
   y los tokens.

2. Porta los estilos del bloque <style> de preview/index.html a
   static/src/scss/theme.scss, sustituyendo las variables var(--cv-*) por
   las variables SCSS $cv-* de _variables.scss. No cambies colores ni
   medidas: fidelidad al diseño.

3. Completa cada snippet en snippets/ siguiendo EXACTAMENTE el patrón de
   snippets/hero_split.xml (que ya está completo). Cada bloque del diseño
   tiene su snippet correspondiente. Mantén las clases cv-* tal cual.

4. En views/layout.xml, porta el header y la barra de navegación,
   adaptando los enlaces a rutas reales de Odoo (/shop, /web/login, etc.).

5. Para los bloques con datos reales (Productos Destacados, Marcas),
   usa t-foreach sobre los modelos de Odoo (product.template) en lugar de
   las tarjetas estáticas de la maqueta.

6. La calculadora solar: revisa static/src/js/solar_calculator.js y conecta
   el formulario del snippet solar_calculator con esa lógica.

Trabaja por pasos y enséñame el plan antes de empezar. No instales el módulo
todavía: primero deja el código listo y dime qué revisar. Cuando esté, te
indico cómo levantarlo con docker compose.

IMPORTANTE: sigue las reglas de ingeniería del CLAUDE.md (cambios mínimos,
nada de churre, no inventar campos de Odoo, verificar antes de dar por hecho).
```

---

## Cómo instalar el tema (cuando el código esté listo)

1. El tema ya está en `addons/theme_cevende/`, dentro de una carpeta que el
   `addons_path` de tu `odoo.conf` ya incluya.
2. Actualiza la lista de módulos y instala:
   ```
   docker compose restart web
   ```
   Luego en Odoo: Ajustes → Activar modo desarrollador → Aplicaciones →
   Actualizar lista de aplicaciones → buscar "CEVENDE Theme" → Instalar.
3. O por línea de comandos:
   ```
   docker compose run --rm web odoo -d scem -i theme_cevende --stop-after-init
   docker compose restart web
   ```
4. Activa el tema en: Sitio web → Configuración → elegir tema CEVENDE.

## Notas

- Los iconos de la maqueta son emojis temporales. En el tema real conviene
  usar un set de iconos (Font Awesome viene con Odoo, o SVG propios).
- Las imágenes (`[ Producto ]`, `[ Hogar ]`, etc.) son placeholders. Sustituir
  por imágenes reales en `static/src/img/` o por imágenes de productos de Odoo.
- El diseño es responsive (breakpoints 767 / 1024 / 1440 px) según la
  especificación; los media queries están al final del `<style>` de la maqueta.

---

## Imágenes e iconos (instrucción adicional para Claude Code)

Los placeholders `[ ... ]` de la maqueta marcan dónde van las imágenes.
Trátalos así:

- **Hero B2C/B2B, calculadora solar, casos de éxito** → imágenes de diseño.
  Deja los huecos con la clase y proporción correctas, y crea en
  `static/src/img/` los nombres de fichero esperados (p. ej. `hero_b2c.jpg`,
  `hero_b2b.jpg`, `solar_home.jpg`, `case_habana.jpg`). El cliente subirá las
  fotos reales a esas rutas.

- **Productos destacados** → NO usar imágenes fijas. Usar las imágenes reales
  de los productos de Odoo con `t-field` sobre `product.template`
  (campo `image_1920`).

- **Logos de marcas** (Samsung, LG, Midea, GREE, CanadianSolar, Growatt,
  JA Solar, BYD) → dejar los huecos con el nombre y preparar
  `static/src/img/brands/`. El cliente subirá los logos oficiales. No
  descargar logos de marcas registradas por tu cuenta.

- **Iconos** → sustituir los emojis temporales de la maqueta por iconos de
  **Font Awesome** (ya incluido en Odoo) para un acabado limpio como el del
  diseño aprobado. Ej.: `<i class="fa fa-snowflake-o"/>` para Refrigeración.

## Secciones (mapa completo del diseño aprobado)

1. Trust Bar (barra superior: envíos, garantía, pagos, soporte)
2. Header + navegación
3. Hero Split B2C / B2B
4. Soluciones (4 tarjetas)
5. Calculadora Solar
6. Productos Destacados (carrusel)
7. Compra Rápida Mayorista
8. Casos de Éxito + Marcas
9. Newsletter
10. Footer

Todas están maquetadas en `preview/index.html`. Esa es la fuente de verdad
visual; esta lista solo confirma el orden y nombres.
