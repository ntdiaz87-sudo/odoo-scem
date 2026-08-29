import { chromium } from 'playwright';

const BASE = 'http://localhost:8300';
const HOST = 'localhost:8300';
const API = 'http://localhost:3000';
const results = [];
const ok = (name) => results.push(['PASS', name]);
const ko = (name, why) => results.push(['FAIL', `${name} — ${why}`]);

async function check(name, fn) {
  try { await fn(); ok(name); } catch (e) { ko(name, String(e.message || e).slice(0, 160)); }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// ---------- 1. LANDING ----------
await check('Landing carga y muestra el mensaje principal', async () => {
  const r = await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  assert(r.status() === 200, `status ${r.status()}`);
  const h1 = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
  assert(h1.includes('生成你的完整商店') && h1.includes('独一无二'), `h1 distinto: "${h1}"`);
});
await check('Landing: secciones Cómo funciona / Diseños únicos / Planes', async () => {
  // El diseño parte estos titulares en dos líneas (<br>), así que se
  // comprueban por fragmentos contiguos.
  for (const t of ['到一个营业的商店', '三个渠道', '三位 AI 员工']) {
    assert(await page.getByText(t, { exact: false }).first().isVisible(), `falta "${t}"`);
  }
});
await check('Landing: 3 planes con marcadores de precio', async () => {
  const body = await page.content();
  for (const t of ['体验版', '开店版', 'AI 商家版', '全渠道版', '¥199', '¥399', '¥699', '0 平台交易佣金']) assert(body.includes(t), `falta ${t}`);
});
await check('Landing móvil: sin scroll horizontal', async () => {
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  assert(sw <= cw + 1, `scrollWidth ${sw} > clientWidth ${cw}`);
});
await check('CTA "Probar demo gratis" lleva al wizard', async () => {
  await page.getByRole('link', { name: '免费试用' }).first().click();
  await page.waitForURL('**/demo');
  assert(await page.getByLabel('商店名称').isVisible(), 'wizard sin campo de nombre');
});

// ---------- 2. WIZARD ----------
await check('Wizard: validación de nombre vacío', async () => {
  await page.getByRole('button', { name: /生成我的商店/ }).click();
  await page.waitForTimeout(400);
  assert((await page.content()).includes('请填写商店名称'), 'no mostró el error de validación');
});
const STAMP = Math.random().toString(36).slice(2, 6);
const EMAIL = `owner-${STAMP}@test.local`;
const PASS = 'clave-segura-123';
const NAME = `Flujo Total ${STAMP}`;
const SLUG = `flujo-total-${STAMP}`;
await check('Wizard: encuesta del diseñador propone 3 diseños únicos', async () => {
  await page.getByRole('button', { name: '深色' }).click();
  await page.waitForTimeout(1500);
  await page.locator('.design-card').first().waitFor({ timeout: 20000 });
  const cards = await page.locator('.design-card').count();
  assert(cards === 3, `hay ${cards} propuestas`);
});
await check('Wizard: crear tienda demo con cuenta de dueño y diseño propuesto', async () => {
  await page.locator('.design-card').first().click();
  await page.fill('#storeName', NAME);
  await page.fill('#ownerEmail', EMAIL);
  await page.fill('#ownerPassword', PASS);
  await page.getByRole('button', { name: /生成我的商店/ }).click();
  await page.getByText('你的商店已上线！').waitFor({ timeout: 60000 });
  assert((await page.content()).includes(EMAIL), 'no muestra el usuario del panel');
});
await check('Éxito: enlace "Ver mi tienda" lleva al subdominio', async () => {
  await Promise.all([
    page.waitForURL(new RegExp(SLUG), { timeout: 30000 }),
    page.getByRole('link', { name: '查看我的商店' }).click(),
  ]);
  await page.waitForLoadState('networkidle');
  assert(page.url().includes(`${SLUG}.`), `URL final ${page.url()}`);
});
await check('Tienda creada: banner sandbox, nombre, 4 productos y diseño oscuro aplicado', async () => {
  const body = await page.content();
  assert(body.includes('这是在 fábrica 生成的体验店'), 'sin banner sandbox');
  assert(body.includes('有效期至'), 'banner sin fecha de caducidad');
  assert(body.includes('欢迎来到') && body.includes(NAME), 'sin bienvenida con nombre');
  for (const p of ['明星单品', '本周新品', '日常必备', '礼盒套装']) {
    assert(body.includes(p), `falta producto ${p}`);
  }
  const rgb = await page.evaluate(() => getComputedStyle(document.body.firstElementChild).backgroundColor);
  const nums = (rgb.match(/\d+/g) || []).slice(0, 3).map(Number);
  const brightness = (nums[0] + nums[1] + nums[2]) / 3;
  assert(brightness < 100, `el fondo no es oscuro (${rgb})`);
});
await check('Wizard: nombre duplicado crea tienda con sufijo (no falla)', async () => {
  const res = await ctx.request.post(BASE + '/api/demo', { data: { storeName: NAME, designKey: 'hoja-viva', ownerEmail: `dup-${STAMP}@test.local`, ownerPassword: PASS } });
  assert(res.status() === 200, `status ${res.status()}`);
  const { url } = await res.json();
  assert(url && url.includes(SLUG + '-'), `esperaba sufijo, vino ${url}`);
});

// ---------- 3. TIENDAS DEMO SEMBRADAS ----------
await check('青竹家居: catálogo propio, precios en yuan y sin banner sandbox', async () => {
  await page.goto(`http://qingzhu.${HOST}/`, { waitUntil: 'networkidle' });
  const body = await page.content();
  for (const t of ['青竹家居', '龟背竹', '琴叶榕', '¥128']) assert(body.includes(t), `falta ${t}`);
  assert(!body.includes('这是在 fábrica 生成的体验店'), 'muestra banner sandbox indebido');
});
await check('NOCTA 夜行: catálogo de moda con diseño oscuro', async () => {
  await page.goto(`http://noctachina.${HOST}/`, { waitUntil: 'networkidle' });
  const body = await page.content();
  for (const t of ['NOCTA 夜行', '黑色宽版衬衫', '原色帆布袋']) assert(body.includes(t), `falta ${t}`);
});
await check('Subdominio inexistente: página "Tienda no encontrada" con CTA', async () => {
  await page.goto(`http://tienda-fantasma.${HOST}/`, { waitUntil: 'networkidle' });
  const body = await page.content();
  assert(body.includes('未找到该商店'), 'no mostró el aviso');
  assert(body.includes('创建我的商店'), 'sin CTA de vuelta');
});

// ---------- 4. APIS ----------
await check('Shop API: aislamiento de catálogos por tienda', async () => {
  const q = async (token) => {
    const r = await fetch(API + '/shop-api', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'vendure-token': token },
      body: JSON.stringify({ query: '{ products { totalItems items { name } } }' }),
    });
    return (await r.json()).data.products;
  };
  const v = await q('qingzhu'); const n = await q('noctachina'); const f = await q(SLUG);
  assert(v.totalItems === 4 && n.totalItems === 4 && f.totalItems === 4, `totales ${v.totalItems}/${n.totalItems}/${f.totalItems}`);
  const names = (x) => x.items.map(i => i.name).join(',');
  assert(names(v) !== names(n) && names(n) !== names(f), 'catálogos no aislados');
});
await check('Shop API: diseño y nombre viajan en customFields del canal', async () => {
  const r = await fetch(API + '/shop-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'vendure-token': SLUG },
    body: JSON.stringify({ query: '{ activeChannel { customFields { displayName design isSandbox expiresAt } } }' }),
  });
  const cf = (await r.json()).data.activeChannel.customFields;
  assert(cf.displayName === NAME, `displayName ${cf.displayName}`);
  assert(cf.isSandbox === true, 'isSandbox false');
  assert(/^d-[a-z0-9]+$/.test(JSON.parse(cf.design).key), `huella rara: ${JSON.parse(cf.design).key}`);
  assert(typeof cf.expiresAt === 'string' && cf.expiresAt.length > 0, 'sin expiresAt');
});
await check('Diseñador: propuestas con huellas únicas y contraste garantizado', async () => {
  const gen = async () => {
    const r = await fetch(BASE + '/api/designs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rubro: 'comida', estilo: 'energico', modo: 'claro' }),
    });
    return (await r.json()).proposals;
  };
  const a = await gen(); const b = await gen();
  assert(a.length === 3 && b.length === 3, `propuestas ${a.length}/${b.length}`);
  const keys = [...a, ...b].map(d => d.key);
  assert(new Set(keys).size === 6, `huellas repetidas: ${keys.join(',')}`);
  for (const d of a) {
    assert(/^#[0-9a-f]{6}$/i.test(d.bg) && /^#[0-9a-f]{6}$/i.test(d.brand), 'colores mal formados');
    assert(d.brandInk === '#161616' || d.brandInk === '#f7f6f2', `brandInk ${d.brandInk}`);
  }
});
await check('Diseñador: el diseño elegido queda RETIRADO (409 al reutilizarlo)', async () => {
  const r = await fetch(API + '/shop-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'vendure-token': SLUG },
    body: JSON.stringify({ query: '{ activeChannel { customFields { design } } }' }),
  });
  const design = JSON.parse((await r.json()).data.activeChannel.customFields.design);
  const res = await ctx.request.post(BASE + '/api/demo', {
    headers: { 'x-forwarded-for': '10.99.99.1' },
    data: { storeName: 'Copiona', design, ownerEmail: `copiona-${STAMP}@test.local`, ownerPassword: PASS },
  });
  assert(res.status() === 409, `status ${res.status()}`);
  assert((await res.json()).error.includes('设计'), 'mensaje inesperado');
});
await check('PWA: manifiesto, icono y service worker por tienda', async () => {
  await page.goto(`http://${SLUG}.${HOST}/`, { waitUntil: 'networkidle' });
  assert((await page.content()).includes('manifest.webmanifest'), 'la tienda no enlaza el manifest');
  const pwa = await page.evaluate(async () => {
    const mf = await fetch('/manifest.webmanifest');
    const manifest = mf.ok ? await mf.json() : null;
    const ic = await fetch('/icon.svg');
    const sw = await fetch('/sw.js');
    return {
      mfStatus: mf.status,
      manifest,
      icStatus: ic.status,
      icType: ic.headers.get('content-type') || '',
      swStatus: sw.status,
    };
  });
  assert(pwa.mfStatus === 200, `manifest ${pwa.mfStatus}`);
  assert(pwa.manifest && pwa.manifest.name === NAME, `nombre del manifest: ${pwa.manifest?.name}`);
  assert(pwa.manifest.display === 'standalone' && pwa.manifest.theme_color, 'manifest incompleto');
  assert(pwa.icStatus === 200 && pwa.icType.includes('svg'), `icono ${pwa.icStatus} ${pwa.icType}`);
  assert(pwa.swStatus === 200, `sw.js ${pwa.swStatus}`);
});
await check('tls-check: 200 raíz y tienda real, 404 inventada, 400 sin dominio', async () => {
  const code = async (qs) => (await fetch(`${BASE}/api/tls-check${qs}`)).status;
  assert(await code('?domain=localhost') === 200, 'raíz no 200');
  assert(await code('?domain=qingzhu.localhost') === 200, 'qingzhu no 200');
  assert(await code('?domain=fantasma-xyz.localhost') === 404, 'inventada no 404');
  assert(await code('') === 400, 'sin dominio no 400');
});
await check('Admin: dashboard servido y login de superadmin', async () => {
  const d = await fetch(API + '/dashboard/');
  assert(d.status === 200, `dashboard ${d.status}`);
  const r = await fetch(API + '/admin-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'mutation { login(username:"superadmin",password:"superadmin"){ __typename } }' }),
  });
  const j = await r.json();
  assert(j.data.login.__typename === 'CurrentUser', 'login falló');
});

