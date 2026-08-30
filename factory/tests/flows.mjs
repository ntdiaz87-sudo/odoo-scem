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

/* Cada creación de tienda gasta cupo del límite anti-abuso (3 por IP y hora).
   Si la batería crea varias desde la misma IP, se corta a sí misma; y si se
   lanza dos veces en la misma hora, la segunda arranca con el cupo ya gastado
   por la primera. Por eso el navegador estrena IP en cada ejecución y las
   creaciones que no van por el asistente llevan la suya. */
/* Base aleatoria Y contador: el contador solo evita que dos creaciones de la
   MISMA vuelta compartan IP; sin base aleatoria, dos vueltas seguidas empiezan
   otra vez por la misma IP y la segunda arranca con el cupo ya gastado. */
let nIP = Math.floor(Math.random() * 250);
const ipSuelta = () => `198.51.100.${(nIP++ % 250) + 1}`; // rango distinto al de la prueba del cupo

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  extraHTTPHeaders: { 'x-forwarded-for': ipSuelta() },
});
const page = await ctx.newPage();

// ---------- 1. LANDING ----------
await check('Landing carga y muestra el mensaje principal', async () => {
  const r = await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  assert(r.status() === 200, `status ${r.status()}`);
  const h1 = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ').trim();
  assert(h1.includes('你的商店') && h1.includes('从这里开始'), `h1 distinto: "${h1}"`);
});
await check('Landing: las secciones del recorrido están todas', async () => {
  // Los titulares se parten en dos líneas, así que se comprueban por
  // fragmentos contiguos.
  for (const t of ['找到适合你的设计', '两种方式创建你的商店', '到处销售', '所有渠道同步', 'AI 商品工厂', '不是你一个人在运营']) {
    assert(await page.getByText(t, { exact: false }).first().isVisible(), `falta "${t}"`);
  }
});
await check('Landing: 4 planes con sus precios y el 0% de comisión', async () => {
  const body = await page.content();
  for (const t of ['体验版', '开店版', 'AI 商家版', '全渠道版', '¥199', '¥399', '¥699', '0% 平台交易佣金']) {
    assert(body.includes(t), `falta ${t}`);
  }
});
await check('Landing móvil: sin scroll horizontal', async () => {
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  assert(sw <= cw + 1, `scrollWidth ${sw} > clientWidth ${cw}`);
});
await check('Galería: 8 plantillas, cada una con previsualización y "usar"', async () => {
  const tarjetas = await page.locator('.v-tarjeta').count();
  assert(tarjetas === 8, `hay ${tarjetas} plantillas`);
  for (const n of ['LUMINA', 'NEO', 'ORIGIN', 'PURE', 'NOMAD', 'BLOOM', 'PAWS', 'HOMELY']) {
    assert((await page.content()).includes(n), `falta ${n}`);
  }
  const previas = await page.locator('a[href^="/templates/"]').count();
  const usos = await page.locator('a[href^="/demo?plantilla="]').count();
  assert(previas >= 8, `enlaces de previsualización: ${previas}`);
  assert(usos >= 8, `enlaces de "usar este diseño": ${usos}`);
});
await check('Galería: los escaparates son tiendas reales, con su catálogo', async () => {
  // Si esto falla, la galería ha vuelto a ser un mosaico de imágenes muertas.
  const body = await page.content();
  for (const t of ['羊绒针织衫', '头戴式降噪耳机', '云南日晒咖啡豆', '18K 金素圈戒指']) {
    assert(body.includes(t), `falta el producto ${t}`);
  }
  const escaparates = await page.locator('.e').count();
  assert(escaparates >= 8, `escaparates pintados: ${escaparates}`);
});
await check('Previsualización de plantilla: se abre y ofrece usarla', async () => {
  const r = await ctx.request.get(BASE + '/templates/neo');
  assert(r.status() === 200, `status ${r.status()}`);
  const cuerpo = await r.text();
  assert(cuerpo.includes('NEO'), 'no muestra la plantilla');
  assert(cuerpo.includes('/demo?plantilla=neo'), 'no enlaza al asistente con la plantilla');
});
await check('CTA principal lleva al asistente', async () => {
  await page.getByRole('link', { name: '免费创建商店' }).first().click();
  await page.waitForURL('**/demo');
  assert(await page.getByText('你想怎么开始？').isVisible(), 'el asistente no ofrece las dos vías');
});

// ---------- 2. ASISTENTE ----------
const STAMP = Math.random().toString(36).slice(2, 6);
const EMAIL = `owner-${STAMP}@test.local`;
const PASS = 'clave-segura-123';
const NAME = `Flujo Total ${STAMP}`;
const SLUG = `flujo-total-${STAMP}`;

