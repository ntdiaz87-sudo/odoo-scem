# Imágenes que necesito para el Home V2

Este documento tiene dos partes:

1. **La lista exacta** de imágenes, con nombre de fichero, tamaño y contenido.
2. **El prompt para ChatGPT**, listo para pegar.

---

## Por qué esta lista y no otra

El paquete de diseño no trae ni una imagen de tienda, y el render vive de la
fotografía: el propio sistema de diseño dice *«las capturas de tienda deben
dominar sobre la iconografía»*. La galería pide ocho capturas de plantilla en
alta resolución.

En vez de pedir «capturas de plantillas» (que serían maquetas falsas), pido la
**materia prima**: la fotografía de producto y ambiente de cada rubro. Con ella
construyo las ocho plantillas como diseños reales del motor de tiendas, y las
capturas de la galería salen de nuestro propio producto con Playwright. Así lo
que enseña el home existe de verdad y el botón «usar este diseño» lleva a algo.

### Tres reglas que se aplican a TODAS las imágenes

1. **Sin texto de ningún tipo.** Ni carteles, ni etiquetas, ni logos, ni
   palabras en la ropa o el envase. Todo el texto lo pinto yo en HTML, en chino
   y en español. El texto generado por IA sale deforme y además no se puede
   traducir.
2. **Sin marcas reales ni nada reconocible.** Nada de logotipos, ni envases que
   imiten a una marca existente, ni edificios identificables.
3. **Mercado chino.** Las personas que aparezcan deben ser de Asia oriental, y
   el estilo, la ropa y los objetos, los de una tienda urbana china de gama
   media-alta (Pekín / Shanghái), no los de un catálogo occidental.

---

## Bloque P0 — lo mínimo para empezar (24 imágenes)

Cuatro plantillas, que son las cuatro que se ven en la galería del home.

### 1. LUMINA — moda femenina, minimalista, claro
Fondo de estudio para los productos: **`#F3EFE9`** (marfil)

| Fichero | Tamaño | Contenido |
|---|---|---|
| `lumina-hero.jpg` | 2400×1400 | Modelo asiática de perfil, luz natural suave de ventana, blusa de punto color crema, fondo marfil liso. Estilo editorial de moda, no publicidad. Espacio vacío a la izquierda para el texto. |
| `lumina-p1.png` | 1600×1600 | Blusa de punto crema doblada, plano cenital, sombra suave |
| `lumina-p2.png` | 1600×1600 | Bolso de piel color camel, de tres cuartos |
| `lumina-p3.png` | 1600×1600 | Abrigo de lana gris colgado de una percha de madera |
| `lumina-p4.png` | 1600×1600 | Pañuelo de seda doblado, tonos tierra |

### 2. NEO — tecnología, audaz, oscuro
Fondo de estudio para los productos: **`#14161A`** (grafito)

| Fichero | Tamaño | Contenido |
|---|---|---|
| `neo-hero.jpg` | 2400×1400 | Auriculares de diadema negros mate flotando sobre fondo grafito, luz dura lateral y un reflejo azul frío. Espacio vacío a la izquierda. |
| `neo-p1.png` | 1600×1600 | Auriculares de diadema negros, tres cuartos |
| `neo-p2.png` | 1600×1600 | Reloj inteligente con correa negra, esfera apagada (sin números) |
| `neo-p3.png` | 1600×1600 | Auriculares de botón en su estuche abierto |
| `neo-p4.png` | 1600×1600 | Altavoz portátil cilíndrico gris oscuro |

### 3. ORIGIN — café de especialidad, cálido, oscuro
Fondo de estudio para los productos: **`#2A1B12`** (marrón oscuro)

| Fichero | Tamaño | Contenido |
|---|---|---|
| `origin-hero.jpg` | 2400×1400 | Café con leche visto en tres cuartos sobre madera oscura, vapor visible, luz cálida y baja. Espacio vacío a la izquierda. |
| `origin-p1.png` | 1600×1600 | Bolsa de café kraft sin etiqueta, de pie |
| `origin-p2.png` | 1600×1600 | Granos de café tostado en un cuenco de cerámica |
| `origin-p3.png` | 1600×1600 | Cafetera de goteo de cuello de cisne, acero |
| `origin-p4.png` | 1600×1600 | Taza de cerámica artesanal color arcilla |

### 4. PURE — belleza, limpio, claro
Fondo de estudio para los productos: **`#F2F4F3`** (blanco verdoso)

