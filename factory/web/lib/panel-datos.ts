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
import { adminLogin, adminRequest, panelRequest } from './vendure';

const IDIOMA_TRADUCCION = 'en';

export interface VarianteResumen {
  name: string;
  id: string;
  sku: string;
  price: number;
  stockOnHand: number;
}
export interface Foto {
  id: string;
  preview: string;
}
export interface ProductoResumen {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  /** La foto de portada: la primera de `fotos`. */
  foto: string | null;
  /** Todas las fotos del producto, en orden. La primera es la de portada. */
  fotos: Foto[];
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
  assets { id preview }
  variants { id name sku price stockOnHand }
`;

export async function listarProductos(s: SesionPanel) {
  const r = await panelRequest<{ products: { items: Array<Omit<ProductoResumen, 'foto' | 'fotos'> & { featuredAsset: { preview: string } | null; assets: Foto[] }>; totalItems: number } }>(
    s.token,
    s.canal.token,
    `query Productos { products(options: { take: 100, sort: { createdAt: DESC } }) {
      items { ${CAMPOS_PRODUCTO} } totalItems
    } }`,
  );
  if (r.error || !r.data) return { productos: [] as ProductoResumen[], error: r.error };
  const productos = r.data.products.items.map(p => ({
    ...p,
    foto: p.featuredAsset?.preview ?? p.assets?.[0]?.preview ?? null,
    fotos: p.assets ?? [],
  }));
  return { productos, error: undefined };
}

export async function verProducto(s: SesionPanel, id: string) {
  const r = await panelRequest<{ product: (Omit<ProductoDetalle, 'foto' | 'fotos'> & { featuredAsset: { preview: string } | null; assets: Foto[] }) | null }>(
    s.token,
    s.canal.token,
    `query Producto($id: ID!) { product(id: $id) { ${CAMPOS_PRODUCTO} description } }`,
    { id },
  );
  if (r.error || !r.data?.product) return { producto: null, error: r.error };
  const p = r.data.product;
  return {
    producto: {
      ...p,
      foto: p.featuredAsset?.preview ?? p.assets?.[0]?.preview ?? null,
      fotos: p.assets ?? [],
    },
    error: undefined,
  };
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
  // Con varias variantes, el formulario ya no trae la fila única: los precios
  // van por variante (ver guardarVariantes) y aquí no hay nada que tocar.
  if (!datos.varianteId) return undefined;
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
  datos: { nombre: string; descripcion: string; precio: number; stock: number; slug: string; assetIds?: string[] },
) {
  const p = await panelRequest<{ createProduct: { id: string } }>(
    s.token,
    s.canal.token,
    `mutation Crear($input: CreateProductInput!) { createProduct(input: $input) { id } }`,
    {
      input: {
        enabled: true,
        ...(datos.assetIds?.length ? { assetIds: datos.assetIds, featuredAssetId: datos.assetIds[0] } : {}),
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
    // "Queda poco" avisa ANTES de agotarse, que es cuando aún se puede reponer.
    stockBajo: productos.filter(
      p => p.enabled && p.variants.some(v => v.stockOnHand > 0 && v.stockOnHand <= 5),
    ).length,
  };
}

/* ------------------------------- variantes ------------------------------- */

/**
 * Convierte un producto simple en uno con variantes (颜色, 尺码…).
 *
 * El orden importa y Vendure no perdona: primero se crean los grupos de
 * opciones y se atan al producto, después las variantes —una por combinación—
 * y SOLO al final se borra la variante original sin opciones. Al revés, el
 * producto queda un instante sin variantes y la tienda enseña un catálogo
 * vacío.
 *
 * Cada variante nace con el precio y el stock de la original: el comerciante
 * ajusta después las que difieran, que suele ser ninguna o una.
 */
export async function crearGruposDeVariantes(
  s: SesionPanel,
  productoId: string,
  grupos: Array<{ nombre: string; valores: string[] }>,
): Promise<string | undefined> {
  const actual = await verProducto(s, productoId);
  if (!actual.producto) return actual.error || 'producto no encontrado';
  const base = actual.producto.variants[0];
  if (!base) return 'el producto no tiene variante base';

  const sufijo = Date.now().toString(36);
  const gruposCreados: Array<{ id: string; opciones: Array<{ id: string; nombre: string }> }> = [];

  for (const [gi, g] of grupos.entries()) {
    const r = await panelRequest<{ createProductOptionGroup: { id: string; options: Array<{ id: string; name: string }> } }>(
      s.token,
      s.canal.token,
      `mutation Grupo($input: CreateProductOptionGroupInput!) {
        createProductOptionGroup(input: $input) { id options { id name } }
      }`,
      {
        input: {
          code: `g${gi}-${productoId}-${sufijo}`,
          translations: [{ languageCode: IDIOMA_TRADUCCION, name: g.nombre }],
          options: g.valores.map((v, vi) => ({
            code: `o${gi}-${vi}-${sufijo}`,
            translations: [{ languageCode: IDIOMA_TRADUCCION, name: v }],
          })),
        },
      },
    );
    if (r.error || !r.data) return r.error || 'no se pudo crear el grupo';
    gruposCreados.push({
      id: r.data.createProductOptionGroup.id,
      opciones: r.data.createProductOptionGroup.options.map(o => ({ id: o.id, nombre: o.name })),
    });
    const a = await panelRequest(
      s.token,
      s.canal.token,
      `mutation Atar($productId: ID!, $optionGroupId: ID!) {
        addOptionGroupToProduct(productId: $productId, optionGroupId: $optionGroupId) { id }
      }`,
      { productId: productoId, optionGroupId: r.data.createProductOptionGroup.id },
    );
    if (a.error) return a.error;
  }

  // Todas las combinaciones (1 grupo → sus valores; 2 grupos → producto cartesiano).
  let combos: Array<Array<{ id: string; nombre: string }>> = gruposCreados[0].opciones.map(o => [o]);
  for (const g of gruposCreados.slice(1)) {
    combos = combos.flatMap(c => g.opciones.map(o => [...c, o]));
  }

  const nv = await panelRequest<{ createProductVariants: Array<{ id: string }> }>(
    s.token,
    s.canal.token,
    `mutation Variantes($input: [CreateProductVariantInput!]!) { createProductVariants(input: $input) { id } }`,
    {
      input: combos.map((combo, i) => ({
        productId: productoId,
        sku: `${base.sku}-${i + 1}`,
        price: base.price,
        stockOnHand: base.stockOnHand,
        trackInventory: 'TRUE',
        optionIds: combo.map(o => o.id),
        translations: [
          { languageCode: IDIOMA_TRADUCCION, name: `${actual.producto!.name} ${combo.map(o => o.nombre).join(' / ')}` },
        ],
      })),
    },
  );
  if (nv.error) return nv.error;

  const del = await panelRequest(
    s.token,
    s.canal.token,
    `mutation Borrar($ids: [ID!]!) { deleteProductVariants(ids: $ids) { result message } }`,
    { ids: [base.id] },
  );
  return del.error;
}

/** Guarda precio y stock de VARIAS variantes de un producto, de una vez. */
export async function guardarVariantes(
  s: SesionPanel,
  cambios: Array<{ id: string; precio: number; stock: number }>,
): Promise<string | undefined> {
  if (cambios.length === 0) return undefined;
  const r = await panelRequest(
    s.token,
    s.canal.token,
    `mutation Variantes($input: [UpdateProductVariantInput!]!) { updateProductVariants(input: $input) { id } }`,
    { input: cambios.map(c => ({ id: c.id, price: c.precio, stockOnHand: c.stock })) },
  );
  return r.error;
}

/* --------------------------------- envío --------------------------------- */

/** La tarifa configurada por la tienda, si ya tiene método propio. */
export async function verEnvio(s: SesionPanel): Promise<{ tarifa: number; gratisDesde: number; propio: boolean }> {
  const r = await panelRequest<{
    shippingMethods: { items: Array<{ code: string; calculator: { code: string; args: Array<{ name: string; value: string }> } }> };
  }>(
    s.token,
    s.canal.token,
    `{ shippingMethods(options: { take: 100 }) { items { code calculator { code args { name value } } } } }`,
  );
  const propio = r.data?.shippingMethods.items.find(m => m.code === `envio-${s.canal.token}`);
  if (!propio) return { tarifa: 1000, gratisDesde: 0, propio: false };
  const arg = (n: string) => Number(propio.calculator.args.find(a => a.name === n)?.value || 0);
  return { tarifa: arg('tarifa'), gratisDesde: arg('gratisDesde'), propio: true };
}

/* ------------------------------ marketing -------------------------------- */

export interface PromoResumen {
  id: string;
  name: string;
  enabled: boolean;
  couponCode: string | null;
  endsAt: string | null;
  esSeckill: boolean;
}

/** Promociones de la tienda: cupones y 秒杀, juntos. */
export async function listarPromos(s: SesionPanel): Promise<PromoResumen[]> {
  const r = await panelRequest<{
    promotions: { items: Array<{ id: string; name: string; enabled: boolean; couponCode: string | null; endsAt: string | null; actions: Array<{ code: string }> }> };
  }>(
    s.token,
    s.canal.token,
    `{ promotions(options: { take: 100, sort: { createdAt: DESC } }) {
      items { id name enabled couponCode endsAt actions { code } }
    } }`,
  );
  return (r.data?.promotions.items ?? []).map(p => ({
    id: p.id,
    name: p.name,
    enabled: p.enabled,
    couponCode: p.couponCode,
    endsAt: p.endsAt,
    esSeckill: p.actions.some(a => a.code === 'products_percentage_discount'),
  }));
}

/**
 * Cupón clásico: código, % o importe fijo, mínimo de pedido y caducidad.
 * Sobre las Promotions nativas de Vendure: el carrito lo aplica solo.
 */
export async function crearCupon(
  s: SesionPanel,
  datos: { nombre: string; codigo: string; tipo: 'pct' | 'fijo'; valor: number; minimo: number; caduca: string | null },
): Promise<string | undefined> {
  const accion =
    datos.tipo === 'pct'
      ? { code: 'order_percentage_discount', arguments: [{ name: 'discount', value: String(datos.valor) }] }
      : { code: 'order_fixed_discount', arguments: [{ name: 'discount', value: String(datos.valor) }] };
  const condiciones =
    datos.minimo > 0
      ? [{
          code: 'minimum_order_amount',
          arguments: [
            { name: 'amount', value: String(datos.minimo) },
            { name: 'taxInclusive', value: 'true' },
          ],
        }]
      : [];
  const r = await panelRequest<{ createPromotion: { __typename: string; message?: string } }>(
    s.token,
    s.canal.token,
    `mutation Cupon($input: CreatePromotionInput!) { createPromotion(input: $input) {
      __typename ... on Promotion { id } ... on ErrorResult { message }
    } }`,
    {
      input: {
        enabled: true,
        couponCode: datos.codigo,
        ...(datos.caduca ? { endsAt: datos.caduca } : {}),
        translations: [{ languageCode: IDIOMA_TRADUCCION, name: datos.nombre }],
        conditions: condiciones,
        actions: [accion],
      },
    },
  );
  if (r.error) return r.error;
  const res = r.data?.createPromotion;
  return res && res.__typename !== 'Promotion' ? res.message || res.__typename : undefined;
}

/**
 * 秒杀: descuento automático sobre productos concretos con hora de fin.
 * Sin cupón: el precio baja solo en el carrito mientras dura la ventana.
 */
export async function crearSeckill(
  s: SesionPanel,
  datos: { nombre: string; productIds: string[]; pct: number; termina: string },
): Promise<string | undefined> {
  // La acción de Vendure trabaja con VARIANTES, no con productos: se rebajan
  // todas las variantes de cada producto elegido.
  const variantIds: string[] = [];
  for (const pid of datos.productIds) {
    const rp = await panelRequest<{ product: { variants: Array<{ id: string }> } | null }>(
      s.token,
      s.canal.token,
      `query V($id: ID!) { product(id: $id) { variants { id } } }`,
      { id: pid },
    );
    for (const v of rp.data?.product?.variants ?? []) variantIds.push(v.id);
  }
  if (variantIds.length === 0) return 'sin variantes';
  const r = await panelRequest<{ createPromotion: { __typename: string; message?: string } }>(
    s.token,
    s.canal.token,
    `mutation Seckill($input: CreatePromotionInput!) { createPromotion(input: $input) {
      __typename ... on Promotion { id } ... on ErrorResult { message }
    } }`,
    {
      input: {
        enabled: true,
        startsAt: new Date().toISOString(),
        endsAt: datos.termina,
        translations: [{ languageCode: IDIOMA_TRADUCCION, name: datos.nombre }],
        // Vendure exige condición o cupón. El 秒杀 no lleva cupón, así que va
        // con una condición siempre cierta: pedido mínimo de 0.
        conditions: [{
          code: 'minimum_order_amount',
          arguments: [
            { name: 'amount', value: '0' },
            { name: 'taxInclusive', value: 'true' },
          ],
        }],
        actions: [{
          code: 'products_percentage_discount',
          arguments: [
            { name: 'discount', value: String(datos.pct) },
            { name: 'productVariantIds', value: JSON.stringify(variantIds) },
          ],
        }],
      },
    },
  );
  if (r.error) return r.error;
  const res = r.data?.createPromotion;
  return res && res.__typename !== 'Promotion' ? res.message || res.__typename : undefined;
}

/** Apagar o borrar una promoción. */
export async function borrarPromo(s: SesionPanel, id: string): Promise<string | undefined> {
  const r = await panelRequest<{ deletePromotion: { result: string } }>(
    s.token,
    s.canal.token,
    `mutation Borrar($id: ID!) { deletePromotion(id: $id) { result } }`,
    { id },
  );
  return r.error;
}

/* -------------------------------- 分销 ----------------------------------- */

export interface Distribuidor {
  codigo: string;
  nombre: string;
  comision: number; // en %
}

export function leerDistribuidores(json: string | null | undefined): Distribuidor[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json) as Distribuidor[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Pedidos atribuidos a cada distribuidor, con su comisión calculada. */
export async function informeDistribuidores(s: SesionPanel): Promise<
  Array<Distribuidor & { pedidos: number; vendido: number; comisionGanada: number }>
> {
  const canal = await panelRequest<{ activeChannel: { customFields?: { distribuidores?: string | null } | null } }>(
    s.token,
    s.canal.token,
    `{ activeChannel { customFields { distribuidores } } }`,
  );
  const lista = leerDistribuidores(canal.data?.activeChannel.customFields?.distribuidores);
  if (lista.length === 0) return [];
  const r = await panelRequest<{
    orders: { items: Array<{ totalWithTax: number; state: string; customFields?: { distribuidor?: string | null } | null }> };
  }>(
    s.token,
    s.canal.token,
    `{ orders(options: { take: 500, sort: { orderPlacedAt: DESC } }) {
      items { totalWithTax state customFields { distribuidor } }
    } }`,
  );
  const pedidos = r.data?.orders.items ?? [];
  return lista.map(d => {
    // Solo pedidos COBRADOS generan comisión: un pedido pendiente aún puede
    // cancelarse y pagarle por él sería pagar dos veces el error.
    const suyos = pedidos.filter(p => p.customFields?.distribuidor === d.codigo);
    const cobrados = suyos.filter(p => ['PaymentSettled', 'Shipped', 'Delivered'].includes(p.state));
    const vendido = cobrados.reduce((t, p) => t + p.totalWithTax, 0);
    return { ...d, pedidos: suyos.length, vendido, comisionGanada: Math.round((vendido * d.comision) / 100) };
  });
}

/**
 * Guarda el plantel de distribuidores en el canal. El customField del canal
 * solo puede escribirlo el superadmin, así que se escribe con sus credenciales
 * pero SIEMPRE sobre el canal de la sesión: nadie edita el plantel ajeno.
 */
export async function guardarDistribuidores(
  s: SesionPanel,
  lista: Distribuidor[],
): Promise<string | undefined> {
  try {
    const auth = await adminLogin();
    await adminRequest(
      auth,
      `mutation Dis($input: UpdateChannelInput!) {
        updateChannel(input: $input) {
          __typename
          ... on Channel { id }
          ... on ErrorResult { message }
        }
      }`,
      { input: { id: s.canal.id, customFields: { distribuidores: JSON.stringify(lista) } } },
    );
    return undefined;
  } catch (err) {
    return err instanceof Error ? err.message : 'x';
  }
}
