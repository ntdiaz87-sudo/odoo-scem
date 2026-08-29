'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getT } from '../../lib/i18n-server';
import { cobrarPedido, crearProducto, enviarPedido, guardarProducto, verProducto } from '../../lib/panel-datos';
import { COOKIE_PANEL, leerSesion, opcionesCookie } from '../../lib/panel-sesion';
import { adminLogin, adminRequest, ownerLogin, ownerLogout, ownerMe, panelRequest } from '../../lib/vendure';

const API_URL = process.env.VENDURE_API_URL || 'http://localhost:3000';
const OCHO_HORAS = 60 * 60 * 8;

export interface Estado {
  error?: string;
  ok?: string;
}

/* --------------------------------- sesión -------------------------------- */

export async function entrar(_prev: Estado, datos: FormData): Promise<Estado> {
  const t = await getT();
  const correo = String(datos.get('correo') || '').trim().toLowerCase();
  const clave = String(datos.get('clave') || '');
  if (!correo || !clave) return { error: t('pn.mal') };

  const token = await ownerLogin(correo, clave);
  if (!token) return { error: t('pn.mal') };

  const yo = await ownerMe(token);
  if (!yo || yo.canales.length === 0) {
    await ownerLogout(token);
    return { error: t('pn.sintienda') };
  }
  (await cookies()).set(COOKIE_PANEL, token, opcionesCookie(OCHO_HORAS));
  redirect('/panel/inicio');
}

export async function salir() {
  const galleta = await cookies();
  const token = galleta.get(COOKIE_PANEL)?.value;
  if (token) await ownerLogout(token);
  galleta.set(COOKIE_PANEL, '', opcionesCookie(0));
  redirect('/panel');
}

/** Toda acción del back office empieza aquí: sin sesión válida, a la puerta. */
async function exigirSesion() {
  const s = await leerSesion();
  if (!s) redirect('/panel');
  return s;
}

/* ------------------------------- productos ------------------------------- */

function aCentimos(v: FormDataEntryValue | null): number {
  const n = Number(String(v || '0').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}

/** Sube la foto a Vendure. GraphQL multipart: operations + map + el fichero. */
async function subirFoto(token: string, canal: string, foto: File): Promise<string | null> {
  const cuerpo = new FormData();
  cuerpo.append(
    'operations',
    JSON.stringify({
      query: `mutation Subir($input: [CreateAssetInput!]!) { createAssets(input: $input) {
        __typename ... on Asset { id } ... on ErrorResult { message }
      } }`,
      variables: { input: [{ file: null }] },
    }),
  );
  cuerpo.append('map', JSON.stringify({ '0': ['variables.input.0.file'] }));
  cuerpo.append('0', foto, foto.name);
  const res = await fetch(`${API_URL}/admin-api`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'vendure-token': canal, 'apollo-require-preflight': 'true' },
    body: cuerpo,
    cache: 'no-store',
  });
  const json = (await res.json()) as { data?: { createAssets: Array<{ __typename: string; id?: string }> } };
  const a = json.data?.createAssets?.[0];
  return a && a.__typename === 'Asset' ? a.id! : null;
}

const MAX_FOTO = 5 * 1024 * 1024;

function huella(nombre: string): string {
  // El slug de Vendure debe ser único y ASCII; un nombre chino no da nada, así
  // que se cae a un identificador corto en vez de dejarlo vacío.
  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || `p-${Date.now().toString(36)}`;
}

export async function accionGuardarProducto(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT();
  const id = String(datos.get('id') || '');
  const nombre = String(datos.get('nombre') || '').trim();
  if (!id || !nombre) return { error: t('pn.pr.falta') };

  const actual = await verProducto(s, id);
  if (!actual.producto) return { error: t('pn.error', { msg: actual.error || 'x' }) };

  const foto = datos.get('foto');
  if (foto instanceof File && foto.size > 0) {
    if (foto.size > MAX_FOTO) return { error: t('pn.pr.foto.ayuda') };
    const assetId = await subirFoto(s.token, s.canal.token, foto);
    if (assetId) {
      await panelRequest(
        s.token,
        s.canal.token,
        `mutation Foto($input: UpdateProductInput!) { updateProduct(input: $input) { id } }`,
        { input: { id, assetIds: [assetId], featuredAssetId: assetId } },
      );
    }
  }

  const error = await guardarProducto(s, {
    id,
    slug: actual.producto.slug,
    nombre,
    descripcion: String(datos.get('descripcion') || ''),
    publicado: datos.get('publicado') === 'on',
    varianteId: String(datos.get('varianteId') || ''),
    precio: aCentimos(datos.get('precio')),
    stock: Math.max(0, Math.round(Number(datos.get('stock') || 0))),
  });
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath('/panel/productos');
  return { ok: t('pn.pr.guardado') };
}

export async function accionCrearProducto(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT();
  const nombre = String(datos.get('nombre') || '').trim();
  const precio = aCentimos(datos.get('precio'));
  if (!nombre || precio <= 0) return { error: t('pn.pr.falta') };

  let assetId: string | undefined;
  const foto = datos.get('foto');
  if (foto instanceof File && foto.size > 0) {
    if (foto.size > MAX_FOTO) return { error: t('pn.pr.foto.ayuda') };
    assetId = (await subirFoto(s.token, s.canal.token, foto)) || undefined;
  }

  const { id, error } = await crearProducto(s, {
    nombre,
    descripcion: String(datos.get('descripcion') || ''),
    precio,
    stock: Math.max(0, Math.round(Number(datos.get('stock') || 0))),
    slug: `${huella(nombre)}-${Date.now().toString(36)}`,
    assetId,
  });
  if (error || !id) return { error: t('pn.error', { msg: error || 'x' }) };
  revalidatePath('/panel/productos');
  redirect(`/panel/productos/${id}`);
}

/* -------------------------------- pedidos -------------------------------- */

export async function accionCobrar(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT();
  const error = await cobrarPedido(s, String(datos.get('pagoId') || ''));
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath(`/panel/pedidos`);
  return { ok: t('pn.pe.cobrado') };
}

export async function accionEnviar(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT();
  const error = await enviarPedido(s, String(datos.get('pedidoId') || ''), String(datos.get('seguimiento') || ''));
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath(`/panel/pedidos`);
  return { ok: t('pn.pe.enviado') };
}

/* --------------------------------- tienda -------------------------------- */

export async function accionNombreTienda(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT();
  const nombre = String(datos.get('nombre') || '').trim();
  if (nombre.length < 2) return { error: t('pn.pr.falta') };
  // El rol del dueño NO puede tocar canales, y está bien que no pueda: ahí
  // viven la moneda, los idiomas y el token de la tienda. El cambio de nombre
  // lo hace el servidor con su propia credencial, y solo después de que
  // Vendure haya confirmado que esta sesión es dueña de ESE canal — el id sale
  // de `me`, no de lo que mande el navegador.
  try {
    const superAuth = await adminLogin();
    await adminRequest(
      superAuth,
      `mutation Tienda($input: UpdateChannelInput!) { updateChannel(input: $input) {
        __typename ... on Channel { id } ... on ErrorResult { message }
      } }`,
      { input: { id: s.canal.id, customFields: { displayName: nombre } } },
    );
  } catch (err) {
    return { error: t('pn.error', { msg: err instanceof Error ? err.message : 'x' }) };
  }
  revalidatePath('/panel/tienda');
  return { ok: t('pn.pr.guardado') };
}
