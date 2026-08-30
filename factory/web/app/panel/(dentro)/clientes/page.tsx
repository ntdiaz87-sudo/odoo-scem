import Link from 'next/link';
import { fecha, money } from '../../../../lib/i18n';
import { getT } from '../../../../lib/i18n-server';
import { listarClientes } from '../../../../lib/panel-datos';
import { exigirSesionPagina } from '../../../../lib/panel-sesion';

export const dynamic = 'force-dynamic';

const DORMIDO_DIAS = 30;

type Segmento = 'todos' | 'nuevos' | 'fieles' | 'dormidos';

export default async function Clientes({ searchParams }: { searchParams: Promise<{ seg?: string }> }) {
  const s = await exigirSesionPagina();
  const t = await getT(s.mercado);
  const { seg: segRaw } = await searchParams;
  const seg: Segmento = (['nuevos', 'fieles', 'dormidos'] as const).includes(segRaw as never)
    ? (segRaw as Segmento)
    : 'todos';
  const todos = await listarClientes(s);

  const corte = Date.now() - DORMIDO_DIAS * 24 * 60 * 60 * 1000;
  const filtrados = todos.filter(c => {
    if (seg === 'nuevos') return c.pedidos === 1;
    if (seg === 'fieles') return c.pedidos >= 2;
    if (seg === 'dormidos') return c.pedidos > 0 && (!c.ultimo || Date.parse(c.ultimo) < corte);
    return true;
  });

  const segmentos: Array<{ k: Segmento; txt: string }> = [
    { k: 'todos', txt: t('pn.cl.seg.todos') },
    { k: 'nuevos', txt: t('pn.cl.seg.nuevos') },
    { k: 'fieles', txt: t('pn.cl.seg.fieles') },
    { k: 'dormidos', txt: t('pn.cl.seg.dormidos') },
  ];

  return (
    <>
      <h1 className="pn-h1">{t('pn.nav.clientes')}</h1>

      <div className="pn-segmentos" role="group">
        {segmentos.map(x => (
          <Link
            key={x.k}
            href={x.k === 'todos' ? '/panel/clientes' : `/panel/clientes?seg=${x.k}`}
            className={`pn-segmento${seg === x.k ? ' is-on' : ''}`}
            aria-current={seg === x.k ? 'page' : undefined}
          >
            {x.txt}
          </Link>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <p className="pn-vacio">{t('pn.cl.vacio')}</p>
      ) : (
        <ul className="pn-lista">
          {filtrados.map(c => (
            <li key={c.id}>
              <Link href={`/panel/clientes/${c.id}`} className="pn-fila">
                <span className="pn-fila-txt">
                  <b>{c.nombre || c.correo}</b>
                  <span className="pn-fila-sub">
                    {c.correo} · {t('pn.cl.pedidos')} {c.pedidos}
                    {c.ultimo ? ` · ${t('pn.cl.ultimo')} ${fecha(c.ultimo)}` : ''}
                  </span>
                </span>
                {c.saldo > 0 ? (
                  <span className="pn-importe">{money(c.saldo, s.moneda, s.mercado)}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
