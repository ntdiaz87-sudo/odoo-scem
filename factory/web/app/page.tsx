import Link from 'next/link';
import { getLocale, getT } from '../lib/i18n-server';
import { SelectorIdioma } from './locale-provider';
import {
  IconAgent,
  IconBox,
  IconCheck,
  IconCursor,
  IconDevices,
  IconGlobe,
  IconLock,
  IconPublish,
  IconWand,
  PantallaCasaTerra,
  PantallaNocta,
  PantallaVerdealto,
  Telefono,
} from './_home-parts';

const PASOS = [
  { n: '01', icono: <IconCursor />, k: 'home.paso1' },
  { n: '02', icono: <IconWand />, k: 'home.paso2' },
  { n: '03', icono: <IconPublish />, k: 'home.paso3' },
];

const CAPACIDADES = [
  { icono: <IconDevices />, k: 'home.cap1' },
  { icono: <IconGlobe />, k: 'home.cap2' },
  { icono: <IconAgent />, k: 'home.cap3' },
  { icono: <IconBox />, k: 'home.cap4' },
];

type T = (k: string, v?: Record<string, string>) => string;

const CANALES = [
  { icono: '🌐', k: 'canal.web', estado: 'live' },
  { icono: '📱', k: 'canal.h5', estado: 'live' },
  { icono: '💬', k: 'canal.mp', estado: 'live' },
  { icono: '🍎', k: 'canal.apps', estado: 'plan' },
];

const EQUIPO = ['equipo.1', 'equipo.2', 'equipo.3'];

const IDENTIDADES = ['青竹家居', 'NOCTA 夜行', '陶合', '拾光', '雾山', '游牧'];

function pie(t: T) {
  return [
    {
      titulo: t('pie.producto'),
      enlaces: [
        { t: t('nav.como'), h: '#como-funciona' },
        { t: t('nav.disenos'), h: '#disenos' },
        { t: t('nav.canales'), h: '#canales' },
        { t: t('nav.planes'), h: '#planes' },
      ],
    },
    {
      titulo: t('pie.empresa'),
      enlaces: [
        { t: t('pie.sobre'), h: '#disenos' },
        { t: t('pie.contacto'), h: '#planes' },
        { t: t('pie.terminos'), h: '#planes' },
        { t: t('pie.privacidad'), h: '#planes' },
      ],
    },
    {
      titulo: t('pie.soporte'),
      enlaces: [
        { t: t('pie.ayuda'), h: '#faq' },
        { t: t('pie.faq'), h: '#faq' },
        { t: t('pie.estado'), h: '#faq' },
      ],
    },
  ];
}

/**
 * Los precios NO se traducen: son los del mercado chino. Un visitante que
 * mira la fábrica en español ve el producto chino explicado en su idioma,
 * con sus precios reales en yuan.
 */
function planes(t: T) {
  return [
    { k: 'demo', precio: t('plan.demo.p'), cta: t('plan.cta.gratis'), destacado: false },
    { k: 'store', precio: '¥199', cta: t('plan.cta.crear'), destacado: false },
    { k: 'ai', precio: '¥399', cta: t('plan.cta.crear'), destacado: true },
    { k: 'omni', precio: '¥699', cta: t('plan.cta.hablar'), destacado: false },
  ].map(p => ({
    ...p,
    nombre: t(`plan.${p.k}.n`),
    nota: t(`plan.${p.k}.nota`),
    items: t(`plan.${p.k}.i`).split('|'),
  }));
}

