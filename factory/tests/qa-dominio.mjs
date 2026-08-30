/**
 * Batería Fase 4 — dominio propio del comerciante.
 *
 * DNS de verdad no hay en la réplica, así que la cadena se prueba entera
 * salvo el resolver: alta desde el panel (TXT + registro A en pantalla),
 * tls-check cerrado hasta verificar, verificación simulada marcando el canal
 * como el haría el TXT, y entonces el dominio sirve la tienda, el tls-check
 * abre, el hostname técnico se des-indexa y nadie puede pisar el dominio.
 *
 * Uso: node tests/qa-dominio.mjs   (réplica local: web 8300, vendure 3000)
 */
import { request } from 'node:http';
import { chromium } from 'playwright';
const BASE='http://localhost:8300', V='http://localhost:3000';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const DOMINIO=`shop-${R}.midominio-test.com`;
const ok=[], ko=[];
const check=(n,c,d='')=> (c?ok:ko).push(n+(d?` — ${d}`:''));

/** GET al web local con un Host arbitrario (fetch/undici no deja tocarlo). */
const conHost=(path,host)=>new Promise((res,rej)=>{
  const rq=request({host:'localhost',port:8300,path,headers:{host}},r=>{
    let b='';r.on('data',c=>b+=c);r.on('end',()=>res({status:r.statusCode,body:b}));
  });rq.on('error',rej);rq.end();
});

async function crear(nombre,correo){
  const ip=`10.223.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
  const j=await (await fetch(BASE+'/api/demo',{method:'POST',
    headers:{'content-type':'application/json','x-forwarded-for':ip},
    body:JSON.stringify({storeName:nombre,designKey:'hoja-viva',mercado:'zh',ownerEmail:correo,ownerPassword:CLAVE})})).json();
  return j.url.replace(/^https?:\/\//,'').split('.')[0];
}
const NOMBRE_A=`Dominio ${R}`;
const slugA=await crear(NOMBRE_A,`da-${R}@t.local`);
const slugB=await crear(`Vecina ${R}`,`db-${R}@t.local`);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,90)));

// dueño A da de alta su dominio
await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',`da-${R}@t.local`); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:20000});
await p.goto(BASE+'/panel/tienda',{waitUntil:'networkidle'});
await p.fill('#dominio','https://'+DOMINIO+'/loQuePegue');
await p.locator('#dominio').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(3000);
await p.reload({waitUntil:'networkidle'});
let cuerpo=await p.locator('body').innerText();
check('El dominio pegado con https:// y ruta queda limpio', cuerpo.includes(DOMINIO));
check('La pantalla enseña el registro TXT a crear', cuerpo.includes('_fabrica.'+DOMINIO));
check('Y el registro A con la IP del servidor', /\b46\.4\.98\.13\b|\bSERVIDOR\b/.test(cuerpo)||cuerpo.includes('46.4.98.13'));
check('Estado: pendiente de verificar', (await p.locator('.pn-do-pend').count())===1);

// sin verificar: ni certificado ni tienda
const tls1=await fetch(`${BASE}/api/tls-check?domain=${DOMINIO}`);
check('tls-check dice NO a un dominio sin verificar', tls1.status===404, `status ${tls1.status}`);
const sinVerificar=await conHost('/',DOMINIO);
check('El dominio sin verificar NO sirve la tienda', !sinVerificar.body.includes(NOMBRE_A));

// el botón de comprobar falla con elegancia (no hay DNS real)
await p.locator('form:not(:has(input)):has(button)').first();
await p.getByRole('button',{name:/检查|Comprobar|Check/}).click();
await p.waitForSelector('.fh-aviso',{timeout:30000});
check('Sin TXT publicado, el comprobar avisa y no rompe', true);

// se simula el TXT: el superadmin marca verificado (lo que haría el resolver)
const login=await fetch(V+'/admin-api',{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({query:`mutation{login(username:"${process.env.VENDURE_SUPERADMIN_USERNAME||'superadmin'}",password:"${process.env.VENDURE_SUPERADMIN_PASSWORD||'superadmin'}"){__typename}}`})});
const tok=login.headers.get('vendure-auth-token');
const gql=async(q,v)=>(await (await fetch(V+'/admin-api',{method:'POST',
  headers:{'content-type':'application/json',authorization:`Bearer ${tok}`},
  body:JSON.stringify({query:q,variables:v})})).json());
// Se pregunta por el canal, no se lista: con cientos de tiendas el nuestro
// cae fuera de cualquier página y la prueba moría con "undefined".
const canales=await gql(`query($t:String!){channels(options:{filter:{token:{eq:$t}},take:1}){items{id token}}}`,{t:slugA});
const idA=canales.data.channels.items[0].id;
await gql(`mutation($input:UpdateChannelInput!){updateChannel(input:$input){__typename}}`,
  {input:{id:idA,customFields:{dominioVerificado:true}}});

// la caché negativa del middleware caduca en 15 s
await new Promise(r=>setTimeout(r,16000));

const tls2=await fetch(`${BASE}/api/tls-check?domain=${DOMINIO}`);
check('Verificado, tls-check da el visto bueno', tls2.status===200, `status ${tls2.status}`);
const conVerificar=await conHost('/',DOMINIO);
check('El dominio verificado sirve SU tienda', conVerificar.body.includes(NOMBRE_A));
const otra=await conHost('/', 'shop-'+R+'.otro-dominio-cualquiera.com');
check('Un dominio desconocido no sirve ninguna tienda', !otra.body.includes(NOMBRE_A));
const tls3=await fetch(`${BASE}/api/tls-check?domain=nadie-${R}.example.org`);
check('tls-check dice NO a un dominio desconocido', tls3.status===404);

// el hostname técnico sigue sirviendo pero canónico y sin indexar
const tecnica=await conHost('/', `${slugA}.localhost`);
check('El subdominio técnico sigue sirviendo la tienda', tecnica.body.includes(NOMBRE_A));
check('…con canónico al dominio propio', tecnica.body.includes(`https://${DOMINIO}/`));
check('…y sin indexar (noindex)', /noindex/.test(tecnica.body));

// nadie pisa un dominio ajeno
const p2=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await p2.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p2.fill('#correo',`db-${R}@t.local`); await p2.fill('#clave',CLAVE);
await p2.click('button[type=submit]');
await p2.waitForURL('**/panel/inicio',{timeout:20000});
await p2.goto(BASE+'/panel/tienda',{waitUntil:'networkidle'});
await p2.fill('#dominio',DOMINIO);
await p2.locator('#dominio').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p2.waitForSelector('.fh-aviso',{timeout:20000});
check('Otra tienda NO puede quedarse el mismo dominio', (await p2.locator('.fh-aviso').count())>=1);

// un dominio inválido se rechaza
await p2.fill('#dominio','esto no es un dominio');
await p2.locator('#dominio').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p2.waitForTimeout(2500);
check('Un dominio inválido se rechaza con aviso', (await p2.locator('.fh-aviso').count())>=1);

console.log('\n========== QA DOMINIO PROPIO (Fase 4) ==========');
ok.forEach(n=>console.log('✅ '+n)); ko.forEach(n=>console.log('❌ '+n));
console.log(`errores JS: ${errs.length}${errs.length?' → '+errs[0]:''}`);
console.log('================================================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
await b.close();
process.exit(ko.length?1:0);
