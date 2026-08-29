'use client';

import { useEffect, useState } from 'react';
import { shopFetch } from '../../../../lib/shop-client';
import { money, t } from '../../../../lib/i18n';

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
      <h1 className="st-gracias-t">{t('g.confirmado')}</h1>
      <p className="st-caja-txt">{t('g.gracias', { tienda: nombre })}</p>

      {code ? (
        <dl className="st-pedido">
          <dt>{t('g.numero')}</dt>
          <dd data-testid="order-code">{code}</dd>
          {order ? (
            <>
              <dt>{t('g.total')}</dt>
              <dd>{money(order.totalWithTax, order.currencyCode)}</dd>
              {order.customer?.emailAddress ? (
                <>
                  <dt>{t('g.aviso')}</dt>
                  <dd>{order.customer.emailAddress}</dd>
                </>
              ) : null}
            </>
          ) : null}
        </dl>
      ) : null}

      <p className="st-gracias-nota">{t('g.nota')}</p>
      <a className="st-btn st-btn--marca st-btn--grande" href="/">
        {t('g.volver')}
      </a>
    </div>
  );
}
