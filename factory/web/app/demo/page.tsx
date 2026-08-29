'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DESIGN_PRESETS } from '../../lib/designs';

interface Created {
  url: string;
  panelUrl: string;
  ownerEmail: string;
}

export default function DemoWizard() {
  const [storeName, setStoreName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [designKey, setDesignKey] = useState(DESIGN_PRESETS[0].key);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

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
    setBusy(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          storeName: storeName.trim(),
          designKey,
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
          descripciones y stock.
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
        Gratis y al instante, con tu propio panel para gestionar productos y pedidos. En la versión
        completa, la IA generará diseños únicos a partir de una encuesta.
      </p>

      {error ? <div className="error-box">{error}</div> : null}

      <form onSubmit={createStore}>
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

        <div className="field">
          <label>Elige un diseño de muestra</label>
          <div className="design-options">
            {DESIGN_PRESETS.map(d => (
              <button
                type="button"
                key={d.key}
                className={`design-card${designKey === d.key ? ' selected' : ''}`}
                onClick={() => setDesignKey(d.key)}
                aria-pressed={designKey === d.key}
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
          <div className="hint">
            En la plataforma final, el diseño que elijas quedará registrado a tu nombre y no se
            repetirá para nadie más.
          </div>
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Creando tu tienda…' : 'Crear mi tienda demo'}
        </button>
      </form>
    </main>
  );
}
