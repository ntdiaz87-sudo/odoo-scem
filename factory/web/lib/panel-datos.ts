/**
 * Lo que el back office del comerciante le pide a Vendure.
 *
 * Todo pasa por panelRequest, que va firmado con la sesión del dueño y con el
 * token de SU canal: Vendure aplica sus permisos y no ve nada de otra tienda,
 * aunque alguien manipule un id en la URL.
 *
 * IDIOMA DE LAS TRADUCCIONES: se escriben bajo `en` aunque el texto sea chino.
 * Es la convergencia que documenta la cabecera de la semilla; si se escribiera
 * en zh_Hans, un cambio hecho desde la consola de Vendure (que guarda en su
 * idioma de interfaz) dejaría de verse en la tienda.
 */
import type { SesionPanel } from './panel-sesion';
import { panelRequest } from './vendure';

const IDIOMA_TRADUCCION = 'en';

export interface VarianteResumen {
  id: string;
  sku: string;
  price: number;
  stockOnHand: number;
}
export interface ProductoResumen {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  foto: string | null;
  variants: VarianteResumen[];
}
export interface ProductoDetalle extends ProductoResumen {
  description: string;
}

export interface PedidoResumen {
  id: string;
  code: string;
  state: string;
  orderPlacedAt: string | null;
  totalWithTax: number;
  cliente: string;
}

export interface LineaPedido {
  id: string;
  nombre: string;
  cantidad: number;
  total: number;
}
export interface PedidoDetalle extends PedidoResumen {
  lineas: LineaPedido[];
  correo: string;
  telefono: string;
  direccion: string;
  pagoPendienteId: string | null;
  enviado: boolean;
}

const CAMPOS_PRODUCTO = `
  id name slug enabled
  featuredAsset { preview }
  variants { id sku price stockOnHand }
`;

export async function listarProductos(s: SesionPanel) {
  const r = await panelRequest<{ products: { items: Array<Omit<ProductoResumen, 'foto'> & { featuredAsset: { preview: string } | null }>; totalItems: number } }>(
    s.token,
    s.canal.token,
    `query Productos { products(options: { take: 100, sort: { createdAt: DESC } }) {
      items { ${CAMPOS_PRODUCTO} } totalItems
    } }`,
  );
  if (r.error || !r.data) return { productos: [] as ProductoResumen[], error: r.error };
  const productos = r.data.products.items.map(p => ({ ...p, foto: p.featuredAsset?.preview ?? null }));
  return { productos, error: undefined };
}

export async function verProducto(s: SesionPanel, id: string) {
  const r = await panelRequest<{ product: (Omit<ProductoDetalle, 'foto'> & { featuredAsset: { preview: string } | null }) | null }>(
    s.token,
    s.canal.token,
    `query Producto($id: ID!) { product(id: $id) { ${CAMPOS_PRODUCTO} description } }`,
    { id },
  );
  if (r.error || !r.data?.product) return { producto: null, error: r.error };
  const p = r.data.product;
  return { producto: { ...p, foto: p.featuredAsset?.preview ?? null }, error: undefined };
}

export async function guardarProducto(
  s: SesionPanel,
  datos: { id: string; slug: string; nombre: string; descripcion: string; publicado: boolean; varianteId: string; precio: number; stock: number },
) {
  const p = await panelRequest<{ updateProduct: { id: string } }>(
    s.token,
    s.canal.token,
    `mutation Guardar($input: UpdateProductInput!) { updateProduct(input: $input) { id } }`,
    {
      input: {
        id: datos.id,
        enabled: datos.publicado,
        translations: [
          { languageCode: IDIOMA_TRADUCCION, name: datos.nombre, slug: datos.slug, description: datos.descripcion },
        ],
      },
    },
  );
  if (p.error) return p.error;
  const v = await panelRequest(
    s.token,
    s.canal.token,
    `mutation Variante($input: [UpdateProductVariantInput!]!) { updateProductVariants(input: $input) { id } }`,
    { input: [{ id: datos.varianteId, price: datos.precio, stockOnHand: datos.stock }] },
  );
  return v.error;
}

