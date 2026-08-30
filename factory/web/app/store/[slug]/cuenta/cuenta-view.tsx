'use client';

import { useEffect, useState } from 'react';
import {
  ClienteActivo,
  clienteActivo,
  entrarCliente,
  registrarCliente,
  salirCliente,
} from '../../../../lib/shop-client';
import { useDinero, useTt } from '../../../../lib/tienda-locale';

type Modo = 'entrar' | 'alta';

/**
 * Cuenta del comprador: entrar o registrarse, y una vez dentro sus pedidos
 * y su 储值. El saldo solo lo recarga la tienda; aquí se ve y en el
 * checkout se gasta.
 */
export function CuentaView({ slug }: { slug: string }) {
  const t = useTt();
  const money = useDinero();
  const [cliente, setCliente] = useState<ClienteActivo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modo, setModo] = useState<Modo>('entrar');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [nombre, setNombre] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    clienteActivo(slug)
      .then(setCliente)
      .catch(() => undefined)
      .finally(() => setCargando(false));
  }, [slug]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setAviso(null);
    setOcupado(true);
    try {
      if (modo === 'alta') {
        const r = await registrarCliente(slug, { correo, clave, nombre });
        if (r === 'existe') {
          setAviso(t('st.ac.existe'));
          setModo('entrar');
          return;
        }
        if (r === 'error') {
          setAviso(t('st.ac.error'));
          return;
        }
      }
      const ok = await entrarCliente(slug, correo, clave);
      if (!ok) {
        setAviso(t('st.ac.mal'));
        return;
      }
      setCliente(await clienteActivo(slug));
      setClave('');
    } catch {
      setAviso(t('st.ac.error'));
    } finally {
      setOcupado(false);
    }
  }

  async function salir() {
    await salirCliente(slug);
    setCliente(null);
  }

  if (cargando) return <p className="st-cargando">{t('c.cargando')}</p>;

  if (cliente) {
    return (
      <>
        <h1 className="st-flujo-titulo">{t('st.ac.hola', { n: cliente.firstName })}</h1>

        <div className="st-caja st-ac-saldo">
          <span className="st-ac-saldo-k">{t('st.ac.saldo')}</span>
          <b className="st-ac-saldo-v" data-testid="saldo-cliente">
            {money(cliente.saldo, cliente.pedidos[0]?.currencyCode || 'CNY')}
          </b>
          <p className="st-caja-txt">{t('st.ac.saldo.nota')}</p>
        </div>

        <h2 className="st-resumen-t">{t('st.ac.pedidos')}</h2>
        {cliente.pedidos.length === 0 ? (
          <p className="st-vacio">{t('st.ac.sinpedidos')}</p>
        ) : (
          <ul className="st-ac-pedidos">
            {cliente.pedidos.map(o => (
              <li key={o.code} className="st-ac-pedido">
                <a href={`/pedido?codigo=${encodeURIComponent(o.code)}`}>
                  <b>{o.code}</b>
                  <span>{money(o.totalWithTax, o.currencyCode)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="st-seguir" onClick={salir}>
          {t('st.ac.salir')}
        </button>
      </>
    );
  }

  return (
    <>
      <h1 className="st-flujo-titulo">{t('st.ac.titulo')}</h1>
      <p className="st-caja-txt">{t('st.ac.como')}</p>

      {aviso ? (
        <div className="st-error" role="alert">
          {aviso}
        </div>
      ) : null}

      <form className="st-form st-ac-form" onSubmit={enviar}>
        {modo === 'alta' ? (
          <div className="st-campo">
            <label htmlFor="acNombre">{t('st.ac.nombre')}</label>
            <input id="acNombre" value={nombre} onChange={e => setNombre(e.target.value)} autoComplete="name" />
          </div>
        ) : null}
        <div className="st-campo">
          <label htmlFor="acCorreo">{t('st.ac.correo')}</label>
          <input id="acCorreo" type="email" value={correo} onChange={e => setCorreo(e.target.value)} autoComplete="email" required />
        </div>
        <div className="st-campo">
          <label htmlFor="acClave">{t('st.ac.clave')}</label>
          <input
            id="acClave"
            type="password"
            value={clave}
            onChange={e => setClave(e.target.value)}
            autoComplete={modo === 'alta' ? 'new-password' : 'current-password'}
            minLength={6}
            required
          />
        </div>
        <button className="st-btn st-btn--marca st-btn--grande st-btn--bloque" type="submit" disabled={ocupado}>
          {modo === 'alta' ? t('st.ac.registrar') : t('st.ac.entrar')}
        </button>
      </form>

      <button
        type="button"
        className="st-seguir"
        onClick={() => {
          setAviso(null);
          setModo(modo === 'alta' ? 'entrar' : 'alta');
        }}
      >
        {modo === 'alta' ? t('st.ac.entrar') : t('st.ac.registrar')}
      </button>
    </>
  );
}
