import Link from 'next/link';
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
  {
    n: '01',
    icono: <IconCursor />,
    titulo: 'Prueba el demo',
    texto:
      'Un clic y tienes una tienda de prueba con productos de ejemplo, en tu móvil o PC. Sin registro complicado ni tarjeta.',
  },
  {
    n: '02',
    icono: <IconWand />,
    titulo: 'Hazla tuya',
    texto:
      'Responde una encuesta sencilla y la IA te propone varios diseños creados solo para ti. Eliges uno, subes tus productos y listo.',
  },
  {
    n: '03',
    icono: <IconPublish />,
    titulo: 'Publícala y vende',
    texto:
      'Compra tu dominio aquí mismo y publica con un clic: web, app instalable y certificado seguro, alojado por nosotros.',
  },
];

const CAPACIDADES = [
  { icono: <IconDevices />, l1: 'Web + apps', l2: 'iOS y Android' },
  { icono: <IconGlobe />, l1: 'Tu dominio,', l2: 'comprado aquí' },
  { icono: <IconAgent />, l1: 'Agentes de IA', l2: 'incluidos' },
  { icono: <IconBox />, l1: 'Pedidos, inventario', l2: 'y pagos' },
];

const MUESTRAS = [
  {
    cita: 'Abrí mi tienda en menos de una hora y en una semana ya tenía mis primeras ventas.',
    rubro: 'Accesorios',
  },
  {
    cita: 'Lo que más me gusta es que mi tienda se ve distinta a todas las demás. Es mi marca.',
    rubro: 'Ropa urbana',
  },
  {
    cita: 'Los agentes de IA me ayudan a atender clientes y a saber qué reponer. Es como tener un equipo.',
    rubro: 'Hogar y decoración',
  },
];

const IDENTIDADES = ['VERDEALTO', 'NOCTA', 'CASA TERRA', 'LUMINA', 'BRUMA', 'NÓMADA'];

const PIE = [
  {
    titulo: 'Producto',
    enlaces: [
      { t: 'Cómo funciona', h: '#como-funciona' },
      { t: 'Diseños únicos', h: '#disenos' },
      { t: 'Planes', h: '#planes' },
      { t: 'Recursos', h: '#como-funciona' },
    ],
  },
  {
    titulo: 'Empresa',
    enlaces: [
      { t: 'Sobre nosotros', h: '#disenos' },
      { t: 'Contacto', h: '#planes' },
      { t: 'Términos y condiciones', h: '#planes' },
      { t: 'Privacidad', h: '#planes' },
    ],
  },
  {
    titulo: 'Soporte',
    enlaces: [
      { t: 'Centro de ayuda', h: '#faq' },
      { t: 'Preguntas frecuentes', h: '#faq' },
      { t: 'Estado del sistema', h: '#faq' },
    ],
  },
];

