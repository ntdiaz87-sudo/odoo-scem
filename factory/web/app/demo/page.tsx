'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ESTILOS, MODOS, RUBROS } from '../../lib/design-generator';
import type { StoreDesign } from '../../lib/designs';

interface Created {
  url: string;
  panelUrl: string;
  ownerEmail: string;
}

export default function DemoWizard() {
  const [storeName, setStoreName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [rubro, setRubro] = useState<string>('moda');
  const [estilo, setEstilo] = useState<string>('calido');
  const [modo, setModo] = useState<string>('claro');
  const [proposals, setProposals] = useState<StoreDesign[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [designsBusy, setDesignsBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const fetchSeq = useRef(0);

  const loadProposals = useCallback(async (r: string, e: string, m: string) => {
    const seq = ++fetchSeq.current;
    setDesignsBusy(true);
    try {
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rubro: r, estilo: e, modo: m }),
      });
      const data = await res.json();
      if (seq !== fetchSeq.current) return; // llegó tarde: ya hay otra encuesta
      if (res.ok && Array.isArray(data.proposals) && data.proposals.length) {
        setProposals(data.proposals);
        setSelectedKey(data.proposals[0].key);
      }
    } catch {
      /* la siguiente pulsación reintenta */
    } finally {
      if (seq === fetchSeq.current) setDesignsBusy(false);
    }
  }, []);

  useEffect(() => {
    loadProposals(rubro, estilo, modo);
  }, [rubro, estilo, modo, loadProposals]);

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (storeName.trim().length < 2) {
      setError('Ponle un nombre a tu tienda (mínimo 2 letras).');
      return;
    }
    if (!ownerEmail.includes('@')) {
      setError('Escribe un correo válido: será tu usuario del panel.');
      return;
    }
    if (ownerPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    const design = proposals.find(d => d.key === selectedKey);
    if (!design) {
      setError('Elige uno de los diseños propuestos.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          storeName: storeName.trim(),
          design,
          ownerEmail: ownerEmail.trim(),
          ownerPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'No se pudo crear la tienda demo.');
      }
      setCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Inténtalo otra vez.');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <main className="wizard">
        <h1>🎉 ¡Tu tienda está lista!</h1>
        <p className="sub">
          Guarda estos datos: tu usuario del panel es <strong>{created.ownerEmail}</strong> y la
          contraseña la que acabas de elegir. La demo dura 14 días.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a className="btn btn-primary btn-block" href={created.url}>
            Ver mi tienda
          </a>
          <a className="btn btn-outline btn-block" href={created.panelUrl}>
            Entrar a mi panel (productos y pedidos)
          </a>
        </div>
        <div className="hint" style={{ marginTop: 18 }}>
          En el panel puedes cambiar los productos de ejemplo por los tuyos: precios, fotos,
          descripciones y stock. El diseño que elegiste queda registrado a tu nombre: nadie más lo
          recibirá.
        </div>
      </main>
    );
  }

  return (
    <main className="wizard">
      <Link className="back-link" href="/">
        ← Volver
      </Link>
      <h1>Crea tu tienda demo</h1>
      <p className="sub">
        Cuéntanos de tu negocio y el diseñador de la fábrica te propondrá diseños que no tiene
        nadie más. Gratis y al instante, con tu propio panel.
      </p>

      {error ? <div className="error-box">{error}</div> : null}

      <form onSubmit={createStore}>
        <div className="field">
          <label>¿Qué vendes?</label>
          <div className="chip-row">
            {RUBROS.map(r => (
              <button type="button" key={r.key} className={`chip${rubro === r.key ? ' chip-on' : ''}`} onClick={() => setRubro(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>¿Cómo es tu marca?</label>
          <div className="chip-row">
            {ESTILOS.map(s => (
              <button type="button" key={s.key} className={`chip${estilo === s.key ? ' chip-on' : ''}`} onClick={() => setEstilo(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>¿Claro u oscuro?</label>
          <div className="chip-row">
            {MODOS.map(m => (
              <button type="button" key={m.key} className={`chip${modo === m.key ? ' chip-on' : ''}`} onClick={() => setModo(m.key)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Diseños propuestos para ti</label>
          <div className="design-options" style={{ opacity: designsBusy ? 0.55 : 1 }}>
            {proposals.map(d => (
              <button
                type="button"
                key={d.key}
                className={`design-card${selectedKey === d.key ? ' selected' : ''}`}
                onClick={() => setSelectedKey(d.key)}
                aria-pressed={selectedKey === d.key}
              >
                <div className="design-head" style={{ background: d.brand, color: d.brandInk }}>
                  {d.label}
                </div>
                <div className="design-body" style={{ background: d.bg }}>
                  <div style={{ background: d.surface, border: `1px solid ${d.inkSoft}22` }} />
                  <div style={{ background: d.surface, border: `1px solid ${d.inkSoft}22` }} />
                  <div style={{ background: d.accent, height: 10, borderRadius: 3 }} />
                  <div style={{ background: d.surface, border: `1px solid ${d.inkSoft}22` }} />
                </div>
                <div className="design-name">{d.label}</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-outline btn-block"
            style={{ marginTop: 12 }}
            disabled={designsBusy}
            onClick={() => loadProposals(rubro, estilo, modo)}
          >
            {designsBusy ? 'Diseñando…' : '🎲 Proponme otros diseños'}
          </button>
          <div className="hint">
            Cada diseño tiene una huella única: al elegirlo queda registrado para tu tienda y la
            fábrica no lo vuelve a ofrecer.
          </div>
        </div>

        <div className="field">
          <label htmlFor="storeName">Nombre de tu tienda</label>
          <input
            id="storeName"
            type="text"
            value={storeName}
            maxLength={40}
            placeholder="Ej.: Dulcería Alba"
            onChange={e => setStoreName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="ownerEmail">Tu correo (será tu usuario del panel)</label>
          <input
            id="ownerEmail"
            type="email"
            value={ownerEmail}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            onChange={e => setOwnerEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="ownerPassword">Elige una contraseña (mínimo 8 caracteres)</label>
          <input
            id="ownerPassword"
            type="password"
            value={ownerPassword}
            placeholder="••••••••"
            autoComplete="new-password"
            onChange={e => setOwnerPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Creando tu tienda…' : 'Crear mi tienda demo'}
        </button>
      </form>
    </main>
  );
}
