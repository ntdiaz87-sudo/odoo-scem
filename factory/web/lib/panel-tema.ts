/**
 * El back office pintado con el diseño de SU tienda.
 *
 * El comerciante eligió una paleta para su escaparate; su panel de trabajo se
 * pinta con esa misma paleta, no con la de la fábrica. Los tokens entran como
 * variables CSS en la raíz de .pn y todas las clases .pn- se pintan a partir
 * de ellas, igual que hace el escaparate con .st-.
 *
 * Dos cosas NO siguen al diseño, a propósito:
 *
 * - Los estados (cobrado, sin existencias, aviso). Son señales de trabajo:
 *   tienen que significar lo mismo en la tienda de cualquier cliente, y verde
 *   o ámbar dice más que un tono de su marca.
 * - El contraste. No se confía en que la paleta sea legible: los bordes y los
 *   tonos suaves se derivan de la tinta con color-mix, así que en un diseño
 *   oscuro salen claros y en uno claro, oscuros, sin código por tienda.
 *
 * Por eso NO se pasa design.inkSoft: ese tono está calibrado contra el fondo
 * de la tienda, y las tarjetas del panel van sobre la superficie, que en
 * varias plantillas es bastante más oscura. Medido en LUMINA, el texto
 * secundario caía a 3.57:1. El tono suave del panel se mezcla contra la
 * superficie real, así que el mismo CSS cumple en todas las paletas.
 */
import type { CSSProperties } from 'react';
import type { StoreDesign } from './designs';
import { inkOn } from './design-generator';

export function panelVars(design: StoreDesign): CSSProperties {
  return {
    '--pn-bg': design.bg,
    '--pn-superficie': design.surface,
    '--pn-tinta': design.ink,
    '--pn-marca': design.brand,
    '--pn-marca-tinta': design.brandInk,
    '--pn-acento': design.accent,
    '--pn-acento-tinta': inkOn(design.accent),
    '--pn-radio': design.radius,
    '--pn-titulo':
      design.headingFont === 'serif' ? 'var(--font-serif-cjk)' : 'var(--font-display)',
  } as CSSProperties;
}
