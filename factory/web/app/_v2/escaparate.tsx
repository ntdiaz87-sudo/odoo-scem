import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { Locale } from '../../lib/i18n';
import { money } from '../../lib/i18n';
import type { Plantilla } from '../../lib/plantillas';
import { texto } from '../../lib/plantillas';

/**
 * Una tienda pintada con los tokens de una plantilla.
 *
 * Es el mismo componente para las cuatro cosas que el diseño enseña como
 * "capturas": el hero, las tarjetas de la galería, la previsualización y la
 * sección omnicanal. Al ser uno solo, lo que se ve en el home ES la plantilla
 * que se le entrega al comerciante, no un dibujo de ella.
 *
 * `variante` cambia la densidad, no el diseño:
 *   escritorio → navegador ancho, 4 productos
 *   movil      → columna estrecha, 2 productos
 *   tarjeta    → alto, para que la galería lo desplace al pasar el ratón
 */
export type VarianteEscaparate = 'escritorio' | 'movil' | 'tarjeta';

export function Escaparate({
  p,
  locale,
  variante = 'escritorio',
  prioridad = false,
}: {
  p: Plantilla;
  locale: Locale;
  variante?: VarianteEscaparate;
  prioridad?: boolean;
}) {
  const estilo = {
    '--e-fondo': p.fondo,
    '--e-tinta': p.tinta,
    '--e-acento': p.acento,
    '--e-acento-tinta': p.acentoTinta,
  } as CSSProperties;

  const productos = variante === 'movil' ? p.productos.slice(0, 2) : p.productos;
  const anchoHero = variante === 'movil' ? 420 : 900;

  return (
    <div className={`e e--${variante}`} style={estilo} data-plantilla={p.id} aria-hidden="true">
      <div className="e-barra">
        <span className="e-marca">{p.nombre}</span>
        {variante === 'movil' ? (
          <span className="e-menu">
            <i />
            <i />
            <i />
          </span>
        ) : (
          <>
            <nav className="e-nav">
              {p.categorias.map(c => (
                <span key={c.zh}>{texto(c, locale)}</span>
              ))}
            </nav>
            <span className="e-bolsa" />
          </>
        )}
      </div>

      <div className="e-hero">
        <Image
          src={p.hero}
          alt=""
          width={anchoHero}
          height={Math.round(anchoHero * 0.62)}
          sizes={variante === 'movil' ? '220px' : '760px'}
          style={{ objectPosition: p.heroPos }}
          priority={prioridad}
        />
        <div className="e-hero-copy">
          <p className="e-titular">{texto(p.titular, locale)}</p>
          <p className="e-sub">{texto(p.subtitulo, locale)}</p>
          <span className="e-cta">{texto(p.cta, locale)}</span>
        </div>
      </div>

      <div className="e-cuerpo">
        <p className="e-rot">
          {locale === 'zh' ? '精选商品' : 'Selección'}
          <span>{locale === 'zh' ? '查看全部' : 'Ver todo'}</span>
        </p>
        <div className="e-rejilla">
          {productos.map(pr => (
            <article key={pr.img} className="e-prod">
              <div className="v-foto e-prod-img">
                <Image src={pr.img} alt="" width={300} height={300} sizes="200px" />
              </div>
              <p className="e-prod-n">{locale === 'zh' ? pr.zh : pr.es}</p>
              <p className="e-prod-p">{money(pr.precio, undefined, locale)}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Marco de portátil. El contenido va dentro, a escala. */
export function Portatil({ children, clase = '' }: { children: React.ReactNode; clase?: string }) {
  return (
    <div className={`v-portatil ${clase}`}>
      <div className="v-portatil-pantalla">{children}</div>
      <div className="v-portatil-base" />
    </div>
  );
}

/** Marco de teléfono, con isla dinámica y barra de estado. */
export function Telefono({
  children,
  clase = '',
  etiqueta,
}: {
  children: React.ReactNode;
  clase?: string;
  etiqueta?: string;
}) {
  return (
    <div className={`v-telefono ${clase}`}>
      {etiqueta ? <span className="v-telefono-etiqueta">{etiqueta}</span> : null}
      <div className="v-telefono-marco">
        <span className="v-telefono-isla" />
        <div className="v-telefono-pantalla">{children}</div>
      </div>
    </div>
  );
}
