'use client';

import { useActionState } from 'react';
import { accionCobrarConSaldo, type Estado } from '../../../acciones';

/** Cobro con 储值: solo aparece si el cliente tiene saldo suficiente. */
export function CobroConSaldo({
  pedidoId,
  aviso,
  etiquetas,
}: {
  pedidoId: string;
  aviso: string;
  etiquetas: { boton: string; enviando: string };
}) {
  const [estado, cobrar, cobrando] = useActionState<Estado, FormData>(accionCobrarConSaldo, {});
  return (
    <section className="pn-bloque">
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
      <p className="pn-ayuda">{aviso}</p>
      <form action={cobrar}>
        <input type="hidden" name="pedidoId" value={pedidoId} />
        <button className="fh-btn fh-btn--linea-oscura fh-btn--bloque" type="submit" disabled={cobrando}>
          {cobrando ? etiquetas.enviando : etiquetas.boton}
        </button>
      </form>
    </section>
  );
}
