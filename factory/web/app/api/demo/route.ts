import { NextRequest, NextResponse } from 'next/server';
import { isValidDesign } from '../../../lib/design-generator';
import { takenDesignKeys } from '../../../lib/design-registry';
import { esPlantilla } from '../../../lib/plantillas';
import { findDesign, type StoreDesign } from '../../../lib/designs';
import { LOCALE, MONEDA_DE, esLocaleValido, type Locale } from '../../../lib/i18n';
import { getT } from '../../../lib/i18n-server';
import { rootDomain, slugify, storeUrl } from '../../../lib/tenant';
import { LANG_CANAL } from '../../../lib/panel-sesion';
import { adminLogin, adminRequest } from '../../../lib/vendure';

/**
 * Los errores de esta ruta salían de una constante fijada AL COMPILAR
 * (`LOCALE === 'zh'`), así que un comerciante que estaba viendo la página en
 * español recibía el aviso en chino, y uno en inglés también. Ahora se
 * resuelven con el idioma del visitante, como el resto del sitio.
 */

// El idioma de canal por mercado vive en lib/panel-sesion: lo usan también los
// ajustes del panel, y con dos copias una se queda atrás.
// Idioma de las TRADUCCIONES de producto: siempre `en`, aunque el texto sea
// chino. El panel de Vendure guarda en su idioma de interfaz (inglés por
// defecto); si los productos naciesen en zh_Hans, editar el nombre en el
// panel no se vería en la tienda. Con `en` los dos caminos convergen
// (ver la nota TRADUCCIONES en vendure/src/seed-demo.ts).
const LANG_PRODUCTO = 'en';

// Catálogo de ejemplo, en el idioma de CADA tienda. Los precios no son una
// conversión: son importes verosímiles en cada mercado, y por eso el chino no
// es el español multiplicado por nada.
const CATALOGO: Record<Locale, Array<{ name: string; slug: string; description: string; price: number }>> = {
  zh: [
    { name: '明星单品', slug: 'producto-estrella', description: '最受欢迎的一款。上架后换成你自己的商品。', price: 12900 },
    { name: '本周新品', slug: 'novedad-semana', description: '新上架的商品，用来试试你的目录。', price: 8900 },
    { name: '日常必备', slug: 'basico-imprescindible', description: '回购率最高的基础款。', price: 4900 },
    { name: '礼盒套装', slug: 'pack-regalo', description: '把几件商品组合起来一起卖。', price: 19900 },
  ],
  es: [
    { name: 'Producto estrella', slug: 'producto-estrella', description: 'El favorito de tus clientes. Sustitúyelo por tu producto real.', price: 2500 },
    { name: 'Novedad de la semana', slug: 'novedad-semana', description: 'Un lanzamiento reciente para probar tu catálogo.', price: 1800 },
    { name: 'Básico imprescindible', slug: 'basico-imprescindible', description: 'Ese artículo que nunca falta en el carrito.', price: 900 },
    { name: 'Pack de regalo', slug: 'pack-regalo', description: 'Combina productos y véndelos juntos.', price: 3200 },
  ],
  en: [
    { name: 'Best seller', slug: 'producto-estrella', description: 'Your customers\u2019 favourite. Replace it with your real product.', price: 2500 },
    { name: 'New this week', slug: 'novedad-semana', description: 'A recent arrival, to try out your catalogue.', price: 1800 },
    { name: 'Everyday basic', slug: 'basico-imprescindible', description: 'The one item that is always in the cart.', price: 900 },
    { name: 'Gift bundle', slug: 'pack-regalo', description: 'Put a few products together and sell them as one.', price: 3200 },
  ],
};

// Permisos del dueño de tienda: opera su catálogo, pedidos, clientes y
// promociones dentro de SU canal; solo lectura de configuración.
const OWNER_PERMISSIONS = [
  'CreateCatalog', 'ReadCatalog', 'UpdateCatalog', 'DeleteCatalog',
  'CreateOrder', 'ReadOrder', 'UpdateOrder', 'DeleteOrder',
  'CreateCustomer', 'ReadCustomer', 'UpdateCustomer',
  'CreatePromotion', 'ReadPromotion', 'UpdatePromotion', 'DeletePromotion',
  'CreateTag', 'ReadTag', 'UpdateTag', 'DeleteTag',
  'ReadShippingMethod', 'ReadPaymentMethod', 'ReadCountry', 'ReadSettings',
];

const SANDBOX_DAYS = 14;

