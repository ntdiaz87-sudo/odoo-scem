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
        ? "'Source Serif 4', Georgia, serif"
        : "'Bricolage Grotesque', 'Public Sans', sans-serif",
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
            Inicio
          </a>
          <a href="/#catalogo">Productos</a>
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
          <p className="st-pie-txt">Gracias por comprar en una tienda pequeña.</p>
        </div>
        <ul className="st-pie-links">
          <li>
            <a href="/">Inicio</a>
          </li>
          <li>
            <a href="/#catalogo">Productos</a>
          </li>
          <li>
            <a href="/cart">Carrito</a>
          </li>
        </ul>
        <p className="st-pie-sello">
          Creada con{' '}
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
      Tienda demo creada en la fábrica
      {expiresAt ? ` · caduca el ${new Date(expiresAt).toLocaleDateString('es')}` : ''}
      {' · '}
      <a href={rootUrl}>crea la tuya gratis</a>
    </div>
  );
}

/** Pantalla de tienda inexistente o caducada. */
export function StoreNotFound({ rootUrl }: { rootUrl: string }) {
  return (
    <div className="st-vacio-pagina">
      <div className="st-vacio-caja">
        <h1>Tienda no encontrada</h1>
        <p>No existe ninguna tienda en esta dirección, o el demo expiró.</p>
        <a className="fh-btn fh-btn--lima fh-btn--grande" href={rootUrl}>
          Crear mi tienda
        </a>
      </div>
    </div>
  );
}
