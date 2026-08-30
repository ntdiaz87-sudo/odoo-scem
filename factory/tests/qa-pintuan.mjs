/**
 * Batería 拼团 — compra en grupo de punta a punta:
 * el comerciante lo activa en un producto; A abre grupo y compra al precio
 * de grupo; comparte el enlace; B se une por el enlace y compra; el grupo
 * queda completo y el panel se lo dice al comerciante; quien compra sin
 * grupo paga el precio normal.
 *
 * Uso: node tests/qa-pintuan.mjs   (réplica local: web 8300, vendure 3000)
 */
import { chromium } from 'playwright';
const BASE='http://localhost:8300', HOST='localhost:8300';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const correo=`pt-${R}@t.local`;
const ok=[], ko=[];
const check=(n,c,d='')=> (c?ok:ko).push(n+(d?` — ${d}`:''));

const ip=`10.227.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const j=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`Pintuan ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:correo,ownerPassword:CLAVE})})).json();
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,90)));

// --- el comerciante activa el 拼团: 2 personas, 20 %, 24 h ---
await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',correo); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:20000});
await p.goto(BASE+'/panel/productos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/productos/**');
await p.fill('#ptTamano','2'); await p.fill('#ptPct','20'); await p.fill('#ptHoras','24');
await p.locator('#ptTamano').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForSelector('.pn-ok, .fh-aviso',{timeout:30000});
check('El comerciante guarda el 拼团 del producto', (await p.locator('.pn-ok').count())>=1);

async function movil(){return await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();}
async function checkout(c,mail){
  await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
  await c.locator('#coNombre').waitFor({timeout:20000});
  await c.fill('#coNombre','团'); await c.fill('#coApellidos','友');
  await c.fill('#coCorreo',mail); await c.fill('#coTelefono','13600136000');
  await c.fill('#coDireccion','建国路 1 号'); await c.fill('#coCiudad','深圳');
  await c.selectOption('#coPais','CN');
  await c.getByRole('button',{name:'提交订单'}).click();
  await c.waitForURL('**/gracias?pedido=*',{timeout:40000});
}

// --- A abre el grupo ---
const a=await movil();
await a.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
const btnA=a.locator('.st-pt-btn').first();
check('La tarjeta enseña el botón de 拼团 con su precio', (await btnA.count())===1, await btnA.innerText().catch(()=>'') );
await btnA.click();
await a.waitForURL('**/cart',{timeout:30000});
await a.locator('.st-fila--desc').first().waitFor({timeout:15000}).catch(()=>{});
const descA=await a.locator('.st-fila--desc').count();
check('El carrito de A lleva la rebaja del grupo', descA>=1);
await checkout(a,`a-${R}@t.local`);
await a.locator('[data-testid=pt-compartir]').waitFor({timeout:15000}).catch(()=>{});
check('Tras pagar, A ve el bloque de compartir', (await a.locator('[data-testid=pt-compartir]').count())===1);
const textoA=await a.locator('[data-testid=pt-compartir]').innerText().catch(()=>'');
check('…con el progreso 1/2', /1\/2|1 de 2|1 of 2/.test(textoA), textoA.slice(0,80));
const enlace=await a.locator('.st-pt-enlace').innerText();
const codigo=(enlace.match(/g=(\w+)/)||[])[1];
check('El enlace de compartir lleva el código del grupo', Boolean(codigo), enlace);

// --- B se une por el enlace ---
const c2=await movil();
await c2.goto(`http://${slug}.${HOST}/?g=${codigo}`,{waitUntil:'networkidle'});
check('B ve el banner del grupo en marcha', (await c2.locator('.st-pt-banner').count())===1);
const btnB=c2.locator('.st-pt-btn').first();
const txtB=await btnB.innerText();
check('El botón para B es UNIRSE, no abrir', /参团|Unirme|Join/.test(txtB), txtB);
await btnB.click();
await c2.waitForURL('**/cart',{timeout:30000});
await checkout(c2,`b-${R}@t.local`);
await c2.locator('[data-testid=pt-compartir]').waitFor({timeout:15000}).catch(()=>{});
const textoB=await c2.locator('[data-testid=pt-compartir]').innerText().catch(()=>'');
check('B ve el grupo completo (2/2)', /2\/2|2 de 2|2 of 2/.test(textoB), textoB.slice(0,80));

// --- C compra SIN grupo: precio normal ---
const c3=await movil();
await c3.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
const tarjeta=c3.locator('.st-prod').filter({ has: c3.locator('.st-pt-btn') }).first();
await tarjeta.getByRole('button',{name:'加入购物车'}).click();
await c3.waitForTimeout(2200);
await c3.goto(`http://${slug}.${HOST}/cart`,{waitUntil:'networkidle'});
await c3.locator('#cupon').waitFor({timeout:15000});
check('Sin grupo NO hay rebaja', (await c3.locator('.st-fila--desc').count())===0);

// --- un código inventado no rompe la tienda ---
const c4=await movil();
await c4.goto(`http://${slug}.${HOST}/?g=noexiste`,{waitUntil:'networkidle'});
check('Un código falso no enseña banner ni rompe', (await c4.locator('.st-pt-banner').count())===0 && (await c4.locator('.st-prod').count())>0);

