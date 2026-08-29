import { NextRequest, NextResponse } from 'next/server';
import { rootDomain } from '../../../lib/tenant';
import { shopQuery } from '../../../lib/vendure';

// Endpoint "ask" del on-demand TLS de Caddy: responde 200 solo para el dominio
// raíz de la fábrica o para subdominios cuya tienda (canal) existe, de modo que
// Caddy emita certificados únicamente para tiendas reales.
export async function GET(req: NextRequest) {
  const domain = (req.nextUrl.searchParams.get('domain') || '').toLowerCase();
  const root = rootDomain().split(':')[0].toLowerCase();
  if (!domain) return new NextResponse(null, { status: 400 });
  if (domain === root || domain === `www.${root}`) {
    return new NextResponse(null, { status: 200 });
  }
  if (domain.endsWith(`.${root}`)) {
    const sub = domain.slice(0, -(root.length + 1));
    if (sub && !sub.includes('.')) {
      try {
        await shopQuery(sub, `{ activeChannel { id } }`);
        return new NextResponse(null, { status: 200 });
      } catch {
        /* canal inexistente */
      }
    }
  }
  return new NextResponse(null, { status: 404 });
}
