/**
 * Batería de CRUCES: las funciones que nacieron por separado y tienen que
 * cuadrar juntas. Sin navegador — habla con el API directamente, así que es
 * barata y se puede correr a menudo.
 *
 * Hoy cubre 拼团 + 会员储值: el precio lo baja una promoción y el cobro lo hace
 * un método de pago que mira el total. Si alguien toca una de las dos y la
 * otra deja de cuadrar, el comprador paga de más o el método desaparece.
 *
 * Uso: node tests/qa-cruce.mjs   (réplica local: web 8300, vendure 3000)
 */
const BASE='http://localhost:8300', V='http://localhost:3000';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const ok=[], ko=[];
const check=(n,c,d='')=> (c?ok:ko).push(n+(d?` — ${d}`:''));

const ip=`10.242.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const j=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`Cruce ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:`cr-${R}@t.local`,ownerPassword:CLAVE})})).json();
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];

const login=await fetch(V+'/admin-api',{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({query:`mutation{login(username:"cr-${R}@t.local",password:"${CLAVE}"){__typename}}`})});
const tok=login.headers.get('vendure-auth-token');
const admin=async(q,v)=>(await (await fetch(V+'/admin-api',{method:'POST',
  headers:{'content-type':'application/json',authorization:`Bearer ${tok}`,'vendure-token':slug},
  body:JSON.stringify({query:q,variables:v})})).json());

// el comerciante enciende un 拼团 de 2 personas al 30 %
const prod=(await admin(`{products(options:{take:1}){items{id variants{id priceWithTax}}}}`)).data.products.items[0];
await admin(`mutation($input:UpdateProductInput!){updateProduct(input:$input){id}}`,
  {input:{id:prod.id,customFields:{ptTamano:2,ptPct:30,ptHoras:24}}});
await admin(`mutation($input:CreatePromotionInput!){createPromotion(input:$input){__typename ... on ErrorResult{message}}}`,
  {input:{enabled:true,translations:[{languageCode:'en',name:'拼团'}],
    conditions:[{code:'grupo-pintuan',arguments:[]}],actions:[{code:'descuento-pintuan',arguments:[]}]}});

let auth=null;
const shop=async(q,v)=>{
  const r=await fetch(V+'/shop-api',{method:'POST',
    headers:{'content-type':'application/json','vendure-token':slug,...(auth?{authorization:`Bearer ${auth}`}:{})},
    body:JSON.stringify({query:q,variables:v})});
  const a=r.headers.get('vendure-auth-token'); if(a) auth=a;
  return await r.json();
};

// un comprador con cuenta abre grupo y compra
const correo=`comprador-${R}@t.local`;
await shop(`mutation($input:RegisterCustomerInput!){registerCustomerAccount(input:$input){__typename}}`,
  {input:{emailAddress:correo,password:CLAVE,firstName:'团',lastName:'员'}});
const entro=await shop(`mutation($u:String!,$p:String!){login(username:$u,password:$p,rememberMe:true){__typename}}`,{u:correo,p:CLAVE});
check('El comprador se registra y entra sin verificar el correo', entro.data?.login?.__typename==='CurrentUser');

const g=await shop(`mutation($id:ID!){iniciarGrupo(productId:$id){codigo}}`,{id:prod.id});
await shop(`mutation($id:ID!){addItemToOrder(productVariantId:$id,quantity:1){__typename}}`,{id:prod.variants[0].id});
await shop(`mutation($input:UpdateOrderInput!){setOrderCustomFields(input:$input){__typename}}`,{input:{customFields:{grupo:g.data.iniciarGrupo.codigo}}});
const ln=await shop(`{activeOrder{lines{id}}}`);
// Vendure solo re-aplica promociones cuando el carrito cambia: se reajusta la
// línea a su MISMA cantidad para forzar el recálculo.
await shop(`mutation($l:ID!,$q:Int!){adjustOrderLine(orderLineId:$l,quantity:$q){__typename}}`,{l:ln.data.activeOrder.lines[0].id,q:1});
const conGrupo=(await shop(`{activeOrder{totalWithTax discounts{amountWithTax}}}`)).data.activeOrder;
const esperado=Math.round(prod.variants[0].priceWithTax*0.7);
check('El precio de 拼团 se aplica al pedido de un comprador con cuenta',
  conGrupo.discounts.length>0 && conGrupo.totalWithTax===esperado,
  `${prod.variants[0].priceWithTax} → ${conGrupo.totalWithTax} (esperado ${esperado})`);

