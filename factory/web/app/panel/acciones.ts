'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { dominioOcupado, nombreTxt, normalizarDominio, nuevoTestigo } from '../../lib/dominios';
import { MONEDA_DE, esLocaleValido } from '../../lib/i18n';
import { getT } from '../../lib/i18n-server';
import { borrarPromo, cobrarPedido, crearCupon, crearGruposDeVariantes, crearProducto, crearSeckill, enviarPedido, ajustarSaldo, cobrarConSaldo, guardarDistribuidores, guardarDominio, guardarProducto, guardarVariantes, informeDistribuidores, verDominio, verProducto } from '../../lib/panel-datos';
import { COOKIE_PANEL, LANG_CANAL, leerSesion, opcionesCookie } from '../../lib/panel-sesion';
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
/** Tope por producto. El comerciante pidió poder poner cinco; se dejan ocho. */
const MAX_FOTOS = 8;

/**
 * Sube las fotos nuevas y devuelve la lista final de assets del producto.
 *
 * Antes solo cabía UNA: cada guardado hacía `assetIds: [assetId]` y borraba la
 * anterior, así que un producto no podía enseñarse por más de un lado. Ahora se
 * acumulan, se pueden quitar de una en una, y la primera es la portada.
 */
async function fotosFinales(
  s: { token: string; canal: { token: string } },
  datos: FormData,
  actuales: string[],
): Promise<{ ids: string[]; error?: string }> {
  const quitar = new Set(datos.getAll('quitarFoto').map(String));
  let ids = actuales.filter(id => !quitar.has(id));

  const nuevas = datos.getAll('fotos').filter((f): f is File => f instanceof File && f.size > 0);
  for (const foto of nuevas) {
    if (ids.length >= MAX_FOTOS) break;
    if (foto.size > MAX_FOTO) return { ids, error: 'grande' };
    const id = await subirFoto(s.token, s.canal.token, foto);
    if (id) ids.push(id);
  }
  return { ids };
}

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
  const t = await getT(s.mercado);
  const id = String(datos.get('id') || '');
  const nombre = String(datos.get('nombre') || '').trim();
  if (!id || !nombre) return { error: t('pn.pr.falta') };

  const actual = await verProducto(s, id);
  if (!actual.producto) return { error: t('pn.error', { msg: actual.error || 'x' }) };

  const { ids: fotoIds, error: errorFoto } = await fotosFinales(
    s,
    datos,
    actual.producto.fotos.map(f => f.id),
  );
  if (errorFoto) return { error: t('pn.pr.foto.ayuda') };
  await panelRequest(
    s.token,
    s.canal.token,
    `mutation Fotos($input: UpdateProductInput!) { updateProduct(input: $input) { id } }`,
    { input: { id, assetIds: fotoIds, featuredAssetId: fotoIds[0] ?? null } },
  );

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

  // Con varias variantes, cada fila del formulario trae precio-<id> y
  // stock-<id>: se guardan de una tacada.
  const cambios = actual.producto.variants
    .filter(v => datos.has(`precio-${v.id}`))
    .map(v => ({
      id: v.id,
      precio: aCentimos(datos.get(`precio-${v.id}`)),
      stock: Math.max(0, Math.round(Number(datos.get(`stock-${v.id}`) || 0))),
    }));
  const errV = await guardarVariantes(s, cambios);
  if (errV) return { error: t('pn.error', { msg: errV }) };

  revalidatePath('/panel/productos');
  return { ok: t('pn.pr.guardado') };
}

/**
 * Envío de la tienda: tarifa plana y "gratis a partir de".
 *
 * Cada tienda tiene SU método de envío (envio-<slug>) con la calculadora
 * envio-fabrica. La primera vez se crea en el canal del comerciante y se
 * retiran de ese canal los métodos compartidos de la semilla, para que el
 * comprador vea UNA opción con la tarifa que puso el dueño y no dos. Las
 * mutaciones van con la credencial del servidor porque el rol del dueño no
 * llega a métodos de envío, pero el canal sale de SU sesión, nunca del
 * navegador.
 */
