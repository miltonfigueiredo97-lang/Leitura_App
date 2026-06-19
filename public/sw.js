// BookLegacy V3.7 service worker - network first, sem prender versão antiga
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil((async()=>{ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); await self.clients.claim(); })()); });
self.addEventListener('fetch', event => { event.respondWith(fetch(event.request).catch(()=>new Response('Offline', {status:503,statusText:'Offline'}))); });
