'use client';

import { useEffect, useRef } from 'react';

/**
 * Aparición al entrar en pantalla. Una sola vez por sección.
 *
 * Con IntersectionObserver y CSS: no hace falta librería de animación, y así
 * el home no arrastra un bundle extra. Si el visitante pidió menos movimiento,
 * el contenido sale directamente visible.
 */
export function Revelar({
  children,
  clase = '',
  retardo = 0,
  etiqueta: Etiqueta = 'div',
}: {
  children: React.ReactNode;
  clase?: string;
  retardo?: number;
  etiqueta?: 'div' | 'section' | 'article' | 'li';
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible');
      return;
    }
    const obs = new IntersectionObserver(
      entradas => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            el.classList.add('is-visible');
            obs.unobserve(el);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Etiqueta
      ref={ref as never}
      className={`v-revelar ${clase}`}
      style={retardo ? { transitionDelay: `${retardo}ms` } : undefined}
    >
      {children}
    </Etiqueta>
  );
}
