/**
 * Las tres tiendas que se ven dentro de los teléfonos del hero.
 *
 * Son rubros que de verdad mueven dinero en Pekín ahora mismo:
 *   1. 玩物纪 — 潮玩 y 盲盒. Pop Mart nació en Pekín; el 兔儿爷 y los imanes
 *      de museo son el souvenir que compra media ciudad.
 *   2. 青黛 — 新中式: 马面裙, 盘扣, 云肩. La moda que arrasa desde 2024.
 *   3. 胡同咖啡 — café de especialidad, que es lo que ha ocupado el hutong.
 *
 * Todo el producto está dibujado en SVG, sin una sola imagen externa: así no
 * hay petición a un CDN que en China vaya lento o esté bloqueado, no hay
 * licencia de foto que respetar y el peso del home no sube ni un kilobyte.
 * Cada dibujo lleva fondo propio, silueta con degradado y sombra de apoyo,
 * que es lo que a 55 px hace que una viñeta se lea como un producto
 * fotografiado y no como una mancha de color.
 */

/* =========================== cromo del teléfono =========================== */

function Estado({ oscuro = false }: { oscuro?: boolean }) {
  return (
    <div className={`fh-status${oscuro ? ' is-dark' : ''}`} aria-hidden="true">
      <span className="fh-status-hora">9:41</span>
      <span className="fh-status-iconos">
        <i className="fh-sig" />
        <i className="fh-wifi" />
        <i className="fh-bat" />
      </span>
    </div>
  );
}

/** Barra inferior: en China la tienda se vive dentro de WeChat, y un mini
 *  programa siempre lleva estas cuatro pestañas abajo. */
