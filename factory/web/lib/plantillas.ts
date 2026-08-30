/**
 * Las ocho plantillas de la galería.
 *
 * No son maquetas ni capturas: cada una es un conjunto de tokens de diseño
 * más su catálogo de fotos, y el componente <Escaparate> las pinta como una
 * tienda de verdad. De aquí salen el hero, las tarjetas de la galería, las
 * previsualizaciones y la sección omnicanal, así que lo que enseña el home es
 * literalmente lo que le entregamos al comerciante si elige esa plantilla.
 *
 * `fondo` y `tinta` están medidos del píxel real de sus fotografías, para que
 * foto y tarjeta sean el mismo color y no se vea la costura.
 */
import type { StoreDesign } from './designs';
import type { Locale } from './i18n';

export type CategoriaPlantilla =
  | 'moda' | 'tecnologia' | 'cafe' | 'belleza'
  | 'outdoor' | 'joyeria' | 'mascotas' | 'hogar';

export interface ProductoPlantilla {
  img: string;
  zh: string;
  es: string;
  en: string;
  precio: number;
}

export interface Plantilla {
  id: string;
  nombre: string;
  categoria: CategoriaPlantilla;
  tono: 'claro' | 'oscuro';
  /** Color de la superficie de producto: el fondo real de sus fotos. */
  fondo: string;
  tinta: string;
  acento: string;
  acentoTinta: string;
  hero: string;
  /** Encuadre del hero: dónde queda el motivo al recortar. */
  heroPos: string;
  titular: { zh: string; es: string; en: string };
  subtitulo: { zh: string; es: string; en: string };
  cta: { zh: string; es: string; en: string };
  categorias: { zh: string; es: string; en: string }[];
  productos: ProductoPlantilla[];
}

