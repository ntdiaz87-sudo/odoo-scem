import Link from 'next/link';

export default function Landing() {
  return (
    <main>
      <div className="wrap">
        <nav className="nav">
          <div className="brand">
            fábrica<span>.</span>
          </div>
          <div className="nav-links">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#disenos">Diseños únicos</a>
            <a href="#planes">Planes</a>
            <Link className="btn btn-primary" href="/demo">
              Probar demo gratis
            </Link>
          </div>
        </nav>

        <section className="hero">
          <div>
            <h1>Tu tienda online, hecha por ti en minutos.</h1>
            <p>
              Responde unas preguntas y nuestra IA crea un diseño único para tu negocio: nadie más
              tendrá uno igual. Publícala con tu dominio, en web y como app, con agentes de IA que
              atienden a tus clientes. Sin contratar programadores.
            </p>
            <div className="hero-ctas">
              <Link className="btn btn-primary" href="/demo">
                Probar demo gratis
              </Link>
              <a className="btn btn-outline" href="#planes">
                Ver planes
              </a>
            </div>
            <div className="hero-note">Sin tarjeta. Tu tienda demo lista en 60 segundos.</div>
          </div>
          <div className="hero-visual">
            <div className="mini">
              <div className="mini-head" style={{ background: '#48693c', color: '#f5f4ec' }}>
                Verdealto
              </div>
              <div className="mini-body">
                <div style={{ background: '#e4eadf' }} />
                <div style={{ background: '#dde7e4' }} />
                <div style={{ background: '#e9e4d6' }} />
                <div style={{ background: '#e4eadf' }} />
              </div>
              <div className="mini-label">Hoja viva · plantas</div>
            </div>
            <div className="mini" style={{ background: '#101418', borderColor: '#101418' }}>
              <div className="mini-head" style={{ color: '#f3efe8', letterSpacing: '0.05em' }}>
                NOCTA
              </div>
              <div className="mini-body">
                <div style={{ background: '#232a31' }} />
                <div style={{ background: '#2c333b' }} />
                <div style={{ background: '#c9a35d', height: 10, alignSelf: 'end' }} />
                <div style={{ background: '#232a31' }} />
              </div>
              <div className="mini-label" style={{ color: '#8b949c' }}>
                Nocturno · moda
              </div>
            </div>
            <div className="mini" style={{ background: '#faf3ee' }}>
              <div
                className="mini-head"
                style={{ background: '#b4552f', color: '#fdf6f1', borderRadius: '0 0 22px 0' }}
              >
                Casa Terra
              </div>
              <div className="mini-body">
                <div style={{ background: '#ecd9cb', borderRadius: '999px 999px 6px 6px' }} />
                <div style={{ background: '#e3e0d2', borderRadius: '999px 999px 6px 6px' }} />
                <div style={{ background: '#e3e0d2', borderRadius: '999px 999px 6px 6px' }} />
                <div style={{ background: '#ecd9cb', borderRadius: '999px 999px 6px 6px' }} />
              </div>
              <div className="mini-label" style={{ color: '#9a7c68' }}>
                Terracota · cerámica
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="section section-alt" id="como-funciona">
        <div className="wrap">
          <h2>De la idea a vender, en tres pasos</h2>
          <div className="grid-3">
            <div className="step">
              <div className="step-num">1</div>
              <h3>Prueba el demo</h3>
              <p>
                Un clic y tienes una tienda de prueba con productos de ejemplo, en tu móvil o PC.
                Sin registro complicado ni tarjeta.
              </p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h3>Hazla tuya</h3>
              <p>
                Responde una encuesta sencilla y la IA te propone varios diseños creados solo para
                ti. Eliges uno, subes tus productos y listo.
              </p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3>Publícala y vende</h3>
              <p>
                Compra tu dominio aquí mismo y publica con un clic: web, app instalable y
                certificado seguro, alojado por nosotros.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="disenos">
        <div className="wrap unique">
          <div>
            <div className="badge">Diseñador con IA</div>
            <h2>Ninguna tienda se parece a otra</h2>
            <p>
              Aquí no hay plantillas repetidas. Cuéntanos qué vendes, cómo quieres que se sienta tu
              marca y quién es tu cliente; nuestra IA genera varios diseños creados solo para ti. El
              que elijas queda registrado a tu nombre y se retira para siempre: nadie más lo tendrá,
              ni en la web ni en las apps.
            </p>
            <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Tu diseño, bloqueado para ti.</p>
          </div>
          <div className="grid-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="feature">
              <h3>Web + apps iOS y Android</h3>
              <p>
                Tu tienda funciona en cualquier dispositivo y se instala como app en el móvil de tus
                clientes.
              </p>
            </div>
            <div className="feature">
              <h3>Tu dominio, comprado aquí</h3>
              <p>
                Busca, compra y conecta tu dominio sin salir de la plataforma. Certificado de
                seguridad automático.
              </p>
            </div>
            <div className="feature">
              <h3>Agentes de IA incluidos</h3>
              <p>
                Empleados digitales que responden a tus clientes, redactan tus productos y te avisan
                cuándo reponer.
              </p>
            </div>
            <div className="feature">
              <h3>Pedidos, inventario y pagos</h3>
              <p>
                Controla ventas, stock y compras a proveedores desde un panel simple, pensado para
                el móvil.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section plans" id="planes">
        <div className="wrap">
          <h2>Planes según tu modelo de negocio</h2>
          <p className="plans-sub">Empieza gratis. Paga solo cuando tu tienda sea de verdad.</p>
          <div className="grid-3">
            <div className="plan">
              <h3>Demo</h3>
              <div className="plan-price">Gratis</div>
              <div className="plan-note">14 días de prueba</div>
              <div className="plan-feat">
                <span>Tienda de prueba completa</span>
                <span>Diseños generados para ti</span>
                <span>Subdominio gratuito</span>
              </div>
              <Link className="btn btn-outline" style={{ color: '#e7efec', borderColor: '#3a5054' }} href="/demo">
                Empezar ahora
              </Link>
            </div>
            <div className="plan plan-featured">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Tienda</h3>
                <span className="plan-tag">Más elegido</span>
              </div>
              <div className="plan-price">
                US$ [precio]<small>/mes</small>
              </div>
              <div className="plan-note">+ [1–2] % de ventas a partir de US$ [umbral]/mes</div>
              <div className="plan-feat">
                <span>Tu tienda real, publicada</span>
                <span>Dominio propio y app instalable</span>
                <span>Pedidos, inventario y pagos</span>
              </div>
              <Link className="btn" style={{ background: '#ffffff', color: 'var(--accent)' }} href="/demo">
                Crear mi tienda
              </Link>
            </div>
            <div className="plan">
              <h3>Tienda + IA</h3>
              <div className="plan-price">
                US$ [precio]<small>/mes</small>
              </div>
              <div className="plan-note">+ [1–2] % de ventas a partir de US$ [umbral]/mes</div>
              <div className="plan-feat">
                <span>Todo lo del plan Tienda</span>
                <span>Agentes de IA: atención y catálogo</span>
                <span>App propia iOS/Android (premium)</span>
              </div>
              <Link className="btn btn-outline" style={{ color: '#e7efec', borderColor: '#3a5054' }} href="/demo">
                Hablar con nosotros
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <footer className="footer">
          <div className="brand" style={{ fontSize: 19 }}>
            fábrica<span>.</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#planes">Planes</a>
            <a href="#como-funciona">Cómo funciona</a>
            <span>[dominio.com]</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
