'use client';

import { useEffect, useState } from 'react';
import { ActiveOrder, adjustLine, fetchActiveOrder } from '../../../../lib/shop-client';
import { money, t } from '../../../../lib/i18n';

export function CartView({ slug }: { slug: string }) {
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveOrder(slug)
      .then(setOrder)
      .catch(() => setError(t('c.error.cargar')))
      .finally(() => setLoading(false));
  }, [slug]);

  async function changeQty(lineId: string, qty: number) {
    setError(null);
    try {
      const updated = await adjustLine(slug, lineId, qty);
      setOrder(updated && updated.lines.length ? updated : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('c.error'));
    }
  }

  const vacio = !loading && (!order || !order.lines.length);

  return (
    <>
      <h1 className="st-flujo-titulo">{t('c.tu.carrito')}</h1>

      {error ? (
        <div className="st-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? <p className="st-cargando">{t('c.cargando')}</p> : null}

      {vacio ? (
        <div className="st-caja st-caja--centro">
          <p className="st-caja-txt">{t('c.vacio')}</p>
          <a className="st-btn st-btn--marca st-btn--grande" href="/#catalogo">
            {t('st.ver')}
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
                  <p className="st-linea-p">{money(line.linePriceWithTax, order.currencyCode)}</p>
                </div>
                <div className="st-cant">
                  <button type="button" aria-label={t('c.quitar')} onClick={() => changeQty(line.id, line.quantity - 1)}>
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button type="button" aria-label={t('c.anadir')} onClick={() => changeQty(line.id, line.quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="st-resumen">
            <h2 className="st-resumen-t">{t('c.resumen')}</h2>
            <div className="st-fila">
              <span>{t('c.articulos')}</span>
              <span>{order.totalQuantity}</span>
            </div>
            <div className="st-fila">
              <span>{t('c.subtotal')}</span>
              <span data-testid="cart-total">{money(order.subTotalWithTax, order.currencyCode)}</span>
            </div>
            <p className="st-resumen-nota">{t('c.envio.nota')}</p>
            <a className="st-btn st-btn--marca st-btn--grande st-btn--bloque" href="/checkout">
              {t('c.finalizar')}
            </a>
            <a className="st-seguir" href="/#catalogo">
              {t('c.seguir')}
            </a>
          </aside>
        </div>
      ) : null}
    </>
  );
}
