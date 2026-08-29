'use client';

/**
 * Checkout de la tienda: datos del comprador, envío y pago manual
 * (transferencia / acordado con la tienda). El pago queda AUTORIZADO y el
 * dueño lo liquida desde su panel cuando recibe el dinero.
 */
import { useEffect, useState } from 'react';
import {
  ActiveOrder,
  ORDER_FIELDS,
  fetchActiveOrder,
  notifyCartChanged,
  shopFetch,
} from '../../../../lib/shop-client';
import { money, t } from '../../../../lib/i18n';

interface ShippingMethodOption {
  id: string;
  name: string;
  priceWithTax: number;
}

export function CheckoutForm({ slug, nombre }: { slug: string; nombre: string }) {
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('US');

  useEffect(() => {
    Promise.all([
      fetchActiveOrder(slug),
      shopFetch<{
        availableCountries: Array<{ code: string; name: string }>;
        eligibleShippingMethods: ShippingMethodOption[];
      }>(slug, `{ availableCountries { code name } eligibleShippingMethods { id name priceWithTax } }`),
    ])
      .then(([o, meta]) => {
        setOrder(o);
        setCountries(meta.availableCountries);
        setShippingMethods(meta.eligibleShippingMethods);
        if (meta.eligibleShippingMethods[0]) setShippingMethodId(meta.eligibleShippingMethods[0].id);
      })
      .catch(() => setError('No se pudo cargar el checkout. Vuelve al carrito e inténtalo de nuevo.'))
      .finally(() => setLoading(false));
  }, [slug]);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !email.includes('@') || !street.trim() || !city.trim()) {
      setError(t('ck.faltan'));
      return;
    }
    setBusy(true);
    try {
      const customer = await shopFetch<{
        setCustomerForOrder: { __typename: string; message?: string };
      }>(
        slug,
        `mutation SetCustomer($input: CreateCustomerInput!) {
          setCustomerForOrder(input: $input) {
            __typename
            ... on Order { id }
            ... on ErrorResult { message }
          }
        }`,
        {
          input: {
            firstName: firstName.trim(),
            lastName: lastName.trim() || '-',
            emailAddress: email.trim(),
            phoneNumber: phone.trim() || undefined,
          },
        },
      );
      if (customer.setCustomerForOrder.__typename !== 'Order') {
        throw new Error(customer.setCustomerForOrder.message || 'No se pudieron guardar tus datos.');
      }

      const addr = await shopFetch<{
        setOrderShippingAddress: { __typename: string; message?: string };
      }>(
        slug,
        `mutation SetAddr($input: CreateAddressInput!) {
          setOrderShippingAddress(input: $input) {
            __typename
            ... on Order { id }
            ... on ErrorResult { message }
          }
        }`,
        {
          input: {
            fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
            streetLine1: street.trim(),
            city: city.trim(),
            countryCode,
            phoneNumber: phone.trim() || undefined,
          },
        },
      );
      if (addr.setOrderShippingAddress.__typename !== 'Order') {
        throw new Error(addr.setOrderShippingAddress.message || 'La dirección no es válida.');
      }

      if (shippingMethodId) {
        const ship = await shopFetch<{
          setOrderShippingMethod: { __typename: string; message?: string };
        }>(
          slug,
          `mutation SetShip($id: [ID!]!) {
            setOrderShippingMethod(shippingMethodId: $id) {
              __typename
              ... on Order { id }
              ... on ErrorResult { message }
            }
          }`,
          { id: [shippingMethodId] },
        );
        if (ship.setOrderShippingMethod.__typename !== 'Order') {
          throw new Error(ship.setOrderShippingMethod.message || 'No se pudo fijar el envío.');
        }
      }

      const transition = await shopFetch<{
        transitionOrderToState: { __typename: string; message?: string } | null;
      }>(
        slug,
        `mutation {
          transitionOrderToState(state: "ArrangingPayment") {
            __typename
            ... on Order { id }
            ... on OrderStateTransitionError { message }
          }
        }`,
      );
      if (transition.transitionOrderToState && transition.transitionOrderToState.__typename !== 'Order') {
        throw new Error(transition.transitionOrderToState.message || 'No se pudo preparar el pago.');
      }

      const pm = await shopFetch<{
        eligiblePaymentMethods: Array<{ code: string; isEligible: boolean }>;
      }>(slug, `{ eligiblePaymentMethods { code isEligible } }`);
      const method = pm.eligiblePaymentMethods.find(m => m.isEligible);
      if (!method) throw new Error('La tienda no tiene método de pago configurado.');

      const pay = await shopFetch<{
        addPaymentToOrder: { __typename: string; message?: string; code?: string; state?: string };
      }>(
        slug,
        `mutation Pay($input: PaymentInput!) {
          addPaymentToOrder(input: $input) {
            __typename
            ... on Order { code state }
            ... on ErrorResult { message }
          }
        }`,
        { input: { method: method.code, metadata: { forma: 'pago manual acordado con la tienda' } } },
      );
      if (pay.addPaymentToOrder.__typename !== 'Order') {
        throw new Error(pay.addPaymentToOrder.message || 'No se pudo registrar el pedido.');
      }
      notifyCartChanged();
      window.location.href = `/gracias?pedido=${encodeURIComponent(pay.addPaymentToOrder.code || '')}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ck.error'));
      setBusy(false);
    }
  }

  const empty = !loading && (!order || !order.lines.length);
  const shippingPrice = shippingMethods.find(m => m.id === shippingMethodId)?.priceWithTax ?? 0;

  const empty2 = empty;

  return (
    <>
      <a className="st-atras" href="/cart">
        <span aria-hidden="true">←</span> {t('ck.volver')}
      </a>
      <h1 className="st-flujo-titulo">{t('ck.titulo')}</h1>
      <p className="st-flujo-sub">{t('ck.sub', { tienda: nombre })}</p>

      {error ? (
        <div className="st-error" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? <p className="st-cargando">{t('c.cargando')}</p> : null}
      {empty2 ? (
        <div className="st-caja st-caja--centro">
          <p className="st-caja-txt">{t('c.vacio')}</p>
          <a className="st-btn st-btn--marca st-btn--grande" href="/#catalogo">
            {t('st.ver')}
          </a>
        </div>
      ) : null}

      {order && order.lines.length ? (
        <form className="st-carro" onSubmit={placeOrder}>
          <div className="st-form">
            <fieldset className="st-grupo">
              <legend>{t('ck.datos')}</legend>
              <div className="st-campos">
                <div className="st-campo">
                  <label htmlFor="coNombre">{t('ck.nombre')}</label>
                  <input id="coNombre" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
                <div className="st-campo">
                  <label htmlFor="coApellidos">{t('ck.apellidos')}</label>
                  <input id="coApellidos" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
                </div>
                <div className="st-campo">
                  <label htmlFor="coCorreo">{t('ck.correo')}</label>
                  <input id="coCorreo" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div className="st-campo">
                  <label htmlFor="coTelefono">{t('ck.telefono')}</label>
                  <input id="coTelefono" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
                </div>
              </div>
            </fieldset>

            <fieldset className="st-grupo">
              <legend>{t('ck.entrega')}</legend>
              <div className="st-campos">
                <div className="st-campo st-campo--ancho">
                  <label htmlFor="coDireccion">{t('ck.direccion')}</label>
                  <input id="coDireccion" value={street} onChange={e => setStreet(e.target.value)} placeholder={t('ck.direccion.ph')} autoComplete="street-address" />
                </div>
                <div className="st-campo">
                  <label htmlFor="coCiudad">{t('ck.ciudad')}</label>
                  <input id="coCiudad" value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" />
                </div>
                <div className="st-campo">
                  <label htmlFor="coPais">{t('ck.pais')}</label>
                  <select id="coPais" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {shippingMethods.length > 1 ? (
                <div className="st-envios">
                  {shippingMethods.map(m => (
                    <label key={m.id} className={`st-envio${shippingMethodId === m.id ? ' is-sel' : ''}`}>
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethodId === m.id}
                        onChange={() => setShippingMethodId(m.id)}
                      />
                      <span>
                        {m.name}
                        <b>{money(m.priceWithTax, order.currencyCode)}</b>
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </fieldset>

            <fieldset className="st-grupo">
              <legend>{t('ck.pago')}</legend>
              <div className="st-pago">
                <span className="st-pago-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
                    <path d="M2.5 10h19" />
                  </svg>
                </span>
                <span>
                  <b>Pago acordado con la tienda.</b> Al confirmar, la tienda recibe tu pedido y te
                  contacta para cobrar (transferencia, efectivo a la entrega…). No se te cobra nada
                  ahora.
                </span>
              </div>
            </fieldset>
          </div>

          <aside className="st-resumen">
            <h2 className="st-resumen-t">{t('ck.pedido')}</h2>
            {order.lines.map(l => (
              <div className="st-fila" key={l.id}>
                <span>
                  {l.quantity} × {l.productVariant.name}
                </span>
                <span>{money(l.linePriceWithTax, order.currencyCode)}</span>
              </div>
            ))}
            <div className="st-fila st-fila--suave">
              <span>{t('ck.envio')}</span>
              <span>{money(shippingPrice, order.currencyCode)}</span>
            </div>
            <div className="st-fila st-fila--total">
              <span>{t('ck.total')}</span>
              <span data-testid="checkout-total">
                {money(order.subTotalWithTax + shippingPrice, order.currencyCode)}
              </span>
            </div>
            <button className="st-btn st-btn--marca st-btn--grande st-btn--bloque" type="submit" disabled={busy}>
              {busy ? t('ck.confirmando') : t('ck.confirmar')}
            </button>
            <a className="st-seguir" href="/cart">
              {t('ck.volver')}
            </a>
          </aside>
        </form>
      ) : null}
    </>
  );
}