export const PLANTILLAS: Plantilla[] = [
  {
    id: 'lumina',
    nombre: 'LUMINA',
    categoria: 'moda',
    tono: 'claro',
    fondo: '#dacfc3',
    tinta: '#241d16',
    acento: '#241d16',
    acentoTinta: '#f6f1ea',
    hero: '/img/lumina-hero.jpg',
    heroPos: '58% 35%',
    titular: { zh: '新季系列', es: 'Nueva temporada', en: 'New season' },
    subtitulo: { zh: '2026 春夏', es: 'Primavera-verano 2026', en: 'Spring-summer 2026' },
    cta: { zh: '立即选购', es: 'Comprar', en: 'Shop now' },
    categorias: [
      { zh: '上衣', es: 'Tops', en: 'Tops' }, { zh: '外套', es: 'Abrigos', en: 'Coats' },
      { zh: '包袋', es: 'Bolsos', en: 'Bags' }, { zh: '配饰', es: 'Accesorios', en: 'Accessories' },
    ],
    productos: [
      { img: '/img/lumina-p1.png', zh: '羊绒针织衫', es: 'Jersey de cachemira', en: 'Cashmere jumper', precio: 39900 },
      { img: '/img/lumina-p2.png', zh: '真皮托特包', es: 'Bolso tote de piel', en: 'Leather tote bag', precio: 129900 },
      { img: '/img/lumina-p3.png', zh: '羊毛大衣', es: 'Abrigo de lana', en: 'Wool coat', precio: 189900 },
      { img: '/img/lumina-p4.png', zh: '真丝方巾', es: 'Pañuelo de seda', en: 'Silk scarf', precio: 29900 },
    ],
  },
  {
    id: 'neo',
    nombre: 'NEO',
    categoria: 'tecnologia',
    tono: 'oscuro',
    fondo: '#2a2a29',
    tinta: '#f4f4f3',
    acento: '#6257ff',
    acentoTinta: '#ffffff',
    hero: '/img/neo-hero.jpg',
    heroPos: '62% 45%',
    titular: { zh: '声音的边界', es: 'El límite del sonido', en: 'The edge of sound' },
    subtitulo: { zh: '主动降噪 · 40 小时续航', es: 'Cancelación activa · 40 h', en: 'Active cancelling · 40 h' },
    cta: { zh: '立即选购', es: 'Comprar', en: 'Shop now' },
    categorias: [
      { zh: '耳机', es: 'Auriculares', en: 'Headphones' }, { zh: '穿戴', es: 'Wearables', en: 'Wearables' },
      { zh: '音箱', es: 'Altavoces', en: 'Speakers' }, { zh: '配件', es: 'Accesorios', en: 'Accessories' },
    ],
    productos: [
      { img: '/img/neo-p1.png', zh: '头戴式降噪耳机', es: 'Auriculares con cancelación', en: 'Noise-cancelling headphones', precio: 89900 },
      { img: '/img/neo-p2.png', zh: '智能手表', es: 'Reloj inteligente', en: 'Smart watch', precio: 129900 },
      { img: '/img/neo-p3.png', zh: '真无线耳机', es: 'Auriculares inalámbricos', en: 'Wireless earbuds', precio: 59900 },
      { img: '/img/neo-p4.png', zh: '便携蓝牙音箱', es: 'Altavoz portátil', en: 'Portable speaker', precio: 44900 },
    ],
  },
  {
    id: 'origin',
    nombre: 'ORIGIN',
    categoria: 'cafe',
    tono: 'oscuro',
    fondo: '#322316',
    tinta: '#f6ece1',
    acento: '#e2b483',
    acentoTinta: '#2a1b12',
    hero: '/img/origin-hero.jpg',
    heroPos: '72% 50%',
    titular: { zh: '一杯好咖啡', es: 'Un buen café', en: 'A proper coffee' },
    subtitulo: { zh: '当日烘焙，隔日送达', es: 'Tostado el día, entregado al siguiente', en: 'Roasted today, delivered tomorrow' },
    cta: { zh: '去逛逛', es: 'Ver la tienda', en: 'Visit the store' },
    categorias: [
      { zh: '咖啡豆', es: 'Café', en: 'Coffee' }, { zh: '器具', es: 'Utensilios', en: 'Tools' },
      { zh: '杯具', es: 'Tazas', en: 'Mugs' }, { zh: '礼盒', es: 'Regalo', en: 'Gifts' },
    ],
    productos: [
      { img: '/img/origin-p1.png', zh: '云南日晒咖啡豆', es: 'Café de Yunnan', en: 'Yunnan coffee', precio: 12800 },
      { img: '/img/origin-p2.png', zh: '精选拼配豆', es: 'Mezcla de la casa', en: 'House blend', precio: 9800 },
      { img: '/img/origin-p3.png', zh: '细口手冲壶', es: 'Hervidor de cuello fino', en: 'Gooseneck kettle', precio: 26800 },
      { img: '/img/origin-p4.png', zh: '粗陶咖啡杯', es: 'Taza de cerámica', en: 'Ceramic mug', precio: 12800 },
    ],
  },
  {
    id: 'pure',
    nombre: 'PURE',
    categoria: 'belleza',
    tono: 'claro',
    fondo: '#e5e7e0',
    tinta: '#1b2019',
    acento: '#1b2019',
    acentoTinta: '#f2f4f0',
    hero: '/img/pure-hero.jpg',
    heroPos: '68% 50%',
    titular: { zh: '干净，就够了', es: 'Limpio, y ya está', en: 'Clean, and that is it' },
    subtitulo: { zh: '成分透明 · 无香精', es: 'Fórmula transparente · sin perfume', en: 'Clear formula · fragrance free' },
    cta: { zh: '开始护肤', es: 'Empezar', en: 'Start' },
    categorias: [
      { zh: '精华', es: 'Sérums', en: 'Serums' }, { zh: '面霜', es: 'Cremas', en: 'Creams' },
      { zh: '清洁', es: 'Limpieza', en: 'Cleansing' }, { zh: '套装', es: 'Packs', en: 'Bundles' },
    ],
    productos: [
      { img: '/img/pure-p1.png', zh: '修护精华液', es: 'Sérum reparador', en: 'Repairing serum', precio: 29900 },
      { img: '/img/pure-p2.png', zh: '保湿面霜', es: 'Crema hidratante', en: 'Moisturiser', precio: 35900 },
      { img: '/img/pure-p3.png', zh: '氨基酸洁面', es: 'Limpiador facial', en: 'Face cleanser', precio: 14900 },
      { img: '/img/pure-p4.png', zh: '舒缓喷雾', es: 'Bruma calmante', en: 'Calming mist', precio: 12900 },
    ],
  },
  {
    id: 'nomad',
    nombre: 'NOMAD',
    categoria: 'outdoor',
    tono: 'oscuro',
    fondo: '#252922',
    tinta: '#eef1ea',
    acento: '#c8d94e',
    acentoTinta: '#1b2016',
    hero: '/img/nomad-hero.jpg',
    heroPos: '55% 45%',
    titular: { zh: '去更远的地方', es: 'Llega más lejos', en: 'Go further' },
    subtitulo: { zh: '耐用装备，陪你走完全程', es: 'Equipo que aguanta el camino entero', en: 'Gear that lasts the whole trail' },
    cta: { zh: '看装备', es: 'Ver equipo', en: 'See gear' },
    categorias: [
      { zh: '背包', es: 'Mochilas', en: 'Backpacks' }, { zh: '保温', es: 'Térmicos', en: 'Flasks' },
      { zh: '鞋履', es: 'Calzado', en: 'Footwear' }, { zh: '照明', es: 'Iluminación', en: 'Lighting' },
    ],
    productos: [
      { img: '/img/nomad-p1.png', zh: '帆布登山包', es: 'Mochila de lona', en: 'Canvas backpack', precio: 59900 },
      { img: '/img/nomad-p2.png', zh: '不锈钢保温壶', es: 'Termo de acero', en: 'Steel flask', precio: 21900 },
      { img: '/img/nomad-p3.png', zh: '真皮登山靴', es: 'Botas de montaña', en: 'Hiking boots', precio: 89900 },
      { img: '/img/nomad-p4.png', zh: '强光手电筒', es: 'Linterna de mano', en: 'Handheld torch', precio: 17900 },
    ],
  },
  {
    id: 'bloom',
    nombre: 'BLOOM',
    categoria: 'joyeria',
    tono: 'claro',
    fondo: '#f1dedc',
    tinta: '#2a1a1c',
    acento: '#a8763f',
    acentoTinta: '#fff8f2',
    hero: '/img/bloom-hero.jpg',
    heroPos: '50% 50%',
    titular: { zh: '一克的浪漫', es: 'Un gramo de romance', en: 'A gram of romance' },
    subtitulo: { zh: '18K 金 · 可刻字', es: 'Oro de 18 quilates · grabado', en: '18-carat gold · engraved' },
    cta: { zh: '看系列', es: 'Ver colección', en: 'See collection' },
    categorias: [
      { zh: '戒指', es: 'Anillos', en: 'Rings' }, { zh: '项链', es: 'Collares', en: 'Necklaces' },
      { zh: '耳饰', es: 'Pendientes', en: 'Earrings' }, { zh: '手镯', es: 'Pulseras', en: 'Bracelets' },
    ],
    productos: [
      { img: '/img/bloom-p1.png', zh: '18K 金素圈戒指', es: 'Anillo de oro 18K', en: '18K gold ring', precio: 188000 },
      { img: '/img/bloom-p2.png', zh: '锁骨金链', es: 'Collar de cadena fina', en: 'Fine chain necklace', precio: 128000 },
      { img: '/img/bloom-p3.png', zh: '小圆耳环', es: 'Pendientes de aro', en: 'Hoop earrings', precio: 88000 },
      { img: '/img/bloom-p4.png', zh: '素圈手镯', es: 'Brazalete liso', en: 'Plain bangle', precio: 218000 },
    ],
  },
  {
    id: 'paws',
    nombre: 'PAWS',
    categoria: 'mascotas',
    tono: 'claro',
    fondo: '#ebddcc',
    tinta: '#2a2117',
    acento: '#c9622f',
    acentoTinta: '#fff6ef',
    hero: '/img/paws-hero.jpg',
    heroPos: '50% 40%',
    titular: { zh: '它值得更好的', es: 'Se merece algo mejor', en: 'They deserve better' },
    subtitulo: { zh: '安全材质 · 好洗好收', es: 'Materiales seguros · fáciles de lavar', en: 'Safe materials · easy to wash' },
    cta: { zh: '去逛逛', es: 'Ver la tienda', en: 'Visit the store' },
    categorias: [
      { zh: '牵引', es: 'Paseo', en: 'Walks' }, { zh: '睡窝', es: 'Camas', en: 'Beds' },
      { zh: '玩具', es: 'Juguetes', en: 'Toys' }, { zh: '餐具', es: 'Comederos', en: 'Feeders' },
    ],
    productos: [
      { img: '/img/paws-p1.png', zh: '真皮项圈', es: 'Collar de piel', en: 'Leather collar', precio: 15900 },
      { img: '/img/paws-p2.png', zh: '圆形宠物窝', es: 'Cama redonda', en: 'Round bed', precio: 32900 },
      { img: '/img/paws-p3.png', zh: '编织磨牙玩具', es: 'Juguete de cuerda', en: 'Rope toy', precio: 5900 },
      { img: '/img/paws-p4.png', zh: '陶瓷食盆', es: 'Comedero de cerámica', en: 'Ceramic bowl', precio: 9900 },
    ],
  },
  {
    id: 'homely',
    nombre: 'HOMELY',
    categoria: 'hogar',
    tono: 'claro',
    fondo: '#dfd1bf',
    tinta: '#262019',
    acento: '#6b5a45',
    acentoTinta: '#f8f3ec',
    hero: '/img/homely-hero.jpg',
    heroPos: '55% 55%',
    titular: { zh: '把家住成\n想要的样子', es: 'Haz de tu casa\nlo que quieras', en: 'Make your home\nwhatever you want' },
    subtitulo: { zh: '手作器物 · 天然材质', es: 'Piezas hechas a mano · materiales naturales', en: 'Handmade pieces · natural materials' },
    cta: { zh: '去逛逛', es: 'Ver la tienda', en: 'Visit the store' },
    categorias: [
      { zh: '餐具', es: 'Vajilla', en: 'Tableware' }, { zh: '织物', es: 'Textil', en: 'Textiles' },
      { zh: '香氛', es: 'Aromas', en: 'Scents' }, { zh: '茶具', es: 'Té', en: 'Tea' },
    ],
    productos: [
      { img: '/img/homely-p1.png', zh: '手作陶碗', es: 'Cuenco de cerámica', en: 'Ceramic bowl', precio: 12800 },
      { img: '/img/homely-p2.png', zh: '亚麻盖毯', es: 'Manta de lino', en: 'Linen throw', precio: 39900 },
      { img: '/img/homely-p3.png', zh: '香薰蜡烛', es: 'Vela aromática', en: 'Scented candle', precio: 19900 },
      { img: '/img/homely-p4.png', zh: '粗陶茶壶', es: 'Tetera de barro', en: 'Clay teapot', precio: 28800 },
    ],
  },
];

