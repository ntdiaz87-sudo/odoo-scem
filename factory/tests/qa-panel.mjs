/**
 * Batería QA del PANEL DEL DUEÑO (backend de la tienda).
 *
 * Cubre el hueco que dejaron flows.mjs y qa-edge.mjs: esas prueban las APIs y
 * el escaparate, pero nunca abrían el panel de Vendure como dueño. Aquí se
 * entra por el MISMO enlace que recibe el cliente y se revisan y editan sus
 * productos, como haría él desde el móvil.
 *
 * Uso: node tests/qa-panel.mjs   (réplica local: web en 8300, vendure en 3000)
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://localhost:8300';
const results = [];
const ok = (n) => results.push(['PASS', n]);
const ko = (n, w) => results.push(['FAIL', `${n} — ${w}`]);
async function check(name, fn) {
  try { await fn(); ok(name); } catch (e) { ko(name, String(e.message || e).slice(0, 200)); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };

const S = Math.random().toString(36).slice(2, 6);
const EMAIL = `qa-panel-${S}@t.local`;
const PASS = 'clave-segura-123';
const NOMBRE = `Panel QA ${S}`;
const ip = `10.31.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

// --- crear la tienda del dueño ---
const crear = await fetch(BASE + '/api/demo', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
  body: JSON.stringify({ storeName: NOMBRE, designKey: 'nocta', ownerEmail: EMAIL, ownerPassword: PASS }),
});
const tienda = await crear.json();
if (!tienda.url) {
  console.error('No se pudo crear la tienda de prueba:', JSON.stringify(tienda));
  process.exit(1);
}
const SLUG = tienda.url.replace(/^https?:\/\//, '').split('.')[0];

// El enlace del panel que se le entrega al dueño DEBE funcionar (no 404).
await check('El enlace del panel que recibe el dueño responde (no 404)', async () => {
  assert(tienda.panelUrl, 'la API no devuelve panelUrl');
  const r = await fetch(tienda.panelUrl, { redirect: 'follow' });
  assert(r.status === 200, `panelUrl devolvió ${r.status}`);
});

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
// Móvil: es como entra el dueño de verdad.
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();

let jsErrs = [];
let gqlErrs = [];
page.on('pageerror', e => jsErrs.push('JS: ' + String(e.message).slice(0, 200)));
page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_CONNECTION_RESET/.test(m.text())) jsErrs.push('CONSOLE: ' + m.text().slice(0, 200)); });
page.on('response', async res => {
  if (!res.url().includes('admin-api')) return;
  try {
    const j = await res.json();
    if (j.errors) j.errors.forEach(e => gqlErrs.push(`${e.extensions?.code}|${e.path?.join('.')}`));
  } catch { /* respuesta no-JSON */ }
});
const limpiar = () => { jsErrs = []; gqlErrs = []; };
const sinErrores = (contexto) => {
  const js = [...new Set(jsErrs)];
  const gql = [...new Set(gqlErrs)];
  assert(js.length === 0, `${contexto}: errores JS → ${js.slice(0, 2).join(' / ')}`);
  assert(gql.length === 0, `${contexto}: errores GraphQL → ${gql.slice(0, 3).join(' / ')}`);
};

