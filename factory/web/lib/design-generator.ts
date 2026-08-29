/**
 * Diseñador de la fábrica (núcleo determinista de la Fase 2).
 *
 * A partir de una mini-encuesta (qué vendes, personalidad, claro/oscuro)
 * genera propuestas de diseño completas: paleta con contraste garantizado,
 * tipografía, forma y nombre propio. Cada propuesta lleva una huella (key)
 * derivada de sus tokens; la fábrica no vuelve a ofrecer una huella que ya
 * pertenezca a una tienda existente, así ningún cliente repite diseño.
 *
 * Cuando el usuario aporte la clave del modelo de IA, este módulo pasa a ser
 * el "plan B" y la encuesta alimentará al diseñador agéntico.
 */
import type { StoreDesign } from './designs';

export const RUBROS = [
  { key: 'moda', label: 'Moda y accesorios' },
  { key: 'comida', label: 'Comida y dulces' },
  { key: 'plantas', label: 'Plantas y jardín' },
  { key: 'tecnologia', label: 'Tecnología' },
  { key: 'belleza', label: 'Belleza y cuidado' },
  { key: 'artesania', label: 'Artesanía y hogar' },
  { key: 'otro', label: 'Otra cosa' },
] as const;

export const ESTILOS = [
  { key: 'calido', label: 'Cercana y cálida' },
  { key: 'elegante', label: 'Elegante y sobria' },
  { key: 'energico', label: 'Enérgica y llamativa' },
  { key: 'minimalista', label: 'Minimalista' },
] as const;

export const MODOS = [
  { key: 'claro', label: 'Fondo claro' },
  { key: 'oscuro', label: 'Fondo oscuro' },
] as const;

export interface SurveyAnswers {
  rubro: string;
  estilo: string;
  modo: string;
}

/* ---------- utilidades de color ---------- */

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.min(100, Math.max(0, s)) / 100;
  l = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Blanco o negro, el que más contraste dé sobre el color dado. */
function inkOn(hex: string): string {
  return luminance(hex) > 0.35 ? '#161616' : '#f7f6f2';
}

/* ---------- semillas y huellas ---------- */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fingerprint(tokens: Omit<StoreDesign, 'key' | 'label'>): string {
  const raw = [tokens.bg, tokens.surface, tokens.ink, tokens.brand, tokens.accent, tokens.radius, tokens.headingFont].join('|');
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) | 0;
  return `d-${(h >>> 0).toString(36)}`;
}

/* ---------- vocabulario para los nombres ---------- */

const HUE_NAMES: Array<[number, string]> = [
  [15, 'Terracota'], [35, 'Ámbar'], [50, 'Miel'], [70, 'Oliva'], [100, 'Salvia'],
  [140, 'Esmeralda'], [170, 'Jade'], [200, 'Lago'], [225, 'Índigo'], [255, 'Violeta'],
  [285, 'Orquídea'], [320, 'Frambuesa'], [345, 'Granate'], [360, 'Coral'],
];

const ESTILO_SUFIJOS: Record<string, string[]> = {
  calido: ['de casa', 'al sol', 'sereno', 'de barrio', 'tibio'],
  elegante: ['noble', 'de gala', 'sobrio', 'imperial', 'clásico'],
  energico: ['eléctrico', 'en marcha', 'vivo', 'radical', 'urbano'],
  minimalista: ['puro', 'en calma', 'esencial', 'ligero', 'nítido'],
};

function designName(brandHue: number, estilo: string, rand: () => number): string {
  const hue = ((brandHue % 360) + 360) % 360;
  const base = (HUE_NAMES.find(([limit]) => hue <= limit) ?? HUE_NAMES[0])[1];
  const sufijos = ESTILO_SUFIJOS[estilo] ?? ESTILO_SUFIJOS.calido;
  return `${base} ${sufijos[Math.floor(rand() * sufijos.length)]}`;
}

/* ---------- el generador ---------- */

const RUBRO_HUES: Record<string, [number, number]> = {
  moda: [320, 400],       // granates, corales, negros cálidos
  comida: [15, 55],       // terracotas, ámbares
  plantas: [85, 165],     // verdes
  tecnologia: [195, 265], // azules e índigos
  belleza: [295, 355],    // rosas y orquídeas
  artesania: [20, 65],    // tierras y mieles
  otro: [0, 360],
};

