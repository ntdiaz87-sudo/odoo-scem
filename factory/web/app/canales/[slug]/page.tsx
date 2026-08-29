import Link from 'next/link';
import { redirect } from 'next/navigation';
import { leerSesion } from '../../../lib/panel-sesion';
import { loadStoreInfo } from '../../../lib/store-design';
import { rootDomain, storeUrl } from '../../../lib/tenant';
import { MiniProgramPanel } from './mini-panel';

const ROOT_URL = process.env.NEXT_PUBLIC_ROOT_URL || `http://${rootDomain()}`;

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  return { title: info ? `${info.name} · 销售渠道` : '未找到该商店' };
}

export default async function CanalesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Esta página entrega el código fuente del mini programa, que lleva dentro
  // el token del canal: no puede quedar abierta a quien acierte el slug. Solo
  // la ve el dueño de ESA tienda, con su sesión del back office.
  const sesion = await leerSesion();
  if (!sesion) redirect('/panel');
  if (sesion.canal.token !== slug) redirect(`/canales/${sesion.canal.token}`);

  const info = await loadStoreInfo(slug);

  if (!info) {
    return (
      <div className="fh-page">
        <main className="fh-panel">
          <div className="fh-tarjeta">
            <h1>未找到该商店</h1>
            <p className="fh-tarjeta-sub">这个地址没有商店，或者体验期已结束。</p>
            <Link className="fh-btn fh-btn--lima fh-btn--grande fh-btn--bloque" href="/demo">
              创建我的商店
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const url = storeUrl(slug);

  return (
    <div className="fh-page">
      <header className="fh-topbar">
        <Link href="/" aria-label="fábrica 首页">
          <span className="fh-marca">
            fábrica<span className="fh-punto">.</span>
          </span>
        </Link>
        <a className="fh-volver" href={url}>
          查看我的商店 <span aria-hidden="true">→</span>
        </a>
      </header>

      <main className="fh-panel fh-panel--ancho">
        <div className="fh-tarjeta">
          <h1>我的销售渠道</h1>
          <p className="fh-tarjeta-sub">
            {info.name} · 同一个商品库和订单流。改一次，所有渠道一起更新。
          </p>

          <ul className="fh-canal-lista">
            <li className="fh-canal-fila">
              <span className="fh-canal-ico" aria-hidden="true">🌐</span>
              <span className="fh-canal-info">
                <b>网店</b>
                <a href={url} className="fh-canal-url">{url}</a>
              </span>
              <span className="fh-estado es-live">已上线</span>
            </li>

            <li className="fh-canal-fila">
              <span className="fh-canal-ico" aria-hidden="true">📱</span>
              <span className="fh-canal-info">
                <b>H5（微信内打开）</b>
                <span className="fh-canal-d">同一个地址，在微信里打开即为 H5 版本。扫码可直接进店。</span>
              </span>
              <span className="fh-estado es-live">已上线</span>
            </li>

            <li className="fh-canal-fila">
              <span className="fh-canal-ico" aria-hidden="true">💬</span>
              <span className="fh-canal-info">
                <b>微信小程序</b>
                <span className="fh-canal-d">
                  已按你的专属设计生成源码，用你自己的账号上传即可。
                </span>
              </span>
              <span className="fh-estado es-listo">待上传</span>
            </li>

            <li className="fh-canal-fila es-plan">
              <span className="fh-canal-ico" aria-hidden="true">🍎</span>
              <span className="fh-canal-info">
                <b>iOS / Android 独立 App</b>
                <span className="fh-canal-d">全渠道版提供。</span>
              </span>
              <span className="fh-estado">高级套餐</span>
            </li>
          </ul>

          <MiniProgramPanel slug={slug} nombre={info.name} />
        </div>
      </main>
    </div>
  );
}
