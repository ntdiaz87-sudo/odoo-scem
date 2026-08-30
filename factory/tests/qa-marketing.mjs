/**
 * Batería Fase 3 — motor de marketing chino:
 *   优惠券 (cupón en el carrito), 秒杀 (rebaja automática con badge),
 *   分销 (enlace del distribuidor → pedido atribuido → comisión al cobrar).
 *
 * Uso: node tests/qa-marketing.mjs   (réplica local: web 8300, vendure 3000)
 */
import { chromium } from 'playwright';
const BASE='http://localhost:8300', HOST='localhost:8300';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const correo=`f3-${R}@t.local`;
const ok=[], ko=[];
const check=(n,c,d='')=> (c?ok:ko).push(n+(d?` — ${d}`:''));

const ip=`10.221.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const j=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`Fase3 ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:correo,ownerPassword:CLAVE})})).json();
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,90)));

// entrar al panel
await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',correo); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:20000});

// la pestaña de marketing existe y abre
await p.goto(BASE+'/panel/marketing',{waitUntil:'networkidle'});
check('La pantalla de marketing abre', await p.locator('.pn-h1').count()===1);

// --- crear un 优惠券 del 10% ---
const CUPON=`F3${R}`.toUpperCase();
await p.fill('#cuNombre','活动 '+R);
await p.fill('#cuCodigo',CUPON);
await p.fill('#cuValor','10');
await p.locator('#cuNombre').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(3000);
await p.reload({waitUntil:'networkidle'});
check('El cupón aparece en la lista de promociones',
  (await p.locator('.pn-mk-promo').count())>=1 && (await p.locator('body').innerText()).includes(CUPON));

// --- crear un 秒杀 del 20% sobre el primer producto ---
const fin=new Date(Date.now()+60*60*1000);
const local=`${fin.getFullYear()}-${String(fin.getMonth()+1).padStart(2,'0')}-${String(fin.getDate()).padStart(2,'0')}T${String(fin.getHours()).padStart(2,'0')}:${String(fin.getMinutes()).padStart(2,'0')}`;
await p.fill('#skNombre','秒杀 '+R);
await p.fill('#skPct','20');
await p.fill('#skTermina',local);
await p.locator('input[name=producto]').first().check({force:true});
await p.locator('#skNombre').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(3000);
await p.reload({waitUntil:'networkidle'});
check('El 秒杀 aparece en la lista', (await p.locator('.pn-mk-promo').count())>=2);

// --- alta de un 分销员 con 10% ---
await p.fill('#diNombre','小李');
await p.fill('#diCodigo','xiaoli'+R);
await p.fill('#diComision','10');
await p.locator('#diNombre').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(3000);
await p.reload({waitUntil:'networkidle'});
const enlace=await p.locator('.pn-tabla .pn-mk-codigo').first().innerText().catch(()=>'');
check('El distribuidor sale con su enlace ?d=', enlace.includes('?d=xiaoli'+R), enlace);

// --- el cliente llega POR el enlace del distribuidor ---
const c=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await c.goto(`http://${slug}.${HOST}/?d=xiaoli${R}`,{waitUntil:'networkidle'});

// 秒杀 visible en el escaparate
const badge=await c.locator('.st-sk-badge').count();
check('El escaparate enseña el badge de 秒杀', badge>=1, `${badge} badges`);
const tarjeta=c.locator('.st-prod').filter({ has: c.locator('.st-sk-badge') }).first();
const antes=await tarjeta.locator('.st-precio-antes').count();
check('El precio original sale tachado junto al rebajado', antes>=1);

// compra del producto en 秒杀
await tarjeta.getByRole('button',{name:'加入购物车'}).click();
await c.waitForTimeout(2500);

// --- carrito: el 秒杀 rebaja solo, y el cupón se aplica a mano ---
await c.goto(`http://${slug}.${HOST}/cart`,{waitUntil:'networkidle'});
await c.locator('#cupon').waitFor({timeout:20000});
const descuentosSk=await c.locator('.st-fila--desc').count();
check('El carrito enseña el descuento del 秒杀 sin cupón', descuentosSk>=1);

await c.fill('#cupon','NOEXISTE');
await c.locator('#cupon').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await c.waitForSelector('.st-cupon-mal',{timeout:15000}).catch(()=>{});
check('Un código falso se rechaza con aviso claro', (await c.locator('.st-cupon-mal').count())===1);

await c.fill('#cupon',CUPON);
await c.locator('#cupon').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await c.waitForSelector('.st-cupon-chip',{timeout:15000}).catch(()=>{});
check('El cupón bueno queda aplicado (chip visible)', (await c.locator('.st-cupon-chip').count())===1);
const filasDesc=await c.locator('.st-fila--desc').count();
check('Con cupón + 秒杀 hay dos líneas de descuento', filasDesc>=2, `${filasDesc} líneas`);

// --- checkout completo ---
await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
await c.locator('#coNombre').waitFor({timeout:20000});
check('El resumen del checkout arrastra los descuentos', (await c.locator('.st-fila--desc').count())>=1);
await c.fill('#coNombre','王'); await c.fill('#coApellidos','五');
await c.fill('#coCorreo',`cli3-${R}@t.local`); await c.fill('#coTelefono','13900139000');
await c.fill('#coDireccion','南京路 12 号'); await c.fill('#coCiudad','北京');
await c.selectOption('#coPais','CN');
await c.getByRole('button',{name:'提交订单'}).click();
await c.waitForURL('**/gracias?pedido=*',{timeout:40000});
check('El pedido con cupón, 秒杀 y distribuidor se confirma', true);

// --- panel: el pedido cuenta para el distribuidor; la comisión, al cobrar ---
await p.goto(BASE+'/panel/marketing',{waitUntil:'networkidle'});
let fila=await p.locator('.pn-tabla tbody tr').first().innerText();
check('El pedido queda atribuido al distribuidor', /\s1\s/.test(fila.replace(/\n/g,' ')), fila.replace(/\n/g,' | '));

await p.goto(BASE+'/panel/pedidos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/pedidos/**');
await p.locator('form:has(input[name=pagoId]) button').click();
await p.waitForSelector('.pn-ok, .fh-aviso',{timeout:30000});
await p.goto(BASE+'/panel/marketing',{waitUntil:'networkidle'});
fila=(await p.locator('.pn-tabla tbody tr').first().innerText()).replace(/\n/g,' | ');
const comisiones=fila.match(/¥[\d,.]+/g)||[];
const ultima=comisiones[comisiones.length-1]||'¥0';
check('Cobrado el pedido, la comisión deja de ser cero', ultima!=='¥0.00' && ultima!=='¥0', fila);

console.log('\n========== QA MARKETING (Fase 3) ==========');
ok.forEach(n=>console.log('✅ '+n)); ko.forEach(n=>console.log('❌ '+n));
console.log(`errores JS: ${errs.length}${errs.length?' → '+errs[0]:''}`);
console.log('===========================================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
await b.close();
process.exit(ko.length?1:0);
