/* Service worker mínimo de la fábrica: hace instalable cada tienda (PWA).
   Red primero; sin caché agresiva para no servir catálogos viejos. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<meta charset="utf-8"><title>Sin conexión</title><p style="font-family:system-ui;padding:40px;text-align:center">Sin conexión. Vuelve a intentarlo cuando tengas internet.</p>',
          { headers: { 'content-type': 'text/html; charset=utf-8' }, status: 503 },
        ),
    ),
  );
});
