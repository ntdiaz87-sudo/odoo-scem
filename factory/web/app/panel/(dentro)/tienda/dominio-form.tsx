'use client';

import { useActionState } from 'react';
import {
  accionDominio,
  accionQuitarDominio,
  accionVerificarDominio,
  type Estado,
} from '../../acciones';

/**
 * Dominio propio, en estados de negocio y no en jerga:
 * sin dominio → "pega tu dominio"; guardado → los dos registros DNS y el
 * botón de comprobar; verificado → enseña la dirección viva y el desligado.
 */
export function FormularioDominio({
  estado,
  ip,
  txtNombre,
  etiquetas,
}: {
  estado: { dominio: string | null; verificado: boolean; txt: string | null };
  ip: string;
  txtNombre: string | null;
  etiquetas: Record<string, string>;
}) {
  const [alta, guardar, guardando] = useActionState<Estado, FormData>(accionDominio, {});
  const [compro, comprobar, comprobando] = useActionState<Estado, FormData>(accionVerificarDominio, {});

  const aviso = alta.error || compro.error;
  const okMsg = alta.ok || compro.ok;

  return (
    <div className="pn-form">
      {aviso ? (
        <div className="fh-aviso" role="alert">
          {aviso}
        </div>
      ) : null}
      {okMsg ? (
        <div className="pn-ok" role="status">
          {okMsg}
        </div>
      ) : null}

      {!estado.dominio ? (
        <form action={guardar} className="pn-form">
          <div className="pn-campo">
            <label htmlFor="dominio">{etiquetas.campo}</label>
            <input id="dominio" name="dominio" placeholder="mitienda.com" autoComplete="off" autoCapitalize="none" />
          </div>
          <button className="fh-btn fh-btn--lima" type="submit" disabled={guardando}>
            {guardando ? etiquetas.enviando : etiquetas.guardar}
          </button>
        </form>
      ) : (
        <>
          <p className="pn-do-actual">
            <code className="pn-mk-codigo">{estado.dominio}</code>{' '}
            <span className={estado.verificado ? 'pn-do-ok' : 'pn-do-pend'}>
              {estado.verificado ? `✓ ${etiquetas.estadoOk}` : etiquetas.estadoNo}
            </span>
          </p>

          {!estado.verificado ? (
            <>
              <h3 className="pn-h2">{etiquetas.pasos}</h3>
              <div className="pn-tabla-envuelta">
                <table className="pn-tabla">
                  <thead>
                    <tr>
                      <th>{etiquetas.tipo}</th>
                      <th>{etiquetas.nombre}</th>
                      <th>{etiquetas.valor}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>A</td>
                      <td><code className="pn-mk-codigo">{estado.dominio}</code></td>
                      <td><code className="pn-mk-codigo">{ip}</code></td>
                    </tr>
                    <tr>
                      <td>TXT</td>
                      <td><code className="pn-mk-codigo">{txtNombre}</code></td>
                      <td><code className="pn-mk-codigo">{estado.txt}</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <form action={comprobar}>
                <button className="fh-btn fh-btn--lima" type="submit" disabled={comprobando}>
                  {comprobando ? etiquetas.enviando : etiquetas.comprobar}
                </button>
              </form>
            </>
          ) : (
            <a className="pn-url" href={`https://${estado.dominio}`}>{`https://${estado.dominio}`}</a>
          )}

          <form action={accionQuitarDominio}>
            <button className="pn-enlace-sec pn-mk-borrar" type="submit">
              {etiquetas.quitar}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
