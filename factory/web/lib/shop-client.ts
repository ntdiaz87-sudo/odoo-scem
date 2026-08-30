/**
 * Cliente del shop-api para el NAVEGADOR (carrito y checkout).
 * La sesión del comprador es un bearer token por tienda guardado en
 * localStorage; todas las llamadas van al rewrite /shop-api del propio
 * dominio de la tienda (ver next.config.mjs).
 */

const tokenKey = (slug: string) => `fabrica-sesion-${slug}`;

export interface CartLine {
  id: string;
  quantity: number;
  linePriceWithTax: number;
  discountedLinePriceWithTax: number;
  productVariant: { id: string; name: string; sku: string };
}

export interface ActiveOrder {
  id: string;
  code: string;
  state: string;
  totalQuantity: number;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  currencyCode: string;
  couponCodes: string[];
  discounts: Array<{ description: string; amountWithTax: number }>;
  lines: CartLine[];
}

export const ORDER_FIELDS = `
  id code state totalQuantity subTotalWithTax shippingWithTax totalWithTax currencyCode
  couponCodes
  discounts { description amountWithTax }
  lines { id quantity linePriceWithTax discountedLinePriceWithTax productVariant { id name sku } }
`;

export async function shopFetch<T>(
  slug: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'vendure-token': slug,
  };
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(tokenKey(slug));
  } catch {
    /* almacenamiento bloqueado: seguimos sin sesión persistente */
  }
  if (stored) headers.authorization = `Bearer ${stored}`;
  const res = await fetch('/shop-api', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const auth = res.headers.get('vendure-auth-token');
  if (auth) {
    try {
      window.localStorage.setItem(tokenKey(slug), auth);
    } catch {
      /* idem */
    }
  }
  const body = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (body.errors?.length) {
    throw new Error(body.errors.map(e => e.message).join('; '));
  }
  return body.data as T;
}

/** Avisa a los componentes (p. ej. contador del carrito) de que el pedido cambió. */
export function notifyCartChanged() {
  window.dispatchEvent(new CustomEvent('fabrica:cart-changed'));
}

export async function fetchActiveOrder(slug: string): Promise<ActiveOrder | null> {
  const data = await shopFetch<{ activeOrder: ActiveOrder | null }>(
    slug,
    `{ activeOrder { ${ORDER_FIELDS} } }`,
  );
  return data.activeOrder;
}

export async function addToCart(slug: string, productVariantId: string): Promise<ActiveOrder> {
  const data = await shopFetch<{
    addItemToOrder: { __typename: string; message?: string } & Partial<ActiveOrder>;
  }>(
    slug,
    `mutation Add($id: ID!) {
      addItemToOrder(productVariantId: $id, quantity: 1) {
        __typename
        ... on Order { ${ORDER_FIELDS} }
        ... on ErrorResult { message }
      }
    }`,
    { id: productVariantId },
  );
  if (data.addItemToOrder.__typename !== 'Order') {
    throw new Error(data.addItemToOrder.message || 'No se pudo añadir al carrito.');
  }
  notifyCartChanged();
  return data.addItemToOrder as ActiveOrder;
}

export async function adjustLine(slug: string, lineId: string, quantity: number): Promise<ActiveOrder | null> {
  const mutation = quantity <= 0
    ? `mutation Rm($lineId: ID!) {
        removeOrderLine(orderLineId: $lineId) {
          __typename
          ... on Order { ${ORDER_FIELDS} }
          ... on ErrorResult { message }
        }
      }`
    : `mutation Adj($lineId: ID!, $q: Int!) {
        adjustOrderLine(orderLineId: $lineId, quantity: $q) {
          __typename
          ... on Order { ${ORDER_FIELDS} }
          ... on ErrorResult { message }
        }
      }`;
  const data = await shopFetch<Record<string, { __typename: string; message?: string } & Partial<ActiveOrder>>>(
    slug,
    mutation,
    quantity <= 0 ? { lineId } : { lineId, q: quantity },
  );
  const result = data.removeOrderLine || data.adjustOrderLine;
  if (result.__typename !== 'Order') {
    throw new Error(result.message || 'No se pudo actualizar el carrito.');
  }
  notifyCartChanged();
  return result as ActiveOrder;
}