/**
 * Válvula anti-inundación por IP.
 *
 * OJO con lo que esto es y lo que NO es. El límite de producto —una tienda por
 * comerciante— NO vive aquí: lo impone el propio catálogo, que rechaza un
 * correo que ya tiene tienda comprobándolo contra la base. Ese sí es durable y
 * ese sí es el que cuenta.
 *
 * Esto de aquí solo existe para que nadie monte un guion y cree tiendas en
 * bucle con correos inventados. Por eso es ancho: en China la mayoría del
 * tráfico móvil sale por CGNAT, o sea que una IP pública puede ser un edificio
 * entero, una oficina o media facultad. Un límite estrecho por IP no frena al
 * que abusa —le sobra con cambiar de red— y en cambio deja fuera a
 * comerciantes de verdad que no han hecho nada, por culpa de un vecino.
 *
 * Dos cosas que estaban mal y costaron una tarde de pruebas:
 *
 * - Contaba INTENTOS, no tiendas. Se llamaba antes de validar nada, así que
 *   equivocarse dos veces de correo —que no crea ninguna tienda— gastaba dos
 *   de los tres huecos. Ahora solo se apunta la creación que sale bien.
 * - No decía cuándo se podía reintentar. Ahora devuelve los minutos que faltan
 *   y la cabecera Retry-After.
 *
 * El contador vive en memoria: se reinicia en cada despliegue y no se comparte
 * entre instancias. Para una válvula de este ancho es suficiente; el día que
 * haya más de una instancia, esto se muda a la base (o a Redis) y el límite
 * de producto no se entera, porque no está aquí.
 */
const MAX_POR_IP = 10;
const VENTANA_MS = 60 * 60 * 1000;
const creationsByIp = new Map<string, number[]>();

/** Minutos que faltan para tener hueco, o 0 si lo hay. */
function esperaPorIp(ip: string): number {
  const ahora = Date.now();
  const recientes = (creationsByIp.get(ip) || []).filter(t => t > ahora - VENTANA_MS);
  creationsByIp.set(ip, recientes);
  if (recientes.length < MAX_POR_IP) return 0;
  const libera = recientes[0] + VENTANA_MS;
  return Math.max(1, Math.ceil((libera - ahora) / 60000));
}

