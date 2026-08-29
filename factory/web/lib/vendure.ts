/**
 * Cliente mínimo del API de Vendure (Fase 0).
 * - shopQuery: consultas públicas del storefront, scoping por vendure-token.
 * - adminLogin / adminRequest: provisioning de tiendas demo (solo servidor).
 */
const API_URL = process.env.VENDURE_API_URL || 'http://localhost:3000';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function gqlFetch<T>(
  path: string,
  query: string,
  variables: Record<string, unknown> | undefined,
  headers: Record<string, string>,
): Promise<{ body: GraphQLResponse<T>; response: Response }> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const body = (await response.json()) as GraphQLResponse<T>;
  return { body, response };
}

export async function shopQuery<T>(
  channelToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { body } = await gqlFetch<T>('/shop-api', query, variables, {
    'vendure-token': channelToken,
  });
  if (body.errors?.length) {
    throw new Error(body.errors.map(e => e.message).join('; '));
  }
  return body.data as T;
}

export async function adminLogin(): Promise<string> {
  const username = process.env.VENDURE_SUPERADMIN_USERNAME || 'superadmin';
  const password = process.env.VENDURE_SUPERADMIN_PASSWORD || 'superadmin';
  const { body, response } = await gqlFetch<{
    login: { __typename: string; message?: string };
  }>(
    '/admin-api',
    `mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        __typename
        ... on CurrentUser { id }
        ... on ErrorResult { message }
      }
    }`,
    { username, password },
    {},
  );
  const authToken = response.headers.get('vendure-auth-token');
  if (!authToken || body.data?.login.__typename !== 'CurrentUser') {
    throw new Error(`Login de administración fallido: ${body.data?.login.message || 'sin token'}`);
  }
  return authToken;
}

export async function adminRequest<T>(
  authToken: string,
  query: string,
  variables?: Record<string, unknown>,
  channelToken?: string,
): Promise<T> {
  const headers: Record<string, string> = { authorization: `Bearer ${authToken}` };
  if (channelToken) headers['vendure-token'] = channelToken;
  const { body } = await gqlFetch<T>('/admin-api', query, variables, headers);
  if (body.errors?.length) {
    throw new Error(body.errors.map(e => e.message).join('; '));
  }
  return body.data as T;
}

/* ======================= sesión del comerciante ==========================
 * El dueño de cada tienda tiene su propio administrador en Vendure, con un
 * rol limitado a SU canal. Estas funciones dejan que entre con esas mismas
 * credenciales a nuestro back office, sin pasar por la consola de Vendure.
 */

export interface CanalDelDueno {
  id: string;
  token: string;
  code: string;
}

/** Devuelve el token de sesión de Vendure, o null si las credenciales fallan. */
export async function ownerLogin(
  username: string,
  password: string,
): Promise<string | null> {
  const { body, response } = await gqlFetch<{ login: { __typename: string } }>(
    '/admin-api',
    `mutation Login($username: String!, $password: String!) {
      login(username: $username, password: $password) {
        __typename
        ... on CurrentUser { id }
      }
    }`,
    { username, password },
    {},
  );
  const authToken = response.headers.get('vendure-auth-token');
  if (!authToken || body.data?.login.__typename !== 'CurrentUser') return null;
  return authToken;
}

/** Identidad y canales de la sesión. null si el token ya no vale. */
export async function ownerMe(authToken: string): Promise<{
  identifier: string;
  canales: CanalDelDueno[];
} | null> {
  const { body } = await gqlFetch<{
    me: { identifier: string; channels: CanalDelDueno[] } | null;
  }>(
    '/admin-api',
    `query Yo { me { identifier channels { id token code } } }`,
    undefined,
    { authorization: `Bearer ${authToken}` },
  );
  const me = body.data?.me;
  if (!me) return null;
  // El canal por defecto no es la tienda de nadie: se descarta siempre.
  const canales = me.channels.filter(c => c.code !== '__default_channel__');
  return { identifier: me.identifier, canales };
}

export async function ownerLogout(authToken: string): Promise<void> {
  await gqlFetch('/admin-api', `mutation { logout { success } }`, undefined, {
    authorization: `Bearer ${authToken}`,
  }).catch(() => undefined);
}

/** Igual que adminRequest pero devuelve los errores en vez de reventar: en el
 *  back office un fallo se le enseña al comerciante, no se le tira la página. */
export async function panelRequest<T>(
  authToken: string,
  channelToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: T; error?: string }> {
  try {
    const { body } = await gqlFetch<T>('/admin-api', query, variables, {
      authorization: `Bearer ${authToken}`,
      'vendure-token': channelToken,
    });
    if (body.errors?.length) return { error: body.errors.map(e => e.message).join('; ') };
    return { data: body.data as T };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error de red' };
  }
}
