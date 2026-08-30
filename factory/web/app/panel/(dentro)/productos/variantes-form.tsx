'use client';

import { useActionState } from 'react';
import { accionCrearVariantes, type Estado } from '../../acciones';

/**
 * Convertir un producto simple en uno con variantes.
 *
 * Deliberadamente plano: un grupo obligatorio (颜色…) y otro opcional (尺码…),
 * valores separados por coma. Con dos grupos se generan las combinaciones.
 * No hay editor de matrices ni arrastrar filas: el comerciante escribe
 * «红, 蓝» y ya tiene su tienda con variantes.
 */
export function FormularioVariantes({
  productoId,
  etiquetas,
}: {
  productoId: string;
  etiquetas: Record<string, string>;
}) {
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accionCrearVariantes, {});
  return (
    <form action={enviar} className="pn-form">
      <input type="hidden" name="id" defaultValue={productoId} />
      {estado.error ? (
        <div className="fh-aviso" role="alert">
          {estado.error}
        </div>
      ) : null}
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="grupo1nombre">{etiquetas.g1n}</label>
          <input id="grupo1nombre" name="grupo1nombre" type="text" maxLength={20} placeholder={etiquetas.phN} required />
        </div>
        <div className="pn-campo">
          <label htmlFor="grupo1valores">{etiquetas.g1v}</label>
          <input id="grupo1valores" name="grupo1valores" type="text" maxLength={120} placeholder={etiquetas.phV} required />
        </div>
      </div>
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="grupo2nombre">{etiquetas.g2n}</label>
          <input id="grupo2nombre" name="grupo2nombre" type="text" maxLength={20} />
        </div>
        <div className="pn-campo">
          <label htmlFor="grupo2valores">{etiquetas.g2v}</label>
          <input id="grupo2valores" name="grupo2valores" type="text" maxLength={120} />
        </div>
      </div>
      <button className="fh-btn fh-btn--linea-oscura" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}
