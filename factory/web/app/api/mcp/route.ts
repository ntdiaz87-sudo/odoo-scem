/**
 * Servidor MCP de la fábrica (núcleo de la Fase 7 — capa agéntica).
 *
 * Cada tienda expone sus operaciones como herramientas MCP (JSON-RPC 2.0
 * sobre HTTP POST, transporte "streamable http" respondiendo JSON):
 * un agente de IA se conecta con las credenciales del dueño (HTTP Basic)
 * y solo ve y toca el canal de esa tienda.
 *
 *   URL:  https://<dominio-fabrica>/api/mcp
 *   Auth: Authorization: Basic base64(correo-del-dueño:contraseña)
 *
 * Métodos: initialize, tools/list, tools/call. Sin dependencias nuevas.
 */
import { NextRequest, NextResponse } from 'next/server';
import { money } from '../../../lib/i18n';
import {
  cobrarPedido,
  enviarPedido,
  informeDistribuidores,
  listarClientes,
  listarPedidos,
  listarProductos,
  guardarVariantes,
  listarPromos,
  resumen,
  verPedido,
} from '../../../lib/panel-datos';
import { sesionPorCredenciales } from '../../../lib/panel-sesion-mcp';
import type { SesionPanel } from '../../../lib/panel-sesion';

const PROTOCOL_VERSION = '2025-03-26';

/** La sesión del dueño desde el HTTP Basic: la MISMA que usa su panel. */
async function loginOwner(req: NextRequest): Promise<SesionPanel | null> {
  const header = req.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('basic ')) return null;
  let user = '';
  let pass = '';
  try {
    const decoded = atob(header.slice(6).trim());
    const sep = decoded.indexOf(':');
    if (sep < 1) return null;
    user = decoded.slice(0, sep);
    pass = decoded.slice(sep + 1);
  } catch {
    return null;
  }
  return sesionPorCredenciales(user, pass);
}

/** Importe en la moneda REAL de la tienda. El agente decía "usd" a tiendas que cobran en ¥. */
function importe(s: SesionPanel, minor: number) {
  return { valor: +(minor / 100).toFixed(2), moneda: s.moneda, texto: money(minor, s.moneda, s.mercado) };
}

/* ---------------- herramientas ---------------- */

const TOOLS = [
  {
    name: 'info_tienda',
    description: 'Datos generales de la tienda: nombre, diseño, mercado, moneda y si es demo (sandbox).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'resumen_hoy',
    description: 'Las cifras que ve el comerciante al entrar: pedidos e ingresos de hoy, productos a la venta, agotados, stock bajo y lo que está por cobrar o por enviar.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'ver_catalogo',
    description: 'Productos de la tienda con sus variantes: SKU, precio en la moneda de la tienda, stock y si están publicados.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'ver_pedidos',
    description: 'Pedidos de la tienda (código, estado, total, comprador). PaymentAuthorized = pendiente de cobrar; PaymentSettled = cobrado; Shipped = enviado.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'ver_pedido',
    description: 'Detalle de UN pedido por su código: artículos, dirección de entrega, estado del pago y del envío.',
    inputSchema: {
      type: 'object',
      properties: { codigo: { type: 'string', description: 'Código del pedido (ver ver_pedidos)' } },
      required: ['codigo'],
      additionalProperties: false,
    },
  },
  {
    name: 'ver_promociones',
    description: 'Promociones vivas de la tienda: cupones (优惠券) y ofertas relámpago (秒杀).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'ver_clientes',
    description: 'Clientes de la tienda con su número de pedidos, última compra y saldo prepagado (会员储值).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'ver_distribuidores',
    description: 'Distribuidores (分销) con los pedidos que trajeron y la comisión que se les debe.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'cambiar_precio',
    description: 'Cambia el precio de un producto identificado por su SKU. El importe va en la MONEDA DE LA TIENDA (ver info_tienda).',
    inputSchema: {
      type: 'object',
      properties: {
        sku: { type: 'string', description: 'SKU exacto del producto (ver ver_catalogo)' },
        precio: { type: 'number', description: 'Nuevo precio en la moneda de la tienda, p. ej. 199.00' },
      },
      required: ['sku', 'precio'],
      additionalProperties: false,
    },
  },
  {
    name: 'ajustar_stock',
    description: 'Fija las unidades en existencia del producto identificado por su SKU.',
    inputSchema: {
      type: 'object',
      properties: {
        sku: { type: 'string', description: 'SKU exacto del producto' },
        unidades: { type: 'integer', description: 'Unidades disponibles totales', minimum: 0 },
      },
      required: ['sku', 'unidades'],
      additionalProperties: false,
    },
  },
  {
    name: 'cobrar_pedido',
    description: 'Marca como COBRADO un pedido cuyo pago estaba pendiente, cuando el comerciante confirma que recibió el dinero. Acción con efecto: confírmala con el comerciante antes de usarla.',
    inputSchema: {
      type: 'object',
      properties: { codigo: { type: 'string', description: 'Código del pedido' } },
      required: ['codigo'],
      additionalProperties: false,
    },
  },
  {
    name: 'enviar_pedido',
    description: 'Marca un pedido como enviado, con su número de seguimiento. Acción con efecto: confírmala con el comerciante antes de usarla.',
    inputSchema: {
      type: 'object',
      properties: {
        codigo: { type: 'string', description: 'Código del pedido' },
        seguimiento: { type: 'string', description: 'Número de seguimiento del transportista (opcional)' },
      },
      required: ['codigo'],
      additionalProperties: false,
    },
  },
];

