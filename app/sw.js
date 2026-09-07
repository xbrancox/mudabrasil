const CACHE = 'mb-app-v2';
const SHELL = [
  './',
  './index.html',
  './app.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  '../config.js',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Montserrat:wght@700;800;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => { }));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(
      ks.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Sempre busca API ao vivo
  if (u.pathname.includes('/api/')) return;
  if (e.request.method !== 'GET') return;
  // Cache-first com atualização em segundo plano
  e.respondWith(
    caches.match(e.request).then(hit => {
      const fetchPromise = fetch(e.request).then(r => {
        if (r && r.status === 200) {
          const cp = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
        }
        return r;
      }).catch(() => hit);
      return hit || fetchPromise;
    })
  );
});
