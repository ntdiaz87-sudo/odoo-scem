'use client';

import { useState } from 'react';

interface Generado {
  tienda: string;
  apiUrl: string;
  archivos: number;
  ficheros: Record<string, string>;
}

export function MiniProgramPanel({ slug, nombre }: { slug: string; nombre: string }) {
  const [datos, setDatos] = useState<Generado | null>(null);
  const [activo, setActivo] = useState('pages/index/index.wxml');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch(`/api/miniprogram/${encodeURIComponent(slug)}`);
      if (!r.ok) throw new Error('生成失败');
      const d = (await r.json()) as Generado;
      setDatos(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setCargando(false);
    }
  }

  const rutas = datos ? Object.keys(datos.ficheros).sort() : [];

  return (
    <section className="fh-mp">
      <h2 className="fh-mp-t">微信小程序源码</h2>
      <p className="fh-mp-d">
        用 <b>{nombre}</b> 的专属配色和字体生成，直接连到你的商品和订单。
        用微信开发者工具打开后上传即可，不需要经过我们。
      </p>

      {!datos ? (
        <button className="fh-btn fh-btn--lima fh-btn--grande" onClick={generar} disabled={cargando}>
          {cargando ? '生成中…' : '生成我的小程序源码'}
        </button>
      ) : null}
      {error ? <div className="fh-aviso">{error}</div> : null}

      {datos ? (
        <>
          <p className="fh-mp-ok">
            ✓ 已生成 {datos.archivos} 个文件 · API 域名 <code>{datos.apiUrl}</code>
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
            <li>在微信公众平台注册小程序，拿到 AppID。</li>
            <li>把 <code>project.config.json</code> 里的 appid 换成你的。</li>
            <li>在「开发管理 → 服务器域名」里加入 <code>{datos.apiUrl}</code>。</li>
            <li>完成小程序备案，然后上传提交审核。</li>
          </ol>
        </>
      ) : null}
    </section>
  );
}