await check('Asistente: la vía del diseño exclusivo propone 3 diseños', async () => {
  await page.getByRole('button', { name: 'AI 专属设计' }).click();
  // 'exact' importa: el botón de tema tiene el título 切换到深色 y también casaría.
  await page.getByRole('button', { name: '深色', exact: true }).click();
  await page.waitForTimeout(1200);
  await page.locator('.design-card').first().waitFor({ timeout: 20000 });
  const cards = await page.locator('.design-card').count();
  assert(cards === 3, `hay ${cards} propuestas`);
});
await check('Asistente: validación de nombre vacío', async () => {
  await page.getByRole('button', { name: /生成我的商店/ }).click();
  await page.waitForTimeout(500);
  assert((await page.content()).includes('请填写商店名称'), 'no mostró el error de validación');
});
await check('Asistente: al elegir un diseño exclusivo se muestra el reclamo', async () => {
  await page.locator('.design-card').first().click();
  await page.locator('.w-reclamo').waitFor({ timeout: 5000 });
  const txt = await page.locator('.w-reclamo').innerText();
  assert(txt.includes('只属于你'), `el reclamo no explica la exclusividad: ${txt}`);
  assert(txt.includes('DESIGN #'), 'el reclamo no muestra el identificador');
});
await check('Asistente: crear tienda con cuenta de dueño y diseño exclusivo', async () => {
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
  const res = await ctx.request.post(BASE + '/api/demo', {
    headers: { 'x-forwarded-for': ipSuelta() },
    data: { storeName: NAME, designKey: 'hoja-viva', ownerEmail: `dup-${STAMP}@test.local`, ownerPassword: PASS },
  });
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
    headers: { 'x-forwarded-for': ipSuelta() }, // IP fija = 429 a la cuarta vuelta del día
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
await check('El enlace del dueño lleva a SU back office, no a la consola de Vendure', async () => {
  const r = await ctx.request.get(BASE + '/panel');
  assert(r.status() === 200, `status ${r.status()}`);
  const cuerpo = await r.text();
  assert(cuerpo.includes('id="correo"') && cuerpo.includes('id="clave"'), 'la puerta del panel no pide credenciales');
});
await check('El panel de canales ya no está abierto a quien acierte el slug', async () => {
  const r = await ctx.request.get(`${BASE}/canales/${SLUG}`, { maxRedirects: 0 });
  assert(r.status() === 307 || r.status() === 302, `status ${r.status()} (debería redirigir a /panel)`);
  assert((r.headers()['location'] || '').includes('/panel'), `redirige a ${r.headers()['location']}`);
});
await check('Fase 1: correo repetido rechazado con aviso claro', async () => {
  const res = await ctx.request.post(BASE + '/api/demo', {
    headers: { 'x-forwarded-for': ipSuelta() },
    data: { storeName: 'Otra Tienda', designKey: 'hoja-viva', ownerEmail: EMAIL, ownerPassword: PASS },
  });
  assert(res.status() === 409, `status ${res.status()}`);
  assert((await res.json()).error.includes('已经有商店'), 'mensaje inesperado');
});
await check('Fase 1: límite anti-abuso del demo (429 a la cuarta)', async () => {
  // La prueba gasta su propio cupo desde una IP inventada, así no depende de
  // cuántas tiendas haya creado el resto de la batería. Reutiliza el correo
  // del dueño ya existente: el contador sube igual y el intento muere en el
  // 409 de correo repetido, sin dejar tiendas de más en la base.
  const ip = `203.0.113.${1 + Math.floor(Math.random() * 250)}`;
  const pedir = (n) => ctx.request.post(BASE + '/api/demo', {
    headers: { 'x-forwarded-for': ip },
    data: { storeName: `Cupo ${n}`, designKey: 'hoja-viva', ownerEmail: EMAIL, ownerPassword: PASS },
  });
  for (let n = 1; n <= 3; n++) {
    const r = await pedir(n);
    assert(r.status() === 409, `el intento ${n} debía morir en el correo repetido, dio ${r.status()}`);
  }
  const cuarta = await pedir(4);
  assert(cuarta.status() === 429, `status ${cuarta.status()}`);
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
await check('Menú móvil: tapa la página entera y no se derrama sobre el hero', async () => {
  // Este fallo se vio en un móvil de verdad: al abrir el menú, los enlaces
  // aparecían encima del hero, sin fondo. La causa es de libro y vale la pena
  // dejarla escrita: la cabecera lleva backdrop-filter, y eso la convierte en
  // bloque contenedor de sus hijos position:fixed, así que el panel se medía
  // contra la cabecera (67px de alto) y no contra la pantalla.
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.locator('.v-cab-menu').click();
  await page.locator('.v-cab-panel').waitFor({ timeout: 10000 });
  const m = await page.evaluate(() => {
    const el = document.querySelector('.v-cab-panel');
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const x = Math.round(r.x + r.width / 2);
    const tapa = [0.1, 0.35, 0.6, 0.85, 0.97].every(f => {
      const e = document.elementFromPoint(x, Math.round(r.y + r.height * f));
      return e && (e === el || el.contains(e));
    });
    const ultimo = [...el.querySelectorAll('a')].pop().getBoundingClientRect();
    return {
      alto: r.height,
      llegaAbajo: r.y + r.height >= window.innerHeight - 1,
      opaco: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && !/^rgba\(.*, 0\)$/.test(cs.backgroundColor),
      tapa,
      ultimoDentro: ultimo.bottom <= r.bottom + 1,
    };
  });
  assert(m.alto > 300, `el panel mide ${Math.round(m.alto)}px de alto`);
  assert(m.llegaAbajo, 'el panel no llega al fondo de la pantalla');
  assert(m.opaco, 'el panel no tiene fondo opaco: se ve la página por debajo');
  assert(m.tapa, 'hay puntos del panel donde se toca la página de detrás');
  assert(m.ultimoDentro, 'el último enlace se sale del panel');
});
await check('Idioma: el visitante cambia a español y vuelve al chino', async () => {
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const zh = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ');
  assert(zh.includes('你的商店') && zh.includes('从这里开始'), `no arranca en chino: ${zh}`);

  // El selector guarda la cookie y recarga. Esperar un tiempo fijo aquí hacía
  // la prueba dependiente de lo cargado que estuviera el servidor: se esperan
  // la recarga y el resultado, no un cronómetro.
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('button', { name: 'Español' }).first().click(),
  ]);
  await page.waitForFunction(() => document.documentElement.lang.startsWith('es'), null, { timeout: 20000 });
  const es = (await page.locator('h1').first().innerText()).replace(/\s+/g, ' ');
  assert(/Tu tienda empieza aqu/.test(es), `no cambió a español: ${es}`);
  assert((await page.evaluate(() => document.documentElement.lang)) === 'es', 'el atributo lang no cambió');

  // La galería también: las plantillas enseñan su catálogo en español.
  assert((await page.content()).includes('Jersey de cachemira'), 'la galería sigue en chino');

  // Y el asistente, incluidas las etiquetas de la encuesta.
  await page.goto(BASE + '/demo?modo=ai', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Moda y accesorios' }).first().waitFor({ timeout: 15000 });

  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('button', { name: '中文' }).first().click(),
  ]);
  await page.waitForFunction(() => document.documentElement.lang.startsWith('zh'), null, { timeout: 20000 });
  await page.getByText('你卖什么').first().waitFor({ timeout: 15000 });
});

// ---------- 8. VÍA DE PLANTILLA ----------
const STAMP2 = Math.random().toString(36).slice(2, 6);
await check('Plantilla: crear una tienda eligiendo LUMINA desde la galería', async () => {
  await page.goto(BASE + '/demo?plantilla=lumina', { waitUntil: 'networkidle' });
  await page.locator('.w-plantilla.is-on').first().waitFor({ timeout: 10000 });
  await page.fill('#storeName', `Plantilla ${STAMP2}`);
  await page.fill('#ownerEmail', `tpl-${STAMP2}@test.local`);
  await page.fill('#ownerPassword', PASS);
  await page.getByRole('button', { name: /生成我的商店/ }).click();
  await page.getByText('你的商店已上线！').waitFor({ timeout: 60000 });
});
await check('Plantilla: la tienda creada usa los colores y el catálogo de LUMINA', async () => {
  const r = await ctx.request.post(BASE + '/shop-api', {
    headers: { 'content-type': 'application/json', 'vendure-token': `plantilla-${STAMP2}` },
    data: { query: '{ activeChannel { customFields { design displayName } } }' },
  });
  const cf = (await r.json()).data.activeChannel.customFields;
  assert(cf.design.includes('tpl-lumina'), `el diseño guardado no es la plantilla: ${cf.design.slice(0, 80)}`);
});
await check('Plantilla: es REUTILIZABLE — una segunda tienda puede elegir la misma', async () => {
  // Esto es lo que separa una plantilla de un diseño exclusivo. Si el registro
  // de unicidad la retirase, la galería dejaría de tener sentido.
  const r = await ctx.request.post(BASE + '/api/demo', {
    headers: { 'x-forwarded-for': ipSuelta() },
    data: {
      storeName: `Plantilla Bis ${STAMP2}`,
      design: JSON.parse((await (await ctx.request.post(BASE + '/shop-api', {
        headers: { 'content-type': 'application/json', 'vendure-token': `plantilla-${STAMP2}` },
        data: { query: '{ activeChannel { customFields { design } } }' },
      })).json()).data.activeChannel.customFields.design),
      ownerEmail: `tplbis-${STAMP2}@test.local`,
      ownerPassword: PASS,
    },
  });
  assert(r.status() === 200, `la segunda tienda con la misma plantilla falló: ${r.status()} ${(await r.text()).slice(0, 140)}`);
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
