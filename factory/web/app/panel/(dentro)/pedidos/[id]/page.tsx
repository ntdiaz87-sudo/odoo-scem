import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getT } from '../../../../../lib/i18n-server';
import { fecha, money } from '../../../../../lib/i18n';
import { grupoDelPedido, saldoDelPedido, verPedido } from '../../../../../lib/panel-datos';
import { exigirSesionPagina } from '../../../../../lib/panel-sesion';
import { etiquetaEstado } from '../../../../../lib/panel-estados';
import { AccionesPedido } from './acciones-pedido';
import { CobroConSaldo } from './saldo-cobro';

export const dynamic = 'force-dynamic';

export default async function DetallePedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await exigirSesionPagina();
  const t = await getT(s.mercado);
  const { pedido } = await verPedido(s, id);
  if (!pedido) notFound();
  const e = etiquetaEstado(pedido.state, t);
  // 会员储值: si el cliente tiene saldo que cubre el pedido, se ofrece cobrar
  // contra él en vez de esperar una transferencia.
  const saldoInfo = await saldoDelPedido(s, id);
  const grupoInfo = await grupoDelPedido(s, id);
  const conSaldo = saldoInfo && saldoInfo.saldo >= saldoInfo.total && saldoInfo.total > 0;

  return (
    <>
      <Link className="pn-volver" href="/panel/pedidos">
        <span aria-hidden="true">←</span> {t('pn.pe.volver')}
      </Link>
      <div className="pn-titulo-fila">
        <h1 className="pn-h1">
          {t('pn.pe.numero')} {pedido.code}
        </h1>
        <span className={`pn-pill ${e.clase}`}>{e.txt}</span>
      </div>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.pe.articulos')}</h2>
        <ul className="pn-lineas">
          {pedido.lineas.map(l => (
            <li key={l.id}>
              <span>
                {l.nombre} <em>× {l.cantidad}</em>
              </span>
              <b>{money(l.total, s.moneda, s.mercado)}</b>
            </li>
          ))}
          <li className="pn-lineas-total">
            <span>{t('pn.pe.total')}</span>
            <b>{money(pedido.totalWithTax, s.moneda, s.mercado)}</b>
          </li>
        </ul>
      </section>

      <section className="pn-bloque">
        <h2 className="pn-h2">{t('pn.pe.entrega')}</h2>
        <dl className="pn-datos">
          <dt>{t('pn.pe.cliente')}</dt>
          <dd>{pedido.cliente}</dd>
          <dt>{t('pn.correo')}</dt>
          <dd>{pedido.correo}</dd>
          <dt>{t('pn.pe.entrega')}</dt>
          <dd>{pedido.direccion}</dd>
          <dt>{t('pn.pe.fecha')}</dt>
          <dd>{pedido.orderPlacedAt ? fecha(pedido.orderPlacedAt) : '—'}</dd>
        </dl>
      </section>

      {grupoInfo ? (
        <section className={`pn-bloque pn-pt-estado pn-pt-estado--${grupoInfo.estado}`}>
          {t('pn.pe.grupo', {
            c: grupoInfo.codigo,
            u: String(grupoInfo.unidos),
            n: String(grupoInfo.tamano),
            e: t(`pn.pt.e.${grupoInfo.estado}`),
          })}
        </section>
      ) : null}
      {conSaldo ? (
        <CobroConSaldo
          pedidoId={id}
          aviso={t('pn.pe.saldo.tiene', { s: money(saldoInfo!.saldo, s.moneda, s.mercado) })}
          etiquetas={{ boton: t('pn.pe.saldo.btn'), enviando: t('pn.pr.guardando') }}
        />
      ) : null}
      <AccionesPedido
        pedidoId={pedido.id}
        pagoPendienteId={pedido.pagoPendienteId}
        enviado={pedido.enviado}
        etiquetas={{
          cobrar: t('pn.pe.cobrar'),
          cobrado: t('pn.pe.cobrado'),
          enviar: t('pn.pe.enviar'),
          enviado: t('pn.pe.enviado'),
          seguimiento: t('pn.pe.seguimiento'),
          enviando: t('pn.pr.guardando'),
        }}
      />
    </>
  );
}
