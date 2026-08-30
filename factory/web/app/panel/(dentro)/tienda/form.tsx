'use client';

import { useActionState } from 'react';
import { LOCALES, NOMBRE_IDIOMA, SIMBOLO_DE, type Locale } from '../../../../lib/i18n';
import { accionAjustesTienda, type Estado } from '../../acciones';

export interface AjustesTienda {
  nombre: string;
  mercado: Locale;
  entregaPlazo: string;
  entregaNota: string;
  pagoFormas: string;
  atencionNota: string;
}

/**
 * Ajustes de la tienda.
 *
 * Los plazos y las formas de pago van vacíos a propósito: lo que el comerciante
 * no escriba, su escaparate no lo enseña. Antes venían con "24-48 h" y "WeChat
 * Pay · Alipay" puestos desde el diccionario de la fábrica, y su tienda hacía
 * promesas que él no había decidido.
 */
export function FormularioTienda({
  inicial,
  etiquetas,
}: {
  inicial: AjustesTienda;
  etiquetas: Record<string, string>;
}) {
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accionAjustesTienda, {});
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
        <input id="nombre" name="nombre" type="text" maxLength={40} defaultValue={inicial.nombre} required />
      </div>

      <div className="pn-campo">
        <label htmlFor="mercado">{etiquetas.mercado}</label>
        <div className="pn-mercado" role="group" aria-labelledby="mercado">
          {LOCALES.map(l => (
            <label key={l} className={l === inicial.mercado ? 'is-on' : ''}>
              <input type="radio" name="mercado" value={l} defaultChecked={l === inicial.mercado} />
              <b>{NOMBRE_IDIOMA[l]}</b>
              <em>{SIMBOLO_DE[l]}</em>
            </label>
          ))}
        </div>
        <p className="pn-ayuda">{etiquetas.mercadoAyuda}</p>
      </div>

      <p className="pn-h2">{etiquetas.promesas}</p>
      <p className="pn-ayuda">{etiquetas.promesasAyuda}</p>

      <div className="pn-campo">
        <label htmlFor="entregaPlazo">{etiquetas.entregaPlazo}</label>
        <input id="entregaPlazo" name="entregaPlazo" type="text" maxLength={60}
               defaultValue={inicial.entregaPlazo} placeholder={etiquetas.entregaPlazoPh} />
      </div>
      <div className="pn-campo">
        <label htmlFor="entregaNota">{etiquetas.entregaNota}</label>
        <input id="entregaNota" name="entregaNota" type="text" maxLength={80}
               defaultValue={inicial.entregaNota} placeholder={etiquetas.entregaNotaPh} />
      </div>
      <div className="pn-campo">
        <label htmlFor="pagoFormas">{etiquetas.pagoFormas}</label>
        <input id="pagoFormas" name="pagoFormas" type="text" maxLength={80}
               defaultValue={inicial.pagoFormas} placeholder={etiquetas.pagoFormasPh} />
      </div>
      <div className="pn-campo">
        <label htmlFor="atencionNota">{etiquetas.atencionNota}</label>
        <input id="atencionNota" name="atencionNota" type="text" maxLength={80}
               defaultValue={inicial.atencionNota} placeholder={etiquetas.atencionNotaPh} />
      </div>

      <button className="fh-btn fh-btn--lima" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}
