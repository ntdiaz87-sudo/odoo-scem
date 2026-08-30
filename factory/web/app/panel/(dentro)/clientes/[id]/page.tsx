import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fecha, money } from '../../../../../lib/i18n';
import { getT } from '../../../../../lib/i18n-server';
import { verCliente } from '../../../../../lib/panel-datos';
import { etiquetaEstado } from '../../../../../lib/panel-estados';
import { exigirSesionPagina } from '../../../../../lib/panel-sesion';
import { FormularioSaldo } from '../saldo-form';

export const dynamic = 'force-dynamic';

export default async function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await exigirSesionPagina();
  const t = await getT(s.mercado);
  const c = await verCliente(s, id);
  if (!c) notFound();
  const dinero = (n: number) => money(n, s.moneda, s.mercado);

  return (
    <>
      <Link className="pn-volver" href="/panel/clientes">
        <span aria-hidden="true">←</span> {t('pn.cl.volver')}
      </Link>
      <h1 className="pn-h1">{c.nombre || c.correo}</h1>

      <div className="pn-cifras">
        <div className="pn-cifra">
          <span className="pn-cifra-v">{c.pedidos}</span>
          <span className="pn-cifra-k">{t('pn.cl.pedidos')}</span>
        </div>
        <div className="pn-cifra">
          <span className="pn-cifra-v" data-testid="saldo">{dinero(c.saldo)}</span>
          <span className="pn-cifra-k">{t('pn.cl.saldo')}</span>
        </div>
      </div>

      <section className="pn-bloque">
        <p className="pn-url">{c.correo}{c.telefono ? ` · ${c.telefono}` : ''}</p>
      </section>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.cl.rec.t')}</h2>
        <p className="pn-ayuda">{t('pn.cl.rec.d')}</p>
        <FormularioSaldo
          clienteId={c.id}
          etiquetas={{
            importe: t('pn.cl.rec.importe'),
            nota: t('pn.cl.rec.nota'),
            enviar: t('pn.cl.rec.btn'),
            enviando: t('pn.pr.guardando'),
          }}
        />
        <h3 className="pn-h2">{t('pn.cl.movs')}</h3>
        {c.movs.length === 0 ? (
          <p className="pn-vacio">{t('pn.cl.sinmovs')}</p>
        ) : (
          <ul className="pn-movs">
            {c.movs.map((m, i) => (
              <li key={i} className="pn-mov">
                <span className="pn-mov-nota">{m.nota || '—'}</span>
                <span className="pn-mov-fecha">{fecha(m.fecha)}</span>
                <span className={`pn-importe ${m.delta < 0 ? 'pn-mov-neg' : 'pn-mov-pos'}`}>
                  {m.delta > 0 ? '+' : ''}{dinero(m.delta)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.cl.historial')}</h2>
        {c.historial.length === 0 ? (
          <p className="pn-vacio">{t('pn.cl.sinpedidos')}</p>
        ) : (
          <ul className="pn-lista">
            {c.historial.map(o => {
              const e = etiquetaEstado(o.state, t);
              return (
                <li key={o.id}>
                  <Link href={`/panel/pedidos/${o.id}`} className="pn-fila">
                    <span className="pn-fila-txt">
                      <b>{t('pn.pe.numero')} {o.code}</b>
                      <span className="pn-fila-sub">{o.fecha ? fecha(o.fecha) : '—'}</span>
                    </span>
                    <span className="pn-importe">{dinero(o.totalWithTax)}</span>
                    <span className={`pn-pill ${e.clase}`}>{e.txt}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