export default function Landing() {
  return (
    <>
      {/* ============ HERO ============ */}
      <header className="fh-hero">
        <div className="fh-hero-luz" aria-hidden="true" />
        <div className="fh-wrap">
          <nav className="fh-nav" aria-label="Principal">
            <span className="fh-marca">
              fábrica<span className="fh-punto">.</span>
            </span>
            <div className="fh-nav-links">
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#disenos">Diseños únicos</a>
              <a href="#planes">Planes</a>
              <a href="#faq">Recursos</a>
            </div>
            <Link className="fh-btn fh-btn--lima fh-nav-cta" href="/demo">
              Probar demo gratis
              <span aria-hidden="true">→</span>
            </Link>
          </nav>

          <div className="fh-hero-rejilla">
            <div className="fh-hero-copy">
              <p className="fh-eyebrow">Tu negocio, tu marca, tu tienda</p>
              <h1 className="fh-h1">
                Tu tienda online,
                <br />
                creada por IA.
                <br />
                <span className="fh-h1-lima">Ninguna otra igual.</span>
              </h1>
              <p className="fh-hero-texto">
                Responde unas preguntas y nuestra IA diseña una tienda única para tu negocio.
                <br />
                Web, app, dominio, pagos y agentes de IA. Todo listo para vender.
              </p>
              <div className="fh-hero-ctas">
                <Link className="fh-btn fh-btn--lima fh-btn--grande" href="/demo">
                  Probar demo gratis
                  <span aria-hidden="true">→</span>
                </Link>
                <a className="fh-btn fh-btn--linea fh-btn--grande" href="#planes">
                  Ver planes
                </a>
              </div>
              <ul className="fh-hero-notas">
                <li>
                  <span className="fh-punto-lima" aria-hidden="true" />
                  Sin tarjeta
                </li>
                <li>
                  <span className="fh-punto-lima" aria-hidden="true" />
                  Tu demo lista en 60 segundos
                </li>
              </ul>
            </div>

            <div className="fh-hero-visual">
              <p className="fh-anotacion" aria-hidden="true">
                <span className="fh-anotacion-flecha" />
                Ejemplos generados
                <br />
                por nuestra IA
              </p>
              <div className="fh-phones">
                <Telefono variante="izq" etiqueta="Tienda de plantas Verdealto, generada por la IA de fábrica">
                  <PantallaVerdealto />
                </Telefono>
                <Telefono variante="centro" etiqueta="Tienda de moda NOCTA, generada por la IA de fábrica">
                  <PantallaNocta />
                </Telefono>
                <Telefono variante="der" etiqueta="Tienda de cerámica Casa Terra, generada por la IA de fábrica">
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
            <h2 className="fh-h2 fh-pasos-titulo">
              De la idea a vender,
              <br />
              en tres pasos
            </h2>
            {PASOS.map(p => (
              <article className="fh-paso" key={p.n}>
                <div className="fh-paso-cabeza">
                  <span className="fh-paso-num">{p.n}</span>
                  <span className="fh-paso-ico">{p.icono}</span>
                </div>
                <h3 className="fh-paso-titulo">{p.titulo}</h3>
                <p className="fh-paso-texto">{p.texto}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ BANDA: DISEÑADOR CON IA ============ */}
        <section className="fh-banda-envoltura" id="disenos">
          <div className="fh-wrap">
            <div className="fh-banda">
              <div className="fh-banda-copy">
                <p className="fh-eyebrow fh-eyebrow--violeta">Diseñador con IA</p>
                <h2 className="fh-h2 fh-banda-titulo">
                  Ninguna tienda
                  <br />
                  se parece a otra.
                </h2>
                <p className="fh-banda-texto">
                  Tu diseño se genera para ti, se registra y se retira para siempre. Nadie más lo
                  tendrá, ni en la web ni en las apps.
                </p>
                <p className="fh-banda-remate">Tu diseño, bloqueado para ti.</p>
              </div>

              <ul className="fh-caps">
                {CAPACIDADES.map(c => (
                  <li className="fh-cap" key={c.l1}>
                    <span className="fh-cap-ico">{c.icono}</span>
                    <span className="fh-cap-texto">
                      {c.l1}
                      <br />
                      {c.l2}
                    </span>
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

        {/* ============ PLANES ============ */}
        <section className="fh-planes" id="planes">
          <div className="fh-wrap fh-planes-rejilla">
            <div className="fh-planes-intro">
              <h2 className="fh-h2">
                Planes según tu modelo
                <br />
                de negocio
              </h2>
              <p className="fh-planes-sub">
                Empieza gratis. Paga solo cuando tu tienda sea de verdad.
              </p>
            </div>

            <article className="fh-plan">
              <h3 className="fh-plan-n">Demo</h3>
              <p className="fh-plan-precio">Gratis</p>
              <ul className="fh-plan-lista">
                {['14 días de prueba', 'Tienda de prueba completa', 'Diseños generados para ti', 'Subdominio gratuito'].map(t => (
                  <li key={t}>
                    <span className="fh-tick" aria-hidden="true">
                      <IconCheck />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link className="fh-btn fh-btn--linea-oscura fh-btn--bloque" href="/demo">
                Empezar ahora
              </Link>
            </article>

            <article className="fh-plan fh-plan--destacado">
              <span className="fh-plan-badge">Más elegido</span>
              <h3 className="fh-plan-n">Tienda</h3>
              <p className="fh-plan-precio fh-plan-precio--chico">
                US$ [precio]/mes + <span className="fh-nowrap">[1–2]</span> % de ventas a partir de US$
                [umbral]/mes
              </p>
              <ul className="fh-plan-lista">
                {['Tu tienda real publicada', 'Dominio propio y app instalable', 'Pedidos, inventario y pagos'].map(t => (
                  <li key={t}>
                    <span className="fh-tick" aria-hidden="true">
                      <IconCheck />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link className="fh-btn fh-btn--lima fh-btn--bloque" href="/demo">
                Crear mi tienda
              </Link>
            </article>

            <article className="fh-plan">
              <h3 className="fh-plan-n">Tienda + IA</h3>
              <p className="fh-plan-precio fh-plan-precio--chico">
                US$ [precio]/mes + <span className="fh-nowrap">[1–2]</span> % de ventas a partir de US$
                [umbral]/mes
              </p>
              <ul className="fh-plan-lista">
                {['Todo lo del plan Tienda', 'Agentes de IA incluidos', 'App propia iOS y Android'].map(t => (
                  <li key={t}>
                    <span className="fh-tick" aria-hidden="true">
                      <IconCheck />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link className="fh-btn fh-btn--linea-oscura fh-btn--bloque" href="/demo">
                Hablar con nosotros
              </Link>
            </article>
          </div>
        </section>

        {/* ============ MUESTRAS (contenido de ejemplo, no clientes reales) ============ */}
        <section className="fh-muestras">
          <div className="fh-wrap">
            <p className="fh-eyebrow fh-eyebrow--centrado">Contenido de muestra</p>
            <h2 className="fh-h2 fh-centrado">Así se cuenta lo que hace fábrica.</h2>
            <p className="fh-muestras-aviso">
              Ejemplos de uso mientras recogemos los testimonios de nuestros primeros negocios.
            </p>
            <div className="fh-muestras-rejilla">
              {MUESTRAS.map(m => (
                <figure className="fh-muestra" key={m.rubro}>
                  <span className="fh-comillas" aria-hidden="true">
                    &ldquo;
                  </span>
                  <blockquote>{m.cita}</blockquote>
                  <figcaption>
                    <span className="fh-muestra-avatar" aria-hidden="true" />
                    <span>
                      <span className="fh-muestra-quien">[testimonio pendiente]</span>
                      <span className="fh-muestra-rubro">{m.rubro}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ============ IDENTIDADES ============ */}
        <section className="fh-identidades">
          <div className="fh-wrap">
            <h2 className="fh-identidades-titulo">Identidades que pueden nacer en fábrica</h2>
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
              <h2 className="fh-h2">¿Tienes preguntas?</h2>
              <p className="fh-faq-texto">Respondemos las dudas más comunes sobre fábrica.</p>
              <a className="fh-btn fh-btn--linea-oscura" href="#como-funciona">
                Ver preguntas frecuentes
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
            <p>La plataforma de IA que crea tiendas online únicas para tu negocio.</p>
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
            <p className="fh-pie-legal">© 2026 fábrica. Todos los derechos reservados.</p>
            <span className="fh-pie-sello">
              <span className="fh-punto-lima" aria-hidden="true" />
              Hecho con IA
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
