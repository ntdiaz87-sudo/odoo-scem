'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '../../lib/i18n';
import type { Plantilla } from '../../lib/plantillas';
import { etiquetaCategoria } from '../../lib/plantillas';
import { Escaparate, Portatil, Telefono } from './escaparate';

const CADA = 5000;

export function Hero({
  plantillas,
  locale,
  etiquetas,
}: {
  plantillas: Plantilla[];
  locale: Locale;
  etiquetas: Record<string, string>;
}) {
  const [i, setI] = useState(0);
  const [texto, setTexto] = useState('');
  const router = useRouter();
  const pausado = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => {
      if (!pausado.current && !document.hidden) setI(v => (v + 1) % plantillas.length);
    }, CADA);
    return () => clearInterval(t);
  }, [plantillas.length]);

  const actual = plantillas[i];

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const q = texto.trim();
    router.push(q ? `/demo?q=${encodeURIComponent(q)}` : '/demo');
  }

  return (
    <section className="v-hero">
      <div className="v-hero-luz" aria-hidden="true" />
      <div className="v-envoltura v-hero-rejilla">
        <div className="v-hero-copy">
          <h1 className="v-h1">
            {etiquetas.h1a}
            <br />
            <span className="v-h1-acento">{etiquetas.h1b}</span>
          </h1>
          <p className="v-hero-sub">{etiquetas.sub}</p>

          <form className="v-hero-form" onSubmit={enviar}>
            <input
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder={etiquetas.ph}
              aria-label={etiquetas.ph}
              maxLength={80}
            />
            <button type="submit" aria-label={etiquetas.enviar}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          <div className="v-hero-ctas">
            <a className="v-btn v-btn--linea" href="#templates">{etiquetas.cta1}</a>
            <a className="v-btn v-btn--suave" href="/demo?modo=ai">{etiquetas.cta2}</a>
          </div>

          <ul className="v-hero-pruebas">
            <li>{etiquetas.p1}</li>
            <li>{etiquetas.p2}</li>
            <li>{etiquetas.p3}</li>
          </ul>
        </div>

        <div
          className="v-hero-visual"
          onMouseEnter={() => { pausado.current = true; }}
          onMouseLeave={() => { pausado.current = false; }}
        >
          <div className="v-hero-escena">
            <Portatil clase="v-hero-portatil">
              {plantillas.map((p, k) => (
                <div key={p.id} className={`v-capa${k === i ? ' is-on' : ''}`}>
                  <Escaparate p={p} locale={locale} variante="escritorio" prioridad={k === 0} />
                </div>
              ))}
            </Portatil>
            <Telefono clase="v-hero-telefono">
              {plantillas.map((p, k) => (
                <div key={p.id} className={`v-capa${k === i ? ' is-on' : ''}`}>
                  <Escaparate p={p} locale={locale} variante="movil" prioridad={k === 0} />
                </div>
              ))}
            </Telefono>
          </div>

          <div className="v-hero-puntos" role="tablist" aria-label="Plantillas">
            {plantillas.map((p, k) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={k === i}
                className={k === i ? 'is-on' : ''}
                onClick={() => setI(k)}
              >
                {etiquetaCategoria(p.categoria, locale)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
