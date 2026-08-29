# Home V2 — cómo está construido

## La idea de fondo

El paquete de diseño pedía una galería de plantillas con «capturas de tienda
en alta resolución». La tentación era generar ocho imágenes bonitas. Se hizo
al revés: **las ocho plantillas existen de verdad** y el home las pinta con el
mismo componente que le entregaría la tienda al comerciante.

Un solo componente, `app/_v2/escaparate.tsx`, pinta:

- el portátil y el teléfono del hero,
- las ocho tarjetas de la galería,
- las previsualizaciones de `/templates/[slug]`,
- los tres dispositivos de la sección omnicanal,
- las dos tarjetas de la bifurcación del asistente.

De ahí sale la propiedad que importa: **lo que enseña el home es lo que se
entrega**. No hay forma de que la galería mienta, porque no hay imagen de
galería que mantener sincronizada.

## Plantilla ≠ diseño exclusivo

Son dos promesas distintas y el código las separa:

| | Plantilla | Diseño exclusivo |
|---|---|---|
| Reutilizable | Sí, por definición | No |
| Huella en el registro | `tpl-<id>` | huella generada |
| Al elegirla | sigue disponible | queda retirada para siempre |

El registro de unicidad retira un diseño en cuanto alguien lo elige: es lo que
sostiene el «独一无二». Las plantillas llevan el prefijo `tpl-` y la API las
exime de esa comprobación (`app/api/demo/route.ts`). Mezclar los dos conceptos
rompería una de las dos promesas, y hay una prueba que lo fija: *«Plantilla: es
REUTILIZABLE — una segunda tienda puede elegir la misma»*.

## El color de cada plantilla sale de sus fotos

Las fotos de producto se pidieron sobre un fondo concreto, pero el generador
las devolvió entre 7 y 39 puntos más oscuras y cálidas de lo pedido. En vez de
regenerarlas, se midió el píxel real del borde de cada familia y ese color es
el de la tarjeta de esa plantilla (`app/tokens.css`, bloque `[data-plantilla]`).

Foto y tarjeta son así **exactamente** el mismo color y no se ve la costura,
que era el motivo de pedirlas con fondo en vez de recortadas.

Las fotos traen además marco blanco con esquinas redondeadas de unos 30 px. En
NEO, NOMAD y ORIGIN eso sería un halo blanco en cada esquina, así que `.v-foto`
las recorta con `overflow:hidden` y `scale(1.07)`. Sin reescribir ficheros.

## Tipografía: por qué no se auto-aloja el chino

Google Fonts está bloqueado en China continental y el alojamiento va allí, así
que las latinas (Bricolage Grotesque e Inter) se sirven desde nuestro dominio:
244 KB en total, `public/fuentes/`.

Del chino **no se auto-aloja nada a propósito**. Una familia CJK completa son
decenas de megas —más de 20.000 glifos— y en una red china eso es un lastre que
no compensa: cualquier dispositivo chino trae PingFang SC, Microsoft YaHei o
Noto Sans CJK SC. Es lo que hace cualquier web china seria.

## Claro y oscuro

Un solo DOM. El tema se resuelve en el servidor desde una cookie y se pinta
como `data-theme` en `<html>`, así que no hay parpadeo al cargar. Sin cookie
manda `prefers-color-scheme`. El selector cambia el atributo en caliente, sin
recargar.

Todos los colores salen de tokens (`app/tokens.css`). Regla para lo que se
añada: si un color no está en los tokens, es que falta un token.

## Las tres demos de IA son demos, y lo dicen

`app/_v2/demos-ia.tsx` — sincronización de canales, fábrica de productos y
fábrica. Command. No hay modelo de lenguaje conectado, así que **no ejecutan
nada** y llevan una etiqueta visible que lo dice. Cuando llegue la clave del
modelo se sustituye el guion por la llamada real y la interfaz no cambia.

Prometer en el home lo que el producto no hace es la forma más rápida de
perder a un comerciante en la primera semana.

## Animación sin librería

No se instaló Framer Motion ni ninguna otra. Todo lo que pedía el paquete
—apariciones al hacer scroll, rotación del hero, recorrido de la tarjeta al
pasar el ratón, contadores, tecleo del comando— sale con CSS e
`IntersectionObserver`. Cero dependencias nuevas y cero kilobytes de librería.

Con `prefers-reduced-motion: reduce` no hay autoplay ni movimiento continuo, y
las demos se muestran directamente en su estado final.

## Lo que sigue pendiente

- Pie: faltan razón social, 备案号 (obligatorio por ley al alojar en China),
  canal de soporte y textos legales. Hasta tenerlos, esos enlaces no se ponen:
  un enlace muerto es peor que su ausencia.
- «Casos» enseña las ocho plantillas marcadas como muestra. Cuando haya
  comerciantes reales, se sustituyen por sus tiendas.
- Step 0 del asistente (foto/enlace/Excel): queda fuera hasta que haya clave de
  modelo. Sin IA real no infiere nada.
- El back office `/panel` y las tiendas de los clientes siguen con la estética
  anterior: se pasan en una vuelta posterior, según lo acordado.
