/**
 * Batería QA de casos límite y adversarios de la fábrica (complementa flows.mjs).
 * Corre contra la réplica local. Usa IPs falsas (x-forwarded-for) para no
 * comerse el presupuesto anti-abuso de las pruebas normales.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:8300';
const HOST = 'localhost:8300';
const API = 'http://localhost:3000';
const results = [];
const ok = (n) => results.push(['PASS', n]);
const ko = (n, why) => results.push(['FAIL', `${n} — ${why}`]);
async function check(name, fn) {
  try { await fn(); ok(name); } catch (e) { ko(name, String(e.message || e).slice(0, 180)); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const STAMP = Math.random().toString(36).slice(2, 7);
let ipSeq = 0;
const freshIp = () => `10.77.${Math.floor(Math.random() * 250)}.${++ipSeq}`;

const demo = (data, ip) =>
  fetch(BASE + '/api/demo', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip || freshIp() },
    body: JSON.stringify(data),
  });

// ---------- VALIDACIÓN DE ENTRADAS ----------
await check('Nombre de 1 letra, de 41+ letras y vacío → 400 con mensaje claro', async () => {
  for (const storeName of ['A', 'x'.repeat(41), '', '   ']) {
    const r = await demo({ storeName, designKey: 'hoja-viva', ownerEmail: `v-${STAMP}-${Math.random().toString(36).slice(2,6)}@t.local`, ownerPassword: 'clave-larga-123' });
    assert(r.status === 400, `"${storeName.slice(0, 10)}" dio ${r.status}`);
    assert((await r.json()).error, 'sin mensaje de error');
  }
});
await check('Correos inválidos → 400 (sin @, sin dominio, con espacios)', async () => {
  for (const ownerEmail of ['sin-arroba', 'a@b', 'con espacios@x.com', '@x.com', 'a@.com']) {
    const r = await demo({ storeName: 'Tienda Valida', designKey: 'hoja-viva', ownerEmail, ownerPassword: 'clave-larga-123' });
    assert(r.status === 400, `"${ownerEmail}" dio ${r.status}`);
  }
});
await check('Contraseña de 7 caracteres → 400', async () => {
  const r = await demo({ storeName: 'Tienda Valida', designKey: 'hoja-viva', ownerEmail: `p-${STAMP}@t.local`, ownerPassword: '1234567' });
  assert(r.status === 400, `dio ${r.status}`);
});
await check('Cuerpo no-JSON y JSON sin campos → 400, nunca 500', async () => {
  const raw = await fetch(BASE + '/api/demo', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': freshIp() }, body: 'esto no es json' });
  assert(raw.status === 400, `no-JSON dio ${raw.status}`);
  const empty = await demo({});
  assert(empty.status === 400, `JSON vacío dio ${empty.status}`);
});
await check('Diseño manipulado (colores no-hex, radius raro) → se ignora y usa preset', async () => {
  const r = await demo({
    storeName: `Hack Design ${STAMP}`,
    design: { key: 'd-hack', label: 'x', bg: 'javascript:alert(1)', surface: '#fff', ink: '#000', inkSoft: '#333', brand: '#333333', brandInk: '#ffffff', accent: '#444444', radius: '99999px', headingFont: 'grotesque' },
    ownerEmail: `hd-${STAMP}@t.local`, ownerPassword: 'clave-larga-123',
  });
  assert(r.status === 200, `dio ${r.status}`);
  const { url } = await r.json();
  const slug = url.replace('http://', '').split('.')[0];
  const q = await fetch(API + '/shop-api', { method: 'POST', headers: { 'content-type': 'application/json', 'vendure-token': slug }, body: JSON.stringify({ query: '{ activeChannel { customFields { design } } }' }) });
  const design = JSON.parse((await q.json()).data.activeChannel.customFields.design);
  assert(design.key !== 'd-hack', `aceptó el diseño manipulado: ${design.key}`);
  assert(/^#[0-9a-f]{6}$/i.test(design.bg), `bg peligroso guardado: ${design.bg}`);
});

// ---------- NOMBRES HOSTILES Y UNICODE ----------
const XSS_NAME = `<script>alert(1)</script>Tienda ${STAMP}`;
let xssUrl = '';
await check('Nombre con <script> se crea pero queda NEUTRALIZADO en la página', async () => {
  const r = await demo({ storeName: XSS_NAME, designKey: 'hoja-viva', ownerEmail: `xss-${STAMP}@t.local`, ownerPassword: 'clave-larga-123' });
  assert(r.status === 200, `dio ${r.status}`);
  xssUrl = (await r.json()).url;
  assert(xssUrl, 'sin url');
});
await check('Nombre con comillas SQL no rompe nada (las tablas siguen vivas)', async () => {
  const r = await demo({ storeName: `Rob'); DROP TABLE channel;-- ${STAMP}`.slice(0, 40), designKey: 'hoja-viva', ownerEmail: `sql-${STAMP}@t.local`, ownerPassword: 'clave-larga-123' });
  assert(r.status === 200, `dio ${r.status}`);
  const q = await fetch(API + '/shop-api', { method: 'POST', headers: { 'content-type': 'application/json', 'vendure-token': 'verdealto' }, body: JSON.stringify({ query: '{ products { totalItems } }' }) });
  assert((await q.json()).data.products.totalItems === 4, 'verdealto perdió su catálogo');
});
let uniUrl = '';
await check('Nombre unicode (Café Ñandú 🌟) → slug limpio y tienda navegable', async () => {
  const r = await demo({ storeName: `Café Ñandú 🌟 ${STAMP}`, designKey: 'hoja-viva', ownerEmail: `uni-${STAMP}@t.local`, ownerPassword: 'clave-larga-123' });
  assert(r.status === 200, `dio ${r.status}`);
  uniUrl = (await r.json()).url;
  assert(/cafe-nandu/.test(uniUrl), `slug raro: ${uniUrl}`);
});

// ---------- APIS BAJO ABUSO ----------
await check('Carrito: pedir 999 unidades → error de stock controlado, nunca 500', async () => {
  const slug = uniUrl.replace('http://', '').split('.')[0];
  const vq = await fetch(BASE + '/shop-api', { method: 'POST', headers: { 'content-type': 'application/json', 'vendure-token': slug }, body: JSON.stringify({ query: '{ products { items { variants { id } } } }' }) });
  const vid = (await vq.json()).data.products.items[0].variants[0].id;
  const r = await fetch(BASE + '/shop-api', { method: 'POST', headers: { 'content-type': 'application/json', 'vendure-token': slug }, body: JSON.stringify({ query: `mutation { addItemToOrder(productVariantId: ${vid}, quantity: 999) { __typename ... on ErrorResult { errorCode } } }` }) });
  assert(r.status === 200, `HTTP ${r.status}`);
  const t = (await r.json()).data.addItemToOrder;
  assert(t.__typename === 'InsufficientStockError' || t.__typename === 'OrderLimitError', `tipo ${t.__typename}`);
});
await check('Sesión de carrito de una tienda NO abre el pedido en otra', async () => {
  const slug = uniUrl.replace('http://', '').split('.')[0];
  const add = await fetch(BASE + '/shop-api', { method: 'POST', headers: { 'content-type': 'application/json', 'vendure-token': slug }, body: JSON.stringify({ query: '{ products { items { variants { id } } } }' }) });
  const vid = (await add.json()).data.products.items[0].variants[0].id;
  const r1 = await fetch(BASE + '/shop-api', { method: 'POST', headers: { 'content-type': 'application/json', 'vendure-token': slug }, body: JSON.stringify({ query: `mutation { addItemToOrder(productVariantId: ${vid}, quantity: 1) { __typename } }` }) });
  const bearer = r1.headers.get('vendure-auth-token');
  assert(bearer, 'sin token de sesión');
  const r2 = await fetch(BASE + '/shop-api', { method: 'POST', headers: { 'content-type': 'application/json', 'vendure-token': 'verdealto', authorization: `Bearer ${bearer}` }, body: JSON.stringify({ query: '{ activeOrder { code totalQuantity } }' }) });
  const other = (await r2.json()).data.activeOrder;
  assert(!other || other.totalQuantity === 0, `el pedido se filtró a verdealto: ${JSON.stringify(other)}`);
});
await check('Checkout por API con carrito vacío → error controlado, nunca 500', async () => {
  const r = await fetch(BASE + '/shop-api', { method: 'POST', headers: { 'content-type': 'application/json', 'vendure-token': 'verdealto' }, body: JSON.stringify({ query: 'mutation { transitionOrderToState(state: "ArrangingPayment") { __typename ... on OrderStateTransitionError { message } } }' }) });
  assert(r.status === 200, `HTTP ${r.status}`);
});
await check('tls-check: dominios hostiles → 400/404, nunca 500', async () => {
  for (const d of ['..', 'a b.local', "x'--.localhost", '%00.localhost', 'sub.sub.localhost']) {
    const r = await fetch(`${BASE}/api/tls-check?domain=${encodeURIComponent(d)}`);
    assert(r.status === 400 || r.status === 404, `"${d}" dio ${r.status}`);
  }
});
await check('MCP: precio 0, negativo, stock -1 y no-entero → rechazados con aviso', async () => {
  const auth = 'Basic ' + Buffer.from(`uni-${STAMP}@t.local:clave-larga-123`).toString('base64');
  const call = async (name, args) => {
    const r = await fetch(BASE + '/api/mcp', { method: 'POST', headers: { 'content-type': 'application/json', authorization: auth }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) });
    return (await r.json()).result;
  };
  const slug = uniUrl.replace('http://', '').split('.')[0];
  const sku = `${slug}-producto-estrella`;
  for (const args of [{ sku, precio_usd: 0 }, { sku, precio_usd: -5 }, { sku, precio_usd: 'gratis' }]) {
    const res = await call('cambiar_precio', args);
    assert(res.isError === true, `aceptó precio ${JSON.stringify(args)}`);
  }
  for (const args of [{ sku, unidades: -1 }, { sku, unidades: 2.5 }]) {
    const res = await call('ajustar_stock', args);
    assert(res.isError === true, `aceptó stock ${JSON.stringify(args)}`);
  }
});
await check('Dos tiendas con el MISMO nombre a la vez → ambas viven, sin 500', async () => {
  const name = `Carrera ${STAMP}`;
  const [a, b] = await Promise.all([
    demo({ storeName: name, designKey: 'hoja-viva', ownerEmail: `c1-${STAMP}@t.local`, ownerPassword: 'clave-larga-123' }),
    demo({ storeName: name, designKey: 'nocta', ownerEmail: `c2-${STAMP}@t.local`, ownerPassword: 'clave-larga-123' }),
  ]);
  assert(a.status === 200 && b.status === 200, `estados ${a.status}/${b.status}`);
  const ua = (await a.json()).url; const ub = (await b.json()).url;
  assert(ua !== ub, `misma URL para ambas: ${ua}`);
});

// ---------- NAVEGADOR: RENDER HOSTIL Y MÓVIL ----------
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
let dialogs = 0;
page.on('dialog', d => { dialogs++; d.dismiss().catch(() => undefined); });

await check('XSS: la tienda con <script> en el nombre NO ejecuta nada', async () => {
  await page.goto(xssUrl + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  assert(dialogs === 0, `saltaron ${dialogs} diálogos`);
  const text = await page.locator('body').innerText();
  assert(text.includes('Tienda ' + STAMP), 'el nombre ni siquiera se pinta');
});
await check('Móvil: tienda, carrito y checkout sin scroll horizontal', async () => {
  const slug = uniUrl.replace('http://', '').split('.')[0];
  for (const path of ['/', '/cart', '/checkout']) {
    await page.goto(`http://${slug}.${HOST}${path}`, { waitUntil: 'networkidle' });
    const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert(sw <= cw + 1, `${path}: scrollWidth ${sw} > ${cw}`);
  }
});
await check('Página /gracias sin número de pedido no se rompe', async () => {
  const slug = uniUrl.replace('http://', '').split('.')[0];
  const r = await page.goto(`http://${slug}.${HOST}/gracias`, { waitUntil: 'networkidle' });
  assert(r.status() === 200, `status ${r.status()}`);
  assert((await page.content()).includes('Pedido confirmado'), 'no renderiza');
});
await check('Carrito/checkout de un subdominio inexistente → aviso, no error', async () => {
  for (const path of ['/cart', '/checkout']) {
    await page.goto(`http://no-existe-${STAMP}.${HOST}${path}`, { waitUntil: 'networkidle' });
    assert((await page.content()).includes('Tienda no encontrada'), `${path} sin aviso`);
  }
});

await browser.close();

let fails = 0;
console.log('\n============ QA CASOS LÍMITE ============');
for (const [st, name] of results) {
  if (st === 'FAIL') fails++;
  console.log(`${st === 'PASS' ? '✅' : '❌'} ${name}`);
}
console.log(`=========================================`);
console.log(`${results.length - fails}/${results.length} pruebas pasaron`);
process.exit(fails ? 1 : 0);
