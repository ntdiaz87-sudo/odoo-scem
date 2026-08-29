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

const API_URL = process.env.VENDURE_API_URL || 'http://localhost:3000';
const PROTOCOL_VERSION = '2025-03-26';

interface OwnerSession {
  bearer: string;
  channelToken: string;
  channelCode: string;
}

async function vendureAdmin<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  headers: Record<string, string>,
): Promise<{ data?: T; errors?: Array<{ message: string }>; authToken?: string }> {
  const res = await fetch(`${API_URL}/admin-api`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const body = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  return { ...body, authToken: res.headers.get('vendure-auth-token') || undefined };
}

/** Valida las credenciales Basic del dueño y devuelve su canal. */
async function loginOwner(req: NextRequest): Promise<OwnerSession | null> {
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
  const login = await vendureAdmin<{
    login: { __typename: string; channels?: Array<{ code: string; token: string }> };
  }>(
    `mutation Login($u: String!, $p: String!) {
      login(username: $u, password: $p) {
        __typename
        ... on CurrentUser { channels { code token } }
      }
    }`,
    { u: user, p: pass },
    {},
  );
  if (login.data?.login.__typename !== 'CurrentUser' || !login.authToken) return null;
  // El dueño de una tienda tiene exactamente su canal; el superadmin usa el primero no-default.
  const channels = login.data.login.channels || [];
  const own = channels.find(c => c.code !== '__default_channel__') || channels[0];
  if (!own) return null;
  return { bearer: login.authToken, channelToken: own.token, channelCode: own.code };
}

async function ownerRequest<T>(session: OwnerSession, query: string, variables?: Record<string, unknown>): Promise<T> {
  const { data, errors } = await vendureAdmin<T>(query, variables, {
    authorization: `Bearer ${session.bearer}`,
    'vendure-token': session.channelToken,
  });
  if (errors?.length) throw new Error(errors.map(e => e.message).join('; '));
  return data as T;
}

/* ---------------- herramientas ---------------- */

const TOOLS = [
  {
    name: 'info_tienda',
    description: 'Datos generales de la tienda: nombre, diseño y si es demo (sandbox).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'ver_catalogo',
    description: 'Lista los productos de la tienda con su SKU, precio (USD) y stock disponible.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'ver_pedidos',
    description:
      'Lista los pedidos de la tienda (código, estado, total USD, comprador). Los estados típicos: PaymentAuthorized = pendiente de cobrar, PaymentSettled = cobrado.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'cambiar_precio',
    description: 'Cambia el precio (en USD) del producto identificado por su SKU.',
    inputSchema: {
      type: 'object',
      properties: {
        sku: { type: 'string', description: 'SKU exacto del producto (ver ver_catalogo)' },
        precio_usd: { type: 'number', description: 'Nuevo precio en dólares, p. ej. 19.99' },
      },
      required: ['sku', 'precio_usd'],
      additionalProperties: false,
    },
  },
  {
    name: 'ajustar_stock',
    description: 'Fija las unidades en existencia (stock) del producto identificado por su SKU.',
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
];

async function variantBySku(session: OwnerSession, sku: string): Promise<{ id: string; name: string } | null> {
  const data = await ownerRequest<{
    productVariants: { items: Array<{ id: string; name: string; sku: string }> };
  }>(
    session,
    `query BySku($sku: String!) {
      productVariants(options: { filter: { sku: { eq: $sku } } }) { items { id name sku } }
    }`,
    { sku },
  );
  return data.productVariants.items[0] ?? null;
}

async function callTool(session: OwnerSession, name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'info_tienda': {
      const data = await ownerRequest<{
        channel: null;
        channels: { items: Array<{ code: string; customFields?: { displayName?: string; isSandbox?: boolean; expiresAt?: string; design?: string } | null }> };
      }>(session, `{ channels(options: { take: 100 }) { items { code customFields { displayName isSandbox expiresAt design } } } }`);
      const ch = data.channels.items.find(c => c.code === session.channelCode);
      const cf = ch?.customFields;
      let designLabel = '';
      try {
        designLabel = cf?.design ? (JSON.parse(cf.design) as { label?: string }).label || '' : '';
      } catch { /* sin nombre de diseño */ }
      return JSON.stringify({
        tienda: cf?.displayName || session.channelCode,
        slug: session.channelCode,
        diseno: designLabel,
        es_demo: cf?.isSandbox ?? false,
        demo_caduca: cf?.expiresAt ?? null,
      });
    }
    case 'ver_catalogo': {
      const data = await ownerRequest<{
        productVariants: { items: Array<{ sku: string; name: string; price: number; stockOnHand: number; enabled: boolean }> };
      }>(session, `{ productVariants(options: { take: 100 }) { items { sku name price stockOnHand enabled } } }`);
      return JSON.stringify(
        data.productVariants.items.map(v => ({
          sku: v.sku,
          producto: v.name,
          precio_usd: +(v.price / 100).toFixed(2),
          stock: v.stockOnHand,
          activo: v.enabled,
        })),
      );
    }
    case 'ver_pedidos': {
      const data = await ownerRequest<{
        orders: { items: Array<{ code: string; state: string; totalWithTax: number; orderPlacedAt: string | null; customer?: { firstName: string; lastName: string; emailAddress: string } | null }> };
      }>(session, `{ orders(options: { take: 50, sort: { createdAt: DESC } }) { items { code state totalWithTax orderPlacedAt customer { firstName lastName emailAddress } } } }`);
      return JSON.stringify(
        data.orders.items.map(o => ({
          codigo: o.code,
          estado: o.state,
          total_usd: +(o.totalWithTax / 100).toFixed(2),
          fecha: o.orderPlacedAt,
          comprador: o.customer ? `${o.customer.firstName} ${o.customer.lastName} <${o.customer.emailAddress}>` : null,
        })),
      );
    }
    case 'cambiar_precio': {
      const sku = String(args.sku || '');
      const precio = Number(args.precio_usd);
      if (!sku || !Number.isFinite(precio) || precio <= 0 || precio > 1000000) {
        throw new Error('Parámetros inválidos: se necesita sku y precio_usd > 0.');
      }
      const variant = await variantBySku(session, sku);
      if (!variant) throw new Error(`No hay ningún producto con SKU "${sku}" en esta tienda.`);
      await ownerRequest(
        session,
        `mutation Precio($input: [UpdateProductVariantInput!]!) {
          updateProductVariants(input: $input) { ... on ProductVariant { id } }
        }`,
        { input: [{ id: variant.id, price: Math.round(precio * 100) }] },
      );
      return JSON.stringify({ ok: true, sku, producto: variant.name, nuevo_precio_usd: +precio.toFixed(2) });
    }
    case 'ajustar_stock': {
      const sku = String(args.sku || '');
      const unidades = Number(args.unidades);
      if (!sku || !Number.isInteger(unidades) || unidades < 0 || unidades > 1000000) {
        throw new Error('Parámetros inválidos: se necesita sku y unidades >= 0.');
      }
      const variant = await variantBySku(session, sku);
      if (!variant) throw new Error(`No hay ningún producto con SKU "${sku}" en esta tienda.`);
      await ownerRequest(
        session,
        `mutation Stock($input: [UpdateProductVariantInput!]!) {
          updateProductVariants(input: $input) { ... on ProductVariant { id } }
        }`,
        { input: [{ id: variant.id, stockOnHand: unidades }] },
      );
      return JSON.stringify({ ok: true, sku, producto: variant.name, stock: unidades });
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
