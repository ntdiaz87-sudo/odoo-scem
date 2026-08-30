/** Carga en el servidor el diseño y nombre de una tienda (por token de canal). */
import type { StoreDesign } from './designs';
import { DESIGN_PRESETS } from './designs';
import { LOCALE, MONEDA_DE, esLocaleValido, type Locale } from './i18n';
import { shopQuery } from './vendure';

/** Lo que el comerciante promete a sus clientes. Vacío = no se enseña. */
export interface PromesasTienda {
  entregaPlazo: string;
  entregaNota: string;
  pagoFormas: string;
  atencionNota: string;
}

export interface StoreInfo {
  design: StoreDesign;
  name: string;
  headingFont: string;
  /** Mercado de la tienda: en qué idioma y moneda la ve SU cliente. */
  mercado: Locale;
  moneda: string;
  promesas: PromesasTienda;
  /** Dominio propio VERIFICADO de la tienda, si lo hay: manda como canónico. */
  dominio: string | null;
}

export async function loadStoreInfo(slug: string): Promise<StoreInfo | null> {
  try {
    const data = await shopQuery<{
      activeChannel: {
        code: string;
        currencyCode?: string | null;
        customFields?: {
          displayName?: string | null;
          design?: string | null;
          mercado?: string | null;
          entregaPlazo?: string | null;
          entregaNota?: string | null;
          pagoFormas?: string | null;
          atencionNota?: string | null;
          dominio?: string | null;
          dominioVerificado?: boolean | null;
        } | null;
      };
    }>(
      slug,
      `{ activeChannel {
        code currencyCode
        customFields { displayName design mercado entregaPlazo entregaNota pagoFormas atencionNota dominio dominioVerificado }
      } }`,
    );
    const cf = data.activeChannel.customFields;
    let design = DESIGN_PRESETS[0];
    if (cf?.design) {
      try {
        design = { ...DESIGN_PRESETS[0], ...(JSON.parse(cf.design) as Partial<StoreDesign>) };
      } catch {
        /* diseño corrupto: preset base */
      }
    }
    const headingFont =
      design.headingFont === 'serif'
        ? "var(--font-serif-cjk)"
        : "var(--font-display)";
    // Las tiendas creadas antes de que el mercado fuese elegible no tienen el
    // campo: se quedan en el del lanzamiento, que es como se sirvieron siempre.
    const mercado: Locale = esLocaleValido(cf?.mercado) ? cf.mercado : LOCALE;
    return {
      design,
      name: cf?.displayName || data.activeChannel.code,
      headingFont,
      mercado,
      moneda: data.activeChannel.currencyCode || MONEDA_DE[mercado],
      promesas: {
        entregaPlazo: cf?.entregaPlazo || '',
        entregaNota: cf?.entregaNota || '',
        pagoFormas: cf?.pagoFormas || '',
        atencionNota: cf?.atencionNota || '',
      },
      dominio: cf?.dominioVerificado === true && cf?.dominio ? cf.dominio : null,
    };
  } catch {
    return null;
  }
}
