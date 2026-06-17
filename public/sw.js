const CACHE = 'booklegacy-v7-shell';
const ASSETS = ['/', '/manifest.json', '/icon-192.svg', '/icon-512.svg'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{}))); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(fetch(req).catch(() => caches.match(req).then(r => r || caches.match('/'))));
});