await check('Fase 1: el dueño entra al panel y ve SOLO su canal', async () => {
  const r = await fetch(API + '/admin-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: `mutation { login(username:"${EMAIL}", password:"${PASS}") { __typename ... on CurrentUser { channels { code } } } }` }),
  });
  const j = await r.json();
  assert(j.data.login.__typename === 'CurrentUser', 'login de dueño falló');
  const codes = j.data.login.channels.map((c) => c.code);
  assert(codes.length === 1 && codes[0] === SLUG, `canales del dueño: ${codes.join(',')}`);
});
await check('Fase 1: correo repetido rechazado con aviso claro', async () => {
  const res = await ctx.request.post(BASE + '/api/demo', { data: { storeName: 'Otra Tienda', designKey: 'hoja-viva', ownerEmail: EMAIL, ownerPassword: PASS } });
  assert(res.status() === 409, `status ${res.status()}`);
  assert((await res.json()).error.includes('已经有商店'), 'mensaje inesperado');
});
await check('Fase 1: límite anti-abuso del demo (429 a la cuarta)', async () => {
  const res = await ctx.request.post(BASE + '/api/demo', { data: { storeName: 'Cuarta Tienda', designKey: 'hoja-viva', ownerEmail: `cuarta-${STAMP}@test.local`, ownerPassword: PASS } });
  assert(res.status() === 429, `status ${res.status()}`);
});