/** Se apunta SOLO cuando la tienda existe de verdad. */
function apuntarCreacion(ip: string) {
  const recientes = creationsByIp.get(ip) || [];
  recientes.push(Date.now());
  creationsByIp.set(ip, recientes);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  // Idioma del visitante: sus avisos salen en el idioma en el que está
  // mirando la página, no en el del build.
  const t = await getT();
  let payload: {
    storeName?: string;
    designKey?: string;
    design?: unknown;
    ownerEmail?: string;
    ownerPassword?: string;
    mercado?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: t('demo.err.peticion') }, { status: 400 });
  }
  const storeName = (payload.storeName || '').trim();
  const ownerEmail = (payload.ownerEmail || '').trim().toLowerCase();
  const ownerPassword = payload.ownerPassword || '';
  // El mercado de la tienda: idioma y moneda de lo que verán SUS clientes.
  // Si no viene, se queda en el del lanzamiento, que es lo que había antes.
  const mercado: Locale = esLocaleValido(payload.mercado) ? payload.mercado : LOCALE;
  const lang = LANG_CANAL[mercado];
  const moneda = MONEDA_DE[mercado];
  if (storeName.length < 2 || storeName.length > 40) {
    return NextResponse.json({ error: t('demo.err.nombre') }, { status: 400 });
  }
  if (!EMAIL_RE.test(ownerEmail)) {
    return NextResponse.json({ error: t('demo.err.correo') }, { status: 400 });
  }
  if (ownerPassword.length < 8) {
    return NextResponse.json({ error: t('demo.err.clave') }, { status: 400 });
  }
  // El ÚLTIMO valor de x-forwarded-for es el que añade nuestro proxy (Caddy
  // lo apila), así que es el único que el visitante no puede inventarse. Con
  // el primero, cualquiera saltaba el límite mandando una cabecera al azar.
  const reenviado = (req.headers.get('x-forwarded-for') || '').split(',').map(v => v.trim()).filter(Boolean);
  const ip = reenviado[reenviado.length - 1] || 'local';
  const esperaMin = esperaPorIp(ip);
  if (esperaMin > 0) {
    return NextResponse.json(
      {
        error: t('demo.err.valvula', { min: String(esperaMin) }),
        reintentarEnMin: esperaMin,
      },
      { status: 429, headers: { 'Retry-After': String(esperaMin * 60) } },
    );
  }

  // Diseño: o una propuesta completa del diseñador (con huella única), o un
  // preset por clave (compatibilidad con la Fase 0 y las pruebas de humo).
  const customDesign: StoreDesign | null = isValidDesign(payload.design) ? payload.design : null;
  const design = customDesign ?? findDesign(payload.designKey || '');
  const baseSlug = slugify(storeName) || 'tienda';

  try {
    const auth = await adminLogin();

    // Registro de unicidad: la huella elegida no puede pertenecer ya a otra
    // tienda (los presets de la Fase 0 quedan exentos).
    // Una PLANTILLA es reutilizable por definición y queda exenta del registro.
    // El registro solo protege lo que promete exclusividad: el diseño de IA.
    if (customDesign && !esPlantilla(customDesign.key)) {
      const taken = await takenDesignKeys(auth);
      if (taken.has(customDesign.key)) {
        return NextResponse.json(
          { error: t('demo.err.disenotomado') },
          { status: 409 },
        );
      }
    }

    // El correo del dueño debe estar libre ANTES de crear nada.
    const existing = await adminRequest<{ administrators: { totalItems: number } }>(
      auth,
      `query CheckEmail($email: String!) {
        administrators(options: { filter: { emailAddress: { eq: $email } } }) { totalItems }
      }`,
      { email: ownerEmail },
    );
    if (existing.administrators.totalItems > 0) {
      return NextResponse.json(
        { error: t('demo.err.correoconTienda') },
        { status: 409 },
      );
    }

    const zonesData = await adminRequest<{ zones: { items: Array<{ id: string; name: string }> } }>(
      auth,
      `{ zones(options: { take: 10 }) { items { id name } } }`,
    );
    const zone = zonesData.zones.items[0];
    if (!zone) throw new Error('El servidor de tiendas no está inicializado (sin zonas).');

    // Crea el canal; si el slug está ocupado, prueba con sufijos.
    let ultimoError = '';
    let channel: { id: string; token: string } | null = null;
    let slug = baseSlug;
    const expiresAt = new Date(Date.now() + SANDBOX_DAYS * 24 * 60 * 60 * 1000).toISOString();
    for (let attempt = 0; attempt < 3 && !channel; attempt++) {
      if (attempt > 0) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      let result: {
        createChannel: { __typename: string; id?: string; token?: string; message?: string };
      };
      try {
        result = await adminRequest(
          auth,
          `mutation CreateChannel($input: CreateChannelInput!) {
            createChannel(input: $input) {
              __typename
              ... on Channel { id token }
              ... on ErrorResult { message }
            }
          }`,
          {
            input: {
              code: slug,
              token: slug,
              defaultLanguageCode: lang,
              availableLanguageCodes: [lang],
              pricesIncludeTax: true,
              defaultCurrencyCode: moneda,
              availableCurrencyCodes: [moneda],
              defaultTaxZoneId: zone.id,
              defaultShippingZoneId: zone.id,
              customFields: {
                displayName: storeName,
                mercado,
                design: JSON.stringify(design),
                isSandbox: true,
                expiresAt,
              },
            },
          },
        );
      } catch (err) {
        // Nombre/código ya ocupado (Vendure lanza el error de restricción única
        // en vez de devolver su ErrorResult): reintenta con sufijo.
        //
        // Se deja rastro en el log: este catch se tragaba TODO, y cuando el
        // fallo no era el nombre —un idioma que Vendure no acepta, por
        // ejemplo— el comerciante recibía "ese nombre ya está en uso", que es
        // mentira, y no había forma de saber qué pasaba de verdad.
        ultimoError = err instanceof Error ? err.message : String(err);
        console.error('[demo] createChannel falló:', ultimoError);
        continue;
      }
      if (result.createChannel.__typename === 'Channel') {
        channel = { id: result.createChannel.id!, token: result.createChannel.token! };
      } else {
        // La otra mitad del mismo agujero: Vendure puede devolver un
        // ErrorResult en vez de lanzar, y esto lo descartaba en silencio.
        ultimoError = result.createChannel.message || result.createChannel.__typename;
        console.error('[demo] createChannel rechazó:', ultimoError);
      }
    }
    if (!channel) {
      return NextResponse.json(
        {
          error: t('demo.err.nombretomado'),
          detalle: ultimoError,
        },
        { status: 409 },
      );
    }

    // La tienda debe poder vender desde el minuto uno: se le asignan los
    // métodos de envío y de pago de la plataforma a su canal.
    const methods = await adminRequest<{
      shippingMethods: { items: Array<{ id: string }> };
      paymentMethods: { items: Array<{ id: string; enabled: boolean; handler: { code: string } }> };
      stockLocations: { items: Array<{ id: string }> };
    }>(
      auth,
      `{
        shippingMethods { items { id } }
        paymentMethods { items { id enabled handler { code } } }
        stockLocations { items { id } }
      }`,
    );
    const shippingMethodIds = methods.shippingMethods.items.map(m => m.id);
    const paymentMethodIds = methods.paymentMethods.items.filter(m => m.enabled).map(m => m.id);
    // 会员储值: la semilla lo crea en bases nuevas; en una base anterior a la
    // función no existe, así que se crea aquí una sola vez y de paso queda
    // para las tiendas siguientes.
    if (!methods.paymentMethods.items.some(m => m.handler.code === 'saldo-fabrica')) {
      try {
        const nuevo = await adminRequest<{ createPaymentMethod: { id: string } }>(
          auth,
          `mutation Saldo($input: CreatePaymentMethodInput!) {
            createPaymentMethod(input: $input) { id }
          }`,
          {
            input: {
              code: 'saldo-fabrica',
              enabled: true,
              translations: [{ languageCode: 'en', name: '会员储值' }],
              handler: { code: 'saldo-fabrica', arguments: [] },
              checker: { code: 'saldo-elegible', arguments: [] },
            },
          },
        );
        paymentMethodIds.push(nuevo.createPaymentMethod.id);
      } catch {
        /* sin el método la tienda sigue vendiendo con los otros tres */
      }
    }
    if (shippingMethodIds.length) {
      await adminRequest(
        auth,
        `mutation AssignShipping($input: AssignShippingMethodsToChannelInput!) {
          assignShippingMethodsToChannel(input: $input) { id }
        }`,
        { input: { channelId: channel.id, shippingMethodIds } },
      );
    }
    if (paymentMethodIds.length) {
      await adminRequest(
        auth,
        `mutation AssignPayment($input: AssignPaymentMethodsToChannelInput!) {
          assignPaymentMethodsToChannel(input: $input) { id }
        }`,
        { input: { channelId: channel.id, paymentMethodIds } },
      );
    }
    const stockLocationIds = methods.stockLocations.items.map(s => s.id);
    if (stockLocationIds.length) {
      await adminRequest(
        auth,
        `mutation AssignStock($input: AssignStockLocationsToChannelInput!) {
          assignStockLocationsToChannel(input: $input) { id }
        }`,
        { input: { channelId: channel.id, stockLocationIds } },
      );
    }

    const taxData = await adminRequest<{ taxCategories: { items: Array<{ id: string }> } }>(
      auth,
      `{ taxCategories { items { id } } }`,
    );
    const taxCategoryId = taxData.taxCategories.items[0]?.id;

    for (const p of CATALOGO[mercado]) {
      const created = await adminRequest<{ createProduct: { id: string } }>(
        auth,
        `mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) { id }
        }`,
        {
          input: {
            enabled: true,
            translations: [
              { languageCode: LANG_PRODUCTO, name: p.name, slug: `${slug}-${p.slug}`, description: p.description },
            ],
          },
        },
        channel.token,
      );
      await adminRequest(
        auth,
        `mutation CreateVariants($input: [CreateProductVariantInput!]!) {
          createProductVariants(input: $input) { id }
        }`,
        {
          input: [
            {
              productId: created.createProduct.id,
              sku: `${slug}-${p.slug}`,
              price: p.price,
              taxCategoryId,
              stockOnHand: 25,
              translations: [{ languageCode: LANG_PRODUCTO, name: p.name }],
            },
          ],
        },
        channel.token,
      );
    }

    // Cuenta del dueño: rol restringido a SU canal + administrador.
    const role = await adminRequest<{ createRole: { id: string } }>(
      auth,
      `mutation CreateRole($input: CreateRoleInput!) {
        createRole(input: $input) { id }
      }`,
      {
        input: {
          code: `owner-${slug}`,
          description: `Dueño de la tienda ${storeName}`,
          permissions: OWNER_PERMISSIONS,
          channelIds: [channel.id],
        },
      },
    );
    await adminRequest(
      auth,
      `mutation CreateAdmin($input: CreateAdministratorInput!) {
        createAdministrator(input: $input) { id }
      }`,
      {
        input: {
          firstName: storeName,
          lastName: '(dueño)',
          emailAddress: ownerEmail,
          password: ownerPassword,
          roleIds: [role.createRole.id],
        },
      },
    );

    // La tienda existe: ahora sí gasta hueco de la válvula (ver esperaPorIp).
    apuntarCreacion(ip);

    const base = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;
    return NextResponse.json({
      url: storeUrl(channel.token),
      panelUrl: `${base}/panel`,
      channelsUrl: `${base}/canales/${channel.token}`,
      ownerEmail,
      expiresAt,
    });
  } catch (err) {
    console.error('[demo] Error creando tienda sandbox:', err);
    return NextResponse.json(
      { error: t('demo.err.general') },
      { status: 500 },
    );
  }
}
