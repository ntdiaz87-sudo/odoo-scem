'use client';

import { useState } from 'react';
import { useDinero, useTt } from '../../../../lib/tienda-locale';

interface Estado {
  codigo: string;
  estado: string;
  fecha: string | null;
  total: number;
  moneda: string;
  lineas: { nombre: string; cantidad: number }[];
  seguimiento: string[];
}

/** Consulta de pedido: número + correo. Sin cuentas, esta es la ventanilla. */
export function ConsultaPedido({ slug }: { slug: string }) {
  const t = useTt();
  const money = useDinero();
  const [codigo, setCodigo] = useState('');
  const [correo, setCorreo] = useState('');
  const [pedido, setPedido] = useState<Estado | null>(null);
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    setError('');
    setPedido(null);
    try {
      const r = await fetch('/api/pedido-estado', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, codigo, correo }),
      });
      if (!r.ok) throw new Error('x');
      setPedido((await r.json()) as Estado);
    } catch {
      setError(t('pe.noesta'));
    } finally {
      setBuscando(false);
    }
  }

  // El estado interno de Vendure, en palabras del comprador.
  const etiquetaEstado = (e: string) =>
    e === 'PaymentAuthorized' ? t('pe.e.pendiente')
    : e === 'PaymentSettled' ? t('pe.e.pagado')
    : e === 'Shipped' ? t('pe.e.enviado')
    : e === 'Delivered' ? t('pe.e.entregado')
    : e === 'Cancelled' ? t('pe.e.cancelado')
    : e;

  return (
    <div className="st-consulta">
      <h1 className="st-h2">{t('pe.titulo')}</h1>
      <p className="st-consulta-sub">{t('pe.sub')}</p>
      <form onSubmit={buscar} className="st-consulta-form">
        <label>
          {t('pe.codigo')}
          <input value={codigo} onChange={e => setCodigo(e.target.value)} required />
        </label>
        <label>
          {t('pe.correo')}
          <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} required />
        </label>
        <button className="st-btn st-btn--marca" type="submit" disabled={buscando}>
          {buscando ? t('pe.buscando') : t('pe.buscar')}
        </button>
      </form>

      {error ? <p className="st-consulta-error" role="alert">{error}</p> : null}

      {pedido ? (
        <div className="st-consulta-pedido">
          <p className="st-consulta-estado">
            <b>{etiquetaEstado(pedido.estado)}</b>
            <span>{pedido.codigo}</span>
          </p>
          {pedido.seguimiento.length > 0 ? (
            <p className="st-consulta-seguimiento">
              {t('pe.seguimiento')}: <code>{pedido.seguimiento.join(', ')}</code>
            </p>
          ) : null}
          <ul className="st-consulta-lineas">
            {pedido.lineas.map(l => (
              <li key={l.nombre}>
                <span>{l.nombre}</span>
                <em>× {l.cantidad}</em>
              </li>
            ))}
          </ul>
          <p className="st-consulta-total">
            {t('pe.total')}: <b>{money(pedido.total, pedido.moneda)}</b>
          </p>
        </div>
      ) : null}
    </div>
  );
}
