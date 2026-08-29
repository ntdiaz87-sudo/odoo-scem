'use client';

import { useActionState } from 'react';
import { entrar, type Estado } from './acciones';

export function FormularioEntrar({
  etiquetas,
}: {
  etiquetas: { correo: string; clave: string; enviar: string; enviando: string };
}) {
  const [estado, accion, pendiente] = useActionState<Estado, FormData>(entrar, {});
  return (
    <form action={accion}>
      {estado.error ? (
        <div className="fh-aviso" role="alert">
          {estado.error}
        </div>
      ) : null}
      <div className="fh-campo">
        <label htmlFor="correo">{etiquetas.correo}</label>
        <input id="correo" name="correo" type="email" autoComplete="email" required />
      </div>
      <div className="fh-campo">
        <label htmlFor="clave">{etiquetas.clave}</label>
        <input id="clave" name="clave" type="password" autoComplete="current-password" required />
      </div>
      <button className="fh-btn fh-btn--lima fh-btn--grande fh-btn--bloque" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}