// ---------- 5. FASE 3: CARRITO Y CHECKOUT ----------
let ORDER_CODE = '';
await check('Carrito: añadir 2 productos desde la tienda nueva y ver contador', async () => {
  await page.goto(`http://${SLUG}.${HOST}/`, { waitUntil: 'networkidle' });
  const buttons = page.getByRole('button', { name: '加入购物车' });
  await buttons.nth(0).click();
  await page.getByRole('button', { name: '✓ 已加入' }).first().waitFor({ timeout: 15000 });
  await buttons.nth(1).click();
  await page.waitForTimeout(1200);
  const badge = await page.locator('.st-carrito').first().textContent();
  assert(badge && badge.includes('2'), `contador del carrito: "${badge}"`);
});
await check('Carrito: página /cart con líneas, cambiar cantidad y total', async () => {
  await page.goto(`http://${SLUG}.${HOST}/cart`, { waitUntil: 'networkidle' });
  await page.locator('[data-testid="cart-line"]').first().waitFor({ timeout: 15000 });
  assert(await page.locator('[data-testid="cart-line"]').count() === 2, 'no hay 2 líneas');
  await page.getByRole('button', { name: '增加一件' }).first().click();
  await page.waitForTimeout(1500);
  const total = await page.locator('[data-testid="cart-total"]').textContent();
  assert(total && /\d/.test(total), `total ilegible: ${total}`);
});
await check('Checkout: formulario, envío y confirmación con pago manual', async () => {
  await page.getByRole('link', { name: '去结算' }).click();
  await page.waitForURL('**/checkout');
  await page.locator('#coNombre').waitFor({ timeout: 15000 });
  await page.fill('#coNombre', '张');
  await page.fill('#coApellidos', '三');
  await page.fill('#coCorreo', `comprador-${STAMP}@test.local`);
  await page.fill('#coTelefono', '13800138000');
  await page.fill('#coDireccion', '中山路 88 号');
  await page.fill('#coCiudad', '上海');
  await page.selectOption('#coPais', 'CN');
  await page.getByRole('button', { name: '提交订单' }).click();
  await page.waitForURL('**/gracias?pedido=*', { timeout: 30000 });
  await page.locator('[data-testid="order-code"]').waitFor({ timeout: 15000 });
  ORDER_CODE = (await page.locator('[data-testid="order-code"]').textContent()) || '';
  assert(ORDER_CODE.length > 3, `código de pedido: "${ORDER_CODE}"`);
  assert((await page.content()).includes('下单成功！'), 'sin mensaje de confirmación');
});
await check('Fase 3: el pedido llega al panel del dueño (PaymentAuthorized, canal propio)', async () => {
  const login = await fetch(API + '/admin-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: `mutation { login(username:"${EMAIL}", password:"${PASS}") { __typename } }` }),
  });
  const bearer = login.headers.get('vendure-auth-token');
  assert(bearer, 'sin token de dueño');
  const r = await fetch(API + '/admin-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}`, 'vendure-token': SLUG },
    body: JSON.stringify({ query: '{ orders { totalItems items { code state totalWithTax } } }' }),
  });
  const orders = (await r.json()).data.orders;
  assert(orders.totalItems >= 1, `pedidos del dueño: ${orders.totalItems}`);
  const mine = orders.items.find((o) => o.code === ORDER_CODE);
  assert(mine, `el pedido ${ORDER_CODE} no aparece en el canal`);
  assert(mine.state === 'PaymentAuthorized', `estado ${mine.state}`);
  assert(mine.totalWithTax > 0, 'total 0');
});
await check('Fase 3: el pedido NO se filtra a otros canales (aislamiento)', async () => {
  const login = await fetch(API + '/admin-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'mutation { login(username:"superadmin",password:"superadmin"){ __typename } }' }),
  });
  const bearer = login.headers.get('vendure-auth-token');
  const r = await fetch(API + '/admin-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}`, 'vendure-token': 'qingzhu' },
    body: JSON.stringify({ query: '{ orders { items { code } } }' }),
  });
  const codes = (await r.json()).data.orders.items.map((o) => o.code);
  assert(!codes.includes(ORDER_CODE), 'el pedido aparece en qingzhu');
});

