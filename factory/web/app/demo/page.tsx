'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { estilos, modos, rubros } from '../../lib/design-generator';
import type { StoreDesign } from '../../lib/designs';
import { PLANTILLAS, PLANTILLAS_POR_ID, etiquetaCategoria, plantillaADiseno } from '../../lib/plantillas';
import { Escaparate } from '../_v2/escaparate';
import { LOCALES, NOMBRE_IDIOMA, SIMBOLO_DE, type Locale } from '../../lib/i18n';
import { SelectorIdioma, useLocale, useT } from '../locale-provider';
import { SelectorTema } from '../tema-provider';

interface Created {
  url: string;
  panelUrl: string;
  channelsUrl?: string;
  ownerEmail: string;
}

type Via = 'sin-elegir' | 'plantilla' | 'ia';

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
  const t = useT();
  const locale = useLocale();
  const params = useSearchParams();
  const RUBROS = rubros(locale);
  const ESTILOS = estilos(locale);
  const MODOS = modos(locale);

  const [via, setVia] = useState<Via>('sin-elegir');
  const [plantillaId, setPlantillaId] = useState('');
  const [reclamado, setReclamado] = useState(false);
  const [storeName, setStoreName] = useState('');
  // El mercado de SU tienda: en qué idioma y moneda la verán sus clientes.
  // Arranca en el idioma que el comerciante está usando ahora mismo, que casi
  // siempre es el que quiere, pero puede cambiarlo: una cosa es en qué idioma
  // lee él la fábrica y otra en qué idioma vende.
  const [mercado, setMercado] = useState<Locale>(locale);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [rubro, setRubro] = useState('moda');
  const [estilo, setEstilo] = useState('calido');
  const [modo, setModo] = useState('claro');
  const [proposals, setProposals] = useState<StoreDesign[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [designsBusy, setDesignsBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const fetchSeq = useRef(0);

  /* El home entra ya con la vía decidida: ?plantilla=lumina desde una tarjeta
     de la galería, ?modo=ai desde el botón de diseño exclusivo. */
  useEffect(() => {
    const tpl = params.get('plantilla');
    if (tpl && PLANTILLAS_POR_ID[tpl]) {
      setVia('plantilla');
      setPlantillaId(tpl);
      return;
    }
    if (params.get('modo') === 'ai') setVia('ia');
  }, [params]);

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
        setReclamado(false);
      }
    } catch {
      /* la siguiente pulsación reintenta */
    } finally {
      if (seq === fetchSeq.current) setDesignsBusy(false);
    }
  }, []);

  useEffect(() => {
    if (via !== 'ia') return;
    loadProposals(rubro, estilo, modo);
  }, [via, rubro, estilo, modo, loadProposals]);

  const plantilla = plantillaId ? PLANTILLAS_POR_ID[plantillaId] : undefined;

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (storeName.trim().length < 2) return setError(t('val.nombre'));
    if (!ownerEmail.includes('@')) return setError(t('val.correo'));
    if (ownerPassword.length < 8) return setError(t('val.clave'));

    const design =
      via === 'plantilla'
        ? plantilla && plantillaADiseno(plantilla)
        : proposals.find(d => d.key === selectedKey);
    if (!design) return setError(t('val.diseno'));

    setBusy(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ storeName: storeName.trim(), design, mercado, ownerEmail: ownerEmail.trim(), ownerPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || t('val.error'));
      setCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('val.error'));
    } finally {
      setBusy(false);
    }
  }

  const barra = (
    <header className="w-cab">
      <Link href="/" className="v-marca" aria-label="fábrica">
        fábrica<span>.</span>
      </Link>
      <span className="w-cab-fin">
        <SelectorIdioma compacto />
        <SelectorTema etiquetas={{ claro: t('v.tema.claro'), oscuro: t('v.tema.oscuro') }} />
        {via !== 'sin-elegir' && !created ? (
          <button type="button" className="w-atras" onClick={() => { setVia('sin-elegir'); setPlantillaId(''); }}>
            <span aria-hidden="true">←</span> {t('w.atras')}
          </button>
        ) : (
          <Link className="w-atras" href="/">
            <span aria-hidden="true">←</span> {t('volver')}
          </Link>
        )}
      </span>
    </header>
  );

  /* ----------------------------- tienda creada ---------------------------- */
  if (created) {
    return (
      <div className="w">
        {barra}
        <main className="w-panel">
          <div className="w-tarjeta w-tarjeta--centro">
            <div className="w-exito">
              <IconTick />
            </div>
            <h1>{t('demo.listo')}</h1>
            <p className="w-sub">{t('demo.listo.sub')}</p>
            <dl className="w-datos">
              <dt>{t('demo.usuario')}</dt>
              <dd>{created.ownerEmail}</dd>
              <dt>{t('demo.contra')}</dt>
              <dd>{t('demo.contra.v')}</dd>
            </dl>
            <div className="w-acciones">
              <a className="v-btn v-btn--acento v-btn--grande" href={created.url}>{t('demo.ver')}</a>
              <a className="v-btn v-btn--linea v-btn--grande" href={created.panelUrl}>{t('demo.panel')}</a>
              {created.channelsUrl ? (
                <a className="v-btn v-btn--linea v-btn--grande" href={created.channelsUrl}>{t('demo.canales')}</a>
              ) : null}
            </div>
            <p className="w-nota">
              <IconLock />
              {t('demo.exito.nota')}
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* ------------------------------ bifurcación ----------------------------- */
  if (via === 'sin-elegir') {
    return (
      <div className="w">
        {barra}
        <main className="w-panel w-panel--ancho">
          <div className="w-cabecera">
            <h1>{t('w.bif.t')}</h1>
            <p className="w-sub">{t('w.bif.sub')}</p>
          </div>
          <div className="w-bifurcacion">
            <button type="button" className="w-via" onClick={() => setVia('plantilla')}>
              <span className="w-via-lienzo">
                <Escaparate p={PLANTILLAS_POR_ID.lumina} locale={locale} variante="tarjeta" />
              </span>
              <span className="w-via-txt">
                <b>{t('w.bif.tpl')}</b>
                <em>{t('w.bif.tpl.d')}</em>
              </span>
            </button>
            <button type="button" className="w-via w-via--ia" onClick={() => setVia('ia')}>
              <span className="w-via-lienzo w-via-lienzo--ia">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/ai-exclusivo.jpg" alt="" />
              </span>
              <span className="w-via-txt">
                <b>{t('w.bif.ai')}</b>
                <em>{t('w.bif.ai.d')}</em>
              </span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* --------------------------------- pasos -------------------------------- */
  const camposTienda = (
    <div className="w-bloque">
      <p className="w-legend">
        <span className="w-num">{via === 'plantilla' ? 2 : 5}</span> {t('demo.datos')}
      </p>
      <div className="w-campo">
        <label htmlFor="storeName">{t('demo.nombre')}</label>
        <input id="storeName" type="text" value={storeName} maxLength={40} placeholder={t('demo.nombre.ph')} onChange={e => setStoreName(e.target.value)} />
      </div>
      <div className="w-campo">
        <label htmlFor="mercado">{t('demo.mercado')}</label>
        <div className="w-mercado" role="group" aria-labelledby="mercado">
          {LOCALES.map(l => (
            <button
              key={l}
              type="button"
              className={l === mercado ? 'is-on' : ''}
              aria-pressed={l === mercado}
              onClick={() => setMercado(l)}
            >
              <b>{NOMBRE_IDIOMA[l]}</b>
              <em>{SIMBOLO_DE[l]}</em>
            </button>
          ))}
        </div>
        <p className="w-ayuda">{t('demo.mercado.ayuda')}</p>
      </div>
      <div className="w-campo">
        <label htmlFor="ownerEmail">{t('demo.correo')}</label>
        <input id="ownerEmail" type="email" value={ownerEmail} placeholder="tucorreo@ejemplo.com" autoComplete="email" onChange={e => setOwnerEmail(e.target.value)} />
        <p className="w-ayuda">{t('demo.correo.ayuda')}</p>
      </div>
      <div className="w-campo">
        <label htmlFor="ownerPassword">{t('demo.clave')}</label>
        <input id="ownerPassword" type="password" value={ownerPassword} placeholder="••••••••" autoComplete="new-password" onChange={e => setOwnerPassword(e.target.value)} />
        <p className="w-ayuda">{t('demo.clave.ayuda')}</p>
      </div>
    </div>
  );

  return (
    <div className="w">
      {barra}
      <main className="w-panel w-panel--ancho">
        {error ? (
          <div className="w-aviso" role="alert">{error}</div>
        ) : null}

        <form onSubmit={createStore}>
          {via === 'plantilla' ? (
            <>
              <div className="w-bloque">
                <p className="w-legend">
                  <span className="w-num">1</span> {t('w.tpl.t')}
                </p>
                <p className="w-ayuda w-ayuda--suelta">{t('w.tpl.sub')}</p>
                <ul className="w-plantillas">
                  {PLANTILLAS.map(p => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`w-plantilla${plantillaId === p.id ? ' is-on' : ''}`}
                        aria-pressed={plantillaId === p.id}
                        onClick={() => setPlantillaId(p.id)}
                      >
                        <span className="w-plantilla-lienzo">
                          <Escaparate p={p} locale={locale} variante="tarjeta" />
                        </span>
                        <span className="w-plantilla-id">
                          <b>{p.nombre}</b>
                          <em>{etiquetaCategoria(p.categoria, locale)}</em>
                          {plantillaId === p.id ? <i className="w-plantilla-tick"><IconTick /></i> : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="w-nota">
                  <IconLock />
                  {t('w.reutilizable')}
                </p>
              </div>
              {camposTienda}
            </>
          ) : (
            <>
              <div className="w-bloque">
                <p className="w-legend"><span className="w-num">1</span> {t('demo.que.vendes')}</p>
                <div className="w-chips">
                  {RUBROS.map(r => (
                    <button type="button" key={r.key} className="w-chip" aria-pressed={rubro === r.key} onClick={() => setRubro(r.key)}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div className="w-bloque">
                <p className="w-legend"><span className="w-num">2</span> {t('demo.marca')}</p>
                <div className="w-chips">
                  {ESTILOS.map(x => (
                    <button type="button" key={x.key} className="w-chip" aria-pressed={estilo === x.key} onClick={() => setEstilo(x.key)}>{x.label}</button>
                  ))}
                </div>
              </div>
              <div className="w-bloque">
                <p className="w-legend"><span className="w-num">3</span> {t('demo.modo')}</p>
                <div className="w-chips">
                  {MODOS.map(m => (
                    <button type="button" key={m.key} className="w-chip" aria-pressed={modo === m.key} onClick={() => setModo(m.key)}>{m.label}</button>
                  ))}
                </div>
              </div>
              <div className="w-bloque">
                <p className="w-legend"><span className="w-num">4</span> {t('demo.disenos')}</p>
                <div className="design-options" style={{ opacity: designsBusy ? 0.55 : 1 }}>
                  {proposals.map(d => (
                    <button
                      type="button"
                      key={d.key}
                      className={`design-card${selectedKey === d.key ? ' selected' : ''}`}
                      onClick={() => { setSelectedKey(d.key); setReclamado(true); }}
                      aria-pressed={selectedKey === d.key}
                    >
                      <div className="design-head" style={{ background: d.brand, color: d.brandInk }}>
                        <span className="dp-marca">{d.label}</span>
                        <span className="dp-menu" aria-hidden="true"><i style={{ background: d.brandInk }} /><i style={{ background: d.brandInk }} /><i style={{ background: d.brandInk }} /></span>
                      </div>
                      <div className="design-body" style={{ background: d.bg }}>
                        <div className="dp-hero" style={{ background: d.surface, border: `1px solid ${d.inkSoft}22`, borderRadius: d.radius }}>
                          <span className="dp-t" style={{ background: d.ink }} />
                          <span className="dp-t dp-t--corta" style={{ background: d.inkSoft }} />
                          <span className="dp-cta" style={{ background: d.accent }} />
                        </div>
                        <div className="dp-rejilla">
                          {[0, 1, 2].map(i => (
                            <span key={i} style={{ background: d.surface, border: `1px solid ${d.inkSoft}22`, borderRadius: d.radius }} />
                          ))}
                        </div>
                      </div>
                      <div className="design-name">
                        {d.label}
                        <span className="dp-fuente">{t(d.headingFont === 'serif' ? 'w.fuente.serif' : 'w.fuente.grotesque')}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button type="button" className="w-regenerar" disabled={designsBusy} onClick={() => loadProposals(rubro, estilo, modo)}>
                  {designsBusy ? t('demo.disenando') : t('demo.otros')}
                </button>

                {reclamado && selectedKey ? (
                  <div className="w-reclamo" role="status">
                    <span className="w-reclamo-ico"><IconLock /></span>
                    <span>
                      <b>{t('w.reclamo.t')}</b>
                      <em>{t('w.reclamo.d')}</em>
                      <code>DESIGN #{selectedKey.slice(0, 10).toUpperCase()}</code>
                    </span>
                  </div>
                ) : (
                  <p className="w-nota">
                    <IconLock />
                    {t('demo.unicidad')}
                  </p>
                )}
              </div>
              {camposTienda}
            </>
          )}

          <button
            className="v-btn v-btn--acento v-btn--grande w-enviar"
            type="submit"
            disabled={busy || (via === 'plantilla' && !plantillaId)}
          >
            {busy ? t('demo.enviando') : t('demo.enviar')}
          </button>
        </form>
      </main>
    </div>
  );
}
