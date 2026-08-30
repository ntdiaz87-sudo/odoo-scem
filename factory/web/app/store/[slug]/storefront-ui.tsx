'use client';

/** Piezas interactivas de la tienda: registro PWA, contador y añadir al carrito. */

import { useEffect, useState } from 'react';
import { captarDistribuidor, comprarEnGrupo, iniciarGrupo, notifyCartChanged, addToCart, fetchActiveOrder } from '../../../lib/shop-client';
import { useDinero, useTt } from '../../../lib/tienda-locale';

/** Registra el service worker que hace instalable la tienda como app (PWA). */
/**
 * Si la visita llega con ?d=CODIGO (enlace de un 分销员), el código se
 * guarda y el checkout atribuirá el pedido. Sin interfaz: solo memoria.
 */
export function CaptaDistribuidor({ slug }: { slug: string }) {
  useEffect(() => {
    captarDistribuidor(slug);
  }, [slug]);
  return null;
}

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

/**
 * Precio + variantes + añadir al carrito, juntos porque comparten estado.
 *
 * Con una sola variante no se enseña ningún selector: la mayoría de productos
 * de una tienda pequeña no tienen tallas y no hay que hacerles pensar. Con
 * varias, chips con el nombre corto de cada una (lo que no repite el nombre
 * del producto) y el precio cambia con la elegida.
 */
export function CompraProducto({
  slug,
  nombreProducto,
  variantes,
  seckill,
  pintuan,
  grupoActivo,
  productId,
}: {
  productId: string;
  slug: string;
  nombreProducto: string;
  variantes: { id: string; name: string; priceWithTax: number; currencyCode: string }[];
  /** 秒杀 activo sobre este producto: % de rebaja y hora de fin. */
  seckill?: { pct: number; badge: string } | null;
  /** 拼团 configurado en el producto. */
  pintuan?: { tamano: number; pct: number; badge: string; abrir: string; unirse: string } | null;
  /** Código de grupo si el visitante llegó por un enlace de 拼团 de ESTE producto. */
  grupoActivo?: string | null;
}) {
  const [elegida, setElegida] = useState(0);
  const money = useDinero();
  const v = variantes[elegida];
  if (!v) return null;

  const corto = (n: string) => n.replace(nombreProducto, '').trim() || n;

  return (
    <>
      {variantes.length > 1 ? (
        <div className="st-variantes" role="group">
          {variantes.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className={i === elegida ? 'es-activa' : ''}
              aria-pressed={i === elegida}
              onClick={() => setElegida(i)}
            >
              {corto(x.name)}
            </button>
          ))}
        </div>
      ) : null}
      {seckill ? (
        <p className="st-prod-p">
          <span className="st-sk-badge">{seckill.badge}</span>{' '}
          <s className="st-precio-antes">{money(v.priceWithTax, v.currencyCode)}</s>{' '}
          {money(Math.round((v.priceWithTax * (100 - seckill.pct)) / 100), v.currencyCode)}
        </p>
      ) : (
        <p className="st-prod-p">{money(v.priceWithTax, v.currencyCode)}</p>
      )}
      <AddToCartButton slug={slug} variantId={v.id} />
      {pintuan ? (
        <BotonGrupo
          slug={slug}
          productId={productId}
          variantId={v.id}
          precio={money(Math.round((v.priceWithTax * (100 - pintuan.pct)) / 100), v.currencyCode)}
          pintuan={pintuan}
          grupoActivo={grupoActivo}
        />
      ) : null}
    </>
  );
}

/**
 * 拼团 en la tarjeta: enseña el precio de grupo y, según cómo llegó el
 * visitante, ABRE un grupo nuevo o SE UNE al del enlace. En ambos casos la
 * compra sale al precio de grupo y el carrito lleva el código.
 */
function BotonGrupo({
  slug,
  productId,
  variantId,
  precio,
  pintuan,
  grupoActivo,
}: {
  slug: string;
  productId: string;
  variantId: string;
  precio: string;
  pintuan: { tamano: number; pct: number; badge: string; abrir: string; unirse: string };
  grupoActivo?: string | null;
}) {
  const [ocupado, setOcupado] = useState(false);
  async function comprar() {
    if (ocupado) return;
    setOcupado(true);
    try {
      const codigo = grupoActivo || (await iniciarGrupo(slug, productId)).codigo;
      await comprarEnGrupo(slug, variantId, codigo);
      window.location.href = '/cart';
    } catch {
      setOcupado(false);
    }
  }
  return (
    <button type="button" className="st-btn st-pt-btn" onClick={comprar} disabled={ocupado}>
      <span className="st-pt-badge">{pintuan.badge}</span>
      {grupoActivo ? pintuan.unirse : pintuan.abrir} · {precio}
    </button>
  );
}
