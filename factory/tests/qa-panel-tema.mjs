/**
 * El back office se pinta con el diseño de SU tienda, y sigue siendo legible.
 *
 * Dos cosas que hay que fijar juntas, porque la primera puede romper la
 * segunda: que el panel tome de verdad los tokens del diseño que eligió el
 * dueño, y que con CUALQUIER paleta el texto de trabajo cumpla 4.5:1. Se
 * prueban paletas deliberadamente opuestas: dos oscuras y dos claras, una de
 * ellas (LUMINA) con la superficie más oscura que el fondo, que es el caso
 * que tumbaba el texto secundario a 3.57:1.
 *
 * Uso: node tests/qa-panel-tema.mjs   (réplica local: web en 8300)
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://localhost:8300';
const CLAVE = 'clave-segura-123';
const S = Math.random().toString(36).slice(2, 6);
const MINIMO = 4.5;

const res = [];
const ok = n => res.push(['✅', n]);
const ko = (n, e) => res.push(['❌', `${n} — ${String(e.message || e).slice(0, 180)}`]);
async function check(n, fn) { try { await fn(); ok(n); } catch (e) { ko(n, e); } }
const assert = (c, m) => { if (!c) throw new Error(m); };

/* Chromium devuelve color-mix() como "color(srgb 0.28 0.25 0.22)" (0–1) y el
   resto como "rgb(r g b)" (0–255). Leer los dígitos a secas da ratios de mil
   millones a uno. */
