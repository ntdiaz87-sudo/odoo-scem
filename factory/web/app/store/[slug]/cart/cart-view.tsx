'use client';

import { useEffect, useState } from 'react';
import { ActiveOrder, adjustLine, applyCoupon, fetchActiveOrder, removeCoupon } from '../../../../lib/shop-client';
import { useDinero, useTt } from '../../../../lib/tienda-locale';

export function CartView({ slug }: { slug: string }) {
  const t = useTt();
  const money = useDinero();
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cupon, setCupon] = useState('');
  const [cuponError, setCuponError] = useState<string | null>(null);
  const [cuponBusy, setCuponBusy] = useState(false);

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

  async function usarCupon(e: React.FormEvent) {
    e.preventDefault();
    if (!cupon.trim() || cuponBusy) return;
    setCuponError(null);
    setCuponBusy(true);
    try {
      setOrder(await applyCoupon(slug, cupon.trim()));
      setCupon('');
    } catch {
      // Vendure devuelve el motivo en inglés: al comprador le vale con
      // saber que el código no funciona, en su idioma.
      setCuponError(t('c.cupon.mal'));
    } finally {
      setCuponBusy(false);
    }
  }

  async function quitarCupon(code: string) {
    setCuponError(null);
    try {
      setOrder(await removeCoupon(slug, code));
    } catch {
      /* si falla, el refresco del pedido lo dejará claro */
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
                  <p className="st-linea-p">
                    {line.discountedLinePriceWithTax < line.linePriceWithTax ? (
                      <>
                        <s className="st-precio-antes">{money(line.linePriceWithTax, order.currencyCode)}</s>{' '}
                        {money(line.discountedLinePriceWithTax, order.currencyCode)}
                      </>
                    ) : (
                      money(line.linePriceWithTax, order.currencyCode)
                    )}
                  </p>
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
            {order.discounts.map(d => (
              <div className="st-fila st-fila--desc" key={d.description}>
                <span>{t('c.descuento')} · {d.description}</span>
                <span>{money(d.amountWithTax, order.currencyCode)}</span>
              </div>
            ))}
            <div className="st-fila st-fila--total">
              <span>{t('c.total')}</span>
              <span>{money(order.totalWithTax, order.currencyCode)}</span>
            </div>

            <form className="st-cupon" onSubmit={usarCupon}>
              <label className="st-cupon-l" htmlFor="cupon">{t('c.cupon')}</label>
              <div className="st-cupon-fila">
                <input
                  id="cupon"
                  value={cupon}
                  onChange={e => setCupon(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
                <button type="submit" className="st-btn" disabled={cuponBusy}>
                  {t('c.cupon.aplicar')}
                </button>
              </div>
              {cuponError ? <p className="st-cupon-mal" role="alert">{cuponError}</p> : null}
              {order.couponCodes.length ? (
                <p className="st-cupon-ok">
                  {order.couponCodes.map(c => (
                    <span key={c} className="st-cupon-chip">
                      {c}
                      <button type="button" aria-label={t('c.cupon.quitar')} onClick={() => quitarCupon(c)}>×</button>
                    </span>
                  ))}
                </p>
              ) : null}
            </form>

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
