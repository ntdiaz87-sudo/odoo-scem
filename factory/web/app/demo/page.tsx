'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DESIGN_PRESETS } from '../../lib/designs';

export default function DemoWizard() {
  const [storeName, setStoreName] = useState('');
  const [designKey, setDesignKey] = useState(DESIGN_PRESETS[0].key);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (storeName.trim().length < 2) {
      setError('Ponle un nombre a tu tienda (mínimo 2 letras).');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ storeName: storeName.trim(), designKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'No se pudo crear la tienda demo.');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado. Inténtalo otra vez.');
      setBusy(false);
    }
  }

  return (
    <main className="wizard">
      <Link className="back-link" href="/">
        ← Volver
      </Link>
      <h1>Crea tu tienda demo</h1>
      <p className="sub">
        Gratis y al instante. En la versión completa, la IA generará diseños únicos a partir de una
        encuesta; en este demo eliges entre dos diseños de muestra.
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
