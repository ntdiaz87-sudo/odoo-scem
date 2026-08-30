import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getT } from '../lib/i18n-server';
import { PLANTILLAS, PLANTILLAS_POR_ID, ROTACION_HERO } from '../lib/plantillas';
import { Cabecera } from './_v2/cabecera';
import { DemoComando, DemoFabrica, DemoSync } from './_v2/demos-ia';
import { Escaparate, Telefono } from './_v2/escaparate';
import { Galeria } from './_v2/galeria';
import { Hero } from './_v2/hero';
import { Revelar } from './_v2/revelar';

export const dynamic = 'force-dynamic';

/* Contenido del home que no está en el diccionario porque lleva estructura
   (cifras, precios, banderas). Cada texto va en los TRES idiomas.
   El tercer elemento de una función de plan marca "aún no disponible": la IA
   se vende en los planes pero todavía no existe, y cobrarla sin ese aviso es
   la promesa falsa más cara del sitio. Al activar el equipo de IA, se quita. */
type Trio = { zh: string; es: string; en: string };
const T3 = (zh: string, es: string, en: string): Trio => ({ zh, es, en });

const AGENTES = [
  { id: 'xiaomei', img: '/img/agente-xiaomei.png', n: T3('小美', 'Xiaomei', 'Xiaomei'), r: T3('客服 AI', 'Atención al cliente', 'Customer service'), datos: [['47', T3('客户对话', 'Conversaciones', 'Conversations')], ['3', T3('成交订单', 'Ventas cerradas', 'Sales closed')]] },
  { id: 'xiaolin', img: '/img/agente-xiaolin.png', n: T3('小林', 'Xiaolin', 'Xiaolin'), r: T3('运营 AI', 'Operaciones', 'Operations'), datos: [['3', T3('库存预警', 'Avisos de stock', 'Stock alerts')], ['1', T3('促销待审', 'Promoción lista', 'Promo awaiting review')]] },
  { id: 'xiaoan', img: '/img/agente-xiaoan.png', n: T3('小安', 'Xiaoan', 'Xiaoan'), r: T3('内容 AI', 'Contenido', 'Content'), datos: [['6', T3('优化商品', 'Fichas mejoradas', 'Listings improved')], ['3', T3('内容已生成', 'Contenidos creados', 'Content created')]] },
];

type Funcion = { t: Trio; pronto?: boolean };
const PLANES: Array<{
  id: string; n: Trio; precio: string; anual?: string; reco?: boolean;
  nota?: Trio; f: Funcion[];
}> = [
  { id: 'trial', n: T3('体验版', 'Demo', 'Trial'), precio: '¥0', nota: T3('14 天', '14 días', '14 days'), f: [
    { t: T3('完整体验店', 'Tienda demo completa', 'Full trial store') },
    { t: T3('模板与专属设计', 'Plantillas y diseño exclusivo', 'Templates and exclusive design') },
    { t: T3('免费二级域名', 'Subdominio gratis', 'Free subdomain') },
    { t: T3('AI 功能试用', 'Prueba de funciones IA', 'AI features to try'), pronto: true },
  ] },
  { id: 'store', n: T3('开店版', 'Store', 'Store'), precio: '¥199', anual: '¥1,990', f: [
    { t: T3('Web + H5', 'Web + H5', 'Web + H5') },
    { t: T3('模板或专属设计', 'Plantilla o diseño exclusivo', 'Template or exclusive design') },
    { t: T3('订单、库存与客户', 'Pedidos, inventario y clientes', 'Orders, inventory and customers') },
    { t: T3('SSL 与托管', 'SSL y alojamiento', 'SSL and hosting') },
    { t: T3('0% 平台交易佣金', '0 % de comisión', '0% platform commission') },
  ] },
  { id: 'ai', n: T3('AI 商家版', 'AI Business', 'AI Business'), precio: '¥399', anual: '¥3,990', reco: true, f: [
    { t: T3('开店版全部功能', 'Todo lo de Store', 'Everything in Store') },
    { t: T3('客服 AI + 内容 AI', 'IA de atención y contenido', 'Customer-service and content AI'), pronto: true },
    { t: T3('运营 AI（建议模式）', 'IA de operaciones en modo consejo', 'Operations AI (advice mode)'), pronto: true },
    { t: T3('数据分析', 'Analítica', 'Analytics') },
  ] },
  { id: 'omni', n: T3('全渠道版', 'Omnichannel', 'Omnichannel'), precio: '¥699', anual: '¥6,990', f: [
    { t: T3('AI 商家版全部功能', 'Todo lo de AI Business', 'Everything in AI Business') },
    { t: T3('微信小程序', 'Mini programa de WeChat', 'WeChat Mini Program') },
    { t: T3('完整 AI 团队', 'Equipo de IA completo', 'Full AI team'), pronto: true },
    { t: T3('更高用量与自动化', 'Más uso y automatización', 'Higher usage and automation') },
  ] },
];

