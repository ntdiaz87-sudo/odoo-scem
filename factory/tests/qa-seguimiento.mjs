/**
 * Batería de la consulta pública de pedido: compra, cobro, envío con número
 * de seguimiento, y el comprador lo ve con código+correo. Con el correo
 * equivocado no ve nada, y la respuesta no confirma si el código existe.
 *
 * Uso: node tests/qa-seguimiento.mjs   (réplica local: web 8300, vendure 3000)
 */
import { chromium } from 'playwright';
const BASE='http://localhost:8300', HOST='localhost:8300';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const correo=`pe-${R}@t.local`, cliCorreo=`cli-pe-${R}@t.local`;
const ok=[], ko=[]; const check=(n,c,d='')=>(c?ok:ko).push(n+(d?` — ${d}`:''));
const ip=`10.230.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const j=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`Estado ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:correo,ownerPassword:CLAVE})})).json();
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await c.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
await c.locator('.st-prod').first().getByRole('button',{name:'加入购物车'}).click();
await c.waitForTimeout(2200);
await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
await c.locator('#coNombre').waitFor({timeout:20000});
await c.fill('#coNombre','李'); await c.fill('#coApellidos','四');
await c.fill('#coCorreo',cliCorreo); await c.fill('#coTelefono','13900139000');
await c.fill('#coDireccion','长安街 1 号'); await c.fill('#coCiudad','北京');
await c.selectOption('#coPais','CN');
await c.getByRole('button',{name:'提交订单'}).click();
await c.waitForURL('**/gracias?pedido=*',{timeout:40000});
const codigo=(await c.locator('[data-testid="order-code"]').textContent()).trim();

// el dueño cobra y envía con nº de seguimiento
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',correo); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:20000});
await p.goto(BASE+'/panel/pedidos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/pedidos/**');
const cobrar=p.locator('form:has(input[name=pagoId]) button');
if (await cobrar.count()) { await cobrar.click(); await p.waitForSelector('.pn-ok, .fh-aviso',{timeout:20000}); }
await p.reload({waitUntil:'networkidle'});
const seg=p.locator('input[name=seguimiento]');
if (await seg.count()) await seg.fill('SF123456789CN');
const enviar=p.locator('form:has(input[name=pedidoId]) button');
if (await enviar.count()) { await enviar.click(); await p.waitForSelector('.pn-ok, .fh-aviso',{timeout:25000}); }

// el comprador consulta
await c.goto(`http://${slug}.${HOST}/pedido`,{waitUntil:'networkidle'});
await c.locator('.st-consulta-form input').first().fill(codigo);
await c.locator('.st-consulta-form input[type=email]').fill(cliCorreo);
await c.locator('.st-consulta-form button').click();
await c.waitForTimeout(2500);
const txt=await c.locator('body').innerText();
check('El comprador ve el estado de su pedido', txt.includes(codigo));
check('Ve el número de seguimiento', txt.includes('SF123456789CN'));
check('El estado está en el idioma de la tienda', /已发货|已付款/.test(txt), (txt.match(/已[发付送]\S*/)||[]).join(' '));

// con el correo equivocado, nada
await c.reload({waitUntil:'networkidle'});
await c.locator('.st-consulta-form input').first().fill(codigo);
await c.locator('.st-consulta-form input[type=email]').fill('otro@t.local');
await c.locator('.st-consulta-form button').click();
await c.waitForTimeout(2000);
const txt2=await c.locator('body').innerText();
check('Con el correo equivocado NO enseña nada', !txt2.includes('SF123456789CN') && txt2.includes('没有找到'));

console.log('\n====== QA CONSULTA PÚBLICA DE PEDIDO ======');
ok.forEach(n=>console.log('✅ '+n)); ko.forEach(n=>console.log('❌ '+n));
console.log('===========================================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
await b.close(); process.exit(ko.length?1:0);
