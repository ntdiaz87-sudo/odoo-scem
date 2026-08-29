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
import { type Locale } from './i18n';


/** Las etiquetas de la encuesta siguen el idioma del VISITANTE. */
export function rubros(l: Locale) {
  const z = l === 'zh';
  return [
    { key: 'moda', label: z ? '服饰配件' : 'Moda y accesorios' },
    { key: 'comida', label: z ? '食品甜点' : 'Comida y dulces' },
    { key: 'plantas', label: z ? '花植园艺' : 'Plantas y jardín' },
    { key: 'tecnologia', label: z ? '数码科技' : 'Tecnología' },
    { key: 'belleza', label: z ? '美妆个护' : 'Belleza y cuidado' },
    { key: 'artesania', label: z ? '手作家居' : 'Artesanía y hogar' },
    { key: 'otro', label: z ? '其他' : 'Otra cosa' },
  ];
}
export function estilos(l: Locale) {
  const z = l === 'zh';
  return [
    { key: 'calido', label: z ? '亲切温暖' : 'Cercana y cálida' },
    { key: 'elegante', label: z ? '优雅高级' : 'Elegante y sobria' },
    { key: 'energico', label: z ? '活力鲜明' : 'Enérgica y llamativa' },
    { key: 'minimalista', label: z ? '极简' : 'Minimalista' },
  ];
}
export function modos(l: Locale) {
  const z = l === 'zh';
  return [
    { key: 'claro', label: z ? '浅色' : 'Fondo claro' },
    { key: 'oscuro', label: z ? '深色' : 'Fondo oscuro' },
  ];
}

/** Claves válidas, para validar en el servidor sin depender del idioma. */
export const RUBRO_KEYS = ['moda', 'comida', 'plantas', 'tecnologia', 'belleza', 'artesania', 'otro'];
export const ESTILO_KEYS = ['calido', 'elegante', 'energico', 'minimalista'];
export const MODO_KEYS = ['claro', 'oscuro'];

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

const TINTA_OSCURA = '#161616';
const TINTA_CLARA = '#f7f6f2';

function contraste(a: string, b: string): number {
  const l1 = Math.max(luminance(a), luminance(b));
  const l2 = Math.min(luminance(a), luminance(b));
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Tinta legible sobre el color dado: se calcula el contraste real contra las
 * dos tintas y se elige la mejor, en vez de decidir por un umbral fijo. Así
 * ningún diseño generado se queda en el límite de la accesibilidad.
 */
export function inkOn(hex: string): string {
  return contraste(TINTA_OSCURA, hex) >= contraste(TINTA_CLARA, hex) ? TINTA_OSCURA : TINTA_CLARA;
}

/** Mejor contraste alcanzable sobre un color con nuestras dos tintas. */
function mejorContraste(hex: string): number {
  return Math.max(contraste(TINTA_OSCURA, hex), contraste(TINTA_CLARA, hex));
}

/**
 * Devuelve un color de la familia pedida que SÍ admite texto legible encima.
 * Hay una "zona muerta" de luminosidad media donde ni el negro ni el blanco
 * llegan a 4.5:1; si el color cae ahí, se aparta de ella (se oscurece en los
 * diseños claros, se aclara en los oscuros) hasta cumplir. Así ningún diseño
 * generado puede nacer inaccesible.
 */
function colorLegible(h: number, s: number, l: number, aclarar: boolean): string {
  let luz = l;
  for (let i = 0; i < 16; i++) {
    const hex = hslToHex(h, s, luz);
    if (mejorContraste(hex) >= 4.8) return hex;
    luz += aclarar ? 4 : -4;
    if (luz > 96 || luz < 6) break;
  }
  return hslToHex(h, s, aclarar ? 92 : 14);
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

/* El NOMBRE del diseño lo lee quien está eligiendo, así que sigue al idioma
   del VISITANTE, no al del mercado. Es lo contrario que la tienda ya creada,
   que se sirve siempre en el idioma de su mercado. */
const HUE_NAMES_POR_IDIOMA: Record<Locale, Array<[number, string]>> = {
  zh: [
      [15, '陶土'], [35, '琥珀'], [50, '蜜色'], [70, '橄榄'], [100, '青竹'],
      [140, '翡翠'], [170, '碧玉'], [200, '湖蓝'], [225, '靛青'], [255, '紫罗兰'],
      [285, '兰紫'], [320, '莓红'], [345, '石榴'], [360, '珊瑚'],
  ],
  es: [
      [15, 'Terracota'], [35, 'Ámbar'], [50, 'Miel'], [70, 'Oliva'], [100, 'Salvia'],
      [140, 'Esmeralda'], [170, 'Jade'], [200, 'Lago'], [225, 'Índigo'], [255, 'Violeta'],
      [285, 'Orquídea'], [320, 'Frambuesa'], [345, 'Granate'], [360, 'Coral'],
  ],
};

const SUFIJOS_POR_IDIOMA: Record<Locale, Record<string, string[]>> = {
  zh: {
      calido: ['小屋', '暖阳', '静谧', '街角', '微温'],
      elegante: ['雅致', '典礼', '素朴', '华庭', '经典'],
      energico: ['电光', '疾行', '鲜活', '锋锐', '街头'],
    minimalista: ['纯粹', '安然', '本真', '轻盈', '清晰'],
  },
  es: {
      calido: ['de casa', 'al sol', 'sereno', 'de barrio', 'tibio'],
      elegante: ['noble', 'de gala', 'sobrio', 'imperial', 'clásico'],
      energico: ['eléctrico', 'en marcha', 'vivo', 'radical', 'urbano'],
    minimalista: ['puro', 'en calma', 'esencial', 'ligero', 'nítido'],
  },
};

function designName(brandHue: number, estilo: string, rand: () => number, l: Locale): string {
  const hue = ((brandHue % 360) + 360) % 360;
  const nombres = HUE_NAMES_POR_IDIOMA[l];
  const base = (nombres.find(([limit]) => hue <= limit) ?? nombres[0])[1];
  const porEstilo = SUFIJOS_POR_IDIOMA[l];
  const sufijos = porEstilo[estilo] ?? porEstilo.calido;
  const suf = sufijos[Math.floor(rand() * sufijos.length)];
  return l === 'zh' ? `${base}${suf}` : `${base} ${suf}`;
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

export function generateDesign(answers: SurveyAnswers, seed: number, locale: Locale): StoreDesign {
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
  // En oscuro la marca sube de luz para despegarse del fondo. En ambos casos
  // se garantiza que el color admita texto legible encima (botones, etiquetas).
  const brand = dark
    ? colorLegible(brandHue, Math.min(90, sat + 12), 56 + rand() * 14, true)
    : colorLegible(brandHue, sat, 30 + rand() * 14, false);
  const accent = dark
    ? colorLegible(accentHue, Math.min(88, sat + 8), 60 + rand() * 12, true)
    : colorLegible(accentHue, Math.min(80, sat + 14), 40 + rand() * 14, false);

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
    label: designName(brandHue, answers.estilo, rand, locale),
    ...tokens,
  };
}

/**
 * Genera `count` propuestas sin repetir huella entre sí ni con las tomadas.
 */
export function generateProposals(
  answers: SurveyAnswers,
  takenKeys: Set<string>,
  count: number,
  locale: Locale,
): StoreDesign[] {
  const proposals: StoreDesign[] = [];
  const seen = new Set(takenKeys);
  let seed = Math.floor(Math.random() * 2 ** 31);
  let guard = 0;
  while (proposals.length < count && guard++ < 500) {
    const d = generateDesign(answers, seed++, locale);
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