export async function accionEnvio(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const tarifa = aCentimos(datos.get('envioTarifa'));
  const gratisDesde = aCentimos(datos.get('envioGratisDesde'));
  const codigo = `envio-${s.canal.token}`;
  const args = {
    checker: { code: 'default-shipping-eligibility-checker', arguments: [{ name: 'orderMinimum', value: '0' }] },
    calculator: {
      code: 'envio-fabrica',
      arguments: [
        { name: 'tarifa', value: String(tarifa) },
        { name: 'gratisDesde', value: String(gratisDesde) },
      ],
    },
  };
  try {
    const superAuth = await adminLogin();
    const lista = await adminRequest<{ shippingMethods: { items: Array<{ id: string; code: string }> } }>(
      superAuth,
      `{ shippingMethods(options: { take: 100 }) { items { id code } } }`,
      undefined,
      s.canal.token,
    );
    const propio = lista.shippingMethods.items.find(m => m.code === codigo);
    if (propio) {
      await adminRequest(
        superAuth,
        `mutation Envio($input: UpdateShippingMethodInput!) { updateShippingMethod(input: $input) { id } }`,
        { input: { id: propio.id, ...args } },
        s.canal.token,
      );
    } else {
      await adminRequest(
        superAuth,
        `mutation Envio($input: CreateShippingMethodInput!) { createShippingMethod(input: $input) { id } }`,
        {
          input: {
            code: codigo,
            fulfillmentHandler: 'manual-fulfillment',
            translations: [{ languageCode: 'en', name: t('pn.en.metodo') }],
            ...args,
          },
        },
        s.canal.token,
      );
      // Fuera los métodos compartidos: si se quedan, el comprador ve dos
      // tarifas y una no la puso el dueño.
      const ajenos = lista.shippingMethods.items.filter(m => m.code !== codigo);
      if (ajenos.length) {
        await adminRequest(
          superAuth,
          `mutation Quitar($input: RemoveShippingMethodsFromChannelInput!) {
            removeShippingMethodsFromChannel(input: $input) { id }
          }`,
          { input: { channelId: s.canal.id, shippingMethodIds: ajenos.map(m => m.id) } },
        );
      }
    }
  } catch (err) {
    return { error: t('pn.error', { msg: err instanceof Error ? err.message : 'x' }) };
  }
  revalidatePath('/panel/tienda');
  return { ok: t('pn.pr.guardado') };
}

/**
 * Convierte un producto simple en uno con variantes (颜色 / 尺码…).
 * Los valores llegan separados por coma o por 、 (el separador chino).
 */
export async function accionCrearVariantes(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const id = String(datos.get('id') || '');
  if (!id) return { error: t('pn.pr.falta') };

  const grupos: Array<{ nombre: string; valores: string[] }> = [];
  for (const n of [1, 2]) {
    const nombre = String(datos.get(`grupo${n}nombre`) || '').trim();
    const valores = String(datos.get(`grupo${n}valores`) || '')
      .split(/[,，、]/)
      .map(v => v.trim())
      .filter(Boolean)
      .slice(0, 12);
    if (nombre && valores.length >= 2) grupos.push({ nombre, valores });
  }
  if (grupos.length === 0) return { error: t('pn.va.falta') };

  const error = await crearGruposDeVariantes(s, id, grupos);
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath(`/panel/productos/${id}`);
  return { ok: t('pn.va.creadas') };
}

export async function accionCrearProducto(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const nombre = String(datos.get('nombre') || '').trim();
  const precio = aCentimos(datos.get('precio'));
  if (!nombre || precio <= 0) return { error: t('pn.pr.falta') };

  const { ids: fotoIds, error: errorFoto } = await fotosFinales(s, datos, []);
  if (errorFoto) return { error: t('pn.pr.foto.ayuda') };

  const { id, error } = await crearProducto(s, {
    nombre,
    descripcion: String(datos.get('descripcion') || ''),
    precio,
    stock: Math.max(0, Math.round(Number(datos.get('stock') || 0))),
    slug: `${huella(nombre)}-${Date.now().toString(36)}`,
    assetIds: fotoIds,
  });
  if (error || !id) return { error: t('pn.error', { msg: error || 'x' }) };
  revalidatePath('/panel/productos');
  redirect(`/panel/productos/${id}`);
}

/* -------------------------------- pedidos -------------------------------- */

export async function accionCobrar(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const error = await cobrarPedido(s, String(datos.get('pagoId') || ''));
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath(`/panel/pedidos`);
  return { ok: t('pn.pe.cobrado') };
}

export async function accionEnviar(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const error = await enviarPedido(s, String(datos.get('pedidoId') || ''), String(datos.get('seguimiento') || ''));
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath(`/panel/pedidos`);
  return { ok: t('pn.pe.enviado') };
}

