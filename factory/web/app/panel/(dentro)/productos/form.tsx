'use client';

import { useActionState } from 'react';

import { accionCrearProducto, accionGuardarProducto, type Estado } from '../../acciones';

export interface VarianteForm {
  id: string;
  name: string;
  precio: string;
  stock: string;
}

interface Inicial {
  id: string;
  varianteId: string;
  nombre: string;
  descripcion: string;
  precio: string;
  stock: string;
  publicado: boolean;
  fotos: { id: string; preview: string }[];
  /** Todas las variantes; con más de una, el precio va por fila. */
  variantes: VarianteForm[];
}

export function FormularioProducto({
  modo,
  inicial,
  etiquetas,
}: {
  modo: 'crear' | 'editar';
  inicial: Inicial;
  etiquetas: Record<string, string>;
}) {
  const accion = modo === 'crear' ? accionCrearProducto : accionGuardarProducto;
  const [estado, enviar, pendiente] = useActionState<Estado, FormData>(accion, {});

  return (
    <form action={enviar} className="pn-form">
      <input type="hidden" name="id" defaultValue={inicial.id} />
      <input type="hidden" name="varianteId" defaultValue={inicial.variantes.length > 1 ? '' : inicial.varianteId} />

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

      {/* Varias fotos, no una. El comerciante pidió poder poner cinco: un
          producto que solo se enseña por un lado no se vende. La primera es la
          portada, y quitar una es una casilla, no un botón que borre al vuelo:
          nada se pierde hasta que él guarda. */}
      <div className="pn-campo">
        <label htmlFor="fotos">{etiquetas.foto}</label>
        {inicial.fotos.length > 0 ? (
          <ul className="pn-fotos">
            {inicial.fotos.map((f, i) => (
              <li key={f.id}>
                <span className="pn-foto-caja">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.preview} alt="" />
                  {i === 0 ? <em className="pn-foto-portada">{etiquetas.portada}</em> : null}
                </span>
                <label className="pn-foto-quitar">
                  <input type="checkbox" name="quitarFoto" value={f.id} />
                  {etiquetas.quitar}
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="pn-ayuda">{etiquetas.sinfoto}</p>
        )}
        <input
          id="fotos"
          name="fotos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
        />
        <span className="pn-ayuda">{etiquetas.fotoAyuda}</span>
      </div>

      <div className="pn-campo">
        <label htmlFor="nombre">{etiquetas.nombre}</label>
        <input id="nombre" name="nombre" type="text" maxLength={80} defaultValue={inicial.nombre} required />
      </div>

      <div className="pn-campo">
        <label htmlFor="descripcion">{etiquetas.desc}</label>
        <textarea id="descripcion" name="descripcion" rows={4} defaultValue={inicial.descripcion} />
      </div>

      {inicial.variantes.length > 1 ? (
        /* Varias variantes: el precio y el stock van POR FILA. La fila única
           de abajo desaparece, y varianteId viaja vacío para que el guardado
           no pise la primera variante con los campos que ya no existen. */
        <div className="pn-campo">
          <span className="pn-campo-titulo">{etiquetas.variantes}</span>
          <ul className="pn-variantes">
            {inicial.variantes.map(v => (
              <li key={v.id}>
                <span className="pn-variante-n">{v.name}</span>
                <span className="pn-variante-campos">
                  <label>
                    <em>{etiquetas.precio} ({etiquetas.simbolo})</em>
                    <input name={`precio-${v.id}`} type="number" min="0" step="0.01" inputMode="decimal" defaultValue={v.precio} required />
                  </label>
                  <label>
                    <em>{etiquetas.stock}</em>
                    <input name={`stock-${v.id}`} type="number" min="0" step="1" inputMode="numeric" defaultValue={v.stock} />
                  </label>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="pn-fila2">
          <div className="pn-campo">
            <label htmlFor="precio">
              {etiquetas.precio} ({etiquetas.simbolo})
            </label>
            <input id="precio" name="precio" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={inicial.precio} required />
          </div>
          <div className="pn-campo">
            <label htmlFor="stock">{etiquetas.stock}</label>
            <input id="stock" name="stock" type="number" min="0" step="1" inputMode="numeric" defaultValue={inicial.stock} />
          </div>
        </div>
      )}

      <label className="pn-check">
        <input type="checkbox" name="publicado" defaultChecked={inicial.publicado} />
        {etiquetas.publicado}
      </label>

      <button className="fh-btn fh-btn--lima fh-btn--grande fh-btn--bloque" type="submit" disabled={pendiente}>
        {pendiente ? etiquetas.enviando : etiquetas.enviar}
      </button>
    </form>
  );
}