// --- aislamiento: otra tienda NO puede completar este grupo ---
// El código del grupo se ata al pedido con setOrderCustomFields, que cualquier
// comprador de CUALQUIER tienda puede llamar con el código que quiera. Si el
// conteo no filtrase por canal, un pedido ajeno haría 成团 aquí y el
// comerciante enviaría creyendo que hubo gente.
//
// OJO al escribir esta prueba: el intruso tiene que COMPRAR de verdad. Un
// pedido que se queda en el carrito está en AddingItems y no cuenta ni con el
// fallo presente, así que una versión más floja pasaba siempre y no protegía
// nada.
const otraIp=`10.228.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const jv=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':otraIp},
  body:JSON.stringify({storeName:`Vecina ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:`pv-${R}@t.local`,ownerPassword:CLAVE})})).json();
const slugVecino=jv.url.replace(/^https?:\/\//,'').split('.')[0];
const V='http://localhost:3000';
let authIntruso=null;
const tienda=async(tk,q,v,usarAuth=true)=>{
  const r=await fetch(V+'/shop-api',{method:'POST',
    headers:{'content-type':'application/json','vendure-token':tk,
      ...(usarAuth&&authIntruso?{authorization:`Bearer ${authIntruso}`}:{})},
    body:JSON.stringify({query:q,variables:v})});
  const nuevoAuth=r.headers.get('vendure-auth-token');
  if (nuevoAuth) authIntruso=nuevoAuth;
  return (await r.json());
};
const antes=(await tienda(slug,`query($c:String!){grupo(codigo:$c){unidos}}`,{c:codigo},false)).data.grupo.unidos;

// el intruso compra en SU tienda con NUESTRO código de grupo pegado
const pv=(await tienda(slugVecino,`{products(options:{take:1}){items{variants{id}}}}`)).data.products.items[0].variants[0].id;
await tienda(slugVecino,`mutation($id:ID!){addItemToOrder(productVariantId:$id,quantity:1){__typename}}`,{id:pv});
await tienda(slugVecino,`mutation($input:UpdateOrderInput!){setOrderCustomFields(input:$input){__typename}}`,{input:{customFields:{grupo:codigo}}});
await tienda(slugVecino,`mutation($input:CreateCustomerInput!){setCustomerForOrder(input:$input){__typename}}`,
  {input:{firstName:'入',lastName:'侵',emailAddress:`intruso-${R}@t.local`}});
await tienda(slugVecino,`mutation($input:CreateAddressInput!){setOrderShippingAddress(input:$input){__typename}}`,
  {input:{fullName:'入 侵',streetLine1:'别处 1 号',city:'北京',countryCode:'CN'}});
const envios=(await tienda(slugVecino,`{eligibleShippingMethods{id}}`)).data.eligibleShippingMethods;
if (envios[0]) await tienda(slugVecino,`mutation($id:[ID!]!){setOrderShippingMethod(shippingMethodId:$id){__typename}}`,{id:[envios[0].id]});
await tienda(slugVecino,`mutation{transitionOrderToState(state:"ArrangingPayment"){__typename}}`);
const pagos=(await tienda(slugVecino,`{eligiblePaymentMethods{code isEligible}}`)).data.eligiblePaymentMethods.filter(m=>m.isEligible);
const pago=await tienda(slugVecino,`mutation($input:PaymentInput!){addPaymentToOrder(input:$input){__typename ... on Order{state}}}`,
  {input:{method:pagos[0].code,metadata:{}}});
check('El pedido del intruso llegó a pagarse (si no, la prueba no prueba nada)',
  pago.data?.addPaymentToOrder?.__typename==='Order', JSON.stringify(pago.data?.addPaymentToOrder||pago.errors?.[0]?.message));

const despues=(await tienda(slug,`query($c:String!){grupo(codigo:$c){unidos}}`,{c:codigo},false)).data.grupo.unidos;
check('Un pedido pagado en OTRA tienda no cuenta para este grupo', antes===despues, `antes ${antes}, después ${despues}`);
const ajeno=(await tienda(slugVecino,`query($c:String!){grupo(codigo:$c){codigo}}`,{c:codigo})).data.grupo;
check('El grupo no se consulta desde otra tienda', ajeno===null);

// --- el panel le dice al comerciante que puede cobrar ---
await p.goto(BASE+'/panel/pedidos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/pedidos/**');
const estadoGrupo=await p.locator('.pn-pt-estado').innerText().catch(()=>'');
check('El pedido enseña el grupo COMPLETO (puedes cobrar)', /completo|成团|complete/i.test(estadoGrupo), estadoGrupo);

console.log('\n========== QA 拼团 ==========');
ok.forEach(n=>console.log('✅ '+n)); ko.forEach(n=>console.log('❌ '+n));
console.log(`errores JS: ${errs.length}${errs.length?' → '+errs[0]:''}`);
console.log('=============================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
await b.close();
process.exit(ko.length?1:0);