/* --------------------------------- tienda -------------------------------- */

/**
 * Ajustes de la tienda: nombre, mercado y lo que promete a sus clientes.
 *
 * Los plazos de entrega y las formas de pago los escribe el COMERCIANTE. Antes
 * estaban en el diccionario de la fábrica, así que su escaparate prometía
 * entrega en 24-48 h y pago por WeChat o Alipay sin que él lo hubiera decidido
 * ni pudiera cambiarlo. Lo que deje vacío, su tienda no lo enseña.
 */
export async function accionAjustesTienda(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const nombre = String(datos.get('nombre') || '').trim();
  if (nombre.length < 2) return { error: t('pn.pr.falta') };

  const mercadoPedido = String(datos.get('mercado') || '');
  const mercado = esLocaleValido(mercadoPedido) ? mercadoPedido : s.mercado;
  const texto = (k: string, max: number) => String(datos.get(k) || '').trim().slice(0, max);

  // El rol del dueño NO puede tocar canales, y está bien que no pueda: ahí
  // viven la moneda, los idiomas y el token de la tienda. El cambio lo hace el
  // servidor con su propia credencial, y solo después de que Vendure haya
  // confirmado que esta sesión es dueña de ESE canal — el id sale de `me`, no
  // de lo que mande el navegador.
  try {
    const superAuth = await adminLogin();
    await adminRequest(
      superAuth,
      `mutation Tienda($input: UpdateChannelInput!) { updateChannel(input: $input) {
        __typename ... on Channel { id } ... on ErrorResult { message }
      } }`,
      {
        input: {
          id: s.canal.id,
          defaultLanguageCode: LANG_CANAL[mercado],
          availableLanguageCodes: [LANG_CANAL[mercado]],
          defaultCurrencyCode: MONEDA_DE[mercado],
          availableCurrencyCodes: [MONEDA_DE[mercado]],
          customFields: {
            displayName: nombre,
            mercado,
            entregaPlazo: texto('entregaPlazo', 60),
            entregaNota: texto('entregaNota', 80),
            pagoFormas: texto('pagoFormas', 80),
            atencionNota: texto('atencionNota', 80),
          },
        },
      },
    );
  } catch (err) {
    return { error: t('pn.error', { msg: err instanceof Error ? err.message : 'x' }) };
  }
  revalidatePath('/panel/tienda');
  return { ok: t('pn.pr.guardado') };
}

/* ------------------------------- marketing -------------------------------- */

export async function accionCrearCupon(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const nombre = String(datos.get('nombre') || '').trim();
  const codigo = String(datos.get('codigo') || '').trim().toUpperCase().replace(/\s+/g, '');
  const tipo = datos.get('tipo') === 'fijo' ? ('fijo' as const) : ('pct' as const);
  const bruto = Number(String(datos.get('valor') || '0').replace(',', '.'));
  // El % va tal cual (30 = 30%); el importe fijo va en céntimos.
  const valor = tipo === 'pct' ? Math.round(bruto) : Math.round(bruto * 100);
  const minimo = aCentimos(datos.get('minimo'));
  const caducaRaw = String(datos.get('caduca') || '').trim();
  if (!nombre || !codigo || valor <= 0 || (tipo === 'pct' && valor > 100)) {
    return { error: t('pn.mk.falta') };
  }
  const caduca = caducaRaw ? new Date(caducaRaw).toISOString() : null;
  const error = await crearCupon(s, { nombre, codigo, tipo, valor, minimo, caduca });
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath('/panel/marketing');
  return { ok: t('pn.mk.creado') };
}

export async function accionCrearSeckill(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const nombre = String(datos.get('nombre') || '').trim();
  const pct = Math.round(Number(datos.get('pct') || 0));
  const terminaRaw = String(datos.get('termina') || '').trim();
  const productIds = datos.getAll('producto').map(String).filter(Boolean);
  if (!nombre || pct <= 0 || pct > 90 || !terminaRaw || productIds.length === 0) {
    return { error: t('pn.mk.falta') };
  }
  const termina = new Date(terminaRaw);
  if (!(termina.getTime() > Date.now())) return { error: t('pn.mk.falta') };
  const error = await crearSeckill(s, { nombre, productIds, pct, termina: termina.toISOString() });
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath('/panel/marketing');
  return { ok: t('pn.mk.creado') };
}

