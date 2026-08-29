'use client';

import { useActionState } from 'react';
import { accionNombreTienda, type Estado } from '../../acciones';

export function FormularioTienda({ nombre, etiquetas }: { nombre: string; etiquetas: Record<string, string> }) {
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accionNombreTienda, {});
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
      <div className="pn-campo">
        <label htmlFor="nombre">{etiquetas.nombre}</label>
        <input id="nombre" name="nombre" type="text" maxLength={40} defaultValue={nombre} required />
      </div>
      <button className="fh-btn fh-btn--lima" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}