| Fichero | Tamaño | Contenido |
|---|---|---|
| `pure-hero.jpg` | 2400×1400 | Frascos de cosmética de vidrio esmerilado sobre piedra clara, luz difusa, sombra larga y suave. Espacio vacío a la izquierda. |
| `pure-p1.png` | 1600×1600 | Frasco cuentagotas de vidrio ámbar |
| `pure-p2.png` | 1600×1600 | Tarro de crema de cerámica blanca |
| `pure-p3.png` | 1600×1600 | Tubo de limpiador facial blanco mate |
| `pure-p4.png` | 1600×1600 | Bruma facial en frasco de vidrio transparente |

### 5. Los tres agentes de IA (3 imágenes)

**Ilustración, no fotografía.** En el render son retratos fotorrealistas de
personas: presentar una IA con cara de persona real es un problema de honestidad
y además no sabemos de dónde salen esas caras.

| Fichero | Tamaño | Contenido |
|---|---|---|
| `agente-xiaomei.png` | 1000×1000 | Retrato ilustrado, mujer joven asiática, sonrisa amable, camisa color coral. Vector plano moderno, sombreado suave, fondo circular liso `#F0EDFF` |
| `agente-xiaolin.png` | 1000×1000 | Retrato ilustrado, hombre joven asiático con gafas, sudadera azul. Mismo estilo exacto |
| `agente-xiaoan.png` | 1000×1000 | Retrato ilustrado, mujer joven asiática de pelo corto, jersey verde salvia. Mismo estilo exacto |

**Los tres tienen que parecer la misma serie**: mismo encuadre, mismo grosor de
línea, misma paleta, misma iluminación. Pídeselos en una sola tanda.

### 6. Arte abstracto del diseño exclusivo (1 imagen)

| Fichero | Tamaño | Contenido |
|---|---|---|
| `ai-exclusivo.jpg` | 1600×2000 | Forma fluida abstracta en 3D, violeta y lavanda, superficie satinada, sobre fondo blanco. Sin texto, sin figuras, sin logos. Es el panel de «diseño exclusivo AI» |

---

## Bloque P1 — las otras cuatro plantillas (20 imágenes)

Mismo formato: 1 hero de 2400×1400 y 4 productos de 1600×1600 por plantilla.

| Plantilla | Rubro | Fondo de producto | Los 4 productos |
|---|---|---|---|
| **NOMAD** | Outdoor | `#1E2620` verde oscuro | mochila de lona, termo de acero, botas de montaña, linterna |
| **BLOOM** | Flores | `#F7F0F2` rosa pálido | ramo envuelto en papel, jarrón de vidrio, tijeras de podar, planta en maceta |
| **PAWS** | Mascotas | `#FCF4E8` crema cálido | collar de cuero, cama de mascota, juguete de cuerda, comedero de cerámica |
| **HOMELY** | Hogar | `#F1EDE6` arena | cuenco de cerámica, manta de lino doblada, vela en tarro de vidrio, tetera de barro |

---

## Bloque P2 — verticales para el hero (5 imágenes)

El hero enseña un portátil y un teléfono con la misma tienda. Para el teléfono
necesito la versión vertical de cinco heros:

`lumina-hero-vertical.jpg`, `neo-hero-vertical.jpg`, `origin-hero-vertical.jpg`,
`pure-hero-vertical.jpg`, `homely-hero-vertical.jpg` — todas de **1200×1600**,
la misma escena que su hero horizontal, recomponida en vertical.

---

## Formato de entrega

- Heros y verticales: **JPG** o **WebP**, calidad alta.
- Productos y agentes: **PNG**.
- Nombres de fichero **exactamente** como en las tablas. Si me llegan con otro
  nombre tendré que adivinar cuál es cuál.
- Mándamelas en un ZIP, o sueltas si es más cómodo.

## Sobre los derechos

Las imágenes que genera ChatGPT son tuyas y las puedes usar comercialmente
según los términos de OpenAI. Esa es la razón principal para generarlas en vez
de tirar de un banco de imágenes: no hay licencia que renovar ni riesgo de que
una foto aparezca en la web de un competidor.

---

# EL PROMPT PARA CHATGPT

Copia desde aquí hasta el final y pégalo en ChatGPT. Te irá pidiendo confirmación
por tandas.

---

Necesito que generes un set de imágenes para el sitio de un producto de comercio
electrónico dirigido al mercado chino. Voy a darte la lista completa y quiero
que las generes **por tandas**, parándote a enseñármelas antes de seguir.

Tres reglas que se aplican a TODAS las imágenes, sin excepción:

1. **Cero texto.** Ninguna palabra, letra, número, cartel, etiqueta ni logo en
   ninguna imagen. Ni en la ropa, ni en los envases, ni en el fondo. El texto se
   añade después por software.
