import { NextRequest, NextResponse } from 'next/server';
import { canalPorDominio } from './lib/dominios';
import { rootDomain, tenantFromHost } from './lib/tenant';

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const tenant = tenantFromHost(host);
  if (tenant) {
    const url = req.nextUrl.clone();
    url.pathname = `/store/${tenant}${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Dominio propio del comerciante: cualquier host que no sea el raíz ni un
  // subdominio suyo. La resolución va con caché (lib/dominios): la base no
  // se consulta en cada petición.
  const hostname = host.split(':')[0].toLowerCase();
  const root = rootDomain().split(':')[0].toLowerCase();
  if (hostname && hostname !== root && hostname !== `www.${root}` && !hostname.endsWith(`.${root}`) && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    const slug = await canalPorDominio(hostname);
    if (slug) {
      const url = req.nextUrl.clone();
      url.pathname = `/store/${slug}${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/|api/|shop-api|admin-api|dashboard|panel|canales|assets/|favicon.ico|sw\\.js|store/).*)'],
};
