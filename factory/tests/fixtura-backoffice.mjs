/**
 * Fixtura de tests/qa-backoffice.mjs.
 *
 * Esa batería no crea nada por su cuenta: espera encontrar ya montados dos
 * dueños distintos y un pedido de verdad. Este guion los deja listos e
 * imprime la línea de entorno con la que hay que lanzarla:
 *
 *   node tests/fixtura-backoffice.mjs
 *   CORREO=... SLUG=... SLUG_AJENO=... ID_AJENO=... node tests/qa-backoffice.mjs
 *
 * Sin esas variables la batería falla con "expected string, got undefined",
 * que parece una regresión y no lo es.
 */
import { chromium } from 'playwright';
const BASE = 'http://localhost:8300';
const HOST = 'localhost:8300';
const S = Math.random().toString(36).slice(2, 6);
const CLAVE = 'clave-segura-123';

async function crear(nombre, correo) {
  const ip = `10.44.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
  const r = await fetch(BASE + '/api/demo', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ storeName: nombre, ownerEmail: correo, ownerPassword: CLAVE,
                           rubro: 'moda', estilo: 'calido', modo: 'claro' }),
  });
  const j = await r.json();
  if (!j.url) throw new Error('no se creó ' + nombre + ': ' + JSON.stringify(j));
  return j.url.replace(/^https?:\/\//, '').split('.')[0];
}

const CORREO = `bo-${S}@t.local`;
const slug = await crear(`BO ${S}`, CORREO);
const slugAjeno = await crear(`BO ajena ${S}`, `bo-ajeno-${S}@t.local`);

// un pedido real, comprado desde la tienda pública
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext()).newPage();
await p.goto(`http://${slug}.${HOST}/`, { waitUntil: 'networkidle' });
await p.getByRole('button', { name: '加入购物车' }).nth(0).click();
await p.waitForTimeout(2500);
await p.goto(`http://${slug}.${HOST}/checkout`, { waitUntil: 'networkidle' });
await p.locator('#coNombre').waitFor({ timeout: 20000 });
await p.fill('#coNombre', '张'); await p.fill('#coApellidos', '三');
await p.fill('#coCorreo', `comprador-${S}@t.local`); await p.fill('#coTelefono', '13800138000');
await p.fill('#coDireccion', '中山路 88 号'); await p.fill('#coCiudad', '上海');
await p.selectOption('#coPais', 'CN');
await p.getByRole('button', { name: '提交订单' }).click();
await p.waitForURL('**/gracias?pedido=*', { timeout: 40000 });

// un producto de la tienda ajena, para la prueba de aislamiento
const r = await fetch(BASE + '/shop-api', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'vendure-token': slugAjeno },
  body: JSON.stringify({ query: '{ products(options:{take:1}) { items { id } } }' }),
});
const idAjeno = (await r.json()).data.products.items[0].id;
await b.close();
console.log(`CORREO=${CORREO} SLUG=${slug} SLUG_AJENO=${slugAjeno} ID_AJENO=${idAjeno}`);
