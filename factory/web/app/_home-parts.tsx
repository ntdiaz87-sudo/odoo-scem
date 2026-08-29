/**
 * Piezas visuales del home: iconos lineales y las tres maquetas de tienda que
 * viven dentro de los teléfonos del hero. Todo es CSS/SVG: no se carga
 * ninguna imagen externa.
 *
 * Componentes de servidor puros (sin estado, sin 'use client').
 */

/* ---------- iconos lineales ---------- */

const ico = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconCursor() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="m5 3 6.5 16 2.2-6.6L20 10.2z" />
    </svg>
  );
}
export function IconWand() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="M4 20 15 9" />
      <path d="m17.5 3-.9 2.4-2.4.9 2.4.9.9 2.4.9-2.4 2.4-.9-2.4-.9z" />
      <path d="m6.5 4-.6 1.5-1.5.6 1.5.6.6 1.5.6-1.5 1.5-.6-1.5-.6z" />
    </svg>
  );
}
export function IconPublish() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  );
}
export function IconDevices() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <rect x="3" y="4" width="11" height="14" rx="1.6" />
      <rect x="15.5" y="9" width="5.5" height="11" rx="1.4" />
      <path d="M7 21h4" />
    </svg>
  );
}
export function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.3 3.3 5.2 3.3 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.3-5.2-3.3-8.5S9.8 5.8 12 3.5Z" />
    </svg>
  );
}
export function IconAgent() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <rect x="4" y="7.5" width="16" height="12" rx="3" />
      <path d="M12 4v3.5" />
      <circle cx="9" cy="13.5" r="1.1" />
      <circle cx="15" cy="13.5" r="1.1" />
      <path d="M9.8 16.8h4.4" />
    </svg>
  );
}
export function IconBox() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" />
      <path d="m4 8 8 4.5L20 8" />
      <path d="M12 12.5V20.5" />
    </svg>
  );
}
export function IconLock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <rect x="4.5" y="10" width="15" height="11" rx="2.4" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14.5v2.5" />
    </svg>
  );
}
export function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...ico}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/* ---------- cromo del teléfono ---------- */

function Chrome({ hora, oscuro = false }: { hora: string; oscuro?: boolean }) {
  return (
    <div className={`fh-status${oscuro ? ' is-dark' : ''}`} aria-hidden="true">
      <span className="fh-status-hora">{hora}</span>
      <span className="fh-status-iconos">
        <i className="fh-sig" />
        <i className="fh-wifi" />
        <i className="fh-bat" />
      </span>
    </div>
  );
}

/* ---------- 1. VERDEALTO — botánica ---------- */

export function PantallaVerdealto() {
  return (
    <div className="fh-app fh-app--verdealto">
      <Chrome hora="9:41" oscuro />
      <div className="fh-app-bar">
        <span className="fh-app-marca">青竹家居</span>
        <span className="fh-app-menu" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="fh-app-hero">
        <p className="fh-app-titular">
          让绿意
          <br />
          住进你家。
        </p>
        <span className="fh-app-cta">立即选购</span>
      </div>
      <div className="fh-app-bloque">
        <p className="fh-app-rot">分类</p>
        <div className="fh-app-cats">
          {['绿植', '花盆', '工具', '营养土'].map(c => (
            <span key={c} className="fh-app-cat">
              <i className="fh-cat-ico fh-cat-ico--hoja" />
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="fh-app-bloque">
        <p className="fh-app-rot">热销商品</p>
        <div className="fh-app-rejilla">
          <article className="fh-prod">
            <div className="fh-prod-img fh-planta fh-planta--a" />
            <p className="fh-prod-n">龟背竹</p>
            <p className="fh-prod-p">¥128</p>
          </article>
          <article className="fh-prod">
            <div className="fh-prod-img fh-planta fh-planta--b" />
            <p className="fh-prod-n">琴叶榕</p>
            <p className="fh-prod-p">¥198</p>
          </article>
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. NOCTA — moda editorial, marfil ---------- */

export function PantallaNocta() {
  return (
    <div className="fh-app fh-app--nocta">
      <Chrome hora="9:41" />
      <div className="fh-app-bar">
        <span className="fh-app-menu fh-app-menu--dark" aria-hidden="true">
          <i />
          <i />
        </span>
        <span className="fh-app-marca">NOCTA 夜行</span>
        <span className="fh-app-bolsa" aria-hidden="true" />
      </div>
      <div className="fh-nocta-hero">
        <div className="fh-nocta-figura" aria-hidden="true">
          <span className="fh-fig-cabeza" />
          <span className="fh-fig-cuerpo" />
        </div>
        <div className="fh-nocta-copy">
          <p className="fh-nocta-titular">
            春夏
            <br />
            新系列
          </p>
          <p className="fh-nocta-sub">2026 春夏</p>
          <span className="fh-app-cta fh-app-cta--dark">立即查看</span>
        </div>
      </div>
      <div className="fh-app-bloque">
        <p className="fh-app-rot">精选</p>
        <div className="fh-app-rejilla">
          <article className="fh-prod">
            <div className="fh-prod-img fh-moda fh-moda--camisa" />
            <p className="fh-prod-n">宽版衬衫</p>
            <p className="fh-prod-p">¥299</p>
          </article>
          <article className="fh-prod">
            <div className="fh-prod-img fh-moda fh-moda--bolso" />
            <p className="fh-prod-n">真皮手袋</p>
            <p className="fh-prod-p">¥899</p>
          </article>
        </div>
      </div>
    </div>
  );
}

/* ---------- 3. CASA TERRA — cerámica, terracota ---------- */

export function PantallaCasaTerra() {
  return (
    <div className="fh-app fh-app--terra">
      <Chrome hora="9:41" oscuro />
      <div className="fh-app-bar">
        <span className="fh-app-marca">陶合</span>
        <span className="fh-app-menu" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="fh-app-hero">
        <p className="fh-app-titular">
          手作陶器，
          <br />
          用得长久。
        </p>
        <span className="fh-app-cta">去逛逛</span>
      </div>
      <div className="fh-app-bloque">
        <p className="fh-app-rot">分类</p>
        <div className="fh-app-cats">
          {['餐具', '花器', '碗碟', '全部'].map(c => (
            <span key={c} className="fh-app-cat">
              <i className="fh-cat-ico fh-cat-ico--pieza" />
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="fh-app-bloque">
        <p className="fh-app-rot">孤品</p>
        <div className="fh-app-rejilla">
          <article className="fh-prod">
            <div className="fh-prod-img fh-ceramica fh-ceramica--jarron" />
            <p className="fh-prod-n">沙丘花器</p>
            <p className="fh-prod-p">¥368</p>
          </article>
          <article className="fh-prod">
            <div className="fh-prod-img fh-ceramica fh-ceramica--cuenco" />
            <p className="fh-prod-n">粗陶碗</p>
            <p className="fh-prod-p">¥168</p>
          </article>
        </div>
      </div>
    </div>
  );
}

/* ---------- teléfono ---------- */

export function Telefono({
  variante,
  etiqueta,
  children,
}: {
  variante: 'izq' | 'centro' | 'der';
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`fh-phone fh-phone--${variante}`} role="img" aria-label={etiqueta}>
      <div className="fh-phone-marco">
        <span className="fh-phone-isla" aria-hidden="true" />
        <div className="fh-phone-pantalla">{children}</div>
      </div>
    </div>
  );
}