2. **Nada de marcas reales** ni envases que imiten a una marca existente, ni
   edificios o lugares reconocibles.
3. **Mercado chino.** Las personas deben ser de Asia oriental. El estilo, la
   ropa y los objetos, los de una tienda urbana china de gama media-alta (Pekín
   o Shanghái), no los de un catálogo occidental.

Estilo general: fotografía de producto de gama alta, luz suave y realista,
composición limpia, sensación premium y editorial. Nada de collage, nada de
saturación excesiva, nada de estética publicitaria agresiva.

## TANDA 1 — cuatro fotos de ambiente (2400×1400, apaisadas)

En las cuatro deja la mitad izquierda relativamente vacía: ahí va a ir un
titular, y necesito sitio limpio para ponerlo.

1. Modelo asiática de perfil junto a una ventana, blusa de punto color crema,
   luz natural difusa, fondo marfil liso. Editorial de moda, sereno, minimalista.
2. Unos auriculares de diadema negros mate, flotando sobre un fondo gris grafito
   muy oscuro, luz dura lateral y un reflejo azul frío en el borde.
3. Un café con leche en taza de cerámica, visto en tres cuartos sobre una mesa de
   madera oscura, con vapor visible, luz cálida y baja de cafetería.
4. Tres frascos de cosmética de vidrio esmerilado sobre una superficie de piedra
   clara, luz difusa de estudio, sombras largas y muy suaves.

## TANDA 2 — dieciséis fotos de producto (1600×1600, cuadradas)

Cada grupo de cuatro va sobre un fondo de estudio liso, sin degradado, del color
exacto que indico. El producto centrado, con una sombra de contacto suave.

Fondo marfil `#F3EFE9`:
5. Una blusa de punto color crema doblada, vista desde arriba.
6. Un bolso de piel color camel, de tres cuartos.
7. Un abrigo de lana gris colgado de una percha de madera.
8. Un pañuelo de seda doblado, en tonos tierra.

Fondo grafito `#14161A`:
9. Unos auriculares de diadema negros mate, de tres cuartos.
10. Un reloj inteligente de correa negra, con la pantalla apagada.
11. Unos auriculares de botón dentro de su estuche abierto.
12. Un altavoz portátil cilíndrico, gris oscuro.

Fondo marrón oscuro `#2A1B12`:
13. Una bolsa de café de papel kraft, de pie, completamente lisa y sin etiqueta.
14. Granos de café tostado en un cuenco de cerámica.
15. Una cafetera de goteo de cuello de cisne, de acero.
16. Una taza de cerámica artesanal color arcilla.

Fondo blanco verdoso `#F2F4F3`:
17. Un frasco cuentagotas de vidrio ámbar.
18. Un tarro de crema de cerámica blanca.
19. Un tubo de limpiador facial blanco mate.
20. Una bruma facial en frasco de vidrio transparente.

## TANDA 3 — tres avatares ilustrados (1000×1000)

**Ilustración vectorial, NO fotografía y NO fotorrealismo.** Estilo plano
moderno, sombreado suave, línea limpia. Los tres tienen que parecer de la misma
serie: mismo encuadre de cabeza y hombros, misma iluminación, mismo grosor de
línea, misma paleta. Fondo circular liso lavanda `#F0EDFF` en las tres.

21. Mujer joven asiática, sonrisa amable, camisa color coral.
22. Hombre joven asiático con gafas, sudadera azul.
23. Mujer joven asiática de pelo corto, jersey verde salvia.

## TANDA 4 — una imagen abstracta (1600×2000, vertical)

24. Una forma fluida abstracta en 3D, en violeta y lavanda, de superficie
    satinada, sobre fondo blanco. Sin texto, sin figuras humanas, sin logos.
    Elegante y contenido, nada psicodélico.

---

Cuando termines estas cuatro tandas, dímelo y te paso otras veinte para cuatro
rubros más (outdoor, flores, mascotas y hogar), con el mismo formato.

---

# REVISIÓN — decisiones tomadas y petición P1 definitiva

## Decisiones

| | Decisión |
|---|---|
| Alcance de la estética | Home + asistente `/demo` + plantillas. El back office y las tiendas de los clientes, en una vuelta posterior |
| Flujo de `/demo` | Entra la bifurcación «plantilla o diseño exclusivo» y el momento de reclamo. El Step 0 queda fuera hasta que haya clave de modelo |
| BLOOM | **Joyería**, no flores |
| Alojamiento | China continental → **las tipografías se auto-alojan**, no se cargan de Google Fonts |

