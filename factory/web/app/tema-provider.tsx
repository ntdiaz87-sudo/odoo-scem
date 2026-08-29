'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { COOKIE_TEMA, type Tema } from '../lib/tema';

/**
 * El tema se pinta ya resuelto desde el servidor (atributo data-theme en
 * <html>), así que aquí no hay parpadeo que arreglar: este contexto solo
 * sirve para cambiarlo sin recargar. Al cambiar se escribe la cookie y se
 * toca el atributo directamente; nada de recargar la página por un tema.
 */
const Ctx = createContext<{ tema: Tema | null; cambiar: (t: Tema | null) => void }>({
  tema: null,
  cambiar: () => {},
});

export function TemaProvider({ inicial, children }: { inicial: Tema | null; children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema | null>(inicial);

  const cambiar = useCallback((t: Tema | null) => {
    setTema(t);
    const raiz = document.documentElement;
    if (t) raiz.setAttribute('data-theme', t);
    else raiz.removeAttribute('data-theme');
    document.cookie = t
      ? `${COOKIE_TEMA}=${t}; path=/; max-age=31536000; samesite=lax`
      : `${COOKIE_TEMA}=; path=/; max-age=0; samesite=lax`;
  }, []);

  return <Ctx.Provider value={{ tema, cambiar }}>{children}</Ctx.Provider>;
}

export const useTema = () => useContext(Ctx);

function IconoSol() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
    </svg>
  );
}
function IconoLuna() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}

export function SelectorTema({ etiquetas }: { etiquetas: { claro: string; oscuro: string } }) {
  const { tema, cambiar } = useTema();
  const [sistema, setSistema] = useState<Tema>('light');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const leer = () => setSistema(mq.matches ? 'dark' : 'light');
    leer();
    mq.addEventListener('change', leer);
    return () => mq.removeEventListener('change', leer);
  }, []);

  const efectivo = tema ?? sistema;
  const siguiente = efectivo === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="v-tema"
      onClick={() => cambiar(siguiente)}
      aria-label={siguiente === 'dark' ? etiquetas.oscuro : etiquetas.claro}
      title={siguiente === 'dark' ? etiquetas.oscuro : etiquetas.claro}
    >
      {efectivo === 'dark' ? <IconoSol /> : <IconoLuna />}
    </button>
  );
}