export const PLANTILLAS_POR_ID: Record<string, Plantilla> = Object.fromEntries(
  PLANTILLAS.map(p => [p.id, p]),
);

/** Las que rotan en el hero: una de cada mundo visual. */
export const ROTACION_HERO = ['lumina', 'neo', 'origin', 'pure', 'homely'];

export function etiquetaCategoria(c: CategoriaPlantilla, l: Locale): string {
  const d: Record<CategoriaPlantilla, { zh: string; es: string; en: string }> = {
    moda: { zh: '时尚', es: 'Moda', en: 'Fashion' },
    tecnologia: { zh: '科技', es: 'Tecnología', en: 'Tech' },
    cafe: { zh: '咖啡', es: 'Café', en: 'Coffee' },
    belleza: { zh: '美妆', es: 'Belleza', en: 'Beauty' },
    outdoor: { zh: '户外', es: 'Outdoor', en: 'Outdoor' },
    joyeria: { zh: '珠宝', es: 'Joyería', en: 'Jewellery' },
    mascotas: { zh: '宠物', es: 'Mascotas', en: 'Pets' },
    hogar: { zh: '家居', es: 'Hogar', en: 'Home' },
  };
  return d[c][l];
}

export function texto(v: { zh: string; es: string; en: string }, l: Locale): string {
  return v[l];
}