/** Busca la variante por SKU dentro del catálogo del comerciante. */
async function porSku(sesion: SesionPanel, sku: string) {
  const { productos } = await listarProductos(sesion);
  for (const p of productos) {
    const v = p.variants.find(x => x.sku === sku);
    if (v) return { producto: p, variante: v };
  }
  return null;
}

async function pedidoPorCodigo(sesion: SesionPanel, codigo: string) {
  const { pedidos } = await listarPedidos(sesion);
  return pedidos.find(p => p.code === codigo) ?? null;
}

async function callTool(sesion: SesionPanel, name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'info_tienda': {
      return JSON.stringify({
        tienda: sesion.nombre,
        slug: sesion.canal.token,
        diseno: sesion.design.label ?? '',
        mercado: sesion.mercado,
        moneda: sesion.moneda,
        promesas: sesion.promesas,
      });
    }
    case 'resumen_hoy': {
      const r = await resumen(sesion);
      return JSON.stringify({
        pedidos_hoy: r.pedidosHoy,
        ingresos_hoy: importe(sesion, r.ingresosHoy),
        productos_en_venta: r.enVenta,
        agotados: r.agotados,
        stock_bajo: r.stockBajo,
        por_cobrar: r.porCobrar,
        por_enviar: r.porEnviar,
      });
    }
    case 'ver_catalogo': {
      const { productos } = await listarProductos(sesion);
      return JSON.stringify(
        productos.flatMap(p =>
          p.variants.map(v => ({
            sku: v.sku,
            producto: p.name,
            variante: v.name === p.name ? null : v.name.replace(p.name, '').trim() || v.name,
            precio: importe(sesion, v.price),
            stock: v.stockOnHand,
            publicado: p.enabled,
          })),
        ),
      );
    }
    case 'ver_pedidos': {
      const { pedidos } = await listarPedidos(sesion);
      return JSON.stringify(
        pedidos.map(o => ({
          codigo: o.code,
          estado: o.state,
          total: importe(sesion, o.totalWithTax),
          fecha: o.orderPlacedAt,
          comprador: o.cliente,
        })),
      );
    }
    case 'ver_pedido': {
      const codigo = String(args.codigo || '');
      const cabecera = await pedidoPorCodigo(sesion, codigo);
      if (!cabecera) throw new Error(`No hay ningún pedido con código "${codigo}" en esta tienda.`);
      const { pedido } = await verPedido(sesion, cabecera.id);
      if (!pedido) throw new Error(`No se pudo leer el pedido "${codigo}".`);
      return JSON.stringify({
        codigo: pedido.code,
        estado: pedido.state,
        total: importe(sesion, pedido.totalWithTax),
        fecha: pedido.orderPlacedAt,
        comprador: pedido.cliente,
        contacto: { correo: pedido.correo, telefono: pedido.telefono },
        entrega: pedido.direccion,
        articulos: pedido.lineas.map(l => ({
          producto: l.nombre,
          cantidad: l.cantidad,
          importe: importe(sesion, l.total),
        })),
        cobrado: !pedido.pagoPendienteId,
        enviado: pedido.enviado,
      });
    }
    case 'ver_promociones': {
      const promos = await listarPromos(sesion);
      return JSON.stringify(
        promos.map(p => ({
          nombre: p.name,
          tipo: p.esSeckill ? 'seckill' : 'cupon',
          codigo: p.couponCode,
          activa: p.enabled,
          termina: p.endsAt,
        })),
      );
    }
    case 'ver_clientes': {
      const clientes = await listarClientes(sesion);
      return JSON.stringify(
        clientes.map(c => ({
          nombre: c.nombre,
          correo: c.correo,
          pedidos: c.pedidos,
          ultima_compra: c.ultimo,
          saldo: importe(sesion, c.saldo),
        })),
      );
    }
    case 'ver_distribuidores': {
      const lista = await informeDistribuidores(sesion);
      return JSON.stringify(
        lista.map(d => ({
          nombre: d.nombre,
          codigo: d.codigo,
          comision_pct: d.comision,
          pedidos: d.pedidos,
          vendido: importe(sesion, d.vendido),
          comision: importe(sesion, d.comisionGanada),
        })),
      );
    }
    case 'cambiar_precio': {
      const sku = String(args.sku || '');
      const precio = Number(args.precio);
      if (!sku || !Number.isFinite(precio) || precio <= 0 || precio > 1000000) {
        throw new Error('Parámetros inválidos: se necesita sku y precio > 0.');
      }
      const hallado = await porSku(sesion, sku);
      if (!hallado) throw new Error(`No hay ningún producto con SKU "${sku}" en esta tienda.`);
      const error = await guardarVariantes(sesion, [
        { id: hallado.variante.id, precio: Math.round(precio * 100), stock: hallado.variante.stockOnHand },
      ]);
      if (error) throw new Error(error);
      return JSON.stringify({ ok: true, sku, producto: hallado.producto.name, nuevo_precio: importe(sesion, Math.round(precio * 100)) });
    }
    case 'ajustar_stock': {
      const sku = String(args.sku || '');
      const unidades = Number(args.unidades);
      if (!sku || !Number.isInteger(unidades) || unidades < 0 || unidades > 1000000) {
        throw new Error('Parámetros inválidos: se necesita sku y unidades >= 0.');
      }
      const hallado = await porSku(sesion, sku);
      if (!hallado) throw new Error(`No hay ningún producto con SKU "${sku}" en esta tienda.`);
      const error = await guardarVariantes(sesion, [
        { id: hallado.variante.id, precio: hallado.variante.price, stock: unidades },
      ]);
      if (error) throw new Error(error);
      return JSON.stringify({ ok: true, sku, producto: hallado.producto.name, stock: unidades });
    }
    case 'cobrar_pedido': {
      const codigo = String(args.codigo || '');
      const cabecera = await pedidoPorCodigo(sesion, codigo);
      if (!cabecera) throw new Error(`No hay ningún pedido con código "${codigo}" en esta tienda.`);
      const { pedido } = await verPedido(sesion, cabecera.id);
      if (!pedido?.pagoPendienteId) throw new Error(`El pedido "${codigo}" no tiene ningún pago pendiente de cobrar.`);
      const error = await cobrarPedido(sesion, pedido.pagoPendienteId);
      if (error) throw new Error(error);
      return JSON.stringify({ ok: true, codigo, estado: 'cobrado' });
    }
    case 'enviar_pedido': {
      const codigo = String(args.codigo || '');
      const seguimiento = String(args.seguimiento || '');
      const cabecera = await pedidoPorCodigo(sesion, codigo);
      if (!cabecera) throw new Error(`No hay ningún pedido con código "${codigo}" en esta tienda.`);
      const error = await enviarPedido(sesion, cabecera.id, seguimiento);
      if (error) throw new Error(error);
      return JSON.stringify({ ok: true, codigo, estado: 'enviado', seguimiento: seguimiento || null });
    }
    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}

