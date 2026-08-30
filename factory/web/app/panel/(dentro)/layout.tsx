import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getT } from '../../../lib/i18n-server';
import { panelVars } from '../../../lib/panel-tema';
import { leerSesion } from '../../../lib/panel-sesion';
import { storeUrl } from '../../../lib/tenant';
import { salir } from '../acciones';
import { NavPanel } from './nav';

export const dynamic = 'force-dynamic';

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const s = await leerSesion();
  if (!s) redirect('/panel');
  const t = await getT(s.mercado);

  const enlaces = [
    { href: '/panel/inicio', etiqueta: t('pn.nav.inicio'), icono: 'inicio' as const },
    { href: '/panel/productos', etiqueta: t('pn.nav.productos'), icono: 'productos' as const },
    { href: '/panel/pedidos', etiqueta: t('pn.nav.pedidos'), icono: 'pedidos' as const },
    { href: '/panel/marketing', etiqueta: t('pn.nav.marketing'), icono: 'marketing' as const },
    { href: '/panel/clientes', etiqueta: t('pn.nav.clientes'), icono: 'clientes' as const },
    { href: '/panel/tienda', etiqueta: t('pn.nav.tienda'), icono: 'tienda' as const },
  ];

  return (
    <div className="pn" style={panelVars(s.design)}>
      <header className="pn-cabecera">
        <Link href="/panel/inicio" className="pn-marca">
          <span className="fh-marca">
            fábrica<span className="fh-punto">.</span>
          </span>
          <span className="pn-tienda">{s.nombre}</span>
        </Link>
        <div className="pn-cabecera-fin">
          <a className="pn-enlace-sec" href={storeUrl(s.canal.token)}>
            {t('pn.vertienda')} <span aria-hidden="true">↗</span>
          </a>
          <form action={salir}>
            <button className="pn-enlace-sec" type="submit">
              {t('pn.salir')}
            </button>
          </form>
        </div>
      </header>

      <div className="pn-cuerpo">
        <NavPanel enlaces={enlaces} />
        <main className="pn-contenido">{children}</main>
      </div>
    </div>
  );
}
