/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // El navegador habla con /shop-api en el dominio de la tienda; Next lo
    // reenvía al Vendure interno (en Docker, VENDURE_API_URL=http://vendure:3000
    // queda fijado en build — ver web/Dockerfile).
    const vendure = process.env.VENDURE_API_URL || 'http://localhost:3000';
    return [{ source: '/shop-api', destination: `${vendure}/shop-api` }];
  },
};

export default nextConfig;
