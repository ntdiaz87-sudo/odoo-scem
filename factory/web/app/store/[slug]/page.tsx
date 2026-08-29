import type { StoreDesign } from '../../../lib/designs';
import { DESIGN_PRESETS } from '../../../lib/designs';
import { shopQuery } from '../../../lib/vendure';
import { rootDomain } from '../../../lib/tenant';
import { loadStoreInfo } from '../../../lib/store-design';
import { AddToCartButton, PwaSetup } from './storefront-ui';
import { SandboxBanner, StoreFooter, StoreHeader, StoreNotFound, storeVars } from './_shell';

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;

export const dynamic = 'force-dynamic';

/** Metadatos por tienda: título propio y manifiesto PWA instalable. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  if (!info) return { title: 'Tienda no encontrada' };
  return {
    title: info.name,
    description: `Tienda online de ${info.name}`,
    manifest: '/manifest.webmanifest',
    icons: { icon: '/icon.svg' },
    appleWebApp: { capable: true, title: info.name },
  };
}

interface ChannelData {
  activeChannel: {
    code: string;
    token: string;
    customFields?: {
      displayName?: string | null;
      design?: string | null;
      isSandbox?: boolean | null;
      expiresAt?: string | null;
    } | null;
  };
  products: {
    totalItems: number;
    items: Array<{
      id: string;
      name: string;
      slug: string;
      description: string;
      variants: Array<{ id: string; priceWithTax: number; currencyCode: string }>;
    }>;
  };
}

function parseDesign(raw: string | null | undefined): StoreDesign {
  if (raw) {
    try {
      return { ...DESIGN_PRESETS[0], ...(JSON.parse(raw) as Partial<StoreDesign>) };
    } catch {
      /* diseño corrupto: cae al preset base */
    }
  }
  return DESIGN_PRESETS[0];
}

function formatPrice(minor: number, currency: string): string {
  return new Intl.NumberFormat('es', { style: 'currency', currency }).format(minor / 100);
}

const VENTAJAS = [
  { t: 'Envío a domicilio', d: 'Entrega en 24–48 h' },
  { t: 'Pago como prefieras', d: 'Transferencia o al recibir' },
  { t: 'Atención directa', d: 'Te responde la tienda' },
];

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let data: ChannelData;
  try {
    data = await shopQuery<ChannelData>(
      slug,
      `{
        activeChannel { code token customFields { displayName design isSandbox expiresAt } }
        products(options: { take: 12 }) {
          totalItems
          items { id name slug description variants { id priceWithTax currencyCode } }
        }
      }`,
    );
  } catch {
    return <StoreNotFound rootUrl={ROOT_URL} />;
  }

  const cf = data.activeChannel.customFields;
  const design = parseDesign(cf?.design);
  const nombre = cf?.displayName || data.activeChannel.code;
  const productos = data.products.items;

  return (
    <div className="st" style={storeVars(design)}>
      <PwaSetup />
      {cf?.isSandbox ? <SandboxBanner expiresAt={cf?.expiresAt} rootUrl={ROOT_URL} /> : null}

      <StoreHeader slug={slug} nombre={nombre} activo="catalogo" />

      <main>
        <section className="st-hero">
          <div className="st-hero-in">
            <p className="st-hero-eyebrow">Tienda oficial</p>
            <h1 className="st-hero-titulo">Bienvenido a {nombre}</h1>
            <p className="st-hero-txt">
              Descubre nuestra selección, pide desde el móvil y recíbelo en casa. Cada pedido lo
              prepara y lo atiende directamente la tienda.
            </p>
            <a className="st-btn st-btn--marca st-btn--grande" href="#catalogo">
              Ver productos
            </a>
          </div>
          <div className="st-hero-deco" aria-hidden="true">
            <span className="st-deco st-deco--1" />
            <span className="st-deco st-deco--2" />
            <span className="st-deco st-deco--3" />
          </div>
        </section>

        <ul className="st-ventajas">
          {VENTAJAS.map(v => (
            <li key={v.t}>
              <span className="st-ventaja-t">{v.t}</span>
              <span className="st-ventaja-d">{v.d}</span>
            </li>
          ))}
        </ul>

        <section className="st-catalogo" id="catalogo">
          <div className="st-sec-cabeza">
            <h2 className="st-h2">Nuestros productos</h2>
            <span className="st-conteo">
              {data.products.totalItems} {data.products.totalItems === 1 ? 'artículo' : 'artículos'}
            </span>
          </div>

          {productos.length === 0 ? (
            <p className="st-vacio">Esta tienda todavía no ha publicado productos.</p>
          ) : (
            <div className="st-rejilla">
              {productos.map((p, i) => {
                const v = p.variants[0];
                return (
                  <article className="st-prod" key={p.id}>
                    <div className={`st-prod-img st-prod-img--${i % 4}`} aria-hidden="true">
                      <span>{p.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="st-prod-cuerpo">
                      <h3 className="st-prod-n">{p.name}</h3>
                      <p className="st-prod-d">{p.description}</p>
                      <p className="st-prod-p">
                        {v ? formatPrice(v.priceWithTax, v.currencyCode) : '—'}
                      </p>
                      {v ? <AddToCartButton slug={slug} variantId={v.id} /> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <StoreFooter nombre={nombre} rootUrl={ROOT_URL} />
    </div>
  );
}
