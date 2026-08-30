/**
 * Batería de variantes y envío: el producto con 颜色×尺码 desde el panel, el
 * precio por variante, la tarifa de envío del comerciante, y la compra del
 * cliente con todo aplicado hasta el pedido en el panel.
 *
 * Uso: node tests/qa-pedidos.mjs   (réplica local: web 8300, vendure 3000)
 */
import { chromium } from 'playwright';
const BASE='http://localhost:8300', HOST='localhost:8300';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const correo=`f2-${R}@t.local`;
const ok=[], ko=[];
const check=(n,c,d='')=> (c?ok:ko).push(n+(d?` — ${d}`:''));

const ip=`10.220.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const j=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`Fase2 ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:correo,ownerPassword:CLAVE})})).json();
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,90)));

// entrar
await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',correo); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:20000});

// --- crear variantes 颜色: 红/蓝 × 尺码: S/M ---
await p.goto(BASE+'/panel/productos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/productos/**');
await p.fill('#grupo1nombre','颜色');
await p.fill('#grupo1valores','红, 蓝');
await p.fill('#grupo2nombre','尺码');
await p.fill('#grupo2valores','S, M');
await p.locator('#grupo1nombre').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(4000);
await p.reload({waitUntil:'networkidle'});
const filas=await p.locator('.pn-variantes li').count();
check('4 variantes generadas (2 colores × 2 tallas)', filas===4, `hay ${filas}`);

// cambiar el precio de una variante
if (filas===4) {
  const inputs=p.locator('.pn-variantes input[name^="precio-"]');
  await inputs.nth(1).fill('159.00');
  await p.locator('.pn-form button[type=submit]').first().click();
  await p.waitForSelector('.pn-ok, .fh-aviso',{timeout:30000});
  await p.reload({waitUntil:'networkidle'});
  check('El precio por variante se guarda',
    (await p.locator('.pn-variantes input[name^="precio-"]').nth(1).inputValue())==='159.00');
}

// --- configurar envío: ¥8, gratis desde ¥300 ---
await p.goto(BASE+'/panel/tienda',{waitUntil:'networkidle'});
await p.fill('#envioTarifa','8.00');
await p.fill('#envioGratisDesde','300.00');
await p.locator('#envioTarifa').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(3500);
const okEnvio=await p.locator('.pn-ok').count();
check('El envío se guarda desde el panel', okEnvio>0);

// --- el cliente compra una variante concreta ---
const c=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await c.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
// TODO se hace dentro de LA tarjeta con variantes: elegir chip en una tarjeta
// y comprar en otra fue el fallo de la primera versión de esta prueba.
const tarjeta=c.locator('.st-prod').filter({ has: c.locator('.st-variantes') }).first();
const chips=await tarjeta.locator('.st-variantes button').count();
check('La tarjeta enseña los chips de variantes', chips===4, `${chips} chips`);
// el orden del escaparate no tiene por qué ser el del panel: se busca el chip
// cuyo precio es el editado (159)
let precioElegido='';
for (let i=0;i<chips;i++){
  await tarjeta.locator('.st-variantes button').nth(i).click();
  await c.waitForTimeout(250);
  precioElegido=(await tarjeta.locator('.st-prod-p').innerText()).trim();
  if (precioElegido.includes('159')) break;
}
check('El precio cambia con la variante elegida', precioElegido.includes('159'), precioElegido);
await tarjeta.getByRole('button',{name:'加入购物车'}).click();
await c.waitForTimeout(2500);

// checkout: el envío del comerciante
await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
await c.locator('#coNombre').waitFor({timeout:20000});
const cuerpo=await c.locator('body').innerText();
check('El checkout enseña UNA tarifa de envío (la del dueño)', !cuerpo.includes('标准快递'), 'sin el método compartido');
check('Y es ¥8', /¥8\.00/.test(cuerpo), (cuerpo.match(/¥[\d.]+/g)||[]).join(' '));

await c.fill('#coNombre','张'); await c.fill('#coApellidos','三');
await c.fill('#coCorreo',`cli-${R}@t.local`); await c.fill('#coTelefono','13800138000');
await c.fill('#coDireccion','中山路 88 号'); await c.fill('#coCiudad','上海');
await c.selectOption('#coPais','CN');
await c.getByRole('button',{name:'提交订单'}).click();
await c.waitForURL('**/gracias?pedido=*',{timeout:40000});
check('El pedido con variante y envío propio se confirma', true);

// el pedido en el panel enseña la variante
await p.goto(BASE+'/panel/pedidos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/pedidos/**');
const detalle=await p.locator('body').innerText();
check('El panel enseña QUÉ variante se compró', /红|蓝/.test(detalle) && /[SM]/.test(detalle));

console.log('\n========== QA VARIANTES Y ENVÍO ==========');
ok.forEach(n=>console.log('✅ '+n)); ko.forEach(n=>console.log('❌ '+n));
console.log(`errores JS: ${errs.length}${errs.length?' → '+errs[0]:''}`);
console.log('==========================================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
await b.close();
process.exit(ko.length?1:0);
