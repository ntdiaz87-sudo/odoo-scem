'use client';

import { useActionState } from 'react';
import { accionPintuan, type Estado } from '../../acciones';

/** 拼团 del producto: personas, rebaja y ventana. 0 personas = apagado. */
export function FormularioPintuan({
  productId,
  inicial,
  etiquetas,
}: {
  productId: string;
  inicial: { tamano: string; pct: string; horas: string };
  etiquetas: Record<string, string>;
}) {
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accionPintuan, {});
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
      <input type="hidden" name="productId" value={productId} />
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="ptTamano">{etiquetas.tamano}</label>
          <input id="ptTamano" name="tamano" type="number" min="0" max="50" defaultValue={inicial.tamano} />
        </div>
        <div className="pn-campo">
          <label htmlFor="ptPct">{etiquetas.pct}</label>
          <input id="ptPct" name="pct" type="number" min="0" max="90" defaultValue={inicial.pct} />
        </div>
      </div>
      <div className="pn-campo">
        <label htmlFor="ptHoras">{etiquetas.horas}</label>
        <input id="ptHoras" name="horas" type="number" min="1" max="168" defaultValue={inicial.horas} />
      </div>
      <button className="fh-btn fh-btn--lima" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}
