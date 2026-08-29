/**
 * Idioma del visitante, resuelto por petición en el servidor.
 *
 * Orden: cookie elegida por el visitante → idioma del navegador → idioma del
 * mercado. Solo afecta a las páginas de la fábrica, nunca a las tiendas.
 */
import { cookies, headers } from 'next/headers';
import { LOCALE, Locale, esLocaleValido, translate } from './i18n';

export const COOKIE_IDIOMA = 'fabrica_idioma';

export async function getLocale(): Promise<Locale> {
  const elegido = (await cookies()).get(COOKIE_IDIOMA)?.value;
  if (esLocaleValido(elegido)) return elegido;

  const acepta = (await headers()).get('accept-language')?.toLowerCase() ?? '';
  // El chino llega como zh, zh-CN, zh-Hans…; el español como es, es-ES, es-419…
  if (/(^|,)\s*zh\b/.test(acepta)) return 'zh';
  if (/(^|,)\s*es\b/.test(acepta)) return 'es';
  return LOCALE;
}

/** Traductor ligado al idioma del visitante, para componentes de servidor. */
export async function getT(): Promise<(k: string, v?: Record<string, string>) => string> {
  const locale = await getLocale();
  return (k, v) => translate(locale, k, v);
}
