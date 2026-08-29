'use client';

import { useEffect, useState } from 'react';
import { ActiveOrder, adjustLine, fetchActiveOrder, formatMoney } from '../../../../lib/shop-client';

export function CartView({ slug }: { slug: string }) {
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
      setOrder(updated && updated.lines.length ? updated : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el carrito.');
    }
  }

  const vacio = !loading && (!order || !order.lines.length);

  return (
    <>
      <h1 className="st-flujo-titulo">Tu carrito</h1>

      {error ? (
        <div className="st-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? <p className="st-cargando">Cargando…</p> : null}

      {vacio ? (
        <div className="st-caja st-caja--centro">
          <p className="st-caja-txt">Tu carrito está vacío.</p>
          <a className="st-btn st-btn--marca st-btn--grande" href="/#catalogo">
            Ver productos
          </a>
        </div>
      ) : null}

      {order && order.lines.length ? (
        <div className="st-carro">
          <div className="st-lineas">
            {order.lines.map(line => (
              <div className="st-linea" data-testid="cart-line" key={line.id}>
                <div className="st-linea-img" aria-hidden="true">
                  {line.productVariant.name.charAt(0).toUpperCase()}
                </div>
                <div className="st-linea-info">
                  <p className="st-linea-n">{line.productVariant.name}</p>
                  <p className="st-linea-p">{formatMoney(line.linePriceWithTax, order.currencyCode)}</p>
                </div>
                <div className="st-cant">
                  <button type="button" aria-label="Quitar uno" onClick={() => changeQty(line.id, line.quantity - 1)}>
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button type="button" aria-label="Añadir uno" onClick={() => changeQty(line.id, line.quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="st-resumen">
            <h2 className="st-resumen-t">Resumen</h2>
            <div className="st-fila">
              <span>Artículos</span>
              <span>{order.totalQuantity}</span>
            </div>
            <div className="st-fila">
              <span>Subtotal</span>
              <span data-testid="cart-total">{formatMoney(order.subTotalWithTax, order.currencyCode)}</span>
            </div>
            <p className="st-resumen-nota">El envío se calcula al finalizar la compra.</p>
            <a className="st-btn st-btn--marca st-btn--grande st-btn--bloque" href="/checkout">
              Finalizar compra
            </a>
            <a className="st-seguir" href="/#catalogo">
              Seguir comprando
            </a>
          </aside>
        </div>
      ) : null}
    </>
  );
}
