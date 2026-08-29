'use client';

import { useEffect, useState } from 'react';
import type { StoreDesign } from '../../../../lib/designs';
import {
  ActiveOrder,
  adjustLine,
  fetchActiveOrder,
  formatMoney,
} from '../../../../lib/shop-client';

export function CartView({
  slug,
  design,
  name,
  headingFont,
}: {
  slug: string;
  design: StoreDesign;
  name: string;
  headingFont: string;
}) {
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveOrder(slug)
      .then(setOrder)
      .catch(() => setError('No se pudo cargar el carrito.'))
      .finally(() => setLoading(false));
  }, [slug]);

  async function changeQty(lineId: string, qty: number) {
    setError(null);
    try {
      const updated = await adjustLine(slug, lineId, qty);
      setOrder(updated && updated.lines.length ? updated : updated);
      if (updated && !updated.lines.length) setOrder(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el carrito.');
    }
  }

  const empty = !loading && (!order || !order.lines.length);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: design.bg,
        color: design.ink,
        fontFamily: "'Public Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px 60px' }}>
        <a href="/" style={{ color: design.inkSoft, fontSize: 14.5, fontWeight: 600, textDecoration: 'none' }}>
          ← Seguir comprando en {name}
        </a>
        <h1 style={{ fontFamily: headingFont, fontSize: 30, margin: '18px 0 20px' }}>Tu carrito</h1>

        {error ? (
          <div style={{ background: '#fbe9e7', color: '#8a2b1d', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14.5 }}>
            {error}
          </div>
        ) : null}

        {loading ? <p style={{ color: design.inkSoft }}>Cargando…</p> : null}

        {empty ? (
          <div
            style={{
              background: design.surface,
              border: `1px solid ${design.inkSoft}26`,
              borderRadius: design.radius,
              padding: '34px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 16px', color: design.inkSoft }}>Tu carrito está vacío.</p>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                minHeight: 46,
                alignItems: 'center',
                padding: '0 22px',
                borderRadius: 9,
                background: design.brand,
                color: design.brandInk,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Ver productos
            </a>
          </div>
        ) : null}

        {order && order.lines.length ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {order.lines.map(line => (
                <div
                  key={line.id}
                  data-testid="cart-line"
                  style={{
                    background: design.surface,
                    border: `1px solid ${design.inkSoft}26`,
                    borderRadius: design.radius,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 600 }}>{line.productVariant.name}</div>
                    <div style={{ fontSize: 13.5, color: design.inkSoft }}>
                      {formatMoney(line.linePriceWithTax, order.currencyCode)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      aria-label="Quitar uno"
                      onClick={() => changeQty(line.id, line.quantity - 1)}
                      style={qtyBtn(design)}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Añadir uno"
                      onClick={() => changeQty(line.id, line.quantity + 1)}
                      style={qtyBtn(design)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 20,
                background: design.surface,
                border: `1px solid ${design.inkSoft}26`,
                borderRadius: design.radius,
                padding: '16px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: 17,
              }}
            >
              <span>Total (envío se calcula al pagar)</span>
              <span data-testid="cart-total">{formatMoney(order.subTotalWithTax, order.currencyCode)}</span>
            </div>

            <a
              href="/checkout"
              style={{
                marginTop: 20,
                display: 'flex',
                minHeight: 52,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                background: design.brand,
                color: design.brandInk,
                fontWeight: 700,
                fontSize: 16.5,
                textDecoration: 'none',
              }}
            >
              Finalizar compra
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}

function qtyBtn(design: StoreDesign): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: 9,
    border: `1.5px solid ${design.inkSoft}44`,
    background: design.bg,
    color: design.ink,
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
  };
}
