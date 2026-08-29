'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICONOS = {
  inicio: 'M3 10.6 12 3.5l9 7.1V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  productos: 'M3 8h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 8l2-4h14l2 4M12 4v17',
  pedidos: 'M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 12h7M9 16h5',
  tienda: 'M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM3 9l2-5h14l2 5M9 21v-6h6v6',
};

export function NavPanel({
  enlaces,
}: {
  enlaces: { href: string; etiqueta: string; icono: keyof typeof ICONOS }[];
}) {
  const ruta = usePathname();
  return (
    <nav className="pn-nav" aria-label="secciones del panel">
      {enlaces.map(e => {
        const activo = ruta === e.href || ruta.startsWith(e.href + '/');
        return (
          <Link key={e.href} href={e.href} className={`pn-nav-item${activo ? ' is-on' : ''}`} aria-current={activo ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={ICONOS[e.icono]} />
            </svg>
            {e.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
