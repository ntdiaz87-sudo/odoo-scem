import { NextRequest, NextResponse } from 'next/server';
import { tenantFromHost } from './lib/tenant';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const tenant = tenantFromHost(host);
  if (tenant) {
    const url = req.nextUrl.clone();
    url.pathname = `/store/${tenant}${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/|api/|shop-api|admin-api|dashboard|assets/|favicon.ico|sw\\.js|store/).*)'],
};
