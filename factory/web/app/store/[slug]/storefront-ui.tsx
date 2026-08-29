'use client';

/** Piezas interactivas del escaparate: botón de añadir y contador del carrito. */

import { useEffect, useState } from 'react';
import { addToCart, fetchActiveOrder } from '../../../lib/shop-client';

export function CartBadge({
  slug,
  surface,
  ink,
  inkSoft,
  brand,
  brandInk,
}: {
  slug: string;
  surface: string;
  ink: string;
  inkSoft: string;
  brand: string;
  brandInk: string;
}) {
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

  const active = count > 0;
  return (
    <a
      href="/cart"
      aria-label={`Carrito, ${count} artículos`}
      style={{
        minWidth: 44,
        minHeight: 44,
        borderRadius: 999,
        padding: '0 16px',
        background: active ? brand : surface,
        color: active ? brandInk : ink,
        border: `1px solid ${inkSoft}33`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontSize: 14,
        fontWeight: 700,
        textDecoration: 'none',
      }}
    >
      🛒 {count}
    </a>
  );
}

export function AddToCartButton({
  slug,
  variantId,
  brand,
  brandInk,
}: {
  slug: string;
  variantId: string;
  brand: string;
  brandInk: string;
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  async function add() {
    setState('busy');
    try {
      await addToCart(slug, variantId);
      setState('done');
      setTimeout(() => setState('idle'), 1600);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2500);
    }
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={state === 'busy'}
      style={{
        marginTop: 10,
        minHeight: 44,
        border: 'none',
        borderRadius: 9,
        background: brand,
        color: brandInk,
        fontWeight: 700,
        fontSize: 14.5,
        cursor: 'pointer',
        opacity: state === 'busy' ? 0.7 : 1,
        fontFamily: 'inherit',
      }}
    >
      {state === 'busy'
        ? 'Añadiendo…'
        : state === 'done'
          ? '✓ En el carrito'
          : state === 'error'
            ? 'No se pudo, reintenta'
            : 'Añadir al carrito'}
    </button>
  );
}
