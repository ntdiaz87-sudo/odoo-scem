/**
 * Batería Fase 6 — retención: clientes y 会员储值.
 *
 * El comprador compra dos veces; el panel lo enseña como cliente con su
 * historial y segmentos (nuevo → repetidor); el comerciante le recarga
 * saldo, lo ve en el libro de movimientos y cobra un pedido contra el
 * saldo, que baja y deja rastro.
 *
 * Uso: node tests/qa-clientes.mjs   (réplica local: web 8300, vendure 3000)
 */
import { chromium } from 'playwright';
const BASE='http://localhost:8300', HOST='localhost:8300';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const correo=`f6-${R}@t.local`, comprador=`shopper-${R}@t.local`;
const ok=[], ko=[];
const check=(n,c,d='')=> (c?ok:ko).push(n+(d?` — ${d}`:''));

const ip=`10.224.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const j=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`Fase6 ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:correo,ownerPassword:CLAVE})})).json();
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

async function comprar(n=0){
  const c=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
  await c.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
  await c.getByRole('button',{name:'加入购物车'}).nth(n).click();
  await c.waitForTimeout(2200);
  await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
  await c.locator('#coNombre').waitFor({timeout:20000});
  await c.fill('#coNombre','赵'); await c.fill('#coApellidos','六');
  await c.fill('#coCorreo',comprador); await c.fill('#coTelefono','13700137000');
  await c.fill('#coDireccion','人民路 5 号'); await c.fill('#coCiudad','广州');
  await c.selectOption('#coPais','CN');
  await c.getByRole('button',{name:'提交订单'}).click();
  await c.waitForURL('**/gracias?pedido=*',{timeout:40000});
  await c.close();
}
await comprar(0);

const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,90)));
await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',correo); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:20000});

// --- lista de clientes y segmentos ---
await p.goto(BASE+'/panel/clientes',{waitUntil:'networkidle'});
let cuerpo=await p.locator('body').innerText();
check('El comprador aparece como cliente', cuerpo.includes(comprador));
await p.goto(BASE+'/panel/clientes?seg=nuevos',{waitUntil:'networkidle'});
check('Con 1 pedido está en "nuevos"', (await p.locator('body').innerText()).includes(comprador));
await p.goto(BASE+'/panel/clientes?seg=fieles',{waitUntil:'networkidle'});
check('Y aún NO en "repetidores"', !(await p.locator('body').innerText()).includes(comprador));

// --- ficha: recarga de 储值 ---
await p.goto(BASE+'/panel/clientes',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/clientes/**');
check('La ficha abre con saldo cero', (await p.locator('[data-testid=saldo]').innerText()).includes('0'));
await p.fill('#saldoImporte','500');
await p.fill('#saldoNota','微信转账充值');
await p.locator('#saldoImporte').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForSelector('.pn-ok, .fh-aviso',{timeout:30000});
await p.reload({waitUntil:'networkidle'});
const saldoTx=await p.locator('[data-testid=saldo]').innerText();
check('La recarga de ¥500 queda en el saldo', saldoTx.includes('500'), saldoTx);
check('…y en el libro de movimientos', (await p.locator('.pn-mov').count())===1);

// intentar descontar más de lo que hay
await p.fill('#saldoImporte','-9999');
await p.locator('#saldoImporte').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForSelector('.fh-aviso',{timeout:30000});
check('Descontar más del saldo se rechaza', (await p.locator('.fh-aviso').count())>=1);

// --- segunda compra: repetidor ---
await comprar(1);
await p.goto(BASE+'/panel/clientes?seg=fieles',{waitUntil:'networkidle'});
check('Con 2 pedidos pasa a "repetidores"', (await p.locator('body').innerText()).includes(comprador));

// --- cobrar el pedido nuevo contra el saldo ---
await p.goto(BASE+'/panel/pedidos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/pedidos/**');
const botonSaldo=p.getByRole('button',{name:/储值|saldo|balance/i});
check('El pedido ofrece cobrar con el saldo del cliente', (await botonSaldo.count())===1);
await botonSaldo.click();
// Al cobrar, el pago deja de estar pendiente y la sección del saldo
// desaparece entera: la señal de éxito es el "✓ cobrado" de las acciones.
await p.waitForSelector('.pn-hecho',{timeout:30000});
check('El cobro con saldo se confirma (pedido cobrado)', (await p.locator('.pn-hecho').count())>=1);

// el saldo bajó y el gasto quedó apuntado
await p.goto(BASE+'/panel/clientes',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/clientes/**');
const saldo2=await p.locator('[data-testid=saldo]').innerText();
check('El saldo bajó tras el cobro', !saldo2.includes('500'), saldo2);
cuerpo=await p.locator('body').innerText();
check('El gasto queda en el libro (订单)', cuerpo.includes('订单'));
check('El historial enseña los 2 pedidos', (await p.locator('.pn-lista .pn-fila').count())===2);

console.log('\n========== QA CLIENTES Y 储值 (Fase 6) ==========');
ok.forEach(n=>console.log('✅ '+n)); ko.forEach(n=>console.log('❌ '+n));
console.log(`errores JS: ${errs.length}${errs.length?' → '+errs[0]:''}`);
console.log('=================================================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
await b.close();
process.exit(ko.length?1:0);
