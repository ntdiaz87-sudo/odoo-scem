/**
 * Batería del back office del comerciante (/panel).
 *
 * Corre contra la réplica local. Necesita fixtura; móntala primero:
 *   node tests/fixtura-backoffice.mjs        → imprime la línea de entorno
 *   CORREO=<correo del dueño> SLUG=<canal> ID_AJENO=<id de producto de otra
 *   tienda> SLUG_AJENO=<otro canal> node tests/qa-backoffice.mjs
 *
 * Cuidado al añadir clics: el botón de "salir" es el PRIMER submit de toda
 * página autenticada, así que hay que apuntar al formulario concreto
 * (.pn-form, .pn-cabecera-fin form) y nunca a button[type=submit] a secas.
 */
import { chromium } from 'playwright';
const dir = '/tmp/claude-0/-home-user-odoo-scem/c259b566-d527-5046-bca3-1a88ef0768e7/scratchpad';
const BASE = 'http://localhost:8300';
const CORREO = process.env.CORREO;
const CLAVE = 'clave-segura-123';
const res = [];
const ok = n => res.push(['✅', n]);
const ko = (n, e) => res.push(['❌', `${n} — ${String(e.message || e).slice(0, 180)}`]);
async function check(n, fn) { try { await fn(); ok(n); } catch (e) { ko(n, e); } }
const assert = (c, m) => { if (!c) throw new Error(m); };

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errores = [];
page.on('pageerror', e => errores.push(String(e)));

await check('Sin sesión, /panel/inicio manda a la puerta', async () => {
  await page.goto(`${BASE}/panel/inicio`, { waitUntil: 'networkidle' });
  assert(page.url().endsWith('/panel'), `acabó en ${page.url()}`);
});

await check('Credenciales malas: aviso, no entra', async () => {
  await page.fill('#correo', CORREO);
  await page.fill('#clave', 'no-es-la-clave');
  await page.click('button[type=submit]');
  await page.waitForTimeout(1200);
  assert(!page.url().includes('/inicio'), 'entró con la clave mala');
  assert(await page.locator('.fh-aviso').first().isVisible(), 'sin aviso de error');
});

await check('El dueño entra con sus credenciales', async () => {
  await page.fill('#correo', CORREO);
  await page.fill('#clave', CLAVE);
  await page.click('button[type=submit]');
  await page.waitForURL('**/panel/inicio', { timeout: 15000 });
  assert(await page.getByRole('heading', { level: 1 }).isVisible(), 'sin título');
});

await check('Resumen: cifras del día y navegación de 4 secciones', async () => {
  const cifras = await page.locator('.pn-cifra').count();
  assert(cifras === 4, `cifras=${cifras}`);
  const nav = await page.locator('.pn-nav-item').count();
  assert(nav === 4, `nav=${nav}`);
});

let idProducto = '';
await check('Productos: lista con precio y existencias', async () => {
  await page.click('.pn-nav-item[href="/panel/productos"]');
  await page.waitForURL('**/panel/productos');
  const filas = await page.locator('.pn-fila').count();
  assert(filas > 0, 'lista vacía');
  idProducto = (await page.locator('.pn-fila').first().getAttribute('href')).split('/').pop();
});

const NOMBRE = `茉莉花茶 ${Math.random().toString(36).slice(2, 6)}`;
await check('Editar un producto: nombre y precio se guardan', async () => {
  await page.goto(`${BASE}/panel/productos/${idProducto}`, { waitUntil: 'networkidle' });
  await page.fill('#nombre', NOMBRE);
  await page.fill('#precio', '188.50');
  await page.fill('#stock', '42');
  await page.click('.pn-form button[type=submit]');
  await page.waitForSelector('.pn-ok', { timeout: 15000 });
});

await check('El cambio llega a la TIENDA pública', async () => {
  const p = await ctx.newPage();
  const r = await p.goto(`${BASE}/store/${process.env.SLUG}`, { waitUntil: 'networkidle' });
  const cuerpo = await p.content();
  assert(r.status() === 200, `status ${r.status()}`);
  assert(cuerpo.includes(NOMBRE), 'la tienda no muestra el nombre nuevo');
  assert(cuerpo.includes('188.50') || cuerpo.includes('188,50'), 'la tienda no muestra el precio nuevo');
  await p.close();
});

let idNuevo = '';
await check('Crear un producto nuevo desde el móvil', async () => {
  await page.goto(`${BASE}/panel/productos/nuevo`, { waitUntil: 'networkidle' });
  await page.fill('#nombre', '龙井茶礼盒');
  await page.fill('#descripcion', '明前龙井，一斤装。');
  await page.fill('#precio', '268');
  await page.fill('#stock', '20');
  await page.click('.pn-form button[type=submit]');
  await page.waitForURL(u => /\/panel\/productos\/\d+$/.test(u.pathname), { timeout: 25000 });
  idNuevo = page.url().split('/').pop();
  assert(idNuevo && idNuevo !== 'nuevo', `url rara: ${page.url()}`);
});

