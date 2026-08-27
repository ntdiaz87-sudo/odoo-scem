/**
 * Presets de diseño de la Fase 0 (espejo de factory/vendure/src/designs.ts —
 * mantener sincronizados hasta que la Fase 2 los genere el diseñador agéntico).
 */
export interface StoreDesign {
  key: string;
  label: string;
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  brand: string;
  brandInk: string;
  accent: string;
  radius: string;
  headingFont: 'grotesque' | 'serif';
}

export const DESIGN_PRESETS: StoreDesign[] = [
  {
    key: 'hoja-viva',
    label: 'Hoja viva',
    bg: '#f7f7f2',
    surface: '#ffffff',
    ink: '#22301f',
    inkSoft: '#4c5a44',
    brand: '#48693c',
    brandInk: '#f5f4ec',
    accent: '#8a5a33',
    radius: '14px',
    headingFont: 'grotesque',
  },
  {
    key: 'nocta',
    label: 'Nocta',
    bg: '#101418',
    surface: '#1a2027',
    ink: '#f3efe8',
    inkSoft: '#a7b0b8',
    brand: '#c9a35d',
    brandInk: '#14100a',
    accent: '#c9a35d',
    radius: '4px',
    headingFont: 'serif',
  },
];

export function findDesign(key: string): StoreDesign {
  return DESIGN_PRESETS.find(d => d.key === key) ?? DESIGN_PRESETS[0];
}