## Cambios respecto a la primera petición

- **BLOOM pasa a joyería**: anillo, collar, pendientes y brazalete.
- **Se caen las 5 verticales del P2**: el ambiente apaisado se recorta a vertical con CSS.
- **Se añaden 2 fotos sobre blanco puro** para las dos secciones de IA, que van sobre fondo claro.
- **Tamaños corregidos a los nativos del generador**: 1536×1024 para ambientes y 1024×1024 para productos. Los 2400×1400 de la primera versión no existen como salida; pedirlos obliga a ampliar, y una foto ampliada se nota.

## Ficheros pendientes

**Del P0 ya generado (24):** los originales sueltos, no la hoja de contactos.

`lumina-hero.jpg` · `lumina-p1..p4.png` · `neo-hero.jpg` · `neo-p1..p4.png` ·
`origin-hero.jpg` · `origin-p1..p4.png` · `pure-hero.jpg` · `pure-p1..p4.png` ·
`agente-xiaomei.png` · `agente-xiaolin.png` · `agente-xiaoan.png` ·
`ai-exclusivo.jpg`

**Del P1 (22):**

`nomad-hero.jpg` · `nomad-p1..p4.png` · `bloom-hero.jpg` · `bloom-p1..p4.png` ·
`paws-hero.jpg` · `paws-p1..p4.png` · `homely-hero.jpg` · `homely-p1..p4.png` ·
`blanco-auriculares.png` · `blanco-reloj.png`

---

# EL PROMPT PARA CHATGPT — bloque P1

Copia desde aquí hasta el final.

---

Segunda parte del set de imágenes para el sitio de comercio electrónico chino.
Mismas reglas que la vez anterior, sin excepción:

1. **Cero texto.** Ninguna palabra, letra, número, cartel, etiqueta ni logo, en
   ningún sitio de la imagen. El texto se añade después por software.
2. **Nada de marcas reales**, ni envases que imiten a una marca existente, ni
   edificios o lugares reconocibles.
3. **Mercado chino.** Las personas, de Asia oriental. Estilo de tienda urbana
   china de gama media-alta.

Estilo: fotografía de producto de gama alta, luz suave y realista, composición
limpia, sensación premium y editorial.

## TANDA 5 — cuatro fotos de ambiente (formato apaisado 1536×1024)

Deja la mitad izquierda relativamente despejada: ahí va un titular.

1. Un excursionista asiático visto de espaldas en un sendero de montaña al
   amanecer, con una mochila de lona; luz cálida y rasante, niebla baja.
2. Joyería de oro fino —un collar y un anillo— sobre seda color hueso
   arrugada, luz muy suave, enfoque corto y elegante.
3. Un golden retriever sentado, mirando a cámara, sobre un fondo crema liso,
   con luz de estudio suave y amable.
4. Un rincón de salón con cerámica artesanal y un textil de lino sobre madera
   clara, luz de tarde entrando de lado.

## TANDA 6 — dieciséis fotos de producto (cuadradas 1024×1024)

Cada grupo de cuatro va sobre un fondo de estudio liso, sin degradado, del
color exacto que indico. Producto centrado y sombra de contacto suave.

Fondo verde oscuro `#1E2620`:
5. Una mochila de lona resistente, de tres cuartos.
6. Un termo de acero cepillado, de pie.
7. Un par de botas de montaña de piel.
8. Una linterna de mano compacta.

Fondo rosa pálido `#F7F0F2`:
9. Un anillo de oro fino, en primer plano sobre el fondo.
10. Un collar de cadena fina de oro, extendido en curva suave.
11. Un par de pendientes de aro pequeños, de oro.
12. Un brazalete rígido de oro.

Fondo crema cálido `#FCF4E8`:
13. Un collar de cuero para perro, enrollado.
14. Una cama redonda para mascota, de tela beige.
15. Un juguete de cuerda trenzada para perro.
16. Un comedero de cerámica blanca para mascota.

Fondo arena `#F1EDE6`:
17. Un cuenco de cerámica artesanal color arcilla.
18. Una manta de lino doblada, color hueso.
19. Una vela en tarro de vidrio transparente, apagada.
20. Una tetera de barro sin esmaltar.

## TANDA 7 — dos fotos sobre blanco puro (cuadradas 1024×1024)

Fondo **blanco puro `#FFFFFF`**, liso, sin degradado, con sombra de contacto
muy suave. Son para dos secciones de fondo claro.

21. Unos auriculares de diadema negros mate, de tres cuartos.
22. Un reloj inteligente de correa negra, con la pantalla apagada.

---

Con estas 22 está completo el set.
