'use client';

import { useActionState } from 'react';
import { accionCobrar, accionEnviar, type Estado } from '../../../acciones';

export function AccionesPedido({
  pedidoId,
  pagoPendienteId,
  enviado,
  etiquetas,
}: {
  pedidoId: string;
  pagoPendienteId: string | null;
  enviado: boolean;
  etiquetas: Record<string, string>;
}) {
  const [cobro, cobrar, cobrando] = useActionState<Estado, FormData>(accionCobrar, {});
  const [envio, enviarA, enviandoP] = useActionState<Estado, FormData>(accionEnviar, {});

  return (
    <section className="pn-bloque">
      {cobro.error || envio.error ? (
        <div className="fh-aviso" role="alert">
          {cobro.error || envio.error}
        </div>
      ) : null}
      {cobro.ok || envio.ok ? (
        <div className="pn-ok" role="status">
          {cobro.ok || envio.ok}
        </div>
      ) : null}

      {pagoPendienteId ? (
        <form action={cobrar}>
          <input type="hidden" name="pagoId" value={pagoPendienteId} />
          <button className="fh-btn fh-btn--lima fh-btn--grande fh-btn--bloque" type="submit" disabled={cobrando}>
            {cobrando ? etiquetas.enviando : etiquetas.cobrar}
          </button>
        </form>
      ) : (
        <p className="pn-hecho">✓ {etiquetas.cobrado}</p>
      )}

      {enviado ? (
        <p className="pn-hecho">✓ {etiquetas.enviado}</p>
      ) : (
        <form action={enviarA} className="pn-form">
          <input type="hidden" name="pedidoId" value={pedidoId} />
          <div className="pn-campo">
            <label htmlFor="seguimiento">{etiquetas.seguimiento}</label>
            <input id="seguimiento" name="seguimiento" type="text" maxLength={60} />
          </div>
          <button className="fh-btn fh-btn--linea-oscura fh-btn--grande fh-btn--bloque" type="submit" disabled={enviandoP}>
            {enviandoP ? etiquetas.enviando : etiquetas.enviar}
          </button>
        </form>
      )}
    </section>
  );
}
