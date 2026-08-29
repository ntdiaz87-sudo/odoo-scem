import { NextResponse } from 'next/server';
import { loadStoreInfo } from '../../../../lib/store-design';

export const dynamic = 'force-dynamic';

/** Manifiesto PWA por tienda: nombre y colores propios → app instalable. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  if (!info) {
    return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
  }
  return NextResponse.json(
    {
      name: info.name,
      short_name: info.name.slice(0, 12),
      description: `Tienda online de ${info.name}`,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: info.design.bg,
      theme_color: info.design.brand,
      icons: [
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
      ],
    },
    { headers: { 'content-type': 'application/manifest+json' } },
  );
}