const FAQ = [
  { q: T3('我可以先选模板，再让 AI 调整吗？', '¿Puedo elegir una plantilla y luego ajustarla con IA?', 'Can I pick a template and have the AI adjust it later?'),
    a: T3('可以。模板是快速起点，AI 可以基于你的品牌、产品和风格继续定制。', 'Sí. La plantilla es un punto de partida rápido y la IA puede personalizarla con tu marca, tus productos y tu estilo.', 'Yes. The template is a fast starting point, and the AI can tailor it with your brand, products and style.') },
  { q: T3('专属设计和模板有什么区别？', '¿Cuál es la diferencia entre plantilla y diseño exclusivo?', 'What is the difference between a template and an exclusive design?'),
    a: T3('模板可以被多个商家使用；专属设计为你的品牌生成，登记后不再提供给其他商家。', 'Las plantillas pueden reutilizarlas varios comercios. El diseño exclusivo se genera para tu marca y, una vez registrado, no vuelve a ofrecerse a nadie más.', 'Templates can be reused by several merchants. An exclusive design is generated for your brand and, once registered, is never offered to anyone else.') },
  { q: T3('Web、H5 和微信小程序共享商品和订单吗？', '¿Web, H5 y WeChat comparten productos y pedidos?', 'Do Web, H5 and WeChat share products and orders?'),
    a: T3('是。它们连接同一个核心，商品、价格、库存、客户和订单保持同步。', 'Sí. Los tres canales se conectan al mismo núcleo y comparten productos, precios, inventario, clientes y pedidos.', 'Yes. All three channels connect to the same core and share products, prices, inventory, customers and orders.') },
  { q: T3('AI 会自动修改价格吗？', '¿La IA cambia precios automáticamente?', 'Does the AI change prices automatically?'),
    a: T3('只有在你授权的范围内。默认支持建议、待批准执行和自动执行三种权限级别。', 'Solo dentro de los permisos que le des. Hay tres niveles: recomendar, dejar preparado para tu aprobación, y ejecutar lo que hayas autorizado.', 'Only within the permissions you grant. There are three levels: recommend, prepare for your approval, and run what you authorised.') },
];

