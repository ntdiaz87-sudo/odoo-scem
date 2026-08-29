'use client';

import { useEffect, useState } from 'react';
import type { StoreDesign } from '../../../../lib/designs';
import { formatMoney, shopFetch } from '../../../../lib/shop-client';

interface PlacedOrder {
  code: string;
  state: string;
  totalWithTax: number;
  currencyCode: string;
  customer?: { emailAddress: string } | null;
}

export function ThanksView({
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
    <div
      style={{
        minHeight: '100vh',
        background: design.bg,
        color: design.ink,
        fontFamily: "'Public Sans', system-ui, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          background: design.surface,
          border: `1px solid ${design.inkSoft}26`,
          borderRadius: design.radius,
          padding: '34px 28px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 46 }}>✅</div>
        <h1 style={{ fontFamily: headingFont, fontSize: 27, margin: '10px 0 8px' }}>
          ¡Pedido confirmado!
        </h1>
        <p style={{ color: design.inkSoft, fontSize: 15.5, margin: '0 0 16px' }}>
          Gracias por comprar en {name}.
        </p>
        {code ? (
          <div
            style={{
              background: design.bg,
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 15,
              marginBottom: 14,
            }}
          >
            Número de pedido: <strong data-testid="order-code">{code}</strong>
            {order ? (
              <div style={{ color: design.inkSoft, fontSize: 14, marginTop: 4 }}>
                Total {formatMoney(order.totalWithTax, order.currencyCode)}
                {order.customer?.emailAddress ? ` · aviso a ${order.customer.emailAddress}` : ''}
              </div>
            ) : null}
          </div>
        ) : null}
        <p style={{ color: design.inkSoft, fontSize: 14, margin: '0 0 20px' }}>
          La tienda te contactará para coordinar el pago y la entrega.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-flex',
            minHeight: 48,
            alignItems: 'center',
            padding: '0 24px',
            borderRadius: 9,
            background: design.brand,
            color: design.brandInk,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Volver a la tienda
        </a>
      </div>
    </div>
  );
}
