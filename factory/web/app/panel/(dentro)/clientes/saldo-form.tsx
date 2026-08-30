'use client';

import { useActionState } from 'react';
import { accionRecargarSaldo, type Estado } from '../../acciones';

/** 会员储值: apuntar una recarga (o un descuento, en negativo). */
export function FormularioSaldo({
  clienteId,
  etiquetas,
}: {
  clienteId: string;
  etiquetas: Record<string, string>;
}) {
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accionRecargarSaldo, {});
  return (
    <form action={enviar} className="pn-form">
      {estado.error ? (
        <div className="fh-aviso" role="alert">
          {estado.error}
        </div>
      ) : null}
      {estado.ok ? (
        <div className="pn-ok" role="status">
          {estado.ok}
        </div>
      ) : null}
      <input type="hidden" name="clienteId" value={clienteId} />
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="saldoImporte">{etiquetas.importe}</label>
          <input id="saldoImporte" name="importe" type="number" step="0.01" inputMode="decimal" required />
        </div>
        <div className="pn-campo">
          <label htmlFor="saldoNota">{etiquetas.nota}</label>
          <input id="saldoNota" name="nota" maxLength={80} />
        </div>
      </div>
      <button className="fh-btn fh-btn--lima" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}