/**
 * Prefijo de las plantillas dentro del registro de diseños.
 *
 * El registro RETIRA un diseño en cuanto alguien lo elige: es lo que sostiene
 * la promesa del diseño exclusivo. Pero una plantilla es reutilizable por
 * definición, así que su huella lleva este prefijo y la API la exime de la
 * comprobación. Mezclar los dos conceptos rompería una de las dos promesas.
 */
export const PREFIJO_PLANTILLA = 'tpl-';

export function esPlantilla(key: string | undefined | null): boolean {
  return typeof key === 'string' && key.startsWith(PREFIJO_PLANTILLA);
}

/** Convierte una plantilla en el diseño que se guarda en el canal. */
export function plantillaADiseno(p: Plantilla): StoreDesign {
  const oscura = p.tono === 'oscuro';
  return {
    key: `${PREFIJO_PLANTILLA}${p.id}`,
    label: p.nombre,
    bg: oscura ? mezclar(p.fondo, '#000000', 0.45) : mezclar(p.fondo, '#ffffff', 0.62),
    surface: p.fondo,
    ink: p.tinta,
    inkSoft: mezclar(p.tinta, p.fondo, 0.42),
    brand: p.tinta,
    brandInk: p.fondo,
    accent: p.acento,
    radius: '14px',
    headingFont: 'grotesque',
  };
}

/** Mezcla dos colores hex. `t` = 0 devuelve a, `t` = 1 devuelve b. */
function mezclar(a: string, b: string, t: number): string {
  const n = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = n(a);
  const [r2, g2, b2] = n(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}
