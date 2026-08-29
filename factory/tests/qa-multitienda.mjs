/**
 * Batería QA multicompañía: crea tiendas con rubros, estilos y modos distintos
 * y comprueba que la MISMA plantilla se ve bien con cualquier paleta generada
 * — contraste AA real en el titular y en el botón de marca, y sin desbordes.
 *
 * Uso: node tests/qa-multitienda.mjs   (réplica local en 8300)
 */
import { chromium } from 'playwright';
const BASE='http://localhost:8300';
const casos=[
  {rubro:'tecnologia',estilo:'minimalista',modo:'oscuro',nombre:'Voltix'},
  {rubro:'belleza',estilo:'elegante',modo:'claro',nombre:'Lumina'},
  {rubro:'comida',estilo:'energico',modo:'claro',nombre:'Bruma'},
];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await (await b.newContext({viewport:{width:1200,height:900},deviceScaleFactor:2})).newPage();
const slugs=[];
for(const c of casos){
  const S=Math.random().toString(36).slice(2,5);
  const d=await (await fetch(BASE+'/api/designs',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(c)})).json();
  const r=await fetch(BASE+'/api/demo',{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':`10.55.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}`},body:JSON.stringify({storeName:`${c.nombre} ${S}`,design:d.proposals[0],ownerEmail:`multi-${S}@t.local`,ownerPassword:'clave-segura-123'})});
  const j=await r.json();
  if(!j.url){ console.log('❌',c.nombre,JSON.stringify(j).slice(0,90)); continue; }
  const slug=j.url.replace('http://','').split('.')[0];
  slugs.push(slug);
  await p.goto(j.url+'/',{waitUntil:'networkidle'});
  await p.waitForTimeout(1800);
  // contraste real del texto principal sobre el fondo
  const m=await p.evaluate(()=>{
    const lum=(c)=>{const n=c.match(/\d+/g).slice(0,3).map(Number);const s=n.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*s[0]+.7152*s[1]+.0722*s[2];};
    const cr=(a,b)=>{const l1=Math.max(lum(a),lum(b)),l2=Math.min(lum(a),lum(b));return (l1+.05)/(l2+.05);};
    const raiz=document.querySelector('.st'), h1=document.querySelector('.st-hero-titulo'), btn=document.querySelector('.st-btn--marca');
    const bg=getComputedStyle(raiz).backgroundColor;
    return {
      titulo:+cr(getComputedStyle(h1).color,bg).toFixed(2),
      boton:+cr(getComputedStyle(btn).color,getComputedStyle(btn).backgroundColor).toFixed(2),
      desborde:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    };
  });
  const ok=m.titulo>=4.5 && m.boton>=4.5 && !m.desborde;
  console.log(`${ok?'✅':'❌'} ${c.nombre} (${c.rubro}/${c.estilo}/${c.modo}) → título ${m.titulo}:1, botón ${m.boton}:1${m.desborde?' DESBORDE':''}`);
  await p.screenshot({path:`multi-${c.nombre}.png`,clip:{x:0,y:0,width:1200,height:820}});
}
console.log('tiendas creadas:',slugs.join(', '));
await b.close();
process.exit(0);
