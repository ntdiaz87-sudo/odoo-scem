/**
 * Batería del MCP unificado: el agente ve LO MISMO que el panel.
 *
 * Tras unificar, el MCP no habla con Vendure por su cuenta: usa la misma
 * capa de datos (lib/panel-datos) que el back office. Esta batería
 * comprueba justo eso —que las cifras coinciden— y las herramientas
 * nuevas (resumen, pedido, promociones, clientes, distribuidores, cobrar
 * y enviar).
 *
 * Uso: node tests/qa-mcp.mjs   (réplica local: web 8300, vendure 3000)
 */
import { chromium } from 'playwright';
const BASE='http://localhost:8300', HOST='localhost:8300';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const correo=`mc-${R}@t.local`;
const ok=[], ko=[];
const check=(n,c,d='')=> (c?ok:ko).push(n+(d?` — ${d}`:''));

const ip=`10.229.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const j=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`Mcp ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:correo,ownerPassword:CLAVE})})).json();
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];

const auth='Basic '+Buffer.from(`${correo}:${CLAVE}`).toString('base64');
const mcp=async(name,args={})=>{
  const r=await fetch(BASE+'/api/mcp',{method:'POST',
    headers:{'content-type':'application/json',authorization:auth},
    body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})});
  const b=await r.json();
  const txt=b.result?.content?.[0]?.text ?? '';
  return {error:b.result?.isError===true, txt, json:(()=>{try{return JSON.parse(txt);}catch{return null;}})()};
};

// un pedido de verdad
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const c=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await c.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
await c.getByRole('button',{name:'加入购物车'}).first().click();
await c.waitForTimeout(2200);
await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
await c.locator('#coNombre').waitFor({timeout:20000});
await c.fill('#coNombre','钱'); await c.fill('#coApellidos','七');
await c.fill('#coCorreo',`mcbuyer-${R}@t.local`); await c.fill('#coTelefono','13500135000');
await c.fill('#coDireccion','长安街 1 号'); await c.fill('#coCiudad','北京');
await c.selectOption('#coPais','CN');
await c.getByRole('button',{name:'提交订单'}).click();
await c.waitForURL('**/gracias?pedido=*',{timeout:40000});
const codigo=new URL(c.url()).searchParams.get('pedido');

// --- la moneda: el fallo que la unificación arregla ---
const info=await mcp('info_tienda');
check('info_tienda da la moneda REAL de la tienda', info.json?.moneda==='CNY', info.txt.slice(0,90));
const cat=await mcp('ver_catalogo');
check('El catálogo viene en yuanes, no en dólares',
  Array.isArray(cat.json) && cat.json.every(x=>x.precio?.moneda==='CNY') && cat.json[0].precio.texto.includes('¥'),
  cat.json?.[0]?.precio?.texto);

// --- herramientas nuevas ---
const res=await mcp('resumen_hoy');
check('resumen_hoy cuenta el pedido de hoy', res.json?.pedidos_hoy>=1 && res.json?.por_cobrar>=1, res.txt.slice(0,110));
const det=await mcp('ver_pedido',{codigo});
check('ver_pedido trae artículos y dirección',
  det.json?.articulos?.length>=1 && String(det.json?.entrega||'').includes('北京'), det.txt.slice(0,110));
check('…y dice que aún NO está cobrado', det.json?.cobrado===false);
const promos=await mcp('ver_promociones');
check('ver_promociones responde (aún vacío)', Array.isArray(promos.json), promos.txt.slice(0,60));
const clientes=await mcp('ver_clientes');
check('ver_clientes ve al comprador con su saldo',
  Array.isArray(clientes.json) && clientes.json.some(x=>x.correo===`mcbuyer-${R}@t.local` && x.saldo?.moneda==='CNY'));
const dis=await mcp('ver_distribuidores');
check('ver_distribuidores responde (aún vacío)', Array.isArray(dis.json));

// --- acciones con efecto ---
const cobro=await mcp('cobrar_pedido',{codigo});
check('cobrar_pedido cobra el pedido pendiente', cobro.json?.ok===true, cobro.txt.slice(0,90));
const envio=await mcp('enviar_pedido',{codigo,seguimiento:'SF123456789'});
check('enviar_pedido lo marca enviado con seguimiento', envio.json?.ok===true, envio.txt.slice(0,90));
const det2=await mcp('ver_pedido',{codigo});
check('El pedido queda cobrado y enviado', det2.json?.cobrado===true && det2.json?.enviado===true);
const malo=await mcp('cobrar_pedido',{codigo:'NOEXISTE'});
check('Un código de pedido inventado da error claro', malo.error===true && /No hay/.test(malo.txt), malo.txt.slice(0,70));

// --- coincide con lo que ve el comerciante en SU panel ---
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true})).newPage();
await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',correo); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:20000});
const cifras=await p.locator('.pn-cifra-v').allInnerTexts();
const res2=await mcp('resumen_hoy');
check('El agente y el panel cuentan lo MISMO (pedidos de hoy)',
  cifras[0]===String(res2.json?.pedidos_hoy), `panel=${cifras[0]} mcp=${res2.json?.pedidos_hoy}`);
check('…y los mismos ingresos de hoy',
  cifras[1]===res2.json?.ingresos_hoy?.texto, `panel=${cifras[1]} mcp=${res2.json?.ingresos_hoy?.texto}`);

console.log('\n========== QA MCP UNIFICADO ==========');
ok.forEach(n=>console.log('✅ '+n)); ko.forEach(n=>console.log('❌ '+n));
console.log('======================================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
await b.close();
process.exit(ko.length?1:0);
