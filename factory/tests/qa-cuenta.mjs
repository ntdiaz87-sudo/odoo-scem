/**
 * Batería de cuentas de comprador y pago con 会员储值.
 *
 * El comprador se registra en la tienda; el comerciante le recarga saldo;
 * el comprador ve su saldo y paga con él (el pedido queda COBRADO sin que
 * el comerciante toque nada); el saldo baja y queda el apunte. Sin cuenta
 * o sin saldo suficiente, el método NO aparece: nadie gasta saldo ajeno.
 *
 * Uso: node tests/qa-cuenta.mjs   (réplica local: web 8300, vendure 3000)
 */
import { chromium } from 'playwright';
const BASE='http://localhost:8300', HOST='localhost:8300';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const correo=`cu-${R}@t.local`, comprador=`buyer-${R}@t.local`, CLAVE_C='micuenta-123';
const ok=[], ko=[];
const check=(n,c,d='')=> (c?ok:ko).push(n+(d?` — ${d}`:''));

const ip=`10.228.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const j=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`Cuenta ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:correo,ownerPassword:CLAVE})})).json();
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const movil=async()=>await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();

// --- el comprador se registra desde la tienda ---
const c=await movil();
const errs=[]; c.on('pageerror',e=>errs.push(String(e).slice(0,90)));
await c.goto(`http://${slug}.${HOST}/cuenta`,{waitUntil:'networkidle'});
await c.getByRole('button',{name:/注册|Crear cuenta|Create account/}).click();
await c.fill('#acNombre','李明');
await c.fill('#acCorreo',comprador);
await c.fill('#acClave',CLAVE_C);
await c.locator('.st-ac-form button[type=submit]').click();
await c.locator('[data-testid=saldo-cliente]').waitFor({timeout:30000});
check('El comprador se registra y entra a su cuenta', true);
check('Empieza con saldo cero', (await c.locator('[data-testid=saldo-cliente]').innerText()).includes('0'));

// --- sin saldo, el método 储值 NO aparece ---
await c.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
await c.getByRole('button',{name:'加入购物车'}).first().click();
await c.waitForTimeout(2200);
await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
await c.locator('#coNombre').waitFor({timeout:20000});
check('Los datos del cliente vienen rellenos', (await c.locator('#coCorreo').inputValue())===comprador);
check('Sin saldo, el pago con 储值 no se ofrece', !(await c.locator('body').innerText()).includes('储值'));

// --- el comerciante le recarga ¥500 ---
const p=await movil();
await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',correo); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:20000});
await p.goto(BASE+'/panel/clientes',{waitUntil:'networkidle'});
check('El cliente registrado sale en el panel', (await p.locator('body').innerText()).includes(comprador));
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/clientes/**');
await p.fill('#saldoImporte','500'); await p.fill('#saldoNota','预付款');
await p.locator('#saldoImporte').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForSelector('.pn-ok, .fh-aviso',{timeout:30000});
check('El comerciante recarga ¥500', (await p.locator('.pn-ok').count())>=1);

// --- ahora sí: el comprador paga con su saldo ---
await c.goto(`http://${slug}.${HOST}/cuenta`,{waitUntil:'networkidle'});
const saldoVisto=await c.locator('[data-testid=saldo-cliente]').innerText();
check('El comprador ve su saldo recargado', saldoVisto.includes('500'), saldoVisto);
await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
await c.locator('#coNombre').waitFor({timeout:20000});
const opciones=await c.locator('.st-pago-op').allInnerTexts();
const idxSaldo=opciones.findIndex(x=>x.includes('储值'));
check('Con saldo suficiente, el método 储值 aparece', idxSaldo>=0, opciones.join(' | '));
if (idxSaldo>=0) await c.locator('.st-pago-op input[type=radio]').nth(idxSaldo).check({force:true});
await c.fill('#coDireccion','和平路 9 号'); await c.fill('#coCiudad','天津');
await c.selectOption('#coPais','CN');
await c.getByRole('button',{name:'提交订单'}).click();
await c.waitForURL('**/gracias?pedido=*',{timeout:40000});
check('El pedido pagado con saldo se confirma', true);

// --- el saldo bajó y el pedido queda COBRADO sin tocar el panel ---
await c.goto(`http://${slug}.${HOST}/cuenta`,{waitUntil:'networkidle'});
const saldo2=await c.locator('[data-testid=saldo-cliente]').innerText();
check('El saldo bajó tras pagar', !saldo2.includes('500.00'), saldo2);
check('El pedido aparece en su cuenta', (await c.locator('.st-ac-pedido').count())>=1);

await p.goto(BASE+'/panel/pedidos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/pedidos/**');
const detalle=await p.locator('body').innerText();
check('El panel lo ve ya cobrado (no hay que liquidarlo)', (await p.locator('.pn-hecho').count())>=1, detalle.slice(0,60));

// --- un segundo pedido que supera el saldo no ofrece el método ---
await c.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
for (let i=0;i<4;i++){ await c.getByRole('button',{name:'加入购物车'}).nth(i%2).click(); await c.waitForTimeout(900); }
await c.goto(`http://${slug}.${HOST}/cart`,{waitUntil:'networkidle'});
await c.locator('#cupon').waitFor({timeout:15000});
// se sube la cantidad hasta pasar el saldo restante
for (let i=0;i<6;i++){ await c.locator('.st-cant button').nth(1).click(); await c.waitForTimeout(700); }
await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
await c.locator('#coNombre').waitFor({timeout:20000});
check('Si el pedido supera el saldo, el método desaparece', !(await c.locator('body').innerText()).includes('储值'));

console.log('\n========== QA CUENTA Y PAGO CON 储值 ==========');
ok.forEach(n=>console.log('✅ '+n)); ko.forEach(n=>console.log('❌ '+n));
console.log(`errores JS: ${errs.length}${errs.length?' → '+errs[0]:''}`);
console.log('===============================================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
await b.close();
process.exit(ko.length?1:0);
