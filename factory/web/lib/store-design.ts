/** Carga en el servidor el diseño y nombre de una tienda (por token de canal). */
import type { StoreDesign } from './designs';
import { DESIGN_PRESETS } from './designs';
import { shopQuery } from './vendure';

export interface StoreInfo {
  design: StoreDesign;
  name: string;
  headingFont: string;
}

export async function loadStoreInfo(slug: string): Promise<StoreInfo | null> {
  try {
    const data = await shopQuery<{
      activeChannel: {
        code: string;
        customFields?: { displayName?: string | null; design?: string | null } | null;
      };
    }>(slug, `{ activeChannel { code customFields { displayName design } } }`);
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
    return { design, name: cf?.displayName || data.activeChannel.code, headingFont };
  } catch {
    return null;
  }
}
