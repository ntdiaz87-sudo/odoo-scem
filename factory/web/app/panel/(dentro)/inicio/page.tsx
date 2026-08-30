import Link from 'next/link';
import { getT } from '../../../../lib/i18n-server';
import { money } from '../../../../lib/i18n';
import { resumen } from '../../../../lib/panel-datos';
import { exigirSesionPagina } from '../../../../lib/panel-sesion';

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const s = await exigirSesionPagina();
  const t = await getT(s.mercado);
  const r = await resumen(s);

  const cifras = [
    { k: t('pn.hoy.pedidos'), v: String(r.pedidosHoy) },
    { k: t('pn.hoy.ingresos'), v: money(r.ingresosHoy, s.moneda, s.mercado) },
    { k: t('pn.enventa'), v: String(r.enVenta) },
    { k: t('pn.sinstock'), v: String(r.agotados) },
  ];

  const tareas = [
    r.porCobrar > 0 ? { href: '/panel/pedidos', txt: `${t('pn.porcobrar')} · ${r.porCobrar}` } : null,
    r.porEnviar > 0 ? { href: '/panel/pedidos', txt: `${t('pn.porenviar')} · ${r.porEnviar}` } : null,
    r.agotados > 0 ? { href: '/panel/productos', txt: `${t('pn.sinstock')} · ${r.agotados}` } : null,
    r.stockBajo > 0 ? { href: '/panel/productos', txt: `${t('pn.stockbajo')} · ${r.stockBajo}` } : null,
  ].filter(Boolean) as { href: string; txt: string }[];

  return (
    <>
      <h1 className="pn-h1">{t('pn.nav.inicio')}</h1>
      <div className="pn-cifras">
        {cifras.map(c => (
          <div key={c.k} className="pn-cifra">
            <span className="pn-cifra-v">{c.v}</span>
            <span className="pn-cifra-k">{c.k}</span>
          </div>
        ))}
      </div>

      <h2 className="pn-h2">{t('pn.pendientes')}</h2>
      {tareas.length === 0 ? (
        <p className="pn-vacio">{t('pn.aldia')}</p>
      ) : (
        <ul className="pn-tareas">
          {tareas.map(x => (
            <li key={x.txt}>
              <Link href={x.href} className="pn-tarea">
                <span className="pn-tarea-txt">{x.txt}</span>
                <span className="pn-tarea-txt" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
