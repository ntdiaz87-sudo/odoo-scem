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
  lines: CartLine[];
}

export const ORDER_FIELDS = `
  id code state totalQuantity subTotalWithTax shippingWithTax totalWithTax currencyCode
  lines { id quantity linePriceWithTax productVariant { id name sku } }
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

export function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat('es', { style: 'currency', currency }).format(minor / 100);
}