export async function crearProducto(
  s: SesionPanel,
  datos: { nombre: string; descripcion: string; precio: number; stock: number; slug: string; assetId?: string },
) {
  const p = await panelRequest<{ createProduct: { id: string } }>(
    s.token,
    s.canal.token,
    `mutation Crear($input: CreateProductInput!) { createProduct(input: $input) { id } }`,
    {
      input: {
        enabled: true,
        ...(datos.assetId ? { assetIds: [datos.assetId], featuredAssetId: datos.assetId } : {}),
        translations: [
          { languageCode: IDIOMA_TRADUCCION, name: datos.nombre, slug: datos.slug, description: datos.descripcion },
        ],
      },
    },
  );
  if (p.error || !p.data) return { id: null, error: p.error || 'sin respuesta' };
  const productId = p.data.createProduct.id;
  const v = await panelRequest(
    s.token,
    s.canal.token,
    `mutation CrearVariante($input: [CreateProductVariantInput!]!) { createProductVariants(input: $input) { id } }`,
    {
      input: [
        {
          productId,
          sku: `${datos.slug}-${Date.now().toString(36)}`,
          price: datos.precio,
          stockOnHand: datos.stock,
          trackInventory: 'TRUE',
          translations: [{ languageCode: IDIOMA_TRADUCCION, name: datos.nombre }],
        },
      ],
    },
  );
  return { id: productId, error: v.error };
}

/* ------------------------------- pedidos -------------------------------- */

const CAMPOS_PEDIDO = `
  id code state orderPlacedAt totalWithTax
  customer { firstName lastName emailAddress phoneNumber }
`;

function nombreCliente(c: { firstName?: string; lastName?: string } | null): string {
  if (!c) return '—';
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
}

export async function listarPedidos(s: SesionPanel) {
  const r = await panelRequest<{
    orders: { items: Array<{ id: string; code: string; state: string; orderPlacedAt: string | null; totalWithTax: number; customer: { firstName: string; lastName: string } | null }> };
  }>(
    s.token,
    s.canal.token,
    `query Pedidos { orders(options: { take: 100, sort: { createdAt: DESC } }) { items { ${CAMPOS_PEDIDO} } } }`,
  );
  if (r.error || !r.data) return { pedidos: [] as PedidoResumen[], error: r.error };
  const pedidos = r.data.orders.items
    .filter(o => o.state !== 'Draft' && o.state !== 'AddingItems')
    .map(o => ({ ...o, cliente: nombreCliente(o.customer) }));
  return { pedidos, error: undefined };
}

export async function verPedido(s: SesionPanel, id: string) {
  const r = await panelRequest<{
    order: {
      id: string; code: string; state: string; orderPlacedAt: string | null; totalWithTax: number;
      customer: { firstName: string; lastName: string; emailAddress: string; phoneNumber: string } | null;
      shippingAddress: { fullName: string; streetLine1: string; city: string; province: string; postalCode: string; country: string } | null;
      lines: Array<{ id: string; quantity: number; linePriceWithTax: number; productVariant: { name: string } }>;
      payments: Array<{ id: string; state: string }> | null;
      fulfillments: Array<{ id: string; state: string }> | null;
    } | null;
  }>(
    s.token,
    s.canal.token,
    `query Pedido($id: ID!) { order(id: $id) {
      ${CAMPOS_PEDIDO}
      shippingAddress { fullName streetLine1 city province postalCode country }
      lines { id quantity linePriceWithTax productVariant { name } }
      payments { id state }
      fulfillments { id state }
    } }`,
    { id },
  );
  const o = r.data?.order;
  if (r.error || !o) return { pedido: null, error: r.error };
  const d = o.shippingAddress;
  const pendiente = (o.payments || []).find(p => p.state === 'Authorized');
  const pedido: PedidoDetalle = {
    id: o.id,
    code: o.code,
    state: o.state,
    orderPlacedAt: o.orderPlacedAt,
    totalWithTax: o.totalWithTax,
    cliente: d?.fullName || nombreCliente(o.customer),
    correo: o.customer?.emailAddress || '—',
    telefono: o.customer?.phoneNumber || '—',
    direccion: d ? [d.streetLine1, d.city, d.province, d.postalCode, d.country].filter(Boolean).join(', ') : '—',
    lineas: o.lines.map(l => ({ id: l.id, nombre: l.productVariant.name, cantidad: l.quantity, total: l.linePriceWithTax })),
    pagoPendienteId: pendiente?.id ?? null,
    enviado: (o.fulfillments || []).length > 0,
  };
  return { pedido, error: undefined };
}