export async function accionBorrarPromo(datos: FormData): Promise<void> {
  const s = await exigirSesion();
  const id = String(datos.get('id') || '');
  if (id) await borrarPromo(s, id);
  revalidatePath('/panel/marketing');
}

export async function accionAgregarDistribuidor(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const nombre = String(datos.get('nombre') || '').trim();
  const codigo = String(datos.get('codigo') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const comision = Math.round(Number(String(datos.get('comision') || '0').replace(',', '.')));
  if (!nombre || !codigo || comision < 0 || comision > 50) return { error: t('pn.mk.falta') };
  const lista = await informeDistribuidores(s);
  if (lista.some(d => d.codigo === codigo)) return { error: t('pn.mk.falta') };
  const plantel = [...lista.map(d => ({ codigo: d.codigo, nombre: d.nombre, comision: d.comision })), { codigo, nombre, comision }];
  const error = await guardarDistribuidores(s, plantel);
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath('/panel/marketing');
  return { ok: t('pn.mk.creado') };
}

export async function accionQuitarDistribuidor(datos: FormData): Promise<void> {
  const s = await exigirSesion();
  const codigo = String(datos.get('codigo') || '');
  const lista = await informeDistribuidores(s);
  const plantel = lista
    .filter(d => d.codigo !== codigo)
    .map(d => ({ codigo: d.codigo, nombre: d.nombre, comision: d.comision }));
  await guardarDistribuidores(s, plantel);
  revalidatePath('/panel/marketing');
}

/* ---------------------------- dominio propio ------------------------------ */

export async function accionDominio(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const dominio = normalizarDominio(String(datos.get('dominio') || ''));
  if (!dominio) return { error: t('pn.do.mal') };
  if (await dominioOcupado(dominio, s.canal.token)) return { error: t('pn.do.ocupado') };
  const error = await guardarDominio(s, { dominio, verificado: false, txt: nuevoTestigo() });
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath('/panel/tienda');
  return { ok: t('pn.do.guardado') };
}

export async function accionVerificarDominio(_prev: Estado, _datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const actual = await verDominio(s);
  if (!actual.dominio || !actual.txt) return { error: t('pn.do.mal') };
  let registros: string[][] = [];
  try {
    const { resolveTxt } = await import('node:dns/promises');
    registros = await resolveTxt(nombreTxt(actual.dominio));
  } catch {
    // NXDOMAIN, timeout… al comerciante le vale con "aún no se ve".
    return { error: t('pn.do.noverificado') };
  }
  const visto = registros.some(r => r.join('') === actual.txt);
  if (!visto) return { error: t('pn.do.noverificado') };
  const error = await guardarDominio(s, { ...actual, verificado: true });
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath('/panel/tienda');
  return { ok: t('pn.do.verificado') };
}

export async function accionQuitarDominio(_datos: FormData): Promise<void> {
  const s = await exigirSesion();
  await guardarDominio(s, { dominio: null, verificado: false, txt: null });
  revalidatePath('/panel/tienda');
}

/* ----------------------- clientes y 会员储值 ------------------------------ */

export async function accionRecargarSaldo(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const clienteId = String(datos.get('clienteId') || '');
  const bruto = Number(String(datos.get('importe') || '0').replace(',', '.'));
  const delta = Math.round(bruto * 100);
  const nota = String(datos.get('nota') || '').trim().slice(0, 80);
  if (!clienteId || !Number.isFinite(delta) || delta === 0) return { error: t('pn.cl.rec.mal') };
  const error = await ajustarSaldo(s, clienteId, delta, nota || (delta > 0 ? '充值' : '扣减'));
  if (error) return { error: t('pn.cl.rec.mal') };
  revalidatePath(`/panel/clientes/${clienteId}`);
  return { ok: t('pn.cl.rec.ok') };
}

export async function accionCobrarConSaldo(_prev: Estado, datos: FormData): Promise<Estado> {
  const s = await exigirSesion();
  const t = await getT(s.mercado);
  const pedidoId = String(datos.get('pedidoId') || '');
  if (!pedidoId) return { error: t('pn.cl.rec.mal') };
  const error = await cobrarConSaldo(s, pedidoId);
  if (error) return { error: t('pn.error', { msg: error }) };
  revalidatePath(`/panel/pedidos/${pedidoId}`);
  return { ok: t('pn.pe.saldo.ok') };
}