function aRGB(s) {
  const n = (s.match(/-?[\d.]+/g) || []).map(Number);
  return s.startsWith('color(') ? n.slice(0, 3).map(v => Math.round(v * 255)) : n.slice(0, 3);
}
const luz = ([r, g, b]) => {
  const f = v => (v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
function contraste(a, b) {
  const [l1, l2] = [luz(aRGB(a)), luz(aRGB(b))];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const ipSuelta = () => `10.9${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

/* Las tiendas de plantilla se crean por el asistente, que es el camino real:
   así el diseño que acaba en el canal es el que elige un comerciante y no uno
   que se haya inventado la prueba. Cada una desde su propia IP, o el límite
   anti-abuso (3 por hora) corta a la cuarta. */
async function crearTienda(plantilla, nombre, correo) {
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'x-forwarded-for': ipSuelta() },
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/demo?plantilla=${plantilla}`, { waitUntil: 'networkidle' });
  await p.fill('#storeName', nombre);
  await p.fill('#ownerEmail', correo);
  await p.fill('#ownerPassword', CLAVE);
  await p.locator('form button[type=submit]').last().click();
  await p.waitForSelector('a[href*="/panel"], .w-listo, .w-exito', { timeout: 60000 });
  await ctx.close();
}

const CASOS = [
  { id: 'lumina', nota: 'clara, superficie más oscura que el fondo' },
  { id: 'neo', nota: 'oscura, marca casi blanca' },
  { id: 'origin', nota: 'oscura de tierra' },
  { id: 'bloom', nota: 'clara rosada' },
];

for (const caso of CASOS) {
  const correo = `tema-${S}-${caso.id}@t.local`;
  let m = null;

  await check(`${caso.id.toUpperCase()} (${caso.nota}): el panel toma los tokens de la tienda`, async () => {
    await crearTienda(caso.id, `Tema ${caso.id} ${S}`, correo);
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    const errores = [];
    p.on('pageerror', e => errores.push(String(e)));
    await p.goto(`${BASE}/panel`, { waitUntil: 'networkidle' });
    await p.fill('#correo', correo);
    await p.fill('#clave', CLAVE);
    await p.click('button[type=submit]');
    await p.waitForURL('**/panel/inicio', { timeout: 20000 });
    await p.waitForTimeout(600);

    m = await p.evaluate(() => {
      const cs = sel => getComputedStyle(document.querySelector(sel));
      const raiz = cs('.pn');
      const v = n => raiz.getPropertyValue(n).trim();
      return {
        vars: { bg: v('--pn-bg'), marca: v('--pn-marca'), acento: v('--pn-acento'), radio: v('--pn-radio') },
        fondo: raiz.backgroundColor,
        cab: cs('.pn-cabecera').backgroundColor, cabTxt: cs('.pn-cabecera').color,
        tarjeta: cs('.pn-cifra').backgroundColor,
        cifra: cs('.pn-cifra-v').color, etiqueta: cs('.pn-cifra-k').color,
        nav: cs('.pn-nav').backgroundColor, navTxt: cs('.pn-nav-item:not(.is-on)').color,
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    // El enlace "ver mi tienda" lleva el slug del canal: con él se puede
    // preguntar a la tienda qué diseño tiene guardado de verdad.
    m.slug = await p.evaluate(() => {
      const a = document.querySelector('.pn-cabecera-fin a[href]');
      return a ? new URL(a.href).hostname.split('.')[0] : '';
    });

    await p.goto(`${BASE}/panel/productos`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    m.titulos = await p.evaluate(() =>
      [...document.querySelectorAll('.pn-fila-txt b')].map(x => getComputedStyle(x).color));
    m.errores = errores;
    await ctx.close();

    // La comprobación que importa: los tokens del panel son EXACTAMENTE los
    // del diseño guardado en el canal, no los de la fábrica.
    assert(m.slug, 'no se pudo averiguar el canal desde el panel');
    const r = await fetch(`${BASE}/shop-api`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'vendure-token': m.slug },
      body: JSON.stringify({ query: '{ activeChannel { customFields { design } } }' }),
    });
    const guardado = JSON.parse((await r.json()).data.activeChannel.customFields.design);
    for (const [token, esperado] of [['bg', guardado.bg], ['marca', guardado.brand],
                                     ['acento', guardado.accent], ['radio', guardado.radius]]) {
      assert(m.vars[token].toLowerCase() === String(esperado).toLowerCase(),
        `--pn-${token} es ${m.vars[token]} y la tienda tiene ${esperado}`);
    }
    assert(m.errores.length === 0, `errores JS: ${m.errores[0]}`);
    assert(m.desborde <= 0, `se desborda a lo ancho (${m.desborde}px)`);
  });

  await check(`${caso.id.toUpperCase()}: el texto de trabajo cumple ${MINIMO}:1 con esa paleta`, () => {
    assert(m, 'no se pudo medir');
    const medidas = [
      ['cifra sobre tarjeta', contraste(m.cifra, m.tarjeta)],
      ['etiqueta sobre tarjeta', contraste(m.etiqueta, m.tarjeta)],
      ['cabecera', contraste(m.cabTxt, m.cab)],
      ['navegación', contraste(m.navTxt, m.nav)],
    ];
    const flojo = medidas.filter(([, r]) => r < MINIMO);
    assert(flojo.length === 0, flojo.map(([k, r]) => `${k} ${r.toFixed(2)}:1`).join(', '));
  });

  await check(`${caso.id.toUpperCase()}: un producto ya visitado no cambia de color`, () => {
    assert(m && m.titulos.length > 1, 'sin productos que comparar');
    const distintos = [...new Set(m.titulos.map(c => aRGB(c).join()))];
    // Chromium pinta :visited con SU color y no admite var() dentro de
    // :visited: si el color visible viviera en el <a>, el producto ya abierto
    // saldría en verde azulado dentro de la paleta del dueño.
    assert(distintos.length === 1, `los títulos no comparten color: ${distintos.join(' / ')}`);
  });
}

await b.close();

let fallos = 0;
console.log('\n======== QA TEMA DEL BACK OFFICE ========');
for (const [st, n] of res) { if (st === '❌') fallos++; console.log(`${st} ${n}`); }
console.log('========================================');
console.log(`${res.length - fallos}/${res.length} pruebas pasaron`);
process.exit(fallos ? 1 : 0);