export default async function Landing() {
  const t = await getT();
  const locale = await getLocale();
  const PIE = pie(t);
  const PLANES = planes(t);
  return (
    <>
      {/* ============ HERO ============ */}
      <header className="fh-hero">
        <div className="fh-hero-luz" aria-hidden="true" />
        <div className="fh-wrap">
          <nav className="fh-nav" aria-label={t('nav.como')}>
            <span className="fh-marca">
              fábrica<span className="fh-punto">.</span>
            </span>
            <div className="fh-nav-links">
              <a href="#como-funciona">{t('nav.como')}</a>
              <a href="#disenos">{t('nav.disenos')}</a>
              <a href="#canales">{t('nav.canales')}</a>
              <a href="#planes">{t('nav.planes')}</a>
            </div>
            <SelectorIdioma compacto />
            <Link className="fh-btn fh-btn--lima fh-nav-cta" href="/demo">
              {t('nav.cta')}
              <span aria-hidden="true">→</span>
            </Link>
          </nav>

          <div className="fh-hero-rejilla">
            <div className="fh-hero-copy">
              <p className="fh-eyebrow">{t('home.eyebrow')}</p>
              <h1 className="fh-h1">
                {t('home.h1.l1')}
                <br />
                {t('home.h1.l2')}
                <br />
                <span className="fh-h1-lima">{t('home.h1.l3')}</span>
              </h1>
              <p className="fh-hero-texto">{t('home.sub')}</p>
              <div className="fh-hero-ctas">
                <Link className="fh-btn fh-btn--lima fh-btn--grande" href="/demo">
                  {t('home.cta1')}
                  <span aria-hidden="true">→</span>
                </Link>
                <a className="fh-btn fh-btn--linea fh-btn--grande" href="#planes">
                  {t('home.cta2')}
                </a>
              </div>
              <ul className="fh-hero-notas">
                <li>
                  <span className="fh-punto-lima" aria-hidden="true" />
                  {t('home.nota1')}
                </li>
                <li>
                  <span className="fh-punto-lima" aria-hidden="true" />
                  {t('home.nota2')}
                </li>
                <li>
                  <span className="fh-punto-lima" aria-hidden="true" />
                  {t('home.nota3')}
                </li>
              </ul>
            </div>

            <div className="fh-hero-visual">
              <p className="fh-anotacion" aria-hidden="true">
                <span className="fh-anotacion-flecha" />
                {t('home.anotacion')}
              </p>
              <div className="fh-phones">
                <Telefono variante="izq" etiqueta="青竹家居：由 fábrica 的 AI 生成的花植商店">
                  <PantallaVerdealto />
                </Telefono>
                <Telefono variante="centro" etiqueta="NOCTA 夜行：由 fábrica 的 AI 生成的服饰商店">
                  <PantallaNocta />
                </Telefono>
                <Telefono variante="der" etiqueta="陶合：由 fábrica 的 AI 生成的陶器商店">
                  <PantallaCasaTerra />
                </Telefono>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* ============ PASOS ============ */}
        <section className="fh-pasos" id="como-funciona">
          <div className="fh-wrap fh-pasos-rejilla">
            <h2 className="fh-h2 fh-pasos-titulo fh-pre">{t('home.pasos.titulo')}</h2>
            {PASOS.map(p => (
              <article className="fh-paso" key={p.n}>
                <div className="fh-paso-cabeza">
                  <span className="fh-paso-num">{p.n}</span>
                  <span className="fh-paso-ico">{p.icono}</span>
                </div>
                <h3 className="fh-paso-titulo">{t(`${p.k}.t`)}</h3>
                <p className="fh-paso-texto">{t(`${p.k}.d`)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ CANALES ============ */}
        <section className="fh-canales" id="canales">
          <div className="fh-wrap">
            <div className="fh-canales-cabeza">
              <h2 className="fh-h2 fh-pre">{t('canales.t')}</h2>
              <p className="fh-canales-sub">{t('canales.sub')}</p>
            </div>
            <ul className="fh-canales-lista">
              {CANALES.map(c => (
                <li className={`fh-canal${c.estado === 'plan' ? ' es-plan' : ''}`} key={c.k}>
                  <span className="fh-canal-ico" aria-hidden="true">
                    {c.icono}
                  </span>
                  <span className="fh-canal-n">{t(`${c.k}.n`)}</span>
                  <span className="fh-canal-d">{t(`${c.k}.d`)}</span>
                  <span className={`fh-canal-estado${c.estado === 'live' ? ' es-live' : ''}`}>
                    {c.estado === 'live' ? t('canal.live') : t('canal.plan')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ BANDA: DISEÑADOR CON IA ============ */}
        <section className="fh-banda-envoltura" id="disenos">
          <div className="fh-wrap">
            <div className="fh-banda">
              <div className="fh-banda-copy">
                <p className="fh-eyebrow fh-eyebrow--violeta">{t('home.disenos.eyebrow')}</p>
                <h2 className="fh-h2 fh-banda-titulo fh-pre">{t('home.disenos.t')}</h2>
                <p className="fh-banda-texto">{t('home.disenos.d')}</p>
                <p className="fh-banda-remate">{t('home.disenos.remate')}</p>
              </div>

              <ul className="fh-caps">
                {CAPACIDADES.map(c => (
                  <li className="fh-cap" key={c.k}>
                    <span className="fh-cap-ico">{c.icono}</span>
                    <span className="fh-cap-texto fh-pre">{t(c.k)}</span>
                  </li>
                ))}
              </ul>

              <div className="fh-banda-cierre" aria-hidden="true">
                <div className="fh-mini-phones">
                  <span className="fh-mini fh-mini--verde" />
                  <span className="fh-mini fh-mini--marfil" />
                  <span className="fh-mini fh-mini--terra" />
                </div>
                <span className="fh-candado">
                  <IconLock />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============ EQUIPO DE IA ============ */}
        <section className="fh-equipo" id="equipo">
          <div className="fh-wrap">
            <div className="fh-equipo-cabeza">
              <p className="fh-eyebrow fh-eyebrow--centrado">{t('equipo.eyebrow')}</p>
              <h2 className="fh-h2 fh-centrado">{t('equipo.t')}</h2>
              <p className="fh-equipo-sub">{t('equipo.sub')}</p>
            </div>
            <div className="fh-equipo-rejilla">
              {EQUIPO.map(k => (
                <article className="fh-empleado" key={k}>
                  <div className="fh-empleado-cabeza">
                    <span className="fh-avatar" aria-hidden="true">
                      {t(`${k}.n`).slice(-1)}
                    </span>
                    <span>
                      <span className="fh-empleado-n">{t(`${k}.n`)}</span>
                      <span className="fh-empleado-r">{t(`${k}.r`)}</span>
                    </span>
                  </div>
                  <p className="fh-empleado-d">{t(`${k}.d`)}</p>
                </article>
              ))}
            </div>
            <p className="fh-equipo-nota">
              <span className="fh-punto-lima" aria-hidden="true" />
              {t('equipo.nota')}
            </p>
          </div>
        </section>

        {/* ============ PLANES ============ */}
        <section className="fh-planes" id="planes">
          <div className="fh-wrap fh-planes-rejilla fh-planes-rejilla--4">
            <div className="fh-planes-intro">
              <h2 className="fh-h2">{t('planes.t')}</h2>
              <p className="fh-planes-sub">{t('planes.sub')}</p>
              <p className="fh-planes-sello">
                <span className="fh-punto-lima" aria-hidden="true" />
                {t('planes.sin.comision')}
              </p>
            </div>

            {PLANES.map(p => (
              <article className={`fh-plan${p.destacado ? ' fh-plan--destacado' : ''}`} key={p.k}>
                {p.destacado ? <span className="fh-plan-badge">{t('planes.elegido')}</span> : null}
                <h3 className="fh-plan-n">{p.nombre}</h3>
                <p className="fh-plan-precio">
                  {p.precio}
                  {p.precio !== '免费' ? <small>{t('planes.mes')}</small> : null}
                </p>
                <p className="fh-plan-nota">{p.nota}</p>
                <ul className="fh-plan-lista">
                  {p.items.map(it => (
                    <li key={it}>
                      <span className="fh-tick" aria-hidden="true">
                        <IconCheck />
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
                <Link
                  className={`fh-btn ${p.destacado ? 'fh-btn--lima' : 'fh-btn--linea-oscura'} fh-btn--bloque`}
                  href="/demo"
                >
                  {p.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ============ IDENTIDADES ============ */}
        <section className="fh-identidades">
          <div className="fh-wrap">
            <h2 className="fh-identidades-titulo">{t('ident.t')}</h2>
            <ul className="fh-wordmarks">
              {IDENTIDADES.map(i => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section className="fh-faq" id="faq">
          <div className="fh-wrap fh-faq-rejilla">
            <div>
              <h2 className="fh-h2">{t('faq.t')}</h2>
              <p className="fh-faq-texto">{t('faq.d')}</p>
              <a className="fh-btn fh-btn--linea-oscura" href="#como-funciona">
                {t('faq.cta')}
              </a>
            </div>
            <div className="fh-globos" aria-hidden="true">
              <span className="fh-globo fh-globo--blanco" />
              <span className="fh-globo fh-globo--lima">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* ============ PIE ============ */}
      <footer className="fh-pie">
        <div className="fh-wrap fh-pie-rejilla">
          <div className="fh-pie-marca">
            <span className="fh-marca">
              fábrica<span className="fh-punto">.</span>
            </span>
            <p>{t('marca.tagline')}</p>
          </div>
          {PIE.map(col => (
            <nav className="fh-pie-col" key={col.titulo} aria-label={col.titulo}>
              <h3>{col.titulo}</h3>
              <ul>
                {col.enlaces.map(e => (
                  <li key={e.t}>
                    <a href={e.h}>{e.t}</a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="fh-pie-final">
            <p className="fh-pie-dominio">[dominio.com]</p>
            <p className="fh-pie-legal">© 2026 fábrica.{locale === 'zh' ? ' 保留所有权利。' : ' Todos los derechos reservados.'}</p>
            {/* En China es obligatorio mostrar el número de registro ICP en el pie. */}
            <a className="fh-pie-icp" href="https://beian.miit.gov.cn/" rel="noreferrer">
              [ICP备案号]
            </a>
            <span className="fh-pie-sello">
              <span className="fh-punto-lima" aria-hidden="true" />
              {t('pie.hecho')}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
