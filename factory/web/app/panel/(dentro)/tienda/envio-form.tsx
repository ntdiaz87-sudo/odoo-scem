'use client';

import { useActionState } from 'react';
import { accionEnvio, type Estado } from '../../acciones';

/** Envío: dos números. La tarifa, y desde cuánto sale gratis (0 = nunca). */
export function FormularioEnvio({
  inicial,
  etiquetas,
}: {
  inicial: { tarifa: string; gratisDesde: string };
  etiquetas: Record<string, string>;
}) {
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accionEnvio, {});
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
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="envioTarifa">{etiquetas.tarifa} ({etiquetas.simbolo})</label>
          <input id="envioTarifa" name="envioTarifa" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={inicial.tarifa} required />
        </div>
        <div className="pn-campo">
          <label htmlFor="envioGratisDesde">{etiquetas.gratis} ({etiquetas.simbolo})</label>
          <input id="envioGratisDesde" name="envioGratisDesde" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={inicial.gratisDesde} />
          <p className="pn-ayuda">{etiquetas.gratisAyuda}</p>
        </div>
      </div>
      <button className="fh-btn fh-btn--lima" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}