// el comerciante le recarga saldo de sobra
const cli=(await admin(`{customers(options:{take:20,sort:{createdAt:DESC}}){items{id emailAddress}}}`)).data.customers.items.find(c=>c.emailAddress===correo);
check('El comprador con cuenta aparece como cliente de la tienda', Boolean(cli));
const cargado=conGrupo.totalWithTax+5000;
await admin(`mutation($input:UpdateCustomerInput!){updateCustomer(input:$input){__typename}}`,
  {input:{id:cli.id,customFields:{saldo:cargado}}});

await shop(`mutation($input:CreateCustomerInput!){setCustomerForOrder(input:$input){__typename}}`,
  {input:{firstName:'团',lastName:'员',emailAddress:correo}});
await shop(`mutation($input:CreateAddressInput!){setOrderShippingAddress(input:$input){__typename}}`,
  {input:{fullName:'团 员',streetLine1:'路 1 号',city:'北京',countryCode:'CN'}});
const env=(await shop(`{eligibleShippingMethods{id}}`)).data.eligibleShippingMethods;
if(env[0]) await shop(`mutation($id:[ID!]!){setOrderShippingMethod(shippingMethodId:$id){__typename}}`,{id:[env[0].id]});
await shop(`mutation{transitionOrderToState(state:"ArrangingPayment"){__typename}}`);

const metodos=(await shop(`{eligiblePaymentMethods{code isEligible}}`)).data.eligiblePaymentMethods;
check('Con saldo suficiente, el 储值 se ofrece sobre el precio ya rebajado',
  metodos.some(m=>m.code==='saldo-fabrica'&&m.isEligible), JSON.stringify(metodos.map(m=>`${m.code}:${m.isEligible}`)));

const pago=await shop(`mutation($input:PaymentInput!){addPaymentToOrder(input:$input){__typename ... on Order{state totalWithTax} ... on ErrorResult{message}}}`,
  {input:{method:'saldo-fabrica',metadata:{}}});
const pedido=pago.data?.addPaymentToOrder;
check('El pago con saldo queda liquidado al instante', pedido?.state==='PaymentSettled', JSON.stringify(pedido));

const saldoFinal=(await admin(`query($id:ID!){customer(id:$id){customFields{saldo}}}`,{id:cli.id})).data.customer.customFields.saldo;
check('El saldo baja EXACTAMENTE lo que costó el pedido rebajado',
  saldoFinal===cargado-(pedido?.totalWithTax??0), `${cargado} − ${pedido?.totalWithTax} = ${cargado-(pedido?.totalWithTax??0)}, quedó ${saldoFinal}`);

// y no se puede pagar dos veces con el mismo saldo
const otro=await shop(`mutation($input:PaymentInput!){addPaymentToOrder(input:$input){__typename ... on ErrorResult{message}}}`,
  {input:{method:'saldo-fabrica',metadata:{}}});
check('Un pedido ya pagado no acepta un segundo cobro del saldo',
  otro.data?.addPaymentToOrder?.__typename!=='Order' || otro.errors?.length>0,
  JSON.stringify(otro.data?.addPaymentToOrder||otro.errors?.[0]?.message));

console.log('\n========== QA CRUCES (拼团 + 储值) ==========');
ok.forEach(n=>console.log('✅ '+n)); ko.forEach(n=>console.log('❌ '+n));
console.log('============================================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
process.exit(ko.length?1:0);
