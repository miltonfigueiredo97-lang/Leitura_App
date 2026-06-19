// BookLegacy V12.6 cache breaker
const CACHE = 'booklegacy-v12-61-battle-visible';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, {cache:'no-store'}).catch(() => fetch(e.request)));
});
