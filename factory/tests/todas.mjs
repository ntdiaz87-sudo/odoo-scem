/**
 * EL LOOP: corre TODAS las baterías de punta a punta, en orden, contra la
 * réplica local (web 8300, Vendure 3000) y resume al final.
 *
 *   node tests/todas.mjs            → todas
 *   node tests/todas.mjs marketing  → solo las que casen con el filtro
 *
 * Sale con código 1 si alguna falla, para poder encadenarlo con el push.
 *
 * Notas de por qué está escrito así:
 *  - qa-backoffice necesita fixtura previa: se monta aquí y sus variables se
 *    pasan a esa batería. Sin ellas falla con "expected string, got undefined",
 *    que parece regresión y no lo es.
 *  - Las baterías crean tiendas de verdad. La válvula anti-abuso por IP cuenta
 *    solo las creaciones logradas, y cada batería usa un rango de IP propio,
 *    así que una tanda completa cabe sin toparse con el límite.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const ejecutar = promisify(execFile);

const BASE = 'http://localhost:8300';
const VENDURE = 'http://localhost:3000';

const BATERIAS = [
  ['flows', 'Recorrido completo: landing, asistente, tienda, carrito, MCP'],
  ['qa-mercado', 'Mercado por tienda: idioma y moneda del comerciante'],
  ['qa-multitienda', 'Tres tiendas a la vez: diseño propio y contraste'],
  ['qa-panel', 'Panel: puerta, sesión y aislamiento'],
  ['qa-panel-tema', 'El panel se pinta con el diseño de su tienda'],
  ['qa-backoffice', 'Back office del comerciante de punta a punta'],
  ['qa-pedidos', 'Variantes, envío propio y pedido con todo aplicado'],
  ['qa-seguimiento', 'Consulta pública del pedido'],
  ['qa-marketing', '优惠券, 秒杀 y 分销'],
  ['qa-pintuan', '拼团: abrir grupo, unirse y completar'],
  ['qa-clientes', 'Clientes, segmentos y 会员储值'],
  ['qa-cuenta', 'Cuenta del comprador y pago con saldo'],
  ['qa-dominio', 'Dominio propio del comerciante'],
  ['qa-mcp', 'API unificada: el agente ve lo mismo que el panel'],
  ['qa-edge', 'Casos límite y anti-abuso'],
];

async function vivo(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return r.ok || r.status === 404;
  } catch {
    return false;
  }
}

const filtro = process.argv[2] || '';
const lista = BATERIAS.filter(([n]) => n.includes(filtro));

if (!(await vivo(BASE)) || !(await vivo(VENDURE + '/health'))) {
  console.error('La réplica no responde. Levanta Vendure (3000) y Next (8300) antes del loop.');
  process.exit(2);
}

// Fixtura de qa-backoffice: esa batería no crea nada por su cuenta.
let entornoBackoffice = {};
if (lista.some(([n]) => n === 'qa-backoffice')) {
  const { stdout } = await ejecutar('node', ['tests/fixtura-backoffice.mjs'], { maxBuffer: 8e6 });
  const linea = stdout.split('\n').find(l => l.startsWith('CORREO='));
  if (linea) {
    for (const par of linea.trim().split(' ')) {
      const [k, v] = par.split('=');
      entornoBackoffice[k] = v;
    }
  }
}

const resultados = [];
for (const [nombre, que] of lista) {
  const t0 = Date.now();
  process.stdout.write(`▶ ${nombre.padEnd(16)} ${que}\n`);
  let salida = '';
  let codigo = 0;
  try {
    const r = await ejecutar('node', [`tests/${nombre}.mjs`], {
      maxBuffer: 2e7,
      timeout: 15 * 60 * 1000,
      env: { ...process.env, ...entornoBackoffice },
    });
    salida = r.stdout;
  } catch (err) {
    salida = String(err.stdout || '') + String(err.stderr || err.message || '');
    codigo = err.code ?? 1;
  }
  const marcador = salida.match(/(\d+)\/(\d+) pruebas pasaron/);
  const fallos = [...salida.matchAll(/^❌ (.+)$/gm)].map(m => m[1]);
  resultados.push({
    nombre,
    ok: codigo === 0 && (!marcador || marcador[1] === marcador[2]),
    marcador: marcador ? `${marcador[1]}/${marcador[2]}` : codigo === 0 ? 'ok' : 'ROTA',
    fallos,
    seg: Math.round((Date.now() - t0) / 1000),
    cola: codigo !== 0 && !marcador ? salida.trim().split('\n').slice(-6).join('\n') : '',
  });
  const r = resultados[resultados.length - 1];
  console.log(`${r.ok ? '  ✅' : '  ❌'} ${r.marcador}  (${r.seg}s)\n`);
}

console.log('══════════════════ RESUMEN DEL LOOP ══════════════════');
let pasadas = 0;
let totales = 0;
for (const r of resultados) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.nombre.padEnd(16)} ${r.marcador.padStart(7)}  ${String(r.seg).padStart(4)}s`);
  for (const f of r.fallos) console.log(`     ↳ ${f}`);
  if (r.cola) console.log(r.cola.split('\n').map(l => '     │ ' + l).join('\n'));
  const m = r.marcador.match(/^(\d+)\/(\d+)$/);
  if (m) {
    pasadas += Number(m[1]);
    totales += Number(m[2]);
  }
}
const rotas = resultados.filter(r => !r.ok);
console.log('══════════════════════════════════════════════════════');
console.log(`${resultados.length - rotas.length}/${resultados.length} baterías en verde · ${pasadas}/${totales} comprobaciones`);
process.exit(rotas.length ? 1 : 0);