// ---------- 6. FASE 7: CAPA AGÉNTICA (MCP) ----------
const mcp = async (method, params, auth) => {
  const r = await fetch(BASE + '/api/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(auth ? { authorization: 'Basic ' + Buffer.from(auth).toString('base64') } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  return { status: r.status, body: await r.json() };
};
const OWNER_AUTH = `${EMAIL}:${PASS}`;

await check('MCP: initialize y tools/list con credenciales del dueño', async () => {
  const init = await mcp('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'prueba', version: '0' } });
  assert(init.body.result?.serverInfo?.name === 'fabrica-tiendas-mcp', 'initialize raro');
  const tools = await mcp('tools/list', {}, OWNER_AUTH);
  const names = tools.body.result?.tools?.map(t => t.name) || [];
  for (const t of ['info_tienda', 'ver_catalogo', 'ver_pedidos', 'cambiar_precio', 'ajustar_stock']) {
    assert(names.includes(t), `falta herramienta ${t}`);
  }
});
await check('MCP: sin credenciales o con clave mala → 401', async () => {
  const anon = await mcp('tools/list', {});
  assert(anon.status === 401, `anónimo dio ${anon.status}`);
  const bad = await mcp('tools/list', {}, `${EMAIL}:clave-incorrecta`);
  assert(bad.status === 401, `clave mala dio ${bad.status}`);
});
await check('MCP: el agente lee catálogo y pedidos de SU tienda', async () => {
  const cat = await mcp('tools/call', { name: 'ver_catalogo', arguments: {} }, OWNER_AUTH);
  const items = JSON.parse(cat.body.result.content[0].text);
  assert(items.length === 4, `catálogo con ${items.length} items`);
  assert(items.every(i => i.sku.startsWith(SLUG)), 'SKUs de otra tienda');
  const ped = await mcp('tools/call', { name: 'ver_pedidos', arguments: {} }, OWNER_AUTH);
  const pedidos = JSON.parse(ped.body.result.content[0].text);
  assert(pedidos.some(p => p.codigo === ORDER_CODE && p.estado === 'PaymentAuthorized'), `no aparece el pedido ${ORDER_CODE}`);
  const info = await mcp('tools/call', { name: 'info_tienda', arguments: {} }, OWNER_AUTH);
  const tienda = JSON.parse(info.body.result.content[0].text);
  assert(tienda.slug === SLUG && tienda.es_demo === true, `info_tienda: ${info.body.result.content[0].text}`);
});
await check('MCP: cambiar precio y stock se refleja en la tienda pública', async () => {
  const sku = `${SLUG}-producto-estrella`;
  const precio = await mcp('tools/call', { name: 'cambiar_precio', arguments: { sku, precio_usd: 42.5 } }, OWNER_AUTH);
  assert(JSON.parse(precio.body.result.content[0].text).ok === true, 'cambiar_precio falló');
  const stock = await mcp('tools/call', { name: 'ajustar_stock', arguments: { sku, unidades: 7 } }, OWNER_AUTH);
  assert(JSON.parse(stock.body.result.content[0].text).ok === true, 'ajustar_stock falló');
  const r = await fetch(API + '/shop-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'vendure-token': SLUG },
    body: JSON.stringify({ query: '{ products(options:{take:20}) { items { slug variants { sku priceWithTax } } } }' }),
  });
  const prods = (await r.json()).data.products.items;
  const variant = prods.flatMap(p => p.variants).find(v => v.sku === sku);
  assert(variant, 'variante no encontrada en shop-api');
  assert(variant.priceWithTax === 4250, `precio público ${variant.priceWithTax}, esperaba 4250`);
});
await check('MCP: la herramienta rechaza SKU de otra tienda (aislamiento)', async () => {
  const ajeno = await mcp('tools/call', { name: 'cambiar_precio', arguments: { sku: 'qingzhu-guibeizhu', precio_usd: 1 } }, OWNER_AUTH);
  assert(ajeno.body.result.isError === true, 'debió fallar con SKU ajeno');
  const vr = await fetch(API + '/shop-api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'vendure-token': 'qingzhu' },
    body: JSON.stringify({ query: '{ products { items { variants { sku priceWithTax } } } }' }),
  });
  const v = (await vr.json()).data.products.items.flatMap(p => p.variants).find(x => x.sku === 'qingzhu-guibeizhu');
  assert(v && v.priceWithTax === 12800, `el precio de qingzhu cambió: ${v?.priceWithTax}`);
});