const ESTILO_PARAMS: Record<string, { sat: [number, number]; radius: string[]; font: Array<'grotesque' | 'serif'> }> = {
  calido: { sat: [34, 52], radius: ['14px', '16px', '18px'], font: ['grotesque', 'grotesque', 'serif'] },
  elegante: { sat: [22, 40], radius: ['4px', '6px', '8px'], font: ['serif', 'serif', 'grotesque'] },
  energico: { sat: [58, 82], radius: ['10px', '12px', '20px'], font: ['grotesque'] },
  minimalista: { sat: [10, 24], radius: ['8px', '10px', '12px'], font: ['grotesque'] },
};

export function generateDesign(answers: SurveyAnswers, seed: number): StoreDesign {
  const rand = mulberry32(seed);
  const [h0, h1] = RUBRO_HUES[answers.rubro] ?? RUBRO_HUES.otro;
  const params = ESTILO_PARAMS[answers.estilo] ?? ESTILO_PARAMS.calido;

  const brandHue = h0 + rand() * (h1 - h0);
  const sat = params.sat[0] + rand() * (params.sat[1] - params.sat[0]);
  // Acento: análogo para estilos tranquilos, complementario para el enérgico.
  const accentHue = answers.estilo === 'energico'
    ? brandHue + 150 + rand() * 60
    : brandHue + 25 + rand() * 40;

  const dark = answers.modo === 'oscuro';
  const bg = dark
    ? hslToHex(brandHue, 14 + rand() * 10, 7 + rand() * 4)
    : hslToHex(brandHue, 12 + rand() * 14, 95 + rand() * 3);
  const surface = dark
    ? hslToHex(brandHue, 12 + rand() * 8, 13 + rand() * 4)
    : hslToHex(brandHue, 8 + rand() * 10, 99);
  const ink = dark
    ? hslToHex(brandHue, 8 + rand() * 8, 91 + rand() * 4)
    : hslToHex(brandHue, 18 + rand() * 10, 12 + rand() * 6);
  const inkSoft = dark
    ? hslToHex(brandHue, 8, 68 + rand() * 6)
    : hslToHex(brandHue, 12, 36 + rand() * 8);
  // En oscuro la marca sube de luz para despegarse del fondo.
  const brand = dark
    ? hslToHex(brandHue, Math.min(90, sat + 12), 56 + rand() * 14)
    : hslToHex(brandHue, sat, 30 + rand() * 14);
  const accent = dark
    ? hslToHex(accentHue, Math.min(88, sat + 8), 60 + rand() * 12)
    : hslToHex(accentHue, Math.min(80, sat + 14), 40 + rand() * 14);

  const tokens: Omit<StoreDesign, 'key' | 'label'> = {
    bg,
    surface,
    ink,
    inkSoft,
    brand,
    brandInk: inkOn(brand),
    accent,
    radius: params.radius[Math.floor(rand() * params.radius.length)],
    headingFont: params.font[Math.floor(rand() * params.font.length)],
  };

  return {
    key: fingerprint(tokens),
    label: designName(brandHue, answers.estilo, rand),
    ...tokens,
  };
}

/**
 * Genera `count` propuestas sin repetir huella entre sí ni con las tomadas.
 */
export function generateProposals(
  answers: SurveyAnswers,
  takenKeys: Set<string>,
  count = 3,
): StoreDesign[] {
  const proposals: StoreDesign[] = [];
  const seen = new Set(takenKeys);
  let seed = Math.floor(Math.random() * 2 ** 31);
  let guard = 0;
  while (proposals.length < count && guard++ < 500) {
    const d = generateDesign(answers, seed++);
    if (seen.has(d.key)) continue;
    seen.add(d.key);
    proposals.push(d);
  }
  return proposals;
}

/** Valida que un diseño enviado por el cliente tenga la forma esperada. */
export function isValidDesign(d: unknown): d is StoreDesign {
  if (!d || typeof d !== 'object') return false;
  const o = d as Record<string, unknown>;
  const hex = /^#[0-9a-f]{6}$/i;
  return (
    typeof o.key === 'string' && /^[a-z0-9-]{2,40}$/.test(o.key) &&
    typeof o.label === 'string' && o.label.length <= 60 &&
    [o.bg, o.surface, o.ink, o.inkSoft, o.brand, o.brandInk, o.accent].every(
      v => typeof v === 'string' && hex.test(v),
    ) &&
    typeof o.radius === 'string' && /^\d{1,2}px$/.test(o.radius) &&
    (o.headingFont === 'grotesque' || o.headingFont === 'serif')
  );
}