await check('El dueño entra a su panel con su correo y contraseña', async () => {
  await page.goto(tienda.panelUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  assert(await page.locator('input').count() >= 2, 'no aparece el formulario de acceso');
  await page.locator('input').nth(0).fill(EMAIL);
  await page.locator('input').nth(1).fill(PASS);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(6000);
  assert(!/login/.test(page.url()), `sigue en la pantalla de acceso: ${page.url()}`);
  limpiar();
});

let detalle = '';
await check('La lista de productos muestra los 4 productos de SU tienda', async () => {
  await page.goto(`${BASE}/dashboard/products?sort=-updatedAt&page=1&perPage=10`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  const texto = await page.locator('body').innerText();
  for (const p of ['Producto estrella', 'Novedad de la semana', 'Básico imprescindible', 'Pack de regalo']) {
    assert(texto.includes(p), `falta "${p}" en la lista`);
  }
  assert(texto.includes(SLUG), 'no aparecen los slugs de su tienda');
  const hrefs = await page.locator('a[href*="/dashboard/products/"]').evaluateAll(as => as.map(a => a.getAttribute('href')));
  detalle = hrefs.find(h => /products\/\d+/.test(h)) || '';
  assert(detalle, 'ningún producto es clicable');
  sinErrores('lista de productos');
});

await check('Abrir un producto muestra su ficha completa, sin romperse', async () => {
  limpiar();
  await page.goto(BASE + detalle, { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);
  const texto = await page.locator('body').innerText();
  for (const campo of ['Product name', 'Slug', 'Description', 'Enabled']) {
    assert(texto.includes(campo), `la ficha no muestra "${campo}"`);
  }
  assert(await page.getByRole('button', { name: /^Update$/ }).count() > 0, 'no hay botón para guardar');
  sinErrores('ficha de producto');
});

await check('Abrir la variante muestra precio y existencias, sin romperse', async () => {
  const vs = await page.locator('a[href*="product-variants/"]').evaluateAll(as => as.map(a => a.getAttribute('href')));
  assert(vs.length > 0, 'la ficha no enlaza ninguna variante');
  limpiar();
  await page.goto(BASE + vs[0], { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);
  const texto = await page.locator('body').innerText();
  for (const campo of ['SKU', 'Price', 'Stock']) {
    assert(texto.includes(campo), `la variante no muestra "${campo}"`);
  }
  sinErrores('ficha de variante');
});

await check('Editar el nombre del producto y guardar se refleja en la tienda', async () => {
  const nuevo = `Renombrado QA ${S}`;
  await page.goto(BASE + detalle, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  limpiar();
  await page.getByLabel('Product name').first().fill(nuevo);
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /^Update$/ }).first().click();
  await page.waitForTimeout(5000);
  sinErrores('guardar producto');
  const r = await fetch(BASE + '/shop-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'vendure-token': SLUG },
    body: JSON.stringify({ query: '{ products(options:{take:20}) { items { name } } }' }),
  });
  const nombres = (await r.json()).data.products.items.map(p => p.name);
  assert(nombres.includes(nuevo), `el cambio no llegó a la tienda: ${nombres.join(', ')}`);
});

await check('Crear un producto nuevo desde el panel funciona', async () => {
  await page.goto(BASE + '/dashboard/products/new', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  limpiar();
  await page.getByLabel('Product name').first().fill(`Nuevo QA ${S}`);
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Create$/ }).first().click();
  await page.waitForTimeout(6000);
  assert(/\/dashboard\/products\/\d+/.test(page.url()), `no se creó (url ${page.url()})`);
  sinErrores('crear producto');
});

await check('El panel de pedidos abre sin romperse', async () => {
  limpiar();
  await page.goto(BASE + '/dashboard/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  const texto = await page.locator('body').innerText();
  // Una tienda recién creada no tiene pedidos: lo correcto es ver la tabla
  // vacía ("No results"), no una página rota.
  assert(/Orders/.test(texto), 'no aparece la sección de pedidos');
  for (const col of ['Code', 'State', 'Customer', 'Total']) {
    assert(texto.includes(col), `la tabla de pedidos no muestra la columna "${col}"`);
  }
  sinErrores('pedidos');
});

await check('El dueño NO ve las tiendas de otros clientes desde su panel', async () => {
  const canales = await page.evaluate(async () => {
    const r = await fetch('/admin-api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ me { channels { code } } }' }),
      credentials: 'include',
    });
    return (await r.json()).data?.me?.channels?.map(c => c.code) ?? null;
  });
  assert(canales, 'no se pudo leer la sesión del panel');
  const propios = canales.filter(c => c !== '__default_channel__');
  assert(propios.length === 1 && propios[0] === SLUG, `ve estos canales: ${canales.join(', ')}`);
});

await check('El panel se ve bien en el móvil (sin desbordes)', async () => {
  for (const ruta of ['/dashboard/', '/dashboard/products', detalle]) {
    await page.goto(BASE + ruta, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert(sw <= cw + 2, `${ruta}: se desborda a lo ancho (${sw} > ${cw})`);
  }
});

await browser.close();

let fallos = 0;
console.log('\n========= QA PANEL DEL DUEÑO =========');
for (const [st, n] of results) {
  if (st === 'FAIL') fallos++;
  console.log(`${st === 'PASS' ? '✅' : '❌'} ${n}`);
}
console.log('======================================');
console.log(`${results.length - fallos}/${results.length} pruebas pasaron`);
process.exit(fallos ? 1 : 0);
