'use client';

import { useState } from 'react';
import { useT } from '../../locale-provider';

interface Generado {
  tienda: string;
  apiUrl: string;
  archivos: number;
  ficheros: Record<string, string>;
}

/**
 * Los pasos para publicar el mini programa.
 *
 * Esto estaba escrito en chino a mano y no pasaba por el diccionario, contra la
 * regla de la casa: las páginas de la FÁBRICA siguen al visitante. Un
 * comerciante que tenía la fábrica en español llegaba aquí y se encontraba las
 * instrucciones en chino. Los nombres propios de WeChat (开发管理 → 服务器域名)
 * sí se quedan en chino: son los rótulos que va a ver de verdad en su pantalla,
 * y traducirlos le haría buscar un menú que no existe.
 */
export function MiniProgramPanel({ slug, nombre }: { slug: string; nombre: string }) {
  const t = useT();
  const [datos, setDatos] = useState<Generado | null>(null);
  const [activo, setActivo] = useState('pages/index/index.wxml');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch(`/api/miniprogram/${encodeURIComponent(slug)}`);
      if (!r.ok) throw new Error(t('mp.error'));
      const d = (await r.json()) as Generado;
      setDatos(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('mp.error'));
    } finally {
      setCargando(false);
    }
  }

  const rutas = datos ? Object.keys(datos.ficheros).sort() : [];

  return (
    <section className="fh-mp">
      <h2 className="fh-mp-t">{t('mp.titulo')}</h2>
      <p className="fh-mp-d">
        {t('mp.desc.a', { tienda: nombre })} {t('mp.desc.b')}
      </p>
      {/* La condición para COBRAR va antes del botón de generar, no al final
          de los pasos: descubrirla con el código ya subido es perder días. */}
      <p className="fh-mp-requisito">{t('mp.aviso')}</p>

      {!datos ? (
        <button className="fh-btn fh-btn--lima fh-btn--grande" onClick={generar} disabled={cargando}>
          {cargando ? t('mp.generando') : t('mp.generar')}
        </button>
      ) : null}
      {error ? <div className="fh-aviso">{error}</div> : null}

      {datos ? (
        <>
          <p className="fh-mp-ok">
            ✓ {t('mp.ok', { n: String(datos.archivos) })} · {t('mp.dominio')} <code>{datos.apiUrl}</code>
          </p>
          <div className="fh-mp-caja">
            <ul className="fh-mp-rutas">
              {rutas.map(r => (
                <li key={r}>
                  <button
                    type="button"
                    className={r === activo ? 'es-activo' : ''}
                    onClick={() => setActivo(r)}
                  >
                    {r}
                  </button>
                </li>
              ))}
            </ul>
            <pre className="fh-mp-codigo">
              <code>{datos.ficheros[activo]}</code>
            </pre>
          </div>
          <ol className="fh-mp-pasos">
            <li>{t('mp.p1')}</li>
            <li>
              {t('mp.p2.a')} <code>project.config.json</code> {t('mp.p2.b')}
            </li>
            <li>
              {t('mp.p3.a')} <code>{datos.apiUrl}</code> {t('mp.p3.b')}
            </li>
            <li>{t('mp.p4')}</li>
          </ol>
        </>
      ) : null}
    </section>
  );
}
