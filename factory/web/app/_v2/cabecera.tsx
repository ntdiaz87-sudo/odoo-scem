'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SelectorIdioma } from '../locale-provider';
import { SelectorTema } from '../tema-provider';

export function Cabecera({
  enlaces,
  etiquetas,
}: {
  enlaces: { href: string; txt: string }[];
  etiquetas: { entrar: string; crear: string; menu: string; claro: string; oscuro: string };
}) {
  const [compacta, setCompacta] = useState(false);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const alScroll = () => setCompacta(window.scrollY > 12);
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [abierto]);

  return (
    <header className={`v-cab${compacta ? ' is-compacta' : ''}`}>
      <div className="v-envoltura v-cab-fila">
        <Link href="/" className="v-marca" aria-label="fábrica">
          fábrica<span>.</span>
        </Link>

        <nav className="v-cab-nav" aria-label="Secciones">
          {enlaces.map(e => (
            <a key={e.href} href={e.href}>{e.txt}</a>
          ))}
        </nav>

        <div className="v-cab-fin">
          <SelectorIdioma compacto />
          <SelectorTema etiquetas={{ claro: etiquetas.claro, oscuro: etiquetas.oscuro }} />
          <Link className="v-cab-entrar" href="/panel">{etiquetas.entrar}</Link>
          <Link className="v-btn v-btn--acento v-cab-cta" href="/demo">{etiquetas.crear}</Link>
          <button
            type="button"
            className="v-cab-menu"
            aria-label={etiquetas.menu}
            aria-expanded={abierto}
            onClick={() => setAbierto(v => !v)}
          >
            <span className={abierto ? 'is-x' : ''} />
          </button>
        </div>
      </div>

      {abierto ? (
        <div className="v-cab-panel">
          <nav>
            {enlaces.map(e => (
              <a key={e.href} href={e.href} onClick={() => setAbierto(false)}>{e.txt}</a>
            ))}
            <Link href="/panel" onClick={() => setAbierto(false)}>{etiquetas.entrar}</Link>
          </nav>
          <Link className="v-btn v-btn--acento v-btn--grande" href="/demo" onClick={() => setAbierto(false)}>
            {etiquetas.crear}
          </Link>
        </div>
      ) : null}
    </header>
  );
}
