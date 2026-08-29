import { loadStoreInfo } from '../../../../lib/store-design';

export const dynamic = 'force-dynamic';

/** Icono de la app de cada tienda: su inicial sobre su color de marca. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const info = await loadStoreInfo(slug);
  const brand = info?.design.brand ?? '#0e8a7b';
  const ink = info?.design.brandInk ?? '#ffffff';
  const letter = (info?.name ?? slug).trim().charAt(0).toUpperCase() || 'T';
  const serif = info?.design.headingFont === 'serif';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${brand}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="${serif ? 'Georgia, serif' : 'system-ui, sans-serif'}"
    font-size="300" font-weight="700" fill="${ink}">${letter}</text>
</svg>`;
  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=3600',
    },
  });
}
