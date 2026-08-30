'use client';

/** Piezas interactivas de la tienda: registro PWA, contador y añadir al carrito. */

import { useEffect, useState } from 'react';
import { addToCart, fetchActiveOrder } from '../../../lib/shop-client';
import { useTt } from '../../../lib/tienda-locale';

/** Registra el service worker que hace instalable la tienda como app (PWA). */
export function PwaSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);
  return null;
}

export function CartBadge({ slug }: { slug: string }) {
  const t = useTt();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      fetchActiveOrder(slug)
        .then(o => {
          if (alive) setCount(o?.totalQuantity ?? 0);
        })
        .catch(() => undefined);
    refresh();
    window.addEventListener('fabrica:cart-changed', refresh);
    return () => {
      alive = false;
      window.removeEventListener('fabrica:cart-changed', refresh);
    };
  }, [slug]);

  return (
    <a
      className={`st-carrito${count > 0 ? ' is-lleno' : ''}`}
      href="/cart"
      aria-label={`${t('st.carrito')} ${count}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 7h13l-1.4 8.2a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.6L5.3 4.9A1 1 0 0 0 4.3 4H3" />
        <circle cx="10" cy="20" r="1.2" />
        <circle cx="17" cy="20" r="1.2" />
      </svg>
      <span className="st-carrito-n">{count}</span>
    </a>
  );
}

export function AddToCartButton({ slug, variantId }: { slug: string; variantId: string }) {
  const t = useTt();
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  async function add() {
    setState('busy');
    try {
      await addToCart(slug, variantId);
      setState('done');
      setTimeout(() => setState('idle'), 1800);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2600);
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={state === 'busy'}
      className={`st-btn st-btn--marca st-add${state === 'done' ? ' is-ok' : ''}${state === 'error' ? ' is-mal' : ''}`}
    >
      {state === 'busy'
        ? t('st.anadiendo')
        : state === 'done'
          ? t('st.anadido')
          : state === 'error'
            ? t('st.error.anadir')
            : t('st.anadir')}
    </button>
  );
}

/**
 * Galería de un producto en el escaparate.
 *
 * La tarjeta pintaba SIEMPRE la inicial del nombre y no la foto: el comerciante
 * subía una imagen a su panel y su tienda seguía enseñando una letra. Con
 * varias fotos por producto eso ya no se sostenía, así que la tarjeta enseña la
 * portada y, si hay más, unas miniaturas para cambiarla. Sin fotos se vuelve a
 * la inicial, que es mejor que un hueco gris.
 */
export function GaleriaProducto({
  fotos,
  inicial,
  variante,
}: {
  fotos: { id: string; preview: string }[];
  inicial: string;
  variante: number;
}) {
  const [activa, setActiva] = useState(0);
  const t = useTt();

  if (fotos.length === 0) {
    return (
      <div className={`st-prod-img st-prod-img--${variante}`} aria-hidden="true">
        <span>{inicial}</span>
      </div>
    );
  }

  return (
    <div className="st-prod-galeria">
      <div className="st-prod-img st-prod-img--foto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotos[activa]?.preview} alt="" />
      </div>
      {fotos.length > 1 ? (
        <ul className="st-prod-minis">
          {fotos.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                className={i === activa ? 'es-activa' : ''}
                aria-label={`${t('st.foto')} ${i + 1}`}
                aria-current={i === activa}
                onClick={() => setActiva(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.preview} alt="" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
