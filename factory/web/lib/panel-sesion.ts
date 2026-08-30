/**
 * Sesión del comerciante en su propio back office.
 *
 * El token de sesión de Vendure viaja en una cookie httpOnly: el navegador no
 * puede leerlo, así que un script inyectado en una tienda no se lo lleva. No
 * guardamos nada más en la cookie: en cada petición se le pregunta a Vendure
 * quién es y a qué canal tiene acceso, así una sesión revocada deja de valer
 * al instante en vez de seguir viva hasta que caduque la cookie.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DESIGN_PRESETS, type StoreDesign } from './designs';
import { MONEDA_DE, type Locale } from './i18n';
import { loadStoreInfo } from './store-design';
import { ownerMe, type CanalDelDueno } from './vendure';

export const COOKIE_PANEL = 'fabrica_panel';

/**
 * Idioma del CANAL de Vendure para cada mercado de la fábrica.
 *
 * Vive aquí y no en la ruta que crea tiendas porque lo usan los dos: quien crea
 * la tienda y quien luego le cambia el mercado desde el panel. Con dos copias,
 * una se queda atrás y el comerciante acaba con un canal en un idioma y un
 * customField en otro.
 */
export const LANG_CANAL: Record<Locale, string> = { zh: 'zh_Hans', es: 'es', en: 'en' };

export interface SesionPanel {
  token: string;
  correo: string;
  canal: CanalDelDueno;
  nombre: string;
  /** El diseño que eligió el dueño: su panel se pinta con él. */
  design: StoreDesign;
  /** Mercado de su tienda: idioma y moneda que ven SUS clientes. */
  mercado: Locale;
  /** Moneda de su tienda. El panel enseñaba ¥ mientras su tienda cobraba en US$. */
  moneda: string;
  promesas: { entregaPlazo: string; entregaNota: string; pagoFormas: string; atencionNota: string };
}

export async function leerSesion(): Promise<SesionPanel | null> {
  const token = (await cookies()).get(COOKIE_PANEL)?.value;
  if (!token) return null;
  const yo = await ownerMe(token);
  if (!yo || yo.canales.length === 0) return null;
  const canal = yo.canales[0];
  const info = await loadStoreInfo(canal.token);
  return {
    token,
    correo: yo.identifier,
    canal,
    nombre: info?.name || canal.code,
    design: info?.design ?? DESIGN_PRESETS[0],
    mercado: info?.mercado ?? 'zh',
    moneda: info?.moneda ?? MONEDA_DE[info?.mercado ?? 'zh'],
    promesas: info?.promesas ?? { entregaPlazo: '', entregaNota: '', pagoFormas: '', atencionNota: '' },
  };
}

export function opcionesCookie(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

/**
 * La sesión para una página del back office.
 *
 * Next renderiza el layout y la página a la vez: que el layout redirija NO
 * impide que la página se pinte, así que cada página tiene que comprobarlo por
 * su cuenta. Dar por hecho que hay sesión aquí reventaba la petición con un
 * 500 en el log en vez de mandar limpio a la puerta.
 */
export async function exigirSesionPagina(): Promise<SesionPanel> {
  const s = await leerSesion();
  if (!s) redirect('/panel');
  return s;
}
