/**
 * El recorrido que reportó el primer comerciante de fuera de China.
 *
 * Se llamaba Edian, vendía en La Habana y se encontró con que su tienda salía
 * en chino y en yuanes, que solo podía subir una foto por producto, y que su
 * escaparate prometía a sus clientes entrega en 24-48 h y pago por WeChat o
 * Alipay sin que él lo hubiera decidido. Esta batería fija las cuatro cosas.
 *
 * Necesita las imágenes de prueba: se generan aquí mismo si no están.
 *
 * Uso: node tests/qa-mercado.mjs   (réplica local: web en 8300, vendure en 3000)
 */
import { chromium } from 'playwright';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

/* PNG de un color plano, generado a mano: la batería no debe depender de que
   alguien haya dejado imágenes sueltas en una carpeta temporal. */
function pngPlano(ruta, [r, g, bl]) {
  const lado = 40;
  const trozo = (tipo, datos) => {
    const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
    const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
    const crcTabla = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTabla[n] = c >>> 0;
    }
    let c = 0xffffffff;
    for (const byte of cuerpo) c = crcTabla[(c ^ byte) & 0xff] ^ (c >>> 8);
    const crc = Buffer.alloc(4); crc.writeUInt32BE((c ^ 0xffffffff) >>> 0);
    return Buffer.concat([largo, cuerpo, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0); ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const fila = Buffer.concat([Buffer.from([0]), Buffer.concat(Array(lado).fill(Buffer.from([r, g, bl])))]);
  const cruda = Buffer.concat(Array(lado).fill(fila));
  writeFileSync(ruta, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr), trozo('IDAT', deflateSync(cruda)), trozo('IEND', Buffer.alloc(0)),
  ]));
}

const D = mkdtempSync(join(tmpdir(), 'qa-fotos-')) + '/';
[[220, 60, 60], [60, 160, 220], [90, 200, 120], [240, 190, 70], [170, 110, 220]]
  .forEach((c, i) => pngPlano(`${D}f${i + 1}.png`, c));
const BASE='http://localhost:8300', HOST='localhost:8300';
const R=Math.random().toString(36).slice(2,6), CLAVE='clave-segura-123';
const correo=`edian-${R}@t.local`;
const ok=[], ko=[];
const check=(n,c,d='')=> (c?ok:ko).push(n+(d?` (${d})`:''));

const ip=`10.170.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`;
const r=await fetch(BASE+'/api/demo',{method:'POST',
  headers:{'content-type':'application/json','x-forwarded-for':ip},
  body:JSON.stringify({storeName:`Edian Dolce ${R}`,designKey:'hoja-viva',mercado:'es',
    ownerEmail:correo,ownerPassword:CLAVE})});
const j=await r.json();
if(!j.url){ console.log('no se creó:',JSON.stringify(j)); process.exit(1); }
const slug=j.url.replace(/^https?:\/\//,'').split('.')[0];

const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));

// entrar al panel
await p.goto(BASE+'/panel',{waitUntil:'networkidle'});
await p.fill('#correo',correo); await p.fill('#clave',CLAVE);
await p.click('button[type=submit]');
await p.waitForURL('**/panel/inicio',{timeout:20000});

// --- 5 fotos en un producto ---
await p.goto(BASE+'/panel/productos',{waitUntil:'networkidle'});
await p.locator('.pn-fila').first().click();
await p.waitForURL('**/panel/productos/**');
await p.setInputFiles('#fotos',[D+'f1.png',D+'f2.png',D+'f3.png',D+'f4.png',D+'f5.png']);
await p.click('.pn-form button[type=submit]');
await p.waitForSelector('.pn-ok, .fh-aviso',{timeout:30000});
await p.reload({waitUntil:'networkidle'});
const nFotos=await p.locator('.pn-fotos li').count();
check('El producto acepta 5 fotos', nFotos===5, `${nFotos} guardadas`);
check('La primera va marcada como portada', await p.locator('.pn-foto-portada').count()===1);

// --- quitar una ---
await p.locator('.pn-fotos li input[type=checkbox]').nth(1).check();
await p.click('.pn-form button[type=submit]');
await p.waitForSelector('.pn-ok, .fh-aviso',{timeout:30000});
await p.reload({waitUntil:'networkidle'});
const tras=await p.locator('.pn-fotos li').count();
check('Quitar una deja las otras', tras===4, `quedan ${tras}`);

// --- promesas ---
await p.goto(BASE+'/panel/tienda',{waitUntil:'networkidle'});
check('Los plazos empiezan VACÍOS (no inventados)',
      (await p.inputValue('#entregaPlazo'))==='' && (await p.inputValue('#entregaNota'))==='');
await p.fill('#entregaPlazo','Envío a toda La Habana');
await p.fill('#entregaNota','Llega en 2 a 4 días');
await p.fill('#pagoFormas','Transferencia o efectivo al recibir');
await p.click('.pn-bloque .pn-form button[type=submit]');
await p.waitForSelector('.pn-ok',{timeout:20000});

// --- lo que ve SU cliente ---
const cli=await b.newContext({viewport:{width:390,height:844},isMobile:true});
await cli.addCookies([{name:'fabrica_idioma',value:'zh',url:BASE}]);
const c=await cli.newPage();
await c.goto(`http://${slug}.${HOST}/`,{waitUntil:'networkidle'});
const txt=await c.locator('body').innerText();
check('La tienda enseña SUS plazos', txt.includes('Envío a toda La Habana') && txt.includes('Llega en 2 a 4 días'));
check('Y sus formas de pago', txt.includes('Transferencia o efectivo al recibir'));
check('NO promete 24–48 h ni WeChat Pay', !txt.includes('24–48') && !txt.includes('微信支付'));
check('La tienda sigue en español, no en el idioma del visitante', txt.includes('Bienvenido a'));
const imgs=await c.locator('.st-prod-img--foto img').count();
const minis=await c.locator('.st-prod-minis button').count();
check('El cliente ve las fotos, no una letra', imgs>0, `${imgs} portadas`);
check('Y puede cambiar entre ellas', minis>=4, `${minis} miniaturas`);

console.log('\n===== QA MERCADO, FOTOS Y PROMESAS =====');
ok.forEach(n=>console.log('✅ '+n));
ko.forEach(n=>console.log('❌ '+n));
console.log(`errores JS: ${errs.length}`);
console.log('=========================================');
console.log(`${ok.length}/${ok.length+ko.length} pruebas pasaron`);
await b.close();
process.exit(ko.length?1:0);
