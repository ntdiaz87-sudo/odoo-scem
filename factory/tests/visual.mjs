/**
 * Pasada visual: monta una tienda con TODO encendido (variantes, 拼团, cupón,
 * 秒杀, distribuidor, cliente con saldo) y deja 14 capturas en disco — móvil y
 * escritorio, y el home en los tres idiomas.
 *
 * Las baterías dicen si algo funciona; esto dice si algo se VE bien, que no es
 * lo mismo: un botón que se parte en tres renglones pasa todas las pruebas.
 *
 *   node tests/visual.mjs
 *   → /tmp/.../visual2/*.png  (la ruta se imprime al terminar)
 */
import { chromium } from 'playwright';
const DIR='/tmp/claude-0/-home-user-odoo-scem/c259b566-d527-5046-bca3-1a88ef0768e7/scratchpad/visual2';
const BASE='http://localhost:8300', HOST='localhost:8300';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const correo=`qa-${R}@t.local`;
const ip=`10.230.9.${Math.floor(Math.random()*250)}`;
const j=await (await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`美店 ${R}`,designKey:'hoja-viva',mercado:'zh',ownerEmail:correo,ownerPassword:CLAVE})})).json();
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];
console.log('SLUG='+slug, 'CORREO='+correo);

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:'zh-CN',extraHTTPHeaders:{'accept-language':'zh-CN,zh;q=0.9'}});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));

await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',correo); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:25000});

// producto: variantes + 拼团
await p.goto(BASE+'/panel/productos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/productos/**');
await p.fill('#ptTamano','3'); await p.fill('#ptPct','25'); await p.fill('#ptHoras','24');
await p.locator('#ptTamano').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(2500);
await p.fill('#grupo1nombre','颜色'); await p.fill('#grupo1valores','红, 蓝');
await p.locator('#grupo1nombre').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(4000);
await p.reload({waitUntil:'networkidle'});
await p.screenshot({path:DIR+'/1-producto.png',fullPage:true});

// marketing
await p.goto(BASE+'/panel/marketing',{waitUntil:'networkidle'});
await p.fill('#cuNombre','双十一'); await p.fill('#cuCodigo','SHUANG11'); await p.fill('#cuValor','15');
await p.locator('#cuNombre').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(2500);
const fin=new Date(Date.now()+7200e3);
const loc=`${fin.getFullYear()}-${String(fin.getMonth()+1).padStart(2,'0')}-${String(fin.getDate()).padStart(2,'0')}T${String(fin.getHours()).padStart(2,'0')}:${String(fin.getMinutes()).padStart(2,'0')}`;
await p.fill('#skNombre','晚八点秒杀'); await p.fill('#skPct','30'); await p.fill('#skTermina',loc);
await p.locator('input[name=producto]').nth(1).check({force:true});
await p.locator('#skNombre').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(2500);
await p.fill('#diNombre','小李'); await p.fill('#diCodigo','xiaoli'); await p.fill('#diComision','12');
await p.locator('#diNombre').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(2500);
await p.reload({waitUntil:'networkidle'});
await p.screenshot({path:DIR+'/2-marketing.png',fullPage:true});

// envío
await p.goto(BASE+'/panel/tienda',{waitUntil:'networkidle'});
await p.fill('#envioTarifa','8.00'); await p.fill('#envioGratisDesde','300.00');
await p.locator('#envioTarifa').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await p.waitForTimeout(2500);

// tienda: home
const c=await ctx.newPage();
await c.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
await c.screenshot({path:DIR+'/3-tienda-home.png'});
await c.screenshot({path:DIR+'/3b-tienda-completa.png',fullPage:true});

// comprar con cupón
const tar=c.locator('.st-prod').filter({ has: c.locator('.st-variantes') }).first();
await tar.getByRole('button',{name:'加入购物车'}).click();
await c.waitForTimeout(2200);
await c.goto(`http://${slug}.${HOST}/cart`,{waitUntil:'networkidle'});
await c.locator('#cupon').waitFor({timeout:15000});
await c.fill('#cupon','SHUANG11');
await c.locator('#cupon').evaluate(el=>el.closest('form').querySelector('button[type=submit]').click());
await c.waitForSelector('.st-cupon-chip',{timeout:15000});
await c.screenshot({path:DIR+'/4-carrito.png',fullPage:true});
await c.goto(`http://${slug}.${HOST}/checkout`,{waitUntil:'networkidle'});
await c.locator('#coNombre').waitFor({timeout:20000});
await c.screenshot({path:DIR+'/5-checkout.png',fullPage:true});
await c.fill('#coNombre','孙'); await c.fill('#coApellidos','八');
await c.fill('#coCorreo',`qc-${R}@t.local`); await c.fill('#coTelefono','13400134000');
await c.fill('#coDireccion','西湖路 3 号'); await c.fill('#coCiudad','杭州');
await c.selectOption('#coPais','CN');
await c.getByRole('button',{name:'提交订单'}).click();
await c.waitForURL('**/gracias?pedido=*',{timeout:40000});
await c.screenshot({path:DIR+'/6-gracias.png',fullPage:true});

// pedido en el panel + inicio
await p.goto(BASE+'/panel/inicio',{waitUntil:'networkidle'});
await p.screenshot({path:DIR+'/7-panel-inicio.png',fullPage:true});
await p.goto(BASE+'/panel/pedidos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/pedidos/**');
await p.screenshot({path:DIR+'/8-pedido.png',fullPage:true});

// cuenta del comprador
const c2=await ctx.newPage();
await c2.goto(`http://${slug}.${HOST}/cuenta`,{waitUntil:'networkidle'});
await c2.screenshot({path:DIR+'/9-cuenta.png',fullPage:true});

// escritorio: home de la fábrica en 3 idiomas
const esc=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,locale:'zh-CN'})).newPage();
for (const [lang,file] of [['zh','10-home-zh'],['es','11-home-es'],['en','12-home-en']]) {
  await esc.goto(BASE+'/',{waitUntil:'networkidle'});
  await esc.evaluate(l=>{document.cookie='fabrica_idioma='+l+';path=/';},lang);
  await esc.goto(BASE+'/',{waitUntil:'networkidle'});
  await esc.screenshot({path:`${DIR}/${file}.png`});
}
await esc.goto(BASE+'/panel',{waitUntil:'networkidle'});
await esc.fill('#correo',correo); await esc.fill('#clave',CLAVE);
await esc.click('button[type=submit]');
await esc.waitForURL('**/panel/inicio',{timeout:25000});
await esc.goto(BASE+'/panel/marketing',{waitUntil:'networkidle'});
await esc.screenshot({path:DIR+'/13-marketing-escritorio.png',fullPage:true});
await esc.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
await esc.screenshot({path:DIR+'/14-tienda-escritorio.png'});

console.log('errores JS:', errs.length, errs.slice(0,3));
console.log('capturas listas en', DIR);
await b.close();
