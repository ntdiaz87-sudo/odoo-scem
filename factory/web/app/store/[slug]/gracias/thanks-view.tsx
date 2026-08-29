'use client';

import { useEffect, useState } from 'react';
import { formatMoney, shopFetch } from '../../../../lib/shop-client';

interface PlacedOrder {
  code: string;
  state: string;
  totalWithTax: number;
  currencyCode: string;
  customer?: { emailAddress: string } | null;
}

export function ThanksView({ slug, nombre }: { slug: string; nombre: string }) {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('pedido') || '';
    setCode(c);
    if (!c) return;
    shopFetch<{ orderByCode: PlacedOrder | null }>(
      slug,
      `query ByCode($code: String!) {
        orderByCode(code: $code) { code state totalWithTax currencyCode customer { emailAddress } }
      }`,
      { code: c },
    )
      .then(d => setOrder(d.orderByCode))
      .catch(() => undefined);
  }, [slug]);

  return (
    <div className="st-caja st-caja--centro st-gracias">
      <span className="st-gracias-marca" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h1 className="st-gracias-t">¡Pedido confirmado!</h1>
      <p className="st-caja-txt">Gracias por comprar en {nombre}.</p>

      {code ? (
        <dl className="st-pedido">
          <dt>Número de pedido</dt>
          <dd data-testid="order-code">{code}</dd>
          {order ? (
            <>
              <dt>Total</dt>
              <dd>{formatMoney(order.totalWithTax, order.currencyCode)}</dd>
              {order.customer?.emailAddress ? (
                <>
                  <dt>Aviso enviado a</dt>
                  <dd>{order.customer.emailAddress}</dd>
                </>
              ) : null}
            </>
          ) : null}
        </dl>
      ) : null}

      <p className="st-gracias-nota">La tienda te contactará para coordinar el pago y la entrega.</p>
      <a className="st-btn st-btn--marca st-btn--grande" href="/">
        Volver a la tienda
      </a>
    </div>
  );
}
