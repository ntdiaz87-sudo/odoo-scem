import Link from 'next/link';
import { getT } from '../../../../lib/i18n-server';
import { money } from '../../../../lib/i18n';
import { listarProductos } from '../../../../lib/panel-datos';
import { exigirSesionPagina } from '../../../../lib/panel-sesion';

export const dynamic = 'force-dynamic';

export default async function Productos() {
  const s = await exigirSesionPagina();
  const t = await getT(s.mercado);
  const { productos } = await listarProductos(s);

  return (
    <>
      <div className="pn-titulo-fila">
        <h1 className="pn-h1">{t('pn.pr.titulo')}</h1>
        <Link className="fh-btn fh-btn--lima" href="/panel/productos/nuevo">
          {t('pn.pr.nuevo')}
        </Link>
      </div>

      {productos.length === 0 ? (
        <p className="pn-vacio">{t('pn.pr.vacio')}</p>
      ) : (
        <ul className="pn-lista">
          {productos.map(p => {
            const v = p.variants[0];
            return (
              <li key={p.id}>
                <Link href={`/panel/productos/${p.id}`} className="pn-fila">
                  <span className="pn-miniatura">
                    {p.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto} alt="" />
                    ) : (
                      <span className="pn-sinfoto">{t('pn.pr.sinfoto')}</span>
                    )}
                  </span>
                  <span className="pn-fila-txt">
                    <b>{p.name}</b>
                    <span className="pn-fila-sub">
                      {v ? money(v.price, s.moneda, s.mercado) : '—'} · {t('pn.pr.stock')} {v ? v.stockOnHand : 0}
                    </span>
                  </span>
                  <span className={`pn-pill${p.enabled ? ' is-on' : ''}`}>
                    {p.enabled ? t('pn.pr.publicado') : t('pn.pr.oculto')}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