/** Aplica un 优惠码; si Vendure lo rechaza, devuelve el error como excepción. */
export async function applyCoupon(slug: string, code: string): Promise<ActiveOrder> {
  const data = await shopFetch<{
    applyCouponCode: { __typename: string; message?: string } & Partial<ActiveOrder>;
  }>(
    slug,
    `mutation Cupon($code: String!) {
      applyCouponCode(couponCode: $code) {
        __typename
        ... on Order { ${ORDER_FIELDS} }
        ... on ErrorResult { message }
      }
    }`,
    { code },
  );
  if (data.applyCouponCode.__typename !== 'Order') {
    throw new Error(data.applyCouponCode.message || 'Cupón no válido.');
  }
  notifyCartChanged();
  return data.applyCouponCode as ActiveOrder;
}

export async function removeCoupon(slug: string, code: string): Promise<ActiveOrder> {
  const data = await shopFetch<{ removeCouponCode: ActiveOrder | null }>(
    slug,
    `mutation Quitar($code: String!) {
      removeCouponCode(couponCode: $code) { ${ORDER_FIELDS} }
    }`,
    { code },
  );
  notifyCartChanged();
  return data.removeCouponCode as ActiveOrder;
}

/* ----------------------------- 分销 (atribución) ---------------------------- */

const disKey = (slug: string) => `fabrica-d-${slug}`;

/** Guarda el código del distribuidor si la visita llegó con ?d=CODIGO. */
export function captarDistribuidor(slug: string): void {
  try {
    const d = new URLSearchParams(window.location.search).get('d');
    if (d && d.trim()) window.localStorage.setItem(disKey(slug), d.trim());
  } catch {
    /* almacenamiento bloqueado */
  }
}

export function distribuidorGuardado(slug: string): string | null {
  try {
    return window.localStorage.getItem(disKey(slug));
  } catch {
    return null;
  }
}

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat('es', { style: 'currency', currency }).format(minor / 100);
}

/* -------------------------------- 拼团 ------------------------------------ */

export interface GrupoPintuan {
  codigo: string;
  productId: string;
  tamano: number;
  unidos: number;
  pct: number;
  expiraEn: string;
  estado: 'abierto' | 'completo' | 'caducado';
}

export async function verGrupo(slug: string, codigo: string): Promise<GrupoPintuan | null> {
  const data = await shopFetch<{ grupo: GrupoPintuan | null }>(
    slug,
    `query G($c: String!) { grupo(codigo: $c) { codigo productId tamano unidos pct expiraEn estado } }`,
    { c: codigo },
  );
  return data.grupo;
}

export async function iniciarGrupo(slug: string, productId: string): Promise<GrupoPintuan> {
  const data = await shopFetch<{ iniciarGrupo: GrupoPintuan }>(
    slug,
    `mutation IG($id: ID!) { iniciarGrupo(productId: $id) { codigo productId tamano unidos pct expiraEn estado } }`,
    { id: productId },
  );
  return data.iniciarGrupo;
}

const grupoKey = (slug: string) => `fabrica-g-${slug}`;

/** El grupo del pedido en curso, para enseñar el enlace de compartir. */
export function grupoGuardado(slug: string): string | null {
  try {
    return window.localStorage.getItem(grupoKey(slug));
  } catch {
    return null;
  }
}

export function olvidarGrupo(slug: string): void {
  try {
    window.localStorage.removeItem(grupoKey(slug));
  } catch {
    /* nada */
  }
}

/**
 * Compra al precio de grupo: añade la variante, ata el código al pedido y
 * fuerza el recálculo (Vendure solo re-aplica promociones cuando el carrito
 * cambia, así que se reajusta la línea a su MISMA cantidad).
 */
export async function comprarEnGrupo(
  slug: string,
  variantId: string,
  codigo: string,
): Promise<ActiveOrder | null> {
  const order = await addToCart(slug, variantId);
  await shopFetch(
    slug,
    `mutation AG($input: UpdateOrderInput!) {
      setOrderCustomFields(input: $input) { __typename ... on Order { id } }
    }`,
    { input: { customFields: { grupo: codigo } } },
  );
  const linea = order.lines.find(l => l.productVariant.id === variantId) || order.lines[0];
  const actualizado = linea ? await adjustLine(slug, linea.id, linea.quantity) : order;
  try {
    window.localStorage.setItem(grupoKey(slug), codigo);
  } catch {
    /* sin memoria: el pedido igual lleva el grupo */
  }
  return actualizado;
}
