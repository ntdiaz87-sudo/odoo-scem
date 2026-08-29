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
import { fecha, t } from '../../../lib/i18n';
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
  activo,
}: {
  slug: string;
  nombre: string;
  activo?: 'catalogo' | 'carrito';
}) {
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

export function StoreFooter({ nombre, rootUrl }: { nombre: string; rootUrl: string }) {
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
export function SandboxBanner({ expiresAt, rootUrl }: { expiresAt?: string | null; rootUrl: string }) {
  return (
    <div className="st-aviso">
      <span className="st-aviso-punto" aria-hidden="true" />
      {t('st.demo.banner')}
      {expiresAt ? ` · ${t('st.demo.caduca')} ${fecha(expiresAt)}` : ''}
      {' · '}
      <a href={rootUrl}>{t('st.demo.crea')}</a>
    </div>
  );
}

/** Pantalla de tienda inexistente o caducada. */
export function StoreNotFound({ rootUrl }: { rootUrl: string }) {
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
