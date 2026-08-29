import { NextRequest, NextResponse } from 'next/server';
import { findDesign } from '../../../lib/designs';
import { rootDomain, slugify, storeUrl } from '../../../lib/tenant';
import { adminLogin, adminRequest } from '../../../lib/vendure';

const SAMPLE_PRODUCTS = [
  { name: 'Producto estrella', slug: 'producto-estrella', description: 'El favorito de tus clientes. Sustitúyelo por tu producto real.', price: 2500 },
  { name: 'Novedad de la semana', slug: 'novedad-semana', description: 'Un lanzamiento reciente para probar tu catálogo.', price: 1800 },
  { name: 'Básico imprescindible', slug: 'basico-imprescindible', description: 'Ese artículo que nunca falta en el carrito.', price: 900 },
  { name: 'Pack de regalo', slug: 'pack-regalo', description: 'Combina productos y véndelos juntos.', price: 3200 },
];

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

// Límite simple anti-abuso del demo: 3 tiendas por IP por hora.
const creationsByIp = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const recent = (creationsByIp.get(ip) || []).filter(t => t > windowStart);
  if (recent.length >= 3) {
    creationsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  creationsByIp.set(ip, recent);
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  let payload: { storeName?: string; designKey?: string; ownerEmail?: string; ownerPassword?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Petición inválida.' }, { status: 400 });
  }
  const storeName = (payload.storeName || '').trim();
  const ownerEmail = (payload.ownerEmail || '').trim().toLowerCase();
  const ownerPassword = payload.ownerPassword || '';
  if (storeName.length < 2 || storeName.length > 40) {
    return NextResponse.json({ error: 'El nombre debe tener entre 2 y 40 caracteres.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(ownerEmail)) {
    return NextResponse.json({ error: 'Escribe un correo válido: será tu usuario del panel.' }, { status: 400 });
  }
  if (ownerPassword.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
  }
  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Has creado varias tiendas demo seguidas. Espera un rato e inténtalo de nuevo.' },
      { status: 429 },
    );
  }

  const design = findDesign(payload.designKey || '');
  const baseSlug = slugify(storeName) || 'tienda';

  try {
    const auth = await adminLogin();

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
        { error: 'Ese correo ya tiene una tienda. Usa otro correo o escríbenos para recuperarla.' },
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
              defaultLanguageCode: 'en',
              availableLanguageCodes: ['en'],
              pricesIncludeTax: true,
              defaultCurrencyCode: 'USD',
              availableCurrencyCodes: ['USD'],
              defaultTaxZoneId: zone.id,
              defaultShippingZoneId: zone.id,
              customFields: {
                displayName: storeName,
                design: JSON.stringify(design),
                isSandbox: true,
                expiresAt,
              },
            },
          },
        );
      } catch {
        // Nombre/código ya ocupado (Vendure lanza el error de restricción única
        // en vez de devolver su ErrorResult): reintenta con sufijo.
        continue;
      }
      if (result.createChannel.__typename === 'Channel') {
        channel = { id: result.createChannel.id!, token: result.createChannel.token! };
      }
    }
    if (!channel) {
      return NextResponse.json(
        { error: 'Ese nombre ya está en uso. Prueba con otro.' },
        { status: 409 },
      );
    }

    const taxData = await adminRequest<{ taxCategories: { items: Array<{ id: string }> } }>(
      auth,
      `{ taxCategories { items { id } } }`,
    );
    const taxCategoryId = taxData.taxCategories.items[0]?.id;

    for (const p of SAMPLE_PRODUCTS) {
      const created = await adminRequest<{ createProduct: { id: string } }>(
        auth,
        `mutation CreateProduct($input: CreateProductInput!) {
          createProduct(input: $input) { id }
        }`,
        {
          input: {
            enabled: true,
            translations: [
              { languageCode: 'en', name: p.name, slug: `${slug}-${p.slug}`, description: p.description },
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
              translations: [{ languageCode: 'en', name: p.name }],
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

    const base = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;
    return NextResponse.json({
      url: storeUrl(channel.token),
      panelUrl: `${base}/dashboard`,
      ownerEmail,
      expiresAt,
    });
  } catch (err) {
    console.error('[demo] Error creando tienda sandbox:', err);
    return NextResponse.json(
      { error: 'No se pudo crear la tienda demo. Inténtalo de nuevo en un momento.' },
      { status: 500 },
    );
  }
}
