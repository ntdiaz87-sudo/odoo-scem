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
  clienteActivo,
  distribuidorGuardado,
  fetchActiveOrder,
  notifyCartChanged,
  shopFetch,
} from '../../../../lib/shop-client';
import { useDinero, useTt } from '../../../../lib/tienda-locale';

interface ShippingMethodOption {
  id: string;
  name: string;
  priceWithTax: number;
}

interface PaymentMethodOption {
  id: string;
  code: string;
  name: string;
  isEligible: boolean;
}

/**
 * Icono y nota por método. Se reconoce por palabra clave porque Vendure usa
 * el nombre como código cuando el nombre está en chino.
 */
function pagoInfo(
  m: PaymentMethodOption,
  t: (k: string) => string,
): { ico: string; nota: string } {
  const id = `${m.code} ${m.name}`.toLowerCase();
  if (id.includes('微信') || id.includes('wechat')) return { ico: '💚', nota: t('ck.m.wechat') };
  if (id.includes('支付宝') || id.includes('alipay')) return { ico: '🔷', nota: t('ck.m.alipay') };
  if (id.includes('储值') || id.includes('saldo')) return { ico: '👛', nota: t('ck.m.saldo') };
  if (id.includes('货到') || id.includes('dummy')) return { ico: '📦', nota: t('ck.m.contra') };
  return { ico: '💳', nota: '' };
}

export function CheckoutForm({ slug, nombre }: { slug: string; nombre: string }) {
  const t = useTt();
  const money = useDinero();
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [paymentCode, setPaymentCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Con sesión iniciada el pedido YA tiene cliente: setCustomerForOrder
  // fallaría, así que ese paso se salta.
  const [conCuenta, setConCuenta] = useState(false);

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
        eligiblePaymentMethods: PaymentMethodOption[];
      }>(
        slug,
        `{
          availableCountries { code name }
          eligibleShippingMethods { id name priceWithTax }
          eligiblePaymentMethods { id code name isEligible }
        }`,
      ),
    ])
      .then(([o, meta]) => {
        setOrder(o);
        // Con la sesión iniciada no se le piden otra vez sus datos.
        clienteActivo(slug)
          .then(c => {
            if (!c) return;
            setConCuenta(true);
            setFirstName(v => v || c.firstName);
            setLastName(v => v || (c.lastName === '-' ? '' : c.lastName));
            setEmail(v => v || c.emailAddress);
          })
          .catch(() => undefined);
        setCountries(meta.availableCountries);
        setShippingMethods(meta.eligibleShippingMethods);
        if (meta.eligibleShippingMethods[0]) setShippingMethodId(meta.eligibleShippingMethods[0].id);
        const pagos = meta.eligiblePaymentMethods.filter(m => m.isEligible);
        setPaymentMethods(pagos);
        if (pagos[0]) setPaymentCode(pagos[0].code);
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
      const customer = conCuenta ? null : await shopFetch<{
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
      if (customer && customer.setCustomerForOrder.__typename !== 'Order') {
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

      // 分销: si el comprador llegó por el enlace de un distribuidor, el
      // pedido queda atribuido. Si falla, la compra sigue: la atribución
      // nunca puede tumbar un checkout.
      const codigoDis = distribuidorGuardado(slug);
      if (codigoDis) {
        try {
          await shopFetch(
            slug,
            `mutation Dis($input: UpdateOrderInput!) {
              setOrderCustomFields(input: $input) {
                __typename
                ... on Order { id }
              }
            }`,
            { input: { customFields: { distribuidor: codigoDis } } },
          );
        } catch {
          /* sin atribución, pero con venta */
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

      const method = paymentMethods.find(m => m.code === paymentCode) || paymentMethods[0];
      if (!method) throw new Error(t('ck.sin.pago'));

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
        { input: { method: method.code, metadata: { canal: 'h5' } } },
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
              <div className="st-pagos">
                {paymentMethods.map(m => {
                  const info = pagoInfo(m, t);
                  return (
                    <label key={m.id} className={`st-pago-op${paymentCode === m.code ? ' is-sel' : ''}`}>
                      <input
                        type="radio"
                        name="pago"
                        value={m.code}
                        checked={paymentCode === m.code}
                        onChange={() => setPaymentCode(m.code)}
                      />
                      <span className="st-pago-ico2" aria-hidden="true">
                        {info.ico}
                      </span>
                      <span className="st-pago-txt">
                        <b>{m.name}</b>
                        {info.nota ? <em>{info.nota}</em> : null}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="st-pago-aviso">{t('ck.pago.aviso')}</p>
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
            {order.discounts.map(d => (
              <div className="st-fila st-fila--desc" key={d.description}>
                <span>{t('c.descuento')} · {d.description}</span>
                <span>{money(d.amountWithTax, order.currencyCode)}</span>
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