await check('El producto nuevo aparece en la tienda pública', async () => {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/store/${process.env.SLUG}`, { waitUntil: 'networkidle' });
  assert((await p.content()).includes('龙井茶礼盒'), 'no aparece el producto nuevo');
  await p.close();
});

await check('Pedidos: lista y detalle con artículos y entrega', async () => {
  await page.goto(`${BASE}/panel/pedidos`, { waitUntil: 'networkidle' });
  const filas = await page.locator('.pn-fila').count();
  assert(filas > 0, 'sin pedidos');
  await page.locator('.pn-fila').first().click();
  await page.waitForURL('**/panel/pedidos/**');
  assert(await page.locator('.pn-lineas li').first().isVisible(), 'sin artículos');
  assert(await page.locator('.pn-datos').isVisible(), 'sin datos de entrega');
});

await check('Cobrar y enviar un pedido desde el panel', async () => {
  const cobrar = page.locator('form:has(input[name=pagoId]) button');
  if (await cobrar.count()) {
    await cobrar.click();
    await page.waitForSelector('.pn-ok, .fh-aviso', { timeout: 15000 });
    const fallo = await page.locator('.fh-aviso').first().textContent().catch(() => null);
    assert(await page.locator('.pn-ok').isVisible(), fallo || 'no confirmó el cobro');
  }
  await page.reload({ waitUntil: 'networkidle' });
  const enviar = page.locator('form:has(input[name=pedidoId]) button');
  if (await enviar.count()) {
    await enviar.click();
    await page.waitForSelector('.pn-ok, .fh-aviso', { timeout: 20000 });
    const fallo = await page.locator('.fh-aviso').first().textContent().catch(() => null);
    assert(await page.locator('.pn-ok').isVisible(), fallo || 'no confirmó el envío');
  }
});

await check('Mi tienda: renombrar y ver el nombre nuevo', async () => {
  await page.goto(`${BASE}/panel/tienda`, { waitUntil: 'networkidle' });
  await page.fill('#nombre', '青竹茶铺');
  await page.click('.pn-bloque .pn-form button[type=submit]');
  await page.waitForSelector('.pn-ok', { timeout: 15000 });
  await page.reload({ waitUntil: 'networkidle' });
  assert((await page.content()).includes('青竹茶铺'), 'el nombre no persiste');
});

await check('Aislamiento: no puede abrir el producto de otra tienda', async () => {
  const r = await page.goto(`${BASE}/panel/productos/${process.env.ID_AJENO}`, { waitUntil: 'networkidle' });
  assert(r.status() === 404, `status ${r.status()} (debería ser 404)`);
});

await check('Aislamiento: /canales de otra tienda te devuelve a la tuya', async () => {
  await page.goto(`${BASE}/canales/${process.env.SLUG_AJENO}`, { waitUntil: 'networkidle' });
  assert(page.url().includes(process.env.SLUG), `acabó en ${page.url()}`);
});

await check('Sin desborde horizontal en el móvil', async () => {
  for (const r of ['/panel/inicio', '/panel/productos', '/panel/pedidos', '/panel/tienda']) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' });
    const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert(sw <= cw + 1, `${r}: ${sw} > ${cw}`);
  }
});

await check('Salir cierra la sesión de verdad', async () => {
  await page.goto(`${BASE}/panel/inicio`, { waitUntil: 'networkidle' });
  await page.locator('.pn-cabecera-fin form button[type=submit]').click();
  await page.waitForURL('**/panel', { timeout: 15000 });
  await page.goto(`${BASE}/panel/inicio`, { waitUntil: 'networkidle' });
  assert(page.url().endsWith('/panel'), `sigue dentro: ${page.url()}`);
});

await page.setViewportSize({ width: 1280, height: 900 });
await check('Escritorio: navegación lateral sin desborde', async () => {
  await page.goto(`${BASE}/panel`, { waitUntil: 'networkidle' });
  await page.fill('#correo', CORREO);
  await page.fill('#clave', CLAVE);
  await page.click('button[type=submit]');
  await page.waitForURL('**/panel/inicio', { timeout: 15000 });
  await page.screenshot({ path: `${dir}/panel-desk.png` });
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  assert(sw <= cw + 1, `${sw} > ${cw}`);
});

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/panel/productos`, { waitUntil: 'networkidle' });
await page.screenshot({ path: `${dir}/panel-mov.png`, fullPage: true });

await b.close();
for (const [m, n] of res) console.log(m, n);
console.log('errores JS:', errores.length ? errores : 0);
const fallos = res.filter(r => r[0] === '❌').length;
console.log('='.repeat(46));
console.log(`${res.length - fallos}/${res.length} pruebas pasaron`);