/* ---------------- JSON-RPC ---------------- */

type RpcId = string | number | null;
const rpcResult = (id: RpcId, result: unknown) => ({ jsonrpc: '2.0', id, result });
const rpcError = (id: RpcId, code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } });

export async function POST(req: NextRequest) {
  let rpc: { jsonrpc?: string; id?: RpcId; method?: string; params?: Record<string, unknown> };
  try {
    rpc = await req.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, 'JSON inválido'), { status: 400 });
  }
  const id = rpc.id ?? null;
  const method = rpc.method || '';

  // Notificaciones (sin id): aceptar y no responder cuerpo.
  if (rpc.id === undefined && method.startsWith('notifications/')) {
    return new NextResponse(null, { status: 202 });
  }

  if (method === 'initialize') {
    return NextResponse.json(
      rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'fabrica-tiendas-mcp', version: '0.1.0' },
        instructions:
          'Servidor MCP de una tienda de la fábrica. Autentícate con las credenciales del dueño (HTTP Basic). Solo opera la tienda de esas credenciales.',
      }),
    );
  }
  if (method === 'ping') {
    return NextResponse.json(rpcResult(id, {}));
  }

  // Todo lo demás exige credenciales de dueño.
  const session = await loginOwner(req);
  if (!session) {
    return NextResponse.json(rpcError(id, -32001, 'Credenciales inválidas: usa HTTP Basic con el correo y la contraseña del dueño de la tienda.'), {
      status: 401,
      headers: { 'www-authenticate': 'Basic realm="fabrica-mcp"' },
    });
  }

  if (method === 'tools/list') {
    return NextResponse.json(rpcResult(id, { tools: TOOLS }));
  }
  if (method === 'tools/call') {
    const name = String(rpc.params?.name || '');
    const args = (rpc.params?.arguments as Record<string, unknown>) || {};
    try {
      const text = await callTool(session, name, args);
      return NextResponse.json(rpcResult(id, { content: [{ type: 'text', text }], isError: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error ejecutando la herramienta.';
      return NextResponse.json(rpcResult(id, { content: [{ type: 'text', text: message }], isError: true }));
    }
  }
  return NextResponse.json(rpcError(id, -32601, `Método no soportado: ${method}`));
}

export async function GET() {
  return NextResponse.json({
    servidor: 'fabrica-tiendas-mcp',
    transporte: 'streamable-http (POST JSON-RPC 2.0 a esta misma URL)',
    autenticacion: 'HTTP Basic con el correo y la contraseña del dueño de la tienda',
    herramientas: TOOLS.map(t => t.name),
  });
}
