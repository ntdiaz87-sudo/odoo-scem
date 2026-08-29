'use client';

/**
 * Checkout de la tienda: datos del comprador, envío y pago manual
 * (transferencia / acordado con la tienda). El pago queda AUTORIZADO y el
 * dueño lo liquida desde su panel cuando recibe el dinero.
 */
import { useEffect, useState } from 'react';
import type { StoreDesign } from '../../../../lib/designs';
import {
  ActiveOrder,
  ORDER_FIELDS,
  fetchActiveOrder,
  formatMoney,
  notifyCartChanged,
  shopFetch,
} from '../../../../lib/shop-client';

interface ShippingMethodOption {
  id: string;
  name: string;
  priceWithTax: number;
}

export function CheckoutForm({
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
      setError('Completa tu nombre, correo y dirección de entrega.');
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
      setError(err instanceof Error ? err.message : 'No se pudo completar el pedido.');
      setBusy(false);
    }
  }

  const empty = !loading && (!order || !order.lines.length);
  const shippingPrice = shippingMethods.find(m => m.id === shippingMethodId)?.priceWithTax ?? 0;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 48,
    border: `1.5px solid ${design.inkSoft}44`,
    borderRadius: 9,
    padding: '0 14px',
    fontSize: 16,
    background: design.surface,
    color: design.ink,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 700, fontSize: 14.5, margin: '14px 0 6px' };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: design.bg,
        color: design.ink,
        fontFamily: "'Public Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 60px' }}>
        <a href="/cart" style={{ color: design.inkSoft, fontSize: 14.5, fontWeight: 600, textDecoration: 'none' }}>
          ← Volver al carrito
        </a>
        <h1 style={{ fontFamily: headingFont, fontSize: 30, margin: '18px 0 6px' }}>Finalizar compra</h1>
        <p style={{ color: design.inkSoft, margin: '0 0 18px', fontSize: 15 }}>
          Pedido en {name} · pagas por transferencia o como acuerdes con la tienda.
        </p>

        {error ? (
          <div style={{ background: '#fbe9e7', color: '#8a2b1d', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14.5 }}>
            {error}
          </div>
        ) : null}

        {loading ? <p style={{ color: design.inkSoft }}>Cargando…</p> : null}
        {empty ? (
          <p>
            Tu carrito está vacío.{' '}
            <a href="/" style={{ color: design.ink, fontWeight: 700 }}>
              Ver productos
            </a>
          </p>
        ) : null}

        {order && order.lines.length ? (
          <form onSubmit={placeOrder}>
            <div
              style={{
                background: design.surface,
                border: `1px solid ${design.inkSoft}26`,
                borderRadius: design.radius,
                padding: '14px 18px',
                fontSize: 14.5,
              }}
            >
              {order.lines.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>
                    {l.quantity} × {l.productVariant.name}
                  </span>
                  <span>{formatMoney(l.linePriceWithTax, order.currencyCode)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: design.inkSoft }}>
                <span>Envío</span>
                <span>{formatMoney(shippingPrice, order.currencyCode)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: `1px solid ${design.inkSoft}26`,
                  marginTop: 6,
                  paddingTop: 8,
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                <span>Total</span>
                <span data-testid="checkout-total">
                  {formatMoney(order.subTotalWithTax + shippingPrice, order.currencyCode)}
                </span>
              </div>
            </div>

            <label style={labelStyle} htmlFor="coNombre">Nombre</label>
            <input id="coNombre" style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} />
            <label style={labelStyle} htmlFor="coApellidos">Apellidos</label>
            <input id="coApellidos" style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} />
            <label style={labelStyle} htmlFor="coCorreo">Correo</label>
            <input id="coCorreo" type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} />
            <label style={labelStyle} htmlFor="coTelefono">Teléfono (opcional)</label>
            <input id="coTelefono" style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} />
            <label style={labelStyle} htmlFor="coDireccion">Dirección de entrega</label>
            <input id="coDireccion" style={inputStyle} value={street} onChange={e => setStreet(e.target.value)} placeholder="Calle y número" />
            <label style={labelStyle} htmlFor="coCiudad">Ciudad</label>
            <input id="coCiudad" style={inputStyle} value={city} onChange={e => setCity(e.target.value)} />
            <label style={labelStyle} htmlFor="coPais">País</label>
            <select id="coPais" style={inputStyle} value={countryCode} onChange={e => setCountryCode(e.target.value)}>
              {countries.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>

            {shippingMethods.length > 1 ? (
              <>
                <label style={labelStyle}>Método de envío</label>
                {shippingMethods.map(m => (
                  <label key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', fontSize: 15 }}>
                    <input
                      type="radio"
                      name="shipping"
                      checked={shippingMethodId === m.id}
                      onChange={() => setShippingMethodId(m.id)}
                    />
                    {m.name} · {formatMoney(m.priceWithTax, order.currencyCode)}
                  </label>
                ))}
              </>
            ) : null}

            <div
              style={{
                marginTop: 18,
                background: `${design.accent}22`,
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 14,
                color: design.ink,
              }}
            >
              💳 <strong>Pago manual:</strong> al confirmar, la tienda recibe tu pedido y te contacta
              para cobrar (transferencia, efectivo a la entrega…). No se te cobra nada ahora.
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 18,
                width: '100%',
                minHeight: 52,
                border: 'none',
                borderRadius: 10,
                background: design.brand,
                color: design.brandInk,
                fontWeight: 700,
                fontSize: 16.5,
                cursor: 'pointer',
                opacity: busy ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {busy ? 'Confirmando…' : 'Confirmar pedido'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
