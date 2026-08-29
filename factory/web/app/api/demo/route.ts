import { NextRequest, NextResponse } from 'next/server';
import { findDesign } from '../../../lib/designs';
import { slugify, storeUrl } from '../../../lib/tenant';
import { adminLogin, adminRequest } from '../../../lib/vendure';

const SAMPLE_PRODUCTS = [
  { name: 'Producto estrella', slug: 'producto-estrella', description: 'El favorito de tus clientes. Sustitúyelo por tu producto real.', price: 2500 },
  { name: 'Novedad de la semana', slug: 'novedad-semana', description: 'Un lanzamiento reciente para probar tu catálogo.', price: 1800 },
  { name: 'Básico imprescindible', slug: 'basico-imprescindible', description: 'Ese artículo que nunca falta en el carrito.', price: 900 },
  { name: 'Pack de regalo', slug: 'pack-regalo', description: 'Combina productos y véndelos juntos.', price: 3200 },
];

export async function POST(req: NextRequest) {
  let payload: { storeName?: string; designKey?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Petición inválida.' }, { status: 400 });
  }
  const storeName = (payload.storeName || '').trim();
  if (storeName.length < 2 || storeName.length > 40) {
    return NextResponse.json({ error: 'El nombre debe tener entre 2 y 40 caracteres.' }, { status: 400 });
  }
  const design = findDesign(payload.designKey || '');
  const baseSlug = slugify(storeName) || 'tienda';

  try {
    const auth = await adminLogin();

    const zonesData = await adminRequest<{ zones: { items: Array<{ id: string; name: string }> } }>(
      auth,
      `{ zones(options: { take: 10 }) { items { id name } } }`,
    );
    const zone = zonesData.zones.items[0];
    if (!zone) throw new Error('El servidor de tiendas no está inicializado (sin zonas).');

    // Crea el canal; si el slug está ocupado, prueba con sufijos.
    let channel: { id: string; token: string } | null = null;
    let slug = baseSlug;
    for (let attempt = 0; attempt < 3 && !channel; attempt++) {
      if (attempt > 0) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const result = await adminRequest<{
        createChannel: { __typename: string; id?: string; token?: string; message?: string };
      }>(
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
            },
          },
        },
      );
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

    return NextResponse.json({ url: storeUrl(channel.token) });
  } catch (err) {
    console.error('[demo] Error creando tienda sandbox:', err);
    return NextResponse.json(
      { error: 'No se pudo crear la tienda demo. Inténtalo de nuevo en un momento.' },
      { status: 500 },
    );
  }
}
