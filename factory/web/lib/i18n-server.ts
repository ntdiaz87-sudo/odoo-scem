/**
 * Idioma del visitante, resuelto por petición en el servidor.
 *
 * Orden: cookie elegida por el visitante → idioma del navegador → idioma del
 * mercado. Solo afecta a las páginas de la fábrica, nunca a las tiendas.
 */
import { cookies, headers } from 'next/headers';
import { LOCALE, Locale, esLocaleValido, translate } from './i18n';

export const COOKIE_IDIOMA = 'fabrica_idioma';

/**
 * Idioma del visitante.
 *
 * `respaldo` es el último recurso cuando el visitante no ha elegido nada y su
 * navegador no dice nada útil. El back office le pasa el mercado de SU tienda:
 * un comerciante que vende en español y nunca tocó el selector se encontraba el
 * panel en chino, que es el idioma del lanzamiento y no tiene nada que ver con
 * él. Quien vende en un idioma casi siempre lo lee.
 */
export async function getLocale(respaldo: Locale = LOCALE): Promise<Locale> {
  const elegido = (await cookies()).get(COOKIE_IDIOMA)?.value;
  if (esLocaleValido(elegido)) return elegido;

  const acepta = (await headers()).get('accept-language')?.toLowerCase() ?? '';
  // El chino llega como zh, zh-CN, zh-Hans…; el español como es, es-ES, es-419…
  if (/(^|,)\s*zh\b/.test(acepta)) return 'zh';
  if (/(^|,)\s*es\b/.test(acepta)) return 'es';
  if (/(^|,)\s*en\b/.test(acepta)) return 'en';
  return respaldo;
}

/** Traductor ligado al idioma del visitante, para componentes de servidor. */
export async function getT(respaldo?: Locale): Promise<(k: string, v?: Record<string, string>) => string> {
  const locale = await getLocale(respaldo);
  return (k, v) => translate(locale, k, v);
}
