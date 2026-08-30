import { headers } from 'next/headers';
import type { StoreDesign } from '../../../lib/designs';
import { DESIGN_PRESETS } from '../../../lib/designs';
import { seckillActivos, shopQuery } from '../../../lib/vendure';
import { rootDomain } from '../../../lib/tenant';
import { loadStoreInfo } from '../../../lib/store-design';
import { LOCALE, MONEDA_DE, esLocaleValido, money, translate, type Locale } from '../../../lib/i18n';
import { MercadoProvider } from '../../../lib/tienda-locale';
import { CaptaDistribuidor, CompraProducto, GaleriaProducto, PwaSetup } from './storefront-ui';
import { SandboxBanner, StoreFooter, StoreHeader, StoreNotFound, storeVars } from './_shell';

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;

export const dynamic = 'force-dynamic';

/** Metadatos por tienda: título propio y manifiesto PWA instalable. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  if (!info) return { title: 'Tienda no encontrada' };
  // Con dominio propio verificado, ESE es el canónico: el subdominio técnico
  // sigue sirviendo (enlaces viejos, QR impresos) pero deja de indexarse.
  const host = (await headers()).get('host')?.split(':')[0].toLowerCase() ?? '';
  const conDominio = info.dominio && host !== info.dominio;
  return {
    title: info.name,
    description: info.name,
    manifest: '/manifest.webmanifest',
    icons: { icon: '/icon.svg' },
    appleWebApp: { capable: true, title: info.name },
    ...(info.dominio ? { alternates: { canonical: `https://${info.dominio}/` } } : {}),
    ...(conDominio ? { robots: { index: false, follow: true } } : {}),
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
      customFields?: { ptTamano?: number | null; ptPct?: number | null } | null;
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



interface GrupoInfo {
  codigo: string;
  productId: string;
  tamano: number;
  unidos: number;
  pct: number;
  expiraEn: string;
  estado: string;
}

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ g?: string }>;
}) {
  const { slug } = await params;
  const { g } = await searchParams;
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
            customFields { ptTamano ptPct }
            assets { id preview }
            variants { id name priceWithTax currencyCode }
          }
        }
      }`,
    );
  } catch {
    return <StoreNotFound rootUrl={ROOT_URL} />;
  }

  // 秒杀 vivos: variante → % de rebaja. Un producto luce el badge si alguna
  // de sus variantes está en la promo (si hay varias, gana la mayor).
  const seckills = await seckillActivos(slug);
  const rebajaVar = new Map<string, number>();
  for (const sk of seckills) {
    for (const id of sk.variantIds) {
      rebajaVar.set(id, Math.max(rebajaVar.get(id) ?? 0, sk.pct));
    }
  }

  // 拼团: si la visita llega por el enlace de un grupo, se consulta su estado
  // para el banner y para que la tarjeta del producto ofrezca UNIRSE.
  let grupo: GrupoInfo | null = null;
  if (g) {
    try {
      const rg = await shopQuery<{ grupo: GrupoInfo | null }>(
        slug,
        `query G($c: String!) { grupo(codigo: $c) { codigo productId tamano unidos pct expiraEn estado } }`,
        { c: g },
      );
      grupo = rg.grupo;
    } catch {
      /* código inventado: sin banner */
    }
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
      <CaptaDistribuidor slug={slug} />
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

        {grupo ? (
          <aside className={`st-pt-banner${grupo.estado !== 'abierto' ? ' st-pt-banner--fin' : ''}`}>
            <b>{t('st.pt.banner.t')}</b>{' '}
            {grupo.estado === 'completo'
              ? t('st.pt.completo')
              : grupo.estado === 'caducado'
                ? t('st.pt.caducado')
                : `${t('st.pt.progreso', { u: String(grupo.unidos), n: String(grupo.tamano) })} · ${t('st.pt.faltan', { f: String(grupo.tamano - grupo.unidos) })}`}
          </aside>
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
                        <CompraProducto
                          slug={slug}
                          productId={p.id}
                          nombreProducto={p.name}
                          variantes={p.variants}
                          pintuan={(p.customFields?.ptTamano ?? 0) >= 2 && (p.customFields?.ptPct ?? 0) > 0 ? {
                            tamano: p.customFields!.ptTamano!,
                            pct: p.customFields!.ptPct!,
                            badge: t('st.pt.badge', { n: String(p.customFields!.ptTamano), pct: String(p.customFields!.ptPct) }),
                            abrir: t('st.pt.abrir'),
                            unirse: t('st.pt.unirse'),
                          } : null}
                          grupoActivo={grupo && grupo.estado === 'abierto' && grupo.productId === p.id ? grupo.codigo : null}
                          seckill={(() => {
                            const pct = Math.max(0, ...p.variants.map(v => rebajaVar.get(v.id) ?? 0));
                            return pct > 0 ? { pct, badge: t('st.sk.badge', { pct: String(pct) }) } : null;
                          })()}
                        />
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
