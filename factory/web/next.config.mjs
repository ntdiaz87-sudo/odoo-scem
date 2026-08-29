/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // El navegador habla con estas rutas en el dominio de la fábrica o de la
    // tienda; Next las reenvía al Vendure interno (en Docker,
    // VENDURE_API_URL=http://vendure:3000 queda fijado en build — ver
    // web/Dockerfile). En el servidor, Caddy ya enruta estas mismas rutas a
    // Vendure antes de llegar aquí: esto las hace funcionar IGUAL sin Caddy
    // (local, pruebas) y evita que el panel del dueño quede en 404 si el
    // bloque de Caddy no está.
    const vendure = process.env.VENDURE_API_URL || 'http://localhost:3000';
    return [
      { source: '/shop-api', destination: `${vendure}/shop-api` },
      // Panel de administración de Vendure (el enlace que recibe el dueño).
      { source: '/dashboard', destination: `${vendure}/dashboard` },
      { source: '/dashboard/:path*', destination: `${vendure}/dashboard/:path*` },
      // El panel llama al admin-api de su mismo origen.
      { source: '/admin-api', destination: `${vendure}/admin-api` },
      // Imágenes de productos servidas por Vendure.
      { source: '/assets/:path*', destination: `${vendure}/assets/:path*` },
    ];
  },
};

export default nextConfig;
