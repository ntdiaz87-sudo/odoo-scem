/**
 * Dominio propio del comerciante (Fase 4).
 *
 * Solo usa fetch: este módulo lo importa el middleware, que corre en el
 * runtime edge y no puede tocar módulos de Node. La resolución
 * dominio → canal lleva caché con TTL porque el middleware pasa por aquí
 * en CADA petición de un dominio propio y la base no tiene por qué
 * enterarse de cada una.
 */
import { adminLogin, adminRequest } from './vendure';

/**
 * Normaliza lo que pegue el comerciante: con https://, con ruta, con
 * mayúsculas, con barra final… De ahí tiene que salir un hostname limpio
 * o null. Se aceptan también los IDN ya codificados (xn--).
 */
export function normalizarDominio(bruto: string): string | null {
  let v = (bruto || '').trim().toLowerCase();
  if (!v) return null;
  v = v.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '').replace(/^www\./, '');
  if (v.length > 253) return null;
  // etiquetas de 1-63, letras/dígitos/guión, al menos un punto, TLD de 2+
  if (!/^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(v) && !/\.xn--[a-z0-9-]+$/.test(v)) {
    return null;
  }
  return v;
}

/** El registro TXT va en _fabrica.<dominio> con este testigo. */
export function nombreTxt(dominio: string): string {
  return `_fabrica.${dominio}`;
}

export function nuevoTestigo(): string {
  return `fabrica-verificacion=${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
}

interface CanalConDominio {
  token: string;
  customFields?: { dominio?: string | null; dominioVerificado?: boolean | null } | null;
}

interface Entrada {
  slug: string | null;
  caduca: number;
}

const TTL_ACIERTO = 60_000; // 1 min: un dominio recién verificado tarda ESTO en servir
const TTL_FALLO = 15_000; // los fallos caducan antes para no alargar la espera
const cache = new Map<string, Entrada>();

/**
 * ¿Qué tienda (token de canal) sirve este dominio propio? Solo cuentan los
 * dominios VERIFICADOS: sin eso, cualquiera apunta su DNS al servidor y se
 * queda con una tienda ajena.
 */
export async function canalPorDominio(hostname: string): Promise<string | null> {
  const clave = hostname.toLowerCase();
  const hit = cache.get(clave);
  if (hit && hit.caduca > Date.now()) return hit.slug;

  let slug: string | null = null;
  try {
    const auth = await adminLogin();
    // Se pregunta POR EL DOMINIO, no se listan los canales: con una lista
    // paginada, el dominio del canal 501 en adelante era invisible (su tienda
    // no respondía en su propio dominio) y la consulta pesaba en cada petición.
    const data = await adminRequest<{ channels: { items: CanalConDominio[] } }>(
      auth,
      `query PorDominio($d: String!) {
        channels(options: {
          filter: { dominio: { eq: $d }, dominioVerificado: { eq: true } },
          take: 2
        }) { items { token customFields { dominio dominioVerificado } } }
      }`,
      { d: clave },
    );
    slug = data.channels.items[0]?.token ?? null;
  } catch {
    // Vendure caído o sin permisos: se responde "no hay tienda" y se
    // reintenta pronto (TTL corto). Nunca se tumba la petición.
    cache.set(clave, { slug: null, caduca: Date.now() + TTL_FALLO });
    return null;
  }
  cache.set(clave, { slug, caduca: Date.now() + (slug ? TTL_ACIERTO : TTL_FALLO) });
  return slug;
}

/** ¿Ya hay OTRA tienda con este dominio (verificado o no)? */
export async function dominioOcupado(hostname: string, tokenPropio: string): Promise<boolean> {
  try {
    const auth = await adminLogin();
    const data = await adminRequest<{ channels: { items: CanalConDominio[] } }>(
      auth,
      `query Ocupado($d: String!) {
        channels(options: { filter: { dominio: { eq: $d } }, take: 5 }) {
          items { token customFields { dominio } }
        }
      }`,
      { d: hostname },
    );
    return data.channels.items.some(c => c.token !== tokenPropio);
  } catch {
    return true; // en la duda, mejor negar el alta que regalar un dominio pisado
  }
}