export default async function Home() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const tx = (v: { zh: string; es: string; en: string }) => v[locale];
  const rot = ROTACION_HERO.map(id => PLANTILLAS_POR_ID[id]);
  const canal = PLANTILLAS_POR_ID.lumina;

  const enlaces = [
    { href: '#producto', txt: t('v.nav.producto') },
    { href: '#templates', txt: t('v.nav.plantillas') },
    { href: '#ai-team', txt: t('v.nav.equipo') },
    { href: '#casos', txt: t('v.nav.casos') },
    { href: '#precios', txt: t('v.nav.precios') },
  ];

  return (
    <div className="v">
      <Cabecera
        enlaces={enlaces}
        etiquetas={{
          entrar: t('v.nav.entrar'), crear: t('v.nav.crear'), menu: t('v.nav.menu'),
          claro: t('v.tema.claro'), oscuro: t('v.tema.oscuro'),
        }}
      />

      <main>
        <Hero
          plantillas={rot}
          locale={locale}
          etiquetas={{
            h1a: t('v.hero.h1a'), h1b: t('v.hero.h1b'), sub: t('v.hero.sub'),
            ph: t('v.hero.ph'), enviar: t('v.hero.enviar'),
            cta1: t('v.hero.cta1'), cta2: t('v.hero.cta2'),
            p1: t('v.hero.p1'), p2: t('v.hero.p2'), p3: t('v.hero.p3'),
          }}
        />

        {/* ===================== galería de plantillas ===================== */}
        <section className="v-sec v-sec--sutil" id="templates">
          <div className="v-envoltura">
            <Revelar clase="v-sec-cab">
              <h2 className="v-h2">{t('v.tpl.h2')}</h2>
              <p className="v-sec-sub">{t('v.tpl.sub')}</p>
            </Revelar>
            <Revelar retardo={80}>
              <Galeria
                plantillas={PLANTILLAS}
                locale={locale}
                etiquetas={{
                  h2: t('v.tpl.h2'), todas: t('v.tpl.todas'), gratis: t('v.tpl.gratis'),
                  previsualizar: t('v.tpl.previsualizar'), usar: t('v.tpl.usar'),
                }}
              />
            </Revelar>
            <Revelar clase="v-tpl-nota" retardo={120}>
              <p>{t('v.tpl.reutilizable')}</p>
            </Revelar>
          </div>
        </section>

        {/* ======================= dos formas de crear ===================== */}
        <section className="v-sec" id="producto">
          <div className="v-envoltura">
            <Revelar clase="v-sec-cab v-sec-cab--centro">
              <h2 className="v-h2">{t('v.dos.h2')}</h2>
            </Revelar>
            <div className="v-dos">
              <Revelar etiqueta="article" clase="v-dos-panel">
                <div className="v-dos-txt">
                  <span className="v-dos-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>
                  </span>
                  <h3>{t('v.dos.a.t')}</h3>
                  <ul className="v-lista-check">
                    <li>{t('v.dos.a.1')}</li>
                    <li>{t('v.dos.a.2')}</li>
                    <li>{t('v.dos.a.3')}</li>
                  </ul>
                  <a className="v-btn v-btn--linea" href="#templates">{t('v.dos.a.cta')}</a>
                </div>
                <div className="v-dos-visual">
                  <Escaparate p={PLANTILLAS_POR_ID.pure} locale={locale} variante="tarjeta" />
                </div>
              </Revelar>

              <Revelar etiqueta="article" clase="v-dos-panel v-dos-panel--ai" retardo={90}>
                <div className="v-dos-txt">
                  <span className="v-dos-ico v-dos-ico--ai" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round"><path d="m12 3 2.2 5.1 5.3.7-4 3.6 1.1 5.3L12 15l-4.6 2.7 1.1-5.3-4-3.6 5.3-.7z" /></svg>
                  </span>
                  <h3>{t('v.dos.b.t')}</h3>
                  <ul className="v-lista-check">
                    <li>{t('v.dos.b.1')}</li>
                    <li>{t('v.dos.b.2')}</li>
                    <li>{t('v.dos.b.3')}</li>
                  </ul>
                  <Link className="v-btn v-btn--acento" href="/demo?modo=ai">{t('v.dos.b.cta')}</Link>
                </div>
                <div className="v-dos-visual v-dos-visual--ai">
                  <Image src="/img/ai-exclusivo.jpg" alt="" width={800} height={1000} sizes="(max-width: 900px) 90vw, 380px" />
                  <span className="v-dos-sello">
                    <i aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.2" /><path d="M8.2 10.5V7.8a3.8 3.8 0 0 1 7.6 0v2.7" /></svg>
                    </i>
                    DESIGN #F-48291
                  </span>
                </div>
              </Revelar>
            </div>
          </div>
        </section>

        {/* =========================== omnicanal =========================== */}
        <section className="v-sec v-sec--noche">
          <div className="v-envoltura v-canal">
            <Revelar clase="v-canal-copy">
              <h2 className="v-h2">
                {t('v.canal.h2a')}
                <br />
                <span className="v-h1-acento">{t('v.canal.h2b')}</span>
              </h2>
              <p className="v-sec-sub">{t('v.canal.sub')}</p>
              <ul className="v-canal-lista">
                {[
                  ['web', t('v.canal.web'), t('v.canal.web.d')],
                  ['h5', t('v.canal.h5'), t('v.canal.h5.d')],
                  ['wx', t('v.canal.wx'), t('v.canal.wx.d')],
                ].map(([k, n, d]) => (
                  <li key={k}>
                    <b>{n}</b>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </Revelar>

            <Revelar clase="v-canal-visual" retardo={80}>
              <div className="v-canal-escena">
                <div className="v-canal-portatil">
                  <div className="v-portatil">
                    <div className="v-portatil-pantalla">
                      <Escaparate p={canal} locale={locale} variante="escritorio" />
                    </div>
                    <div className="v-portatil-base" />
                  </div>
                </div>
                <Telefono clase="v-canal-tel v-canal-tel--h5" etiqueta="H5">
                  <Escaparate p={canal} locale={locale} variante="movil" />
                </Telefono>
                <Telefono clase="v-canal-tel v-canal-tel--wx" etiqueta={tx(T3('微信小程序', 'WeChat', 'WeChat'))}>
                  <Escaparate p={canal} locale={locale} variante="movil" />
                </Telefono>
              </div>
            </Revelar>
          </div>
        </section>

        {/* ====================== cambia una vez (sync) ==================== */}
        <section className="v-sec">
          <div className="v-envoltura">
            <Revelar clase="v-sec-cab v-sec-cab--centro">
              <h2 className="v-h2">
                {t('v.sync.h2a')} <span className="v-h1-acento">{t('v.sync.h2b')}</span>
              </h2>
              <p className="v-sec-sub">{t('v.sync.sub')}</p>
            </Revelar>
            <Revelar retardo={70}>
              <DemoSync
                etiquetas={{
                  demo: t('v.demo'), aviso: t('v.demo.aviso'), agente: t('v.sync.agente'),
                  orden: t('v.sync.orden'), producto: t('v.sync.producto'), reiniciar: t('v.sync.reiniciar'),
                  wechat: t('v.sync.wechat'),
                }}
              />
            </Revelar>
          </div>
        </section>

        {/* ==================== fábrica de productos con IA ================ */}
        <section className="v-sec v-sec--sutil">
          <div className="v-envoltura">
            <Revelar clase="v-sec-cab v-sec-cab--centro">
              <h2 className="v-h2">{t('v.fab.h2')}</h2>
              <p className="v-sec-sub">{t('v.fab.sub')}</p>
            </Revelar>
            <Revelar retardo={70}>
              <DemoFabrica
                etiquetas={{
                  demo: t('v.demo'), aviso: t('v.demo.aviso'), analiza: t('v.fab.analiza'),
                  e1: t('v.fab.e1'), e2: t('v.fab.e2'), e3: t('v.fab.e3'),
                  c1: t('v.fab.c1'), c2: t('v.fab.c2'), c3: t('v.fab.c3'),
                  c4: t('v.fab.c4'), c5: t('v.fab.c5'), c6: t('v.fab.c6'),
                  publicar: t('v.fab.publicar'),
                  salidaN: tx(T3('无线降噪耳机', 'Auriculares con cancelación', 'Noise-cancelling earbuds')),
                }}
              />
            </Revelar>
          </div>
        </section>

        {/* ============================ equipo IA ========================== */}
        <section className="v-sec v-sec--noche" id="ai-team">
          <div className="v-envoltura">
            <Revelar clase="v-sec-cab">
              <h2 className="v-h2">
                {t('v.ai.h2a')}
                <br />
                <span className="v-h1-acento">{t('v.ai.h2b')}</span>
              </h2>
              <p className="v-sec-sub">{t('v.ai.sub')}</p>
            </Revelar>
            <ul className="v-agentes">
              {AGENTES.map((a, k) => (
                <Revelar key={a.id} etiqueta="li" clase="v-agente" retardo={k * 90}>
                  <span className="v-agente-cara">
                    <Image src={a.img} alt="" width={200} height={200} sizes="76px" />
                  </span>
                  <span className="v-agente-id">
                    <em>{tx(a.r)}</em>
                    <b>{tx(a.n)}</b>
                    <span className="v-agente-estado">
                      <i />
                      {t('v.ai.trabajando')}
                    </span>
                  </span>
                  <span className="v-agente-datos">
                    {a.datos.map(([n, d]) => (
                      <span key={String(n)}>
                        <b>{n as string}</b>
                        <em>{tx(d as { zh: string; es: string; en: string })}</em>
                      </span>
                    ))}
                  </span>
                </Revelar>
              ))}
            </ul>
            <p className="v-aviso-demo v-aviso-demo--centro">{t('v.demo.aviso')}</p>
          </div>
        </section>

        {/* ========================= fábrica. Command ====================== */}
        <section className="v-sec">
          <div className="v-envoltura">
            <Revelar clase="v-sec-cab v-sec-cab--centro">
              <h2 className="v-h2">{t('v.cmd.h2')}</h2>
            </Revelar>
            <Revelar retardo={70}>
              <DemoComando
                etiquetas={{
                  demo: t('v.demo'), aviso: t('v.demo.aviso'), ej: t('v.cmd.ej'),
                  plan: t('v.cmd.plan'), encontrado: t('v.cmd.encontrado'), desc: t('v.cmd.desc'),
                  cuando: t('v.cmd.cuando'), aprobar: t('v.cmd.aprobar'), hecho: t('v.cmd.hecho'),
                  reiniciar: t('v.sync.reiniciar'),
                }}
              />
            </Revelar>
          </div>
        </section>

        {/* ============================== casos ============================ */}
        <section className="v-sec v-sec--sutil" id="casos">
          <div className="v-envoltura">
            <Revelar clase="v-sec-cab">
              <h2 className="v-h2">{t('v.casos.h2')}</h2>
              <p className="v-sec-sub">{t('v.casos.sub')}</p>
            </Revelar>
            <ul className="v-casos">
              {PLANTILLAS.map((p, k) => (
                <Revelar key={p.id} etiqueta="li" clase="v-caso" retardo={(k % 4) * 70}>
                  <Link href={`/templates/${p.id}`}>
                    <span className="v-caso-lienzo">
                      <Escaparate p={p} locale={locale} variante="tarjeta" />
                    </span>
                    <span className="v-caso-n">{p.nombre}</span>
                  </Link>
                </Revelar>
              ))}
            </ul>
            <p className="v-aviso-demo v-aviso-demo--centro">{t('v.muestra')}</p>
          </div>
        </section>

        {/* ============================= precios =========================== */}
        <section className="v-sec" id="precios">
          <div className="v-envoltura">
            <Revelar clase="v-sec-cab v-sec-cab--centro">
              <h2 className="v-h2">{t('v.pr.h2')}</h2>
              <p className="v-sec-sub">{t('v.pr.sub')}</p>
            </Revelar>
            <ul className="v-planes">
              {PLANES.map((pl, k) => (
                <Revelar key={pl.id} etiqueta="li" clase={`v-plan${pl.reco ? ' is-reco' : ''}`} retardo={k * 60}>
                  {pl.reco ? <span className="v-plan-sello">{t('v.pr.reco')}</span> : null}
                  <p className="v-plan-n">{tx(pl.n)}</p>
                  <p className="v-plan-precio">
                    {pl.precio}
                    {pl.anual ? <em>{t('v.pr.mes')}</em> : null}
                  </p>
                  <p className="v-plan-nota">
                    {pl.anual ? t('v.pr.anual', { precio: pl.anual }) : tx(pl.nota!)}
                  </p>
                  <ul className="v-lista-check">
                    {pl.f.map(f => (
                      <li key={f.t.zh} className={f.pronto ? 'is-pronto' : undefined}>
                        {tx(f.t)}
                        {/* La IA se vende en los planes pero AÚN no existe: se
                            dice en la propia función, no en letra pequeña. */}
                        {f.pronto ? <em className="v-pronto">{t('v.pr.pronto')}</em> : null}
                      </li>
                    ))}
                  </ul>
                  <Link className={`v-btn ${pl.reco ? 'v-btn--acento' : 'v-btn--linea'}`} href="/demo">
                    {t('v.pr.elegir')}
                  </Link>
                </Revelar>
              ))}
            </ul>
          </div>
        </section>

        {/* =============================== FAQ ============================= */}
        <section className="v-sec v-sec--sutil">
          <div className="v-envoltura v-faq-envoltura">
            <Revelar clase="v-sec-cab v-sec-cab--centro">
              <h2 className="v-h2">{t('v.faq.h2')}</h2>
            </Revelar>
            <Revelar etiqueta="div" clase="v-faq">
              {FAQ.map(f => (
                <details key={f.q.zh}>
                  <summary>{tx(f.q)}</summary>
                  <p>{tx(f.a)}</p>
                </details>
              ))}
            </Revelar>
          </div>
        </section>

        {/* =========================== cierre + pie ======================== */}
        <section className="v-sec v-final">
          <div className="v-envoltura">
            <Revelar clase="v-sec-cab v-sec-cab--centro">
              <h2 className="v-h2">{t('v.final.h2')}</h2>
              <div className="v-final-ctas">
                <Link className="v-btn v-btn--acento v-btn--grande" href="/demo">{t('v.nav.crear')}</Link>
                <a className="v-btn v-btn--linea v-btn--grande" href="#templates">{t('v.hero.cta1')}</a>
              </div>
              <ul className="v-hero-pruebas v-hero-pruebas--centro">
                <li>{t('v.hero.p1')}</li>
                <li>{t('v.hero.p2')}</li>
                <li>{t('v.hero.p3')}</li>
              </ul>
            </Revelar>
          </div>
        </section>
      </main>

      <footer className="v-pie">
        <div className="v-envoltura v-pie-rejilla">
          <div className="v-pie-marca">
            <span className="v-marca">
              fábrica<span>.</span>
            </span>
            <p>{t('marca.tagline')}</p>
          </div>
          <nav>
            <p className="v-pie-t">{t('v.pie.producto')}</p>
            <a href="#templates">{t('v.nav.plantillas')}</a>
            <a href="#ai-team">{t('v.nav.equipo')}</a>
            <a href="#precios">{t('v.nav.precios')}</a>
            <Link href="/demo">{t('v.nav.crear')}</Link>
          </nav>
          <nav>
            <p className="v-pie-t">{t('v.pie.empresa')}</p>
            <Link href="/panel">{t('v.nav.entrar')}</Link>
            <a href="#casos">{t('v.nav.casos')}</a>
          </nav>
        </div>
        <div className="v-envoltura v-pie-final">
          <span>© {new Date().getFullYear()} fábrica. {t('v.pie.derechos')}</span>
        </div>
      </footer>
    </div>
  );
}
