'use client';

import { useState } from 'react';
import type { Locale } from '../../../lib/i18n';
import type { Plantilla } from '../../../lib/plantillas';
import { Escaparate, Portatil, Telefono } from '../../_v2/escaparate';

export function VistaPrevia({
  p,
  locale,
  etiquetas,
}: {
  p: Plantilla;
  locale: Locale;
  etiquetas: { escritorio: string; movil: string; aviso: string };
}) {
  const [vista, setVista] = useState<'escritorio' | 'movil'>('escritorio');

  return (
    <main className="v-previa-cuerpo">
      <div className="v-conmutador" role="tablist">
        {(['escritorio', 'movil'] as const).map(v => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={vista === v}
            className={vista === v ? 'is-on' : ''}
            onClick={() => setVista(v)}
          >
            {etiquetas[v]}
          </button>
        ))}
      </div>

      <div className={`v-previa-lienzo v-previa-lienzo--${vista}`}>
        {vista === 'escritorio' ? (
          <Portatil>
            <Escaparate p={p} locale={locale} variante="escritorio" prioridad />
          </Portatil>
        ) : (
          <Telefono>
            <Escaparate p={p} locale={locale} variante="movil" prioridad />
          </Telefono>
        )}
      </div>

      <p className="v-previa-nota">{etiquetas.aviso}</p>
    </main>
  );
}
