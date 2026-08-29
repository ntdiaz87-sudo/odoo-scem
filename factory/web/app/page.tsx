import Link from 'next/link';
import { LOCALE, t } from '../lib/i18n';
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

const CANALES = [
  { icono: '🌐', n: '网店', d: '独立域名，自动 SSL', estado: 'live' },
  { icono: '📱', n: 'H5', d: '微信内直接打开，扫码即达', estado: 'live' },
  { icono: '💬', n: '微信小程序', d: '一分钟授权，同步上架', estado: 'live' },
  { icono: '🍎', n: 'iOS / Android', d: '高级套餐提供', estado: 'plan' },
];

const EQUIPO = [
  { nombre: '小美', rol: '客服 AI', d: '回答顾客、查订单、查库存，拿不准的转给你。' },
  { nombre: '小林', rol: '运营 AI', d: '盯库存、找滞销品、准备促销，等你点头再执行。' },
  { nombre: '小安', rol: '内容 AI', d: '写商品详情、优化标题、按渠道调整文案。' },
];

const IDENTIDADES = ['青竹家居', 'NOCTA 夜行', '陶合', '拾光', '雾山', '游牧'];

const PIE = [
  {
    titulo: '产品',
    enlaces: [
      { t: '怎么用', h: '#como-funciona' },
      { t: '专属设计', h: '#disenos' },
      { t: '销售渠道', h: '#canales' },
      { t: '价格', h: '#planes' },
    ],
  },
  {
    titulo: '公司',
    enlaces: [
      { t: '关于我们', h: '#disenos' },
      { t: '联系我们', h: '#planes' },
      { t: '服务条款', h: '#planes' },
      { t: '隐私政策', h: '#planes' },
    ],
  },
  {
    titulo: '支持',
    enlaces: [
      { t: '帮助中心', h: '#faq' },
      { t: '常见问题', h: '#faq' },
      { t: '系统状态', h: '#faq' },
    ],
  },
];

const PLANES = [
  {
    k: 'demo',
    nombre: '体验版',
    precio: '免费',
    precioChico: false,
    nota: '14 天试用',
    items: ['完整体验店', '专属设计生成', '免费二级域名', 'AI 功能试用'],
    cta: '免费开始',
    destacado: false,
  },
  {
    k: 'store',
    nombre: '开店版',
    precio: '¥199',
    precioChico: false,
    nota: '按年 ¥1.990',
    items: ['网店 + H5', '专属设计与域名', '订单、库存与客户', 'SSL 与托管'],
    cta: '创建我的商店',
    destacado: false,
  },
  {
    k: 'ai',
    nombre: 'AI 商家版',
    precio: '¥399',
    precioChico: false,
    nota: '按年 ¥3.990',
    items: ['开店版全部功能', '客服 AI + 内容 AI', '运营 AI（建议模式）', '数据分析'],
    cta: '创建我的商店',
    destacado: true,
  },
  {
    k: 'omni',
    nombre: '全渠道版',
    precio: '¥699',
    precioChico: false,
    nota: '按年 ¥6.990',
    items: ['AI 商家版全部功能', '微信小程序', '完整 AI 团队', '更高用量与自动化'],
    cta: '联系我们',
    destacado: false,
  },
];

export default function Landing() {
  return (
    <>
      {/* ============ HERO ============ */}
      <header className="fh-hero">
        <div className="fh-hero-luz" aria-hidden="true" />
        <div className="fh-wrap">
          <nav className="fh-nav" aria-label="主导航">
            <span className="fh-marca">
              fábrica<span className="fh-punto">.</span>
            </span>
            <div className="fh-nav-links">
              <a href="#como-funciona">{t('nav.como')}</a>
              <a href="#disenos">{t('nav.disenos')}</a>
              <a href="#canales">{t('nav.canales')}</a>
              <a href="#planes">{t('nav.planes')}</a>
            </div>
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
              <h2 className="fh-h2">
                三个渠道，
                <br />
                一次生成。
              </h2>
              <p className="fh-canales-sub">
                同一个商品库、同一批订单。改一次价格，网店、H5 和小程序同时更新。
              </p>
            </div>
            <ul className="fh-canales-lista">
              {CANALES.map(c => (
                <li className={`fh-canal${c.estado === 'plan' ? ' es-plan' : ''}`} key={c.n}>
                  <span className="fh-canal-ico" aria-hidden="true">
                    {c.icono}
                  </span>
                  <span className="fh-canal-n">{c.n}</span>
                  <span className="fh-canal-d">{c.d}</span>
                  <span className={`fh-canal-estado${c.estado === 'live' ? ' es-live' : ''}`}>
                    {c.estado === 'live' ? '已上线' : '高级套餐'}
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
              <p className="fh-eyebrow fh-eyebrow--centrado">AI 团队</p>
              <h2 className="fh-h2 fh-centrado">三位 AI 员工，和你一起看店。</h2>
              <p className="fh-equipo-sub">
                不是「AI 功能」，是三位有名字的同事。重要的操作先给你看，你点头才执行。
              </p>
            </div>
            <div className="fh-equipo-rejilla">
              {EQUIPO.map(e => (
                <article className="fh-empleado" key={e.nombre}>
                  <div className="fh-empleado-cabeza">
                    <span className="fh-avatar" aria-hidden="true">
                      {e.nombre.slice(-1)}
                    </span>
                    <span>
                      <span className="fh-empleado-n">{e.nombre}</span>
                      <span className="fh-empleado-r">{e.rol}</span>
                    </span>
                  </div>
                  <p className="fh-empleado-d">{e.d}</p>
                </article>
              ))}
            </div>
            <p className="fh-equipo-nota">
              <span className="fh-punto-lima" aria-hidden="true" />
              三种授权级别：只建议 · 准备好等你批准 · 自动执行你允许的操作。
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
            <h2 className="fh-identidades-titulo">在 fábrica 可以诞生的品牌</h2>
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
              <h2 className="fh-h2">还有疑问？</h2>
              <p className="fh-faq-texto">关于 fábrica 的常见问题，我们都整理好了。</p>
              <a className="fh-btn fh-btn--linea-oscura" href="#como-funciona">
                查看常见问题
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
            <p className="fh-pie-legal">© 2026 fábrica.{LOCALE === 'zh' ? ' 保留所有权利。' : ' Todos los derechos reservados.'}</p>
            {/* En China es obligatorio mostrar el número de registro ICP en el pie. */}
            <a className="fh-pie-icp" href="https://beian.miit.gov.cn/" rel="noreferrer">
              [ICP备案号]
            </a>
            <span className="fh-pie-sello">
              <span className="fh-punto-lima" aria-hidden="true" />
              AI 生成
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