export async function cobrarPedido(s: SesionPanel, pagoId: string) {
  const r = await panelRequest<{ settlePayment: { __typename: string; message?: string } }>(
    s.token,
    s.canal.token,
    `mutation Cobrar($id: ID!) { settlePayment(id: $id) {
      __typename ... on Payment { id state } ... on ErrorResult { message }
    } }`,
    { id: pagoId },
  );
  if (r.error) return r.error;
  const res = r.data?.settlePayment;
  return res && res.__typename !== 'Payment' ? res.message || res.__typename : undefined;
}

export async function enviarPedido(s: SesionPanel, pedidoId: string, seguimiento: string) {
  const detalle = await verPedido(s, pedidoId);
  if (!detalle.pedido) return detalle.error || 'pedido no encontrado';
  const r = await panelRequest<{ addFulfillmentToOrder: { __typename: string; id?: string; message?: string } }>(
    s.token,
    s.canal.token,
    `mutation Enviar($input: FulfillOrderInput!) { addFulfillmentToOrder(input: $input) {
      __typename ... on Fulfillment { id } ... on ErrorResult { message }
    } }`,
    {
      input: {
        lines: detalle.pedido.lineas.map(l => ({ orderLineId: l.id, quantity: l.cantidad })),
        handler: {
          code: 'manual-fulfillment',
          arguments: [
            { name: 'method', value: '商家自行发货' },
            { name: 'trackingCode', value: seguimiento },
          ],
        },
      },
    },
  );
  if (r.error) return r.error;
  const f = r.data?.addFulfillmentToOrder;
  if (!f || f.__typename !== 'Fulfillment') return f?.message || 'no se pudo marcar el envío';
  const t = await panelRequest<{ transitionFulfillmentToState: { __typename: string; message?: string } }>(
    s.token,
    s.canal.token,
    `mutation Estado($id: ID!, $state: String!) { transitionFulfillmentToState(id: $id, state: $state) {
      __typename ... on Fulfillment { id } ... on ErrorResult { message }
    } }`,
    { id: f.id, state: 'Shipped' },
  );
  const res = t.data?.transitionFulfillmentToState;
  return res && res.__typename !== 'Fulfillment' ? res.message : undefined;
}

/** Números de la pantalla de concepto general. */
export async function resumen(s: SesionPanel) {
  const [{ productos }, { pedidos }] = await Promise.all([listarProductos(s), listarPedidos(s)]);
  const hoy = new Date().toISOString().slice(0, 10);
  const deHoy = pedidos.filter(p => (p.orderPlacedAt || '').slice(0, 10) === hoy);
  return {
    pedidosHoy: deHoy.length,
    ingresosHoy: deHoy.reduce((t, p) => t + p.totalWithTax, 0),
    porCobrar: pedidos.filter(p => p.state === 'PaymentAuthorized').length,
    porEnviar: pedidos.filter(p => p.state === 'PaymentSettled').length,
    enVenta: productos.filter(p => p.enabled).length,
    agotados: productos.filter(p => p.variants.every(v => v.stockOnHand <= 0)).length,
  };
}
