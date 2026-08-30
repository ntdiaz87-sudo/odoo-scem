/**
 * Armazón compartido de las tiendas (multicompañía).
 *
 * Cada tienda es la MISMA plantilla dirigida por los tokens de diseño de su
 * cliente: los tokens entran como variables CSS en el elemento raíz y todas
 * las clases .st- se pintan a partir de ellas. Así una plantilla de nivel
 * sirve a cualquier paleta generada, clara u oscura, sin código por tienda.
 */
import type { CSSProperties } from 'react';
import type { StoreDesign } from '../../../lib/designs';
import { inkOn } from '../../../lib/design-generator';
import { LOCALE, fecha, translate, type Locale } from '../../../lib/i18n';
import type { StoreInfo } from '../../../lib/store-design';
import { MercadoProvider } from '../../../lib/tienda-locale';
import { CartBadge } from './storefront-ui';

export function storeVars(design: StoreDesign): CSSProperties {
  return {
    '--s-bg': design.bg,
    '--s-surface': design.surface,
    '--s-ink': design.ink,
    '--s-ink-soft': design.inkSoft,
    '--s-brand': design.brand,
    '--s-brand-ink': design.brandInk,
    '--s-accent': design.accent,
    '--s-accent-ink': inkOn(design.accent),
    '--s-radio': design.radius,
    '--s-titulo':
      design.headingFont === 'serif'
        ? 'var(--font-serif-cjk)'
        : 'var(--font-display)',
  } as CSSProperties;
}

export function StoreHeader({
  slug,
  nombre,
  mercado,
  activo,
}: {
  slug: string;
  nombre: string;
  mercado: Locale;
  activo?: 'catalogo' | 'carrito';
}) {
  const t = (k: string) => translate(mercado, k);
  return (
    <header className="st-head">
      <div className="st-head-in">
        <a className="st-marca" href="/">
          {nombre}
        </a>
        <nav className="st-nav" aria-label="Tienda">
          <a href="/" aria-current={activo === 'catalogo' ? 'page' : undefined}>
            {t('st.inicio')}
          </a>
          <a href="/#catalogo">{t('st.productos')}</a>
        </nav>
        <CartBadge slug={slug} />
      </div>
    </header>
  );
}

export function StoreFooter({
  nombre,
  rootUrl,
  mercado,
}: {
  nombre: string;
  rootUrl: string;
  mercado: Locale;
}) {
  const t = (k: string) => translate(mercado, k);
  return (
    <footer className="st-pie">
      <div className="st-pie-in">
        <div>
          <p className="st-pie-marca">{nombre}</p>
          <p className="st-pie-txt">{t('st.pie.txt')}</p>
        </div>
        <ul className="st-pie-links">
          <li>
            <a href="/">{t('st.inicio')}</a>
          </li>
          <li>
            <a href="/#catalogo">{t('st.productos')}</a>
          </li>
          <li>
            <a href="/cart">{t('st.carrito')}</a>
          </li>
        </ul>
        <p className="st-pie-sello">
          {t('st.creada')}{' '}
          <a href={rootUrl} rel="noreferrer">
            fábrica.
          </a>
        </p>
      </div>
    </footer>
  );
}

/** Aviso de tienda demo, con su caducidad. */
export function SandboxBanner({
  expiresAt,
  rootUrl,
  mercado,
}: {
  expiresAt?: string | null;
  rootUrl: string;
  mercado: Locale;
}) {
  const t = (k: string) => translate(mercado, k);
  return (
    <div className="st-aviso">
      <span className="st-aviso-punto" aria-hidden="true" />
      {t('st.demo.banner')}
      {expiresAt ? ` · ${t('st.demo.caduca')} ${fecha(expiresAt, mercado)}` : ''}
      {' · '}
      <a href={rootUrl}>{t('st.demo.crea')}</a>
    </div>
  );
}

/** Pantalla de tienda inexistente o caducada. */
export function StoreNotFound({ rootUrl, locale = LOCALE }: { rootUrl: string; locale?: Locale }) {
  // Aquí no hay tienda de la que sacar idioma: se usa el del lanzamiento.
  const t = (k: string) => translate(locale, k);
  return (
    <div className="st-vacio-pagina">
      <div className="st-vacio-caja">
        <h1>{t('st.no.encontrada')}</h1>
        <p>{t('st.no.encontrada.d')}</p>
        <a className="fh-btn fh-btn--lima fh-btn--grande" href={rootUrl}>
          {t('st.crear.mia')}
        </a>
      </div>
    </div>
  );
}


/**
 * Marco de una página de tienda: variables de diseño, idioma de la tienda,
 * cabecera y pie. Las cuatro páginas repetían este montaje; ahora lo comparten,
 * que es también lo que garantiza que ninguna se quede sin el proveedor de
 * mercado y vuelva a pintarse en el idioma del build.
 */
export function MarcoTienda({
  slug,
  info,
  rootUrl,
  activo,
  banner,
  clase,
  children,
}: {
  slug: string;
  info: StoreInfo;
  rootUrl: string;
  activo?: 'catalogo' | 'carrito';
  banner?: React.ReactNode;
  clase?: string;
  children: React.ReactNode;
}) {
  return (
    <MercadoProvider valor={{ locale: info.mercado, moneda: info.moneda }}>
      <div className="st" style={storeVars(info.design)}>
        {banner}
        <StoreHeader slug={slug} nombre={info.name} mercado={info.mercado} activo={activo} />
        <main className={clase}>{children}</main>
        <StoreFooter nombre={info.name} rootUrl={rootUrl} mercado={info.mercado} />
      </div>
    </MercadoProvider>
  );
}
