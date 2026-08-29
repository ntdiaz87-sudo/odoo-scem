'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Locale } from '../../lib/i18n';
import type { CategoriaPlantilla, Plantilla } from '../../lib/plantillas';
import { etiquetaCategoria } from '../../lib/plantillas';
import { Escaparate } from './escaparate';

export function Galeria({
  plantillas,
  locale,
  etiquetas,
}: {
  plantillas: Plantilla[];
  locale: Locale;
  etiquetas: Record<string, string>;
}) {
  const [filtro, setFiltro] = useState<CategoriaPlantilla | null>(null);

  const categorias = useMemo(
    () => [...new Set(plantillas.map(p => p.categoria))],
    [plantillas],
  );
  const visibles = filtro ? plantillas.filter(p => p.categoria === filtro) : plantillas;

  return (
    <>
      <div className="v-filtros" role="tablist" aria-label={etiquetas.h2}>
        <button
          type="button"
          role="tab"
          aria-selected={filtro === null}
          className={filtro === null ? 'is-on' : ''}
          onClick={() => setFiltro(null)}
        >
          {etiquetas.todas}
        </button>
        {categorias.map(c => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={filtro === c}
            className={filtro === c ? 'is-on' : ''}
            onClick={() => setFiltro(c)}
          >
            {etiquetaCategoria(c, locale)}
          </button>
        ))}
      </div>

      <ul className="v-tarjetas">
        {visibles.map(p => (
          <li key={p.id} className="v-tarjeta">
            {/* El escaparate es más alto que su ventana: al pasar el ratón se
                desplaza hacia arriba, como si se recorriera la tienda. */}
            <div className="v-tarjeta-ventana">
              <div className="v-tarjeta-lienzo">
                <Escaparate p={p} locale={locale} variante="tarjeta" />
              </div>
            </div>
            <div className="v-tarjeta-pie">
              <span className="v-tarjeta-id">
                <b>{p.nombre}</b>
                <em>{etiquetaCategoria(p.categoria, locale)}</em>
                <span className="v-tarjeta-libre">{etiquetas.gratis}</span>
              </span>
              <span className="v-tarjeta-acciones">
                <Link className="v-btn v-btn--linea v-btn--mini" href={`/templates/${p.id}`}>
                  {etiquetas.previsualizar}
                </Link>
                <Link className="v-btn v-btn--acento v-btn--mini" href={`/demo?plantilla=${p.id}`}>
                  {etiquetas.usar}
                </Link>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
