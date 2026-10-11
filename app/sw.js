const CACHE = 'meuvoto-app-v3';
const ASSETS = [
  './',
  './index.html',
  '/manifest.json',
  './logo-hd.png',
  './icon.png'
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

// Fetch event
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networked = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || networked;
    })
  );
});

// ==========================================
// Push notifications (ciclo 33)
// ==========================================

// Handler de evento push: exibe notificação quando chega um push do servidor
self.addEventListener('push', e => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (err) {
    data = { title: e.data ? e.data.text() : 'MeuVoto' };
  }

  const title = data.title || 'MeuVoto · Atualização';
  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/icon.png',
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'meuvoto-notification',
    renotify: !!data.renotify,
    data: data.data || { url: '/' },
    actions: data.actions || []
  };

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique na notificação: abre a URL associada (se houver) e foca a janela
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Se já tem uma janela aberta com o site, foca nela
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Senão, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Renovação automática quando a assinatura push expira ou muda
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(
    Promise.all([
      fetch('/api/push/vapid-public').then(r => r.ok ? r.json() : null).catch(() => null),
      self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null // preenchido dinamicamente abaixo
      }).catch(() => null)
    ]).then(async ([vapid, sub]) => {
      if (!vapid || !vapid.publicKey) return;
      const newSub = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid.publicKey)
      });
      return fetch('/api/digest/subscribe-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub.toJSON())
      });
    })
  );
});

// Helper: converte VAPID publicKey base64url para Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = self.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
