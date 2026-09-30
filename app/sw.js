const CACHE = 'votabrasil-v36';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './logo.svg'
];

// Install event with cache handling
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      return Promise.allSettled(
        ASSETS.map(url => c.add(url).catch(err => console.warn('[SW] Falha ao cachear asset:', url, err)))
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch event with fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(e.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(c => {
          if(new URL(e.request.url).protocol==="https:"){c.put(e.request, copy);}
        });
        return response;
      }).catch(() => {
        // Fallback for offline
        if (e.request.url.endsWith('.html')) {
          return caches.match('./index.html');
        }
        return new Response('Recurso não disponível offline', { 
          status: 404, 
          statusText: 'Not Found' 
        });
      });
    })
  );
});


// Push event (ciclo 33)
self.addEventListener('push', e => {
  let data = { title: 'MeuVoto', body: 'Atualização disponível' };
  try {
    if (e.data) {
      const parsed = e.data.json();
      data = Object.assign(data, parsed);
    }
  } catch(err) {
    if (e.data) data.body = e.data.text();
  }
  const options = {
    body: data.body,
    icon: data.icon || './icon.svg',
    badge: data.badge || './icon.svg',
    data: data.url || './pages/digest.html',
    vibrate: [100, 50, 100],
    actions: data.actions || [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Dispensar' }
    ]
  };
  e.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification && e.notification.data) || './pages/digest.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if (w.url === url && 'focus' in w) return w.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});

self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(
    fetch('/api/push/vapid-public').then(r=>r.json()).then(j=>{
      if (!j.publicKey) return;
      return self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8ArraySW(j.publicKey)
      }).then(sub => fetch('/api/digest/subscribe-push', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ subscription: sub.toJSON() })
      }));
    }).catch(()=>{})
  );
});
function urlBase64ToUint8ArraySW(base64String){
  const padding='='.repeat((4-base64String.length%4)%4);
  const b64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(b64); const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}
