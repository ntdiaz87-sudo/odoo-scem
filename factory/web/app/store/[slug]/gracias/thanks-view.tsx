'use client';

import { useEffect, useState } from 'react';
import { GrupoPintuan, grupoGuardado, olvidarGrupo, shopFetch, verGrupo } from '../../../../lib/shop-client';
import { useDinero, useTt } from '../../../../lib/tienda-locale';

interface PlacedOrder {
  code: string;
  state: string;
  totalWithTax: number;
  currencyCode: string;
  customer?: { emailAddress: string } | null;
}

export function ThanksView({ slug, nombre }: { slug: string; nombre: string }) {
  const t = useTt();
  const money = useDinero();
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [grupo, setGrupo] = useState<GrupoPintuan | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const codigo = grupoGuardado(slug);
    if (!codigo) return;
    verGrupo(slug, codigo)
      .then(gr => {
        // Abierto: se comparte. Completo: se celebra. Caducado: ni una ni otra.
        if (gr && gr.estado !== 'caducado') setGrupo(gr);
        else olvidarGrupo(slug);
      })
      .catch(() => undefined);
  }, [slug]);

  async function copiarEnlace() {
    if (!grupo) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/?g=${grupo.codigo}`);
      setCopiado(true);
    } catch {
      /* sin permiso de portapapeles: el enlace queda visible para copiarlo a mano */
    }
  }

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

      {grupo ? (
        <div className="st-pt-compartir" data-testid="pt-compartir">
          <b>{t('st.pt.banner.t')}</b>
          <p className="st-caja-txt">
            {t('st.pt.progreso', { u: String(grupo.unidos), n: String(grupo.tamano) })}
            {grupo.unidos < grupo.tamano
              ? ` · ${t('st.pt.faltan', { f: String(grupo.tamano - grupo.unidos) })}`
              : ` · ${t('st.pt.completo')}`}
          </p>
          {grupo.estado === 'abierto' ? (
            <>
              <p className="st-caja-txt">{t('st.pt.comparte')}</p>
              <code className="st-pt-enlace">{typeof window !== 'undefined' ? `${window.location.origin}/?g=${grupo.codigo}` : ''}</code>
              <button type="button" className="st-btn" onClick={copiarEnlace}>
                {copiado ? t('st.pt.copiado') : t('st.pt.copiar')}
              </button>
              <p className="st-gracias-nota">{t('st.pt.nota')}</p>
            </>
          ) : null}
        </div>
      ) : null}

      <p className="st-gracias-nota">{t('g.nota')}</p>
      <a className="st-btn st-btn--marca st-btn--grande" href="/">
        {t('g.volver')}
      </a>
    </div>
  );
}
