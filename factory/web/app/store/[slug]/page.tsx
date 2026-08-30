import type { StoreDesign } from '../../../lib/designs';
import { DESIGN_PRESETS } from '../../../lib/designs';
import { shopQuery } from '../../../lib/vendure';
import { rootDomain } from '../../../lib/tenant';
import { loadStoreInfo } from '../../../lib/store-design';
import { LOCALE, MONEDA_DE, esLocaleValido, money, translate, type Locale } from '../../../lib/i18n';
import { MercadoProvider } from '../../../lib/tienda-locale';
import { CompraProducto, GaleriaProducto, PwaSetup } from './storefront-ui';
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
    description: info.name,
    manifest: '/manifest.webmanifest',
    icons: { icon: '/icon.svg' },
    appleWebApp: { capable: true, title: info.name },
  };
}

interface ChannelData {
  activeChannel: {
    code: string;
    token: string;
    currencyCode?: string | null;
    customFields?: {
      displayName?: string | null;
      design?: string | null;
      isSandbox?: boolean | null;
      expiresAt?: string | null;
      mercado?: string | null;
      entregaPlazo?: string | null;
      entregaNota?: string | null;
      pagoFormas?: string | null;
      atencionNota?: string | null;
    } | null;
  };
  products: {
    totalItems: number;
    items: Array<{
      assets?: { id: string; preview: string }[];
      id: string;
      name: string;
      slug: string;
      description: string;
      variants: Array<{ id: string; name: string; priceWithTax: number; currencyCode: string }>;
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



export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let data: ChannelData;
  try {
    data = await shopQuery<ChannelData>(
      slug,
      `{
        activeChannel {
          code token currencyCode
          customFields {
            displayName design isSandbox expiresAt mercado
            entregaPlazo entregaNota pagoFormas atencionNota
          }
        }
        products(options: { take: 12 }) {
          totalItems
          items {
            id name slug description
            assets { id preview }
            variants { id name priceWithTax currencyCode }
          }
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

  // Esta tienda se sirve en SU idioma, el que eligió su dueño, no en el del
  // build ni en el del visitante.
  const mercado: Locale = esLocaleValido(cf?.mercado ?? undefined) ? (cf!.mercado as Locale) : LOCALE;
  const moneda = data.activeChannel.currencyCode || MONEDA_DE[mercado];
  const t = (k: string, v?: Record<string, string>) => translate(mercado, k, v);
  const precio = (minor: number, m?: string) => money(minor, m || moneda, mercado);

  const promesas = [
    { t: cf?.entregaPlazo || '', d: cf?.entregaNota || '' },
    { t: cf?.pagoFormas || '', d: '' },
    { t: cf?.atencionNota || '', d: '' },
  ].filter(v => v.t.trim().length > 0);

  return (
    <MercadoProvider valor={{ locale: mercado, moneda }}>
    <div className="st" style={storeVars(design)}>
      <PwaSetup />
      {cf?.isSandbox ? <SandboxBanner expiresAt={cf?.expiresAt} rootUrl={ROOT_URL} mercado={mercado} /> : null}

      <StoreHeader slug={slug} nombre={nombre} mercado={mercado} activo="catalogo" />

      <main>
        <section className="st-hero">
          <div className="st-hero-in">
            <p className="st-hero-eyebrow">{t('st.oficial')}</p>
            <h1 className="st-hero-titulo">
              {t('st.bienvenido')} {nombre}
            </h1>
            <p className="st-hero-txt">{t('st.hero.txt')}</p>
            <a className="st-btn st-btn--marca st-btn--grande" href="#catalogo">
              {t('st.ver')}
            </a>
          </div>
          <div className="st-hero-deco" aria-hidden="true">
            <span className="st-deco st-deco--1" />
            <span className="st-deco st-deco--2" />
            <span className="st-deco st-deco--3" />
          </div>
        </section>

        {/* La tira de promesas la escribe el COMERCIANTE. Antes estaba en el
            diccionario, así que su tienda prometía entrega en 24–48 h y pago
            por WeChat o Alipay sin que él lo hubiera decidido ni pudiera
            cambiarlo. Lo que no haya rellenado, no se enseña: una tienda no
            promete nada en nombre de su dueño. */}
        {promesas.length > 0 ? (
          <ul className="st-ventajas">
            {promesas.map(v => (
              <li key={v.t}>
                <span className="st-ventaja-t">{v.t}</span>
                {v.d ? <span className="st-ventaja-d">{v.d}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}

        <section className="st-catalogo" id="catalogo">
          <div className="st-sec-cabeza">
            <h2 className="st-h2">{t('st.nuestros')}</h2>
            <span className="st-conteo">
              {data.products.totalItems} {t('st.articulos')}
            </span>
          </div>

          {productos.length === 0 ? (
            <p className="st-vacio">{t('st.sin.productos')}</p>
          ) : (
            <div className="st-rejilla">
              {productos.map((p, i) => {
                const v = p.variants[0];
                return (
                  <article className="st-prod" key={p.id}>
                    <GaleriaProducto
                      fotos={p.assets ?? []}
                      inicial={p.name.charAt(0).toUpperCase()}
                      variante={i % 4}
                    />
                    <div className="st-prod-cuerpo">
                      <h3 className="st-prod-n">{p.name}</h3>
                      <p className="st-prod-d">{p.description}</p>
                      {p.variants.length > 0 ? (
                        <CompraProducto slug={slug} nombreProducto={p.name} variantes={p.variants} />
                      ) : (
                        <p className="st-prod-p">—</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <StoreFooter nombre={nombre} rootUrl={ROOT_URL} mercado={mercado} />
    </div>
    </MercadoProvider>
  );
}
