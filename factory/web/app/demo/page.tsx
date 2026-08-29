'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ESTILOS, MODOS, RUBROS } from '../../lib/design-generator';
import type { StoreDesign } from '../../lib/designs';
import { t } from '../../lib/i18n';

interface Created {
  url: string;
  panelUrl: string;
  channelsUrl?: string;
  ownerEmail: string;
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="11" rx="2.4" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  );
}
function IconTick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
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
      if (seq !== fetchSeq.current) return;
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
      setError(t('val.nombre'));
      return;
    }
    if (!ownerEmail.includes('@')) {
      setError(t('val.correo'));
      return;
    }
    if (ownerPassword.length < 8) {
      setError(t('val.clave'));
      return;
    }
    const design = proposals.find(d => d.key === selectedKey);
    if (!design) {
      setError(t('val.diseno'));
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
        throw new Error(data.error || t('val.error'));
      }
      setCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('val.error'));
    } finally {
      setBusy(false);
    }
  }

  const marca = (
    <span className="fh-marca">
      fábrica<span className="fh-punto">.</span>
    </span>
  );

  if (created) {
    return (
      <div className="fh-page">
        <header className="fh-topbar">
          <Link href="/" aria-label="Ir al inicio de fábrica">
            {marca}
          </Link>
        </header>
        <main className="fh-panel">
          <div className="fh-tarjeta">
            <div className="fh-exito-marca">
              <IconTick />
            </div>
            <h1>{t('demo.listo')}</h1>
            <p className="fh-tarjeta-sub">{t('demo.listo.sub')}</p>
            <dl className="fh-datos">
              <dt>{t('demo.usuario')}</dt>
              <dd>{created.ownerEmail}</dd>
              <dt>{t('demo.contra')}</dt>
              <dd>{t('demo.contra.v')}</dd>
            </dl>
            <div className="fh-acciones">
              <a className="fh-btn fh-btn--lima fh-btn--grande fh-btn--bloque" href={created.url}>
                {t('demo.ver')}
              </a>
              <a className="fh-btn fh-btn--linea-oscura fh-btn--grande fh-btn--bloque" href={created.panelUrl}>
                {t('demo.panel')}
              </a>
              {created.channelsUrl ? (
                <a className="fh-btn fh-btn--linea-oscura fh-btn--grande fh-btn--bloque" href={created.channelsUrl}>
                  {t('demo.canales')}
                </a>
              ) : null}
            </div>
            <p className="fh-nota">
              <span className="fh-nota-ico">
                <IconLock />
              </span>
              {t('demo.exito.nota')}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fh-page">
      <header className="fh-topbar">
        <Link href="/" aria-label="Ir al inicio de fábrica">
          {marca}
        </Link>
        <Link className="fh-volver" href="/">
          <span aria-hidden="true">←</span> {t('volver')}
        </Link>
      </header>

      <main className="fh-panel">
        <div className="fh-tarjeta">
          <h1>{t('demo.h1')}</h1>
          <p className="fh-tarjeta-sub">{t('demo.sub')}</p>

          {error ? (
            <div className="fh-aviso" role="alert">
              {error}
            </div>
          ) : null}

          <form onSubmit={createStore}>
            <div className="fh-bloque">
              <p className="fh-legend">
                <span className="fh-legend-num">1</span> {t('demo.que.vendes')}
              </p>
              <div className="fh-chips">
                {RUBROS.map(r => (
                  <button
                    type="button"
                    key={r.key}
                    className="fh-opcion"
                    aria-pressed={rubro === r.key}
                    onClick={() => setRubro(r.key)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fh-bloque">
              <p className="fh-legend">
                <span className="fh-legend-num">2</span> {t('demo.marca')}
              </p>
              <div className="fh-chips">
                {ESTILOS.map(s => (
                  <button
                    type="button"
                    key={s.key}
                    className="fh-opcion"
                    aria-pressed={estilo === s.key}
                    onClick={() => setEstilo(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fh-bloque">
              <p className="fh-legend">
                <span className="fh-legend-num">3</span> {t('demo.modo')}
              </p>
              <div className="fh-chips">
                {MODOS.map(m => (
                  <button
                    type="button"
                    key={m.key}
                    className="fh-opcion"
                    aria-pressed={modo === m.key}
                    onClick={() => setModo(m.key)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fh-bloque">
              <p className="fh-legend">
                <span className="fh-legend-num">4</span> {t('demo.disenos')}
              </p>
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
                      <span className="dp-marca">{d.label}</span>
                      <span className="dp-menu" aria-hidden="true">
                        <i style={{ background: d.brandInk }} />
                        <i style={{ background: d.brandInk }} />
                        <i style={{ background: d.brandInk }} />
                      </span>
                    </div>
                    <div className="design-body" style={{ background: d.bg }}>
                      <div
                        className="dp-hero"
                        style={{ background: d.surface, border: `1px solid ${d.inkSoft}22`, borderRadius: d.radius }}
                      >
                        <span className="dp-t" style={{ background: d.ink }} />
                        <span className="dp-t dp-t--corta" style={{ background: d.inkSoft }} />
                        <span className="dp-cta" style={{ background: d.accent }} />
                      </div>
                      <div className="dp-rejilla">
                        {[0, 1, 2].map(i => (
                          <span
                            key={i}
                            style={{ background: d.surface, border: `1px solid ${d.inkSoft}22`, borderRadius: d.radius }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="design-name">
                      {d.label}
                      <span className="dp-fuente">{d.headingFont === 'serif' ? 'Serif' : 'Grotesca'}</span>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="fh-regenerar"
                disabled={designsBusy}
                onClick={() => loadProposals(rubro, estilo, modo)}
              >
                {designsBusy ? t('demo.disenando') : t('demo.otros')}
              </button>
              <p className="fh-nota">
                <span className="fh-nota-ico">
                  <IconLock />
                </span>
                {t('demo.unicidad')}
              </p>
            </div>

            <div className="fh-bloque">
              <p className="fh-legend">
                <span className="fh-legend-num">5</span> {t('demo.datos')}
              </p>
              <div className="fh-campo">
                <label htmlFor="storeName">{t('demo.nombre')}</label>
                <input
                  id="storeName"
                  type="text"
                  value={storeName}
                  maxLength={40}
                  placeholder={t('demo.nombre.ph')}
                  onChange={e => setStoreName(e.target.value)}
                />
              </div>
              <div className="fh-campo">
                <label htmlFor="ownerEmail">{t('demo.correo')}</label>
                <input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email"
                  onChange={e => setOwnerEmail(e.target.value)}
                />
                <p className="fh-campo-ayuda">{t('demo.correo.ayuda')}</p>
              </div>
              <div className="fh-campo">
                <label htmlFor="ownerPassword">{t('demo.clave')}</label>
                <input
                  id="ownerPassword"
                  type="password"
                  value={ownerPassword}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  onChange={e => setOwnerPassword(e.target.value)}
                />
                <p className="fh-campo-ayuda">{t('demo.clave.ayuda')}</p>
              </div>
            </div>

            <button className="fh-btn fh-btn--lima fh-btn--grande fh-btn--bloque fh-enviar" type="submit" disabled={busy}>
              {busy ? t('demo.enviando') : t('demo.enviar')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
