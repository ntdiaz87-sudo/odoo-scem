import type { StoreDesign } from '../../../lib/designs';
import { DESIGN_PRESETS } from '../../../lib/designs';
import { shopQuery } from '../../../lib/vendure';
import { rootDomain } from '../../../lib/tenant';
import { AddToCartButton, CartBadge, PwaSetup } from './storefront-ui';
import { loadStoreInfo } from '../../../lib/store-design';

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

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;

export const dynamic = 'force-dynamic';

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
    return (
      <main className="wizard" style={{ textAlign: 'center' }}>
        <h1>Tienda no encontrada</h1>
        <p className="sub">No existe ninguna tienda en esta dirección, o el demo expiró.</p>
        <a className="btn btn-primary" href={ROOT_URL}>
          Crear mi tienda
        </a>
      </main>
    );
  }

  const cf = data.activeChannel.customFields;
  const design = parseDesign(cf?.design);
  const name = cf?.displayName || data.activeChannel.code;
  const headingFont =
    design.headingFont === 'serif'
      ? "'Source Serif 4', Georgia, serif"
      : "'Bricolage Grotesque', 'Public Sans', sans-serif";

  return (
    <div
      style={{
        minHeight: '100vh',
        background: design.bg,
        color: design.ink,
        fontFamily: "'Public Sans', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PwaSetup />
      {cf?.isSandbox ? (
        <div
          style={{
            background: design.brand,
            color: design.brandInk,
            textAlign: 'center',
            padding: '8px 16px',
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          Tienda demo creada en la fábrica
          {cf?.expiresAt ? ` · caduca el ${new Date(cf.expiresAt).toLocaleDateString('es')}` : ''}
          {' · '}
          <a href={ROOT_URL} style={{ color: design.brandInk, textDecoration: 'underline' }}>crea la tuya gratis</a>
        </div>
      ) : null}

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          maxWidth: 1080,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 24, color: design.ink }}>{name}</div>
        <CartBadge
          slug={slug}
          surface={design.surface}
          ink={design.ink}
          inkSoft={design.inkSoft}
          brand={design.brand}
          brandInk={design.brandInk}
        />
      </header>

      <section
        style={{
          maxWidth: 1080,
          width: '100%',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            background: design.brand,
            color: design.brandInk,
            borderRadius: design.radius,
            padding: '34px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 'clamp(26px, 4vw, 38px)', lineHeight: 1.12 }}>
            Bienvenido a {name}
          </div>
          <div style={{ opacity: 0.85, fontSize: 15.5 }}>Envío a domicilio en 24–48 h · Pago seguro</div>
        </div>
      </section>

      <main
        style={{
          flex: 1,
          maxWidth: 1080,
          width: '100%',
          margin: '0 auto',
          padding: '28px 24px 48px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 18,
          }}
        >
          {data.products.items.map((p, i) => (
            <div
              key={p.id}
              style={{
                background: design.surface,
                border: `1px solid ${design.inkSoft}26`,
                borderRadius: design.radius,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  height: 130,
                  background: `${i % 2 === 0 ? design.brand : design.accent}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: headingFont,
                  fontWeight: 700,
                  fontSize: 40,
                  color: design.brand,
                }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 15.5 }}>{p.name}</div>
                <div style={{ fontSize: 13.5, color: design.inkSoft, minHeight: 40 }}>{p.description}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: design.brand === design.bg ? design.ink : design.brand }}>
                  {p.variants[0]
                    ? formatPrice(p.variants[0].priceWithTax, p.variants[0].currencyCode)
                    : '—'}
                </div>
                {p.variants[0] ? (
                  <AddToCartButton
                    slug={slug}
                    variantId={p.variants[0].id}
                    brand={design.brand}
                    brandInk={design.brandInk}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '20px 24px 32px',
          fontSize: 13.5,
          color: design.inkSoft,
        }}
      >
        {name} · Creada con{' '}
        <a href={ROOT_URL} style={{ color: design.inkSoft, textDecoration: 'underline' }}>
          fábrica.
        </a>
      </footer>
    </div>
  );
}
