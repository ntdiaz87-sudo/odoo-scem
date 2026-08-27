/** Utilidades de dominio raíz y subdominios de tiendas. */

export function rootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:8300';
}

/** Devuelve el subdominio de tienda si el host es sub.<dominio-raíz>, o null. */
export function tenantFromHost(host: string): string | null {
  const hostname = host.split(':')[0].toLowerCase();
  const rootname = rootDomain().split(':')[0].toLowerCase();
  if (hostname === rootname || hostname === `www.${rootname}`) return null;
  if (hostname.endsWith(`.${rootname}`)) {
    const sub = hostname.slice(0, -(rootname.length + 1));
    if (sub && sub !== 'www' && !sub.includes('.')) return sub;
  }
  return null;
}

export function storeUrl(slug: string, protocol: string): string {
  return `${protocol}//${slug}.${rootDomain()}`;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}
