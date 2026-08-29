import Link from 'next/link';
import { getT } from '../../../../lib/i18n-server';
import { fecha, money } from '../../../../lib/i18n';
import { listarPedidos } from '../../../../lib/panel-datos';
import { etiquetaEstado } from '../../../../lib/panel-estados';
import { exigirSesionPagina } from '../../../../lib/panel-sesion';

export const dynamic = 'force-dynamic';

export default async function Pedidos() {
  const s = await exigirSesionPagina();
  const t = await getT();
  const { pedidos } = await listarPedidos(s);

  return (
    <>
      <h1 className="pn-h1">{t('pn.pe.titulo')}</h1>
      {pedidos.length === 0 ? (
        <p className="pn-vacio">{t('pn.pe.vacio')}</p>
      ) : (
        <ul className="pn-lista">
          {pedidos.map(p => {
            const e = etiquetaEstado(p.state, t);
            return (
              <li key={p.id}>
                <Link href={`/panel/pedidos/${p.id}`} className="pn-fila">
                  <span className="pn-fila-txt">
                    <b>
                      {t('pn.pe.numero')} {p.code}
                    </b>
                    <span className="pn-fila-sub">
                      {p.cliente} · {p.orderPlacedAt ? fecha(p.orderPlacedAt) : '—'}
                    </span>
                  </span>
                  <span className="pn-importe">{money(p.totalWithTax)}</span>
                  <span className={`pn-pill ${e.clase}`}>{e.txt}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
