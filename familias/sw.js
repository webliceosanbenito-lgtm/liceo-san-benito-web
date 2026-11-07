/* LSB Familias: caché exclusivo de recursos públicos. Nunca guardar datos escolares, respuestas de Supabase ni autenticación. */
const CACHE = 'lsb-familias-static-v1';
const STATIC = ['./manifest.webmanifest','./offline.html','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
const PREFIX = 'lsb-familias-static-';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./offline.html')));
    return;
  }
  const filename = url.pathname.slice(scope.pathname.length);
  if (!STATIC.some(asset => asset.slice(2) === filename)) return;
  event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
});