function Pestanas() {
  const items = [
    { t: '首页', d: 'M3 10.6 12 3.5l9 7.1V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
    { t: '分类', d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
    { t: '购物车', d: 'M6 7h13l-1.3 8.5a2 2 0 0 1-2 1.7H9.3a2 2 0 0 1-2-1.7L6 7zm3 0a3 3 0 0 1 6 0' },
    { t: '我的', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0z' },
  ];
  return (
    <nav className="fh-app-tabs" aria-hidden="true">
      {items.map((it, i) => (
        <span key={it.t} className={`fh-app-tab${i === 0 ? ' is-on' : ''}`}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d={it.d} />
          </svg>
          {it.t}
        </span>
      ))}
    </nav>
  );
}

function Menu({ oscuro = false }: { oscuro?: boolean }) {
  return (
    <span className={`fh-app-menu${oscuro ? ' fh-app-menu--dark' : ''}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** Fila de categorías con su glifo. */
function Categorias({ items }: { items: { t: string; d: string }[] }) {
  return (
    <div className="fh-app-cats">
      {items.map(c => (
        <span key={c.t} className="fh-app-cat">
          <i className="fh-cat-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d={c.d} />
            </svg>
          </i>
          {c.t}
        </span>
      ))}
    </div>
  );
}

function Rot({ titulo, mas }: { titulo: string; mas: string }) {
  return (
    <p className="fh-app-rot">
      {titulo} <span className="fh-app-rot-mas">{mas}</span>
    </p>
  );
}

/** Franja de promoción: el 营销位 que lleva arriba cualquier app de compra
 *  china. En los teléfonos laterales ocupa el sitio de la segunda fila de
 *  producto, que a ese tamaño no cabe. */
function Promo({ titulo, pie, sello, arte }: { titulo: string; pie: string; sello: string; arte: React.ReactNode }) {
  return (
    <div className="fh-app-promo">
      <span className="fh-app-promo-txt">
        <b>{titulo}</b>
        <em>{pie}</em>
      </span>
      <span className="fh-app-promo-sello">{sello}</span>
      <span className="fh-app-promo-img">{arte}</span>
    </div>
  );
}

function Ficha({
  arte,
  nombre,
  precio,
  etiqueta,
  etiquetaClara = false,
}: {
  arte: React.ReactNode;
  nombre: string;
  precio: string;
  etiqueta?: string;
  etiquetaClara?: boolean;
}) {
  return (
    <article className="fh-prod">
      <div className="fh-prod-img">
        {arte}
        {etiqueta ? <span className={`fh-prod-tag${etiquetaClara ? ' fh-prod-tag--claro' : ''}`}>{etiqueta}</span> : null}
      </div>
      <p className="fh-prod-n">{nombre}</p>
      <p className="fh-prod-p">{precio}</p>
    </article>
  );
}

/* ====================== dibujos — 玩物纪 (潮玩) ========================== */

const FONDO_TOY = (
  <>
    <radialGradient id="toyf" cx=".5" cy=".28" r=".85">
      <stop offset="0" stopColor="#3d2760" />
      <stop offset="1" stopColor="#1a1030" />
    </radialGradient>
  </>
);

/** 盲盒 — caja ciega con el gato asomando. */
function ArteBlindbox() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        {FONDO_TOY}
        <linearGradient id="bbc" x1="0" y1="0" x2=".85" y2="1">
          <stop offset="0" stopColor="#ff9ec6" />
          <stop offset="1" stopColor="#c53b7e" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#toyf)" />
      <g fill="#ffe6f0">
        <path d="M35 31 39 15 50 27z" />
        <path d="M65 31 61 15 50 27z" />
        <circle cx="50" cy="34" r="15" />
      </g>
      <g fill="#2b1442">
        <circle cx="44" cy="33" r="1.9" />
        <circle cx="56" cy="33" r="1.9" />
        <path d="M46.5 38.5h7L50 42z" />
      </g>
      <ellipse cx="50" cy="88" rx="28" ry="4.5" fill="#000" opacity=".4" />
      <rect x="26" y="47" width="48" height="41" rx="5" fill="url(#bbc)" />
      <rect x="46.5" y="47" width="7" height="41" fill="#fff" opacity=".45" />
      <rect x="21" y="41" width="58" height="11" rx="4" fill="#ffd6e7" />
      <rect x="21" y="41" width="58" height="4" rx="2" fill="#fff" opacity=".5" />
    </svg>
  );
}

/** 手办 — figura con máscara de ópera de Pekín (脸谱). */
function ArteFigura() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="fgf" cx=".5" cy=".3" r=".85">
          <stop offset="0" stopColor="#3a2b5c" />
          <stop offset="1" stopColor="#171029" />
        </radialGradient>
        <linearGradient id="fgr" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#2f7fd8" />
          <stop offset="1" stopColor="#1a4488" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#fgf)" />
      <ellipse cx="50" cy="88" rx="24" ry="4" fill="#000" opacity=".4" />
      {/* túnica */}
      <path d="M35 84C35 62 40 50 50 50s15 12 15 34z" fill="url(#fgr)" />
      <path d="M36 60c-8 3-12 12-10 19l10 1z" fill="#2a6bbd" />
      <path d="M64 60c8 3 12 12 10 19l-10 1z" fill="#2a6bbd" />
      <path d="M50 50c5 0 8.5 4.5 9.5 10L50 66l-9.5-6c1-5.5 4.5-10 9.5-10z" fill="#f0e2c4" />
      {/* cabeza y 脸谱 */}
      <circle cx="50" cy="35" r="13.5" fill="#fbf3e6" />
      <path d="M50 21.5c2.6 0 4 4 4 8s-1.4 6-4 6-4-2-4-6 1.4-8 4-8z" fill="#d8443c" />
      <g fill="#1d1526">
        <path d="M37.6 33c2.6-3.2 6.4-3.4 8.6-.6-2.6 2.4-6 2.6-8.6.6z" />
        <path d="M62.4 33c-2.6-3.2-6.4-3.4-8.6-.6 2.6 2.4 6 2.6 8.6.6z" />
      </g>
      <g fill="#fff">
        <circle cx="44.4" cy="35.2" r="1.5" />
        <circle cx="55.6" cy="35.2" r="1.5" />
      </g>
      <path d="M45.4 42.5c2.8 1.6 6.4 1.6 9.2 0-1.4 2.8-7.8 2.8-9.2 0z" fill="#c0392f" />
      {/* tocado con plumas */}
      <path d="M36.5 29q13.5-12.5 27 0-13.5-5-27 0z" fill="#e8b23c" />
      <path d="M43 20q4-9 7-11 3 2 7 11-7-4-14 0z" fill="#d8443c" />
      <rect x="31" y="84" width="38" height="6" rx="3" fill="#6a4f96" />
    </svg>
  );
}

/** 兔儿爷 — el conejo con armadura, juguete tradicional de Pekín. */
function ArteTuerye() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="tyf" cx=".5" cy=".3" r=".85">
          <stop offset="0" stopColor="#4a2a4e" />
          <stop offset="1" stopColor="#1d1026" />
        </radialGradient>
        <linearGradient id="tya" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#f0c04a" />
          <stop offset="1" stopColor="#b5822a" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#tyf)" />
      <ellipse cx="50" cy="88" rx="25" ry="4" fill="#000" opacity=".4" />
      {/* orejas */}
      <g fill="#fdf1ec">
        <path d="M41 33c-2-9-3-18 0-22 3 3 4 13 4 21z" />
        <path d="M59 33c2-9 3-18 0-22-3 3-4 13-4 21z" />
      </g>
      <g fill="#f2a7b8">
        <path d="M41.8 30c-1.2-6.5-1.8-13-.2-15.6 1.6 2 2.2 9 2.2 15.2z" />
        <path d="M58.2 30c1.2-6.5 1.8-13 .2-15.6-1.6 2-2.2 9-2.2 15.2z" />
      </g>
      {/* armadura */}
      <path d="M33 86c0-19 6-30 17-30s17 11 17 30z" fill="url(#tya)" />
      <path d="M50 56c6 0 9 5 10 11H40c1-6 4-11 10-11z" fill="#c9453e" />
      <path d="M34 66c-6 3-9 11-8 18l9 1z" fill="#c9453e" />
      <path d="M66 66c6 3 9 11 8 18l-9 1z" fill="#c9453e" />
      {/* cara */}
      <circle cx="50" cy="41" r="12.5" fill="#fdf5ee" />
      <path d="M50 30c2 4 2.6 8 0 11-2.6-3-2-7 0-11z" fill="#d8443c" />
      <g fill="#241a2c">
        <circle cx="44.6" cy="41.6" r="1.6" />
        <circle cx="55.4" cy="41.6" r="1.6" />
      </g>
      <path d="M47 47h6l-3 3z" fill="#e0736e" />
      <path d="M50 50v3M50 53h-3M50 53h3" stroke="#c98d8d" strokeWidth=".9" fill="none" />
    </svg>
  );
}

/** Héroe del escaparate de 潮玩: la pieza del mes sobre un aro de neón. */
function ArteToyHero() {
  return (
    <svg className="fh-art fh-toy-hero" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="thg" cx=".5" cy=".5" r=".5">
          <stop offset=".55" stopColor="#ff7ec2" stopOpacity=".9" />
          <stop offset="1" stopColor="#ff7ec2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="thb" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#ffd166" />
          <stop offset="1" stopColor="#f2933d" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#thg)" opacity=".55" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#ffd166" strokeWidth="1.4" opacity=".65" />
      <g fill="#fdf1ec">
        <path d="M40 34c-2-10-3-19 0-23 3 3 4 14 4 22z" />
        <path d="M60 34c2-10 3-19 0-23-3 3-4 14-4 22z" />
      </g>
      <path d="M31 84c0-20 7-32 19-32s19 12 19 32z" fill="url(#thb)" />
      <path d="M50 52c6 0 10 5 11 12H39c1-7 5-12 11-12z" fill="#e0574f" />
      <circle cx="50" cy="41" r="13" fill="#fdf5ee" />
      <g fill="#241a2c">
        <circle cx="44.6" cy="41" r="1.7" />
        <circle cx="55.4" cy="41" r="1.7" />
      </g>
      <path d="M50 30c2 4 2.6 8 0 11-2.6-3-2-7 0-11z" fill="#d8443c" />
      <path d="M47 47h6l-3 3z" fill="#e0736e" />
    </svg>
  );
}

/* ====================== dibujos — 青黛 (新中式) ========================== */

/** 马面裙 — falda de tablas con banda tejida en el bajo. */
function ArteMamian() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="mmf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2ece2" />
          <stop offset="1" stopColor="#e3dacc" />
        </linearGradient>
        <linearGradient id="mms" x1=".15" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#3d4a6b" />
          <stop offset="1" stopColor="#1e2740" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#mmf)" />
      <ellipse cx="50" cy="86" rx="30" ry="3.5" fill="#2b2419" opacity=".14" />
      <rect x="35" y="17" width="30" height="8" rx="2.5" fill="#2b3350" />
      <path d="M35 24h30l12 60H23z" fill="url(#mms)" />
      <g stroke="#fff" strokeOpacity=".2" strokeWidth="1">
        <path d="M42 25 36.5 84" />
        <path d="M46 25 44 84" />
        <path d="M54 25 56 84" />
        <path d="M58 25 63.5 84" />
      </g>
      <path d="M24.4 74h51.2l1.4 10H23z" fill="#c39a45" />
      <path d="M24.4 74h51.2l.3 2.4H24.1z" fill="#e7c274" />
      <circle cx="50" cy="21" r="1.6" fill="#c39a45" />
    </svg>
  );
}

/** 盘扣小外套 — chaqueta cruzada con botones de nudo. */
function ArteAbrigo() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="abf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe7dc" />
          <stop offset="1" stopColor="#ddd2c2" />
        </linearGradient>
        <linearGradient id="abc" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#9d3b34" />
          <stop offset="1" stopColor="#6e231f" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#abf)" />
      <ellipse cx="50" cy="85" rx="26" ry="3.5" fill="#2b2419" opacity=".14" />
      <path d="M37 26h26l6 57H31z" fill="url(#abc)" />
      <path d="M37 26 24 33l5 32 8-2z" fill="#8a322c" />
      <path d="M63 26l13 7-5 32-8-2z" fill="#8a322c" />
      <path d="M50 26h13l-11 26-2-9z" fill="#b0554c" />
      <path d="M50 26H37l11 26 2-9z" fill="#c2685e" />
      <g fill="#e8cf9c">
        <circle cx="50" cy="55" r="2.1" />
        <circle cx="50" cy="64" r="2.1" />
        <circle cx="50" cy="73" r="2.1" />
      </g>
    </svg>
  );
}

/** 云肩上衣 — blusa con cuello de nubes. */
function ArteYunjian() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="yjf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef0e8" />
          <stop offset="1" stopColor="#dde1d5" />
        </linearGradient>
        <linearGradient id="yjc" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#93b3a4" />
          <stop offset="1" stopColor="#5d8375" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#yjf)" />
      <ellipse cx="50" cy="84" rx="26" ry="3.5" fill="#243026" opacity=".14" />
      <path d="M36 28h28l5 54H31z" fill="url(#yjc)" />
      <path d="M36 28 23 35l6 27 7-2z" fill="#7fa294" />
      <path d="M64 28l13 7-6 27-7-2z" fill="#7fa294" />
      {/* cuello de nubes */}
      <path d="M33 32h34v6a6 6 0 0 1-5.7 6 6 6 0 0 1-5.6-4.4A6 6 0 0 1 50 44a6 6 0 0 1-5.7-4.4A6 6 0 0 1 38.7 44 6 6 0 0 1 33 38z" fill="#e6d3a8" />
      <path d="M33 32h34v2.4H33z" fill="#f2e6c8" />
      <g fill="#c39a45">
        <circle cx="50" cy="52" r="1.9" />
        <circle cx="50" cy="60" r="1.9" />
      </g>
    </svg>
  );
}

/** 真丝方巾 — pañuelo de seda doblado. */
function ArtePanuelo() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="pnf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2eae6" />
          <stop offset="1" stopColor="#e3d7d2" />
        </linearGradient>
        <linearGradient id="pnc" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#c9748c" />
          <stop offset="1" stopColor="#8e3f5c" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#pnf)" />
      <ellipse cx="50" cy="82" rx="28" ry="4" fill="#2b1f24" opacity=".13" />
      <g transform="rotate(9 52 54)">
        <path d="M30 40h44v30q-22 8-44 0z" fill="#a4536b" />
      </g>
      <g transform="rotate(-11 48 46)">
        <path d="M24 24h50v34q-25 9-50 0z" fill="url(#pnc)" />
        <path d="M29 29h40v26q-20 7-40 0z" fill="none" stroke="#f2ddcd" strokeWidth="1.3" opacity=".8" />
        <g fill="#f2ddcd" opacity=".92">
          <path d="M49 36c2.2 2 2.2 5 0 7-2.2-2-2.2-5 0-7zM45.5 39.5c2 2.2 5 2.2 7 0-2-2.2-5-2.2-7 0z" />
          <circle cx="37" cy="46" r="1.5" />
          <circle cx="61" cy="44" r="1.5" />
          <circle cx="49" cy="50" r="1.3" />
        </g>
      </g>
    </svg>
  );
}

/** La modelo del escaparate: 云肩 arriba y 马面裙 abajo. */
function ArteModelo() {
  return (
    <svg className="fh-qd-figura" viewBox="0 36 100 114" aria-hidden="true">
      <defs>
        <linearGradient id="qdt" x1=".2" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#f0eae0" />
          <stop offset="1" stopColor="#d8cfbe" />
        </linearGradient>
        <linearGradient id="qds" x1=".15" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#3f4b6b" />
          <stop offset="1" stopColor="#1c2438" />
        </linearGradient>
      </defs>
      {/* Encuadre editorial: la figura entra por el hombro. Una cara dibujada a
          este tamaño sale de muñeca y le quita el sitio a la ropa, que es lo
          que se vende. */}
      <path d="M50 36c5 0 8 2 8 6H42c0-4 3-6 8-6z" fill="#e6cbb0" />
      {/* cuerpo */}
      <path d="M36 41h28l6 34H30z" fill="url(#qdt)" />
      <path d="M36 41 25 47l3 26 8-2z" fill="#e6ded1" />
      <path d="M64 41l11 6-3 26-8-2z" fill="#e6ded1" />
      <path d="M34 44h32v5a5.5 5.5 0 0 1-5.3 5.5A5.5 5.5 0 0 1 55.4 51 5.5 5.5 0 0 1 50 54.5 5.5 5.5 0 0 1 44.6 51a5.5 5.5 0 0 1-5.3 3.5A5.5 5.5 0 0 1 34 49z" fill="#e6d3a8" />
      <g fill="#c39a45">
        <circle cx="50" cy="61" r="1.8" />
        <circle cx="50" cy="68" r="1.8" />
      </g>
      {/* falda */}
      <path d="M30 75h40l9 76H21z" fill="url(#qds)" />
      <g stroke="#fff" strokeOpacity=".18" strokeWidth="1.2">
        <path d="M40 76 33 151" />
        <path d="M46 76 43 151" />
        <path d="M54 76 57 151" />
        <path d="M60 76 67 151" />
      </g>
      <path d="M23.6 132h52.8l1.6 12H22z" fill="#c39a45" />
      <path d="M23.6 132h52.8l.3 2.6H23.3z" fill="#e7c274" />
    </svg>
  );
}

/* ==================== dibujos — 胡同咖啡 (精品咖啡) ===================== */

/** 挂耳咖啡 — caja de sobres de filtro. */
function ArteDrip() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="dpf" cx=".5" cy=".3" r=".85">
          <stop offset="0" stopColor="#6d3d28" />
          <stop offset="1" stopColor="#3d2016" />
        </radialGradient>
        <linearGradient id="dpc" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#d9a878" />
          <stop offset="1" stopColor="#a4744b" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#dpf)" />
      <g opacity=".95">
        <rect x="33" y="25" width="15" height="20" rx="2" fill="#f2e6d5" transform="rotate(-9 40 35)" />
        <rect x="52" y="23" width="15" height="21" rx="2" fill="#e3d2ba" transform="rotate(8 59 34)" />
      </g>
      <ellipse cx="50" cy="88" rx="27" ry="4" fill="#000" opacity=".35" />
      <rect x="25" y="40" width="50" height="48" rx="4" fill="url(#dpc)" />
      <rect x="25" y="54" width="50" height="15" fill="#2f1a11" />
      <rect x="31" y="59.5" width="24" height="2.4" rx="1.2" fill="#e7c79c" />
      <rect x="31" y="63.5" width="14" height="1.8" rx=".9" fill="#e7c79c" opacity=".7" />
      <rect x="25" y="40" width="50" height="3" rx="1.5" fill="#fff" opacity=".28" />
    </svg>
  );
}

/** 咖啡豆 — bolsa de medio kilo con válvula. */
function ArteGranos() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="gnf" cx=".5" cy=".3" r=".85">
          <stop offset="0" stopColor="#5f3626" />
          <stop offset="1" stopColor="#341c13" />
        </radialGradient>
        <linearGradient id="gnb" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#3f4b3f" />
          <stop offset="1" stopColor="#1f2820" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#gnf)" />
      <ellipse cx="50" cy="88" rx="26" ry="4" fill="#000" opacity=".35" />
      <path d="M30 32h40l5 56H25z" fill="url(#gnb)" />
      <rect x="27" y="24" width="46" height="10" rx="2" fill="#131a15" />
      <rect x="27" y="24" width="46" height="3" rx="1.5" fill="#fff" opacity=".18" />
      <circle cx="50" cy="58" r="12" fill="#ead9bd" />
      <ellipse cx="50" cy="58" rx="4.6" ry="6.6" fill="#432a1b" transform="rotate(-18 50 58)" />
      <path d="M50 51.6c-2.2 3.6-2.2 9.2 0 12.8" stroke="#ead9bd" strokeWidth="1.3" fill="none" />
      <rect x="44" y="74" width="12" height="4" rx="2" fill="#0e130f" />
    </svg>
  );
}

/** 驴打滚可颂 — el cruasán relleno de 驴打滚, la moda de las cafeterías de Pekín. */
function ArteCruasan() {
  return (
    <svg className="fh-art" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="crf" cx=".5" cy=".3" r=".85">
          <stop offset="0" stopColor="#6b4c2e" />
          <stop offset="1" stopColor="#3a2718" />
        </radialGradient>
        <linearGradient id="crc" x1=".1" y1="0" x2=".9" y2="1">
          <stop offset="0" stopColor="#f0c176" />
          <stop offset="1" stopColor="#c1803a" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#crf)" />
      <ellipse cx="50" cy="76" rx="30" ry="5" fill="#000" opacity=".35" />
      <path d="M18 62c0-14 12-24 32-24s32 10 32 24c0 5-5 8-10 6-6-2-12-4-22-4s-16 2-22 4c-5 2-10-1-10-6z" fill="url(#crc)" />
      <g stroke="#a86c2e" strokeWidth="1.5" fill="none" opacity=".75">
        <path d="M38 40q-3 12-2 24" />
        <path d="M50 37v27" />
        <path d="M62 40q3 12 2 24" />
      </g>
      <path d="M26 52q24-12 48 0" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" />
      <g fill="#e8d6b0" opacity=".9">
        <circle cx="36" cy="47" r="1.3" />
        <circle cx="56" cy="44" r="1.2" />
        <circle cx="66" cy="52" r="1.1" />
        <circle cx="45" cy="55" r="1.1" />
      </g>
    </svg>
  );
}

/** Café con leche visto desde arriba: el héroe del escaparate de café. */
function ArteLatte() {
  return (
    <svg className="fh-art fh-hu-taza" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="ltc" cx=".38" cy=".32" r=".8">
          <stop offset="0" stopColor="#c9a07a" />
          <stop offset="1" stopColor="#8b5c3a" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="53" r="42" fill="#000" opacity=".28" />
      <circle cx="50" cy="50" r="42" fill="#f4ece1" />
      <circle cx="50" cy="50" r="34" fill="url(#ltc)" />
      {/* corazón de latte art: se lee a cualquier tamaño */}
      <path d="M50 70c-9-7-15-12-15-19a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 7-6 12-15 19z" fill="#f7f1e7" opacity=".95" />
      <path d="M20 34a34 34 0 0 1 20-15" stroke="#fff" strokeOpacity=".35" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ======================== 1. 玩物纪 — 潮玩 / 盲盒 ======================== */

export function PantallaToys() {
  return (
    <div className="fh-app fh-app--toys">
      <Estado oscuro />
      <div className="fh-app-bar">
        <span className="fh-app-marca">玩物纪</span>
        <Menu />
      </div>
      <div className="fh-app-hero">
        <ArteToyHero />
        <span className="fh-app-sello">每周三 20:00 上新</span>
        <p className="fh-app-titular">
          手慢
          <br />
          就没了。
        </p>
        <span className="fh-app-cta">立即抽盒</span>
      </div>
      <div className="fh-app-bloque">
        <Categorias
          items={[
            { t: '盲盒', d: 'M3 8h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM3 8l2-4h14l2 4M12 4v17' },
            { t: '手办', d: 'M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM8 21c0-7 1-11 4-11s4 4 4 11zM6 21h12' },
            { t: '联名', d: 'm12 3 2.6 5.6 6.4.8-4.7 4.3 1.2 6.3L12 17l-5.5 3 1.2-6.3L3 9.4l6.4-.8z' },
            { t: '全部', d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
          ]}
        />
      </div>
      <div className="fh-app-bloque">
        <Promo titulo="限时秒杀" pie="京剧脸谱手办 ¥199" sello="00:41:22" arte={<ArteFigura />} />
      </div>
      <div className="fh-app-bloque fh-app-cuerpo">
        <Rot titulo="本周热抽" mas="更多" />
        <div className="fh-app-rejilla">
          <Ficha arte={<ArteBlindbox />} nombre="胡同猫 · 盲盒" precio="¥69" etiqueta="限量" />
          <Ficha arte={<ArteTuerye />} nombre="兔儿爷 · 联名" precio="¥259" />
        </div>
      </div>
      <Pestanas />
    </div>
  );
}

/* ====================== 2. 青黛 — 新中式服饰 (centro) ==================== */

export function PantallaQingdai() {
  return (
    <div className="fh-app fh-app--qingdai">
      <Estado />
      <div className="fh-app-bar">
        <Menu oscuro />
        <span className="fh-app-marca">青黛</span>
        <span className="fh-app-bolsa" aria-hidden="true" />
      </div>
      <div className="fh-qd-hero">
        <ArteModelo />
        <div className="fh-qd-copy">
          <p className="fh-qd-eyebrow">2026 春夏</p>
          <p className="fh-qd-titular">
            春意起，
            <br />
            新中式。
          </p>
          <span className="fh-app-cta fh-app-cta--dark">立即查看</span>
        </div>
      </div>
      <div className="fh-app-bloque fh-app-cuerpo">
        <Rot titulo="精选" mas="全部 12 件" />
        <div className="fh-app-rejilla">
          <Ficha arte={<ArteMamian />} nombre="缂丝马面裙" precio="¥459" etiqueta="新品" etiquetaClara />
          <Ficha arte={<ArteAbrigo />} nombre="盘扣小外套" precio="¥699" />
          <Ficha arte={<ArteYunjian />} nombre="云肩上衣" precio="¥329" />
          <Ficha arte={<ArtePanuelo />} nombre="真丝方巾" precio="¥259" />
        </div>
      </div>
      <Pestanas />
    </div>
  );
}

/* ====================== 3. 胡同咖啡 — 精品咖啡 ========================== */

export function PantallaHutong() {
  return (
    <div className="fh-app fh-app--hutong">
      <Estado oscuro />
      <div className="fh-app-bar">
        <span className="fh-app-marca">胡同咖啡</span>
        <Menu />
      </div>
      <div className="fh-app-hero fh-hu-hero">
        <ArteLatte />
        <p className="fh-app-titular">
          胡同里的
          <br />
          一杯手冲。
        </p>
        <span className="fh-app-cta">去逛逛</span>
      </div>
      <div className="fh-app-bloque">
        <Categorias
          items={[
            { t: '咖啡豆', d: 'M12 4c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8zM12 4c-2.5 3-2.5 13 0 16' },
            { t: '挂耳', d: 'M6 5h12l-1.5 6.5a5 5 0 0 1-9 0zM9 18h6' },
            { t: '器具', d: 'M6 4h12l-2 7H8zM10 11v6M14 11v6M8 20h8' },
            { t: '甜点', d: 'M4 15c0-4 3.6-7 8-7s8 3 8 7M3 15h18v3H3zM12 5v3' },
          ]}
        />
      </div>
      <div className="fh-app-bloque">
        <Promo titulo="满 2 件 8 折" pie="驴打滚可颂 ¥26" sello="限今日" arte={<ArteCruasan />} />
      </div>
      <div className="fh-app-bloque fh-app-cuerpo">
        <Rot titulo="本周烘焙" mas="更多" />
        <div className="fh-app-rejilla">
          <Ficha arte={<ArteDrip />} nombre="挂耳咖啡 10片" precio="¥88" />
          <Ficha arte={<ArteGranos />} nombre="云南日晒 半磅" precio="¥128" etiqueta="当日烘" />
        </div>
      </div>
      <Pestanas />
    </div>
  );
}
