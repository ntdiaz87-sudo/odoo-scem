'use client';

import { useActionState } from 'react';
import {
  accionAgregarDistribuidor,
  accionCrearCupon,
  accionCrearSeckill,
  type Estado,
} from '../../acciones';

function Avisos({ estado }: { estado: Estado }) {
  return (
    <>
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
    </>
  );
}

/** 优惠券: nombre, código, % o importe, mínimo y caducidad. */
export function FormularioCupon({
  simbolo,
  etiquetas,
}: {
  simbolo: string;
  etiquetas: Record<string, string>;
}) {
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accionCrearCupon, {});
  return (
    <form action={enviar} className="pn-form">
      <Avisos estado={estado} />
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="cuNombre">{etiquetas.nombre}</label>
          <input id="cuNombre" name="nombre" required maxLength={60} />
        </div>
        <div className="pn-campo">
          <label htmlFor="cuCodigo">{etiquetas.codigo}</label>
          <input id="cuCodigo" name="codigo" required maxLength={24} autoCapitalize="characters" placeholder="WEIXIN10" />
        </div>
      </div>
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="cuTipo">{etiquetas.tipo}</label>
          <select id="cuTipo" name="tipo" defaultValue="pct">
            <option value="pct">{etiquetas.tipoPct}</option>
            <option value="fijo">{etiquetas.tipoFijo} ({simbolo})</option>
          </select>
        </div>
        <div className="pn-campo">
          <label htmlFor="cuValor">{etiquetas.valor}</label>
          <input id="cuValor" name="valor" type="number" min="1" step="0.01" inputMode="decimal" required />
        </div>
      </div>
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="cuMinimo">{etiquetas.minimo} ({simbolo})</label>
          <input id="cuMinimo" name="minimo" type="number" min="0" step="0.01" inputMode="decimal" />
        </div>
        <div className="pn-campo">
          <label htmlFor="cuCaduca">{etiquetas.caduca}</label>
          <input id="cuCaduca" name="caduca" type="datetime-local" />
        </div>
      </div>
      <button className="fh-btn fh-btn--lima" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}

/** 秒杀: productos elegidos, % de rebaja y hora de fin. */
export function FormularioSeckill({
  productos,
  etiquetas,
}: {
  productos: Array<{ id: string; nombre: string }>;
  etiquetas: Record<string, string>;
}) {
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accionCrearSeckill, {});
  return (
    <form action={enviar} className="pn-form">
      <Avisos estado={estado} />
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="skNombre">{etiquetas.nombre}</label>
          <input id="skNombre" name="nombre" required maxLength={60} />
        </div>
        <div className="pn-campo">
          <label htmlFor="skPct">{etiquetas.pct}</label>
          <input id="skPct" name="pct" type="number" min="1" max="90" required />
        </div>
      </div>
      <div className="pn-campo">
        <label htmlFor="skTermina">{etiquetas.hasta}</label>
        <input id="skTermina" name="termina" type="datetime-local" required />
      </div>
      <fieldset className="pn-campo pn-mk-prods">
        <legend>{etiquetas.prods}</legend>
        {productos.map(p => (
          <label key={p.id} className="pn-mk-prod">
            <input type="checkbox" name="producto" value={p.id} />
            <span>{p.nombre}</span>
          </label>
        ))}
      </fieldset>
      <button className="fh-btn fh-btn--lima" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}

/** Alta de un 分销员: nombre, código del enlace y % de comisión. */
export function FormularioDistribuidor({ etiquetas }: { etiquetas: Record<string, string> }) {
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accionAgregarDistribuidor, {});
  return (
    <form action={enviar} className="pn-form">
      <Avisos estado={estado} />
      <div className="pn-fila2">
        <div className="pn-campo">
          <label htmlFor="diNombre">{etiquetas.nombre}</label>
          <input id="diNombre" name="nombre" required maxLength={40} />
        </div>
        <div className="pn-campo">
          <label htmlFor="diCodigo">{etiquetas.codigo}</label>
          <input id="diCodigo" name="codigo" required maxLength={20} placeholder="xiaoli" />
        </div>
      </div>
      <div className="pn-campo">
        <label htmlFor="diComision">{etiquetas.comision}</label>
        <input id="diComision" name="comision" type="number" min="0" max="50" required />
      </div>
      <button className="fh-btn fh-btn--lima" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}