// ---------- 7. IDIOMA DEL VISITANTE ----------
await check('Idioma: el visitante cambia a español y vuelve al chino', async () => {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const zh = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ');
  assert(zh.includes('生成你的完整商店'), `no arranca en chino: ${zh}`);

  await page.getByRole('button', { name: 'Español' }).first().click();
  await page.waitForTimeout(2200);
  const es = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ');
  assert(/Tu tienda online/.test(es), `no cambió a español: ${es}`);
  assert((await page.evaluate(() => document.documentElement.lang)) === 'es', 'el atributo lang no cambió');

  // El asistente también, incluidas las etiquetas de la encuesta.
  await page.goto(BASE + '/demo', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  assert((await page.locator('h1').first().innerText()).includes('¿Qué quieres vender?'), 'el asistente sigue en chino');
  assert(await page.getByRole('button', { name: 'Moda y accesorios' }).count() > 0, 'la encuesta sigue en chino');

  await page.getByRole('button', { name: '中文' }).first().click();
  await page.waitForTimeout(2200);
  assert((await page.locator('h1').first().innerText()).includes('你想卖什么'), 'no volvió al chino');
});
await check('Idioma: la TIENDA no sigue la preferencia del visitante', async () => {
  // La tienda es del comerciante y de su mercado: se sirve en chino aunque
  // el visitante tenga la fábrica en español.
  await ctx.addCookies([{ name: 'fabrica_idioma', value: 'es', domain: 'localhost', path: '/' }]);
  await page.goto(`http://qingzhu.${HOST}/`, { waitUntil: 'networkidle' });
  const body = await page.content();
  assert(body.includes('欢迎来到'), 'la tienda cambió de idioma con la cookie del visitante');
  assert(body.includes('加入购物车'), 'los botones de la tienda cambiaron de idioma');
  await ctx.clearCookies();
});

await browser.close();

let fails = 0;
console.log('\n================= RESULTADOS =================');
for (const [st, name] of results) {
  if (st === 'FAIL') fails++;
  console.log(`${st === 'PASS' ? '✅' : '❌'} ${name}`);
}
console.log(`==============================================`);
console.log(`${results.length - fails}/${results.length} pruebas pasaron`);
process.exit(fails ? 1 : 0);
