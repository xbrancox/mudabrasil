/* MeuVoto SW - shell offline + runtime cache + Web Push */
var SHELL = 'meuvoto-shell-v5';
var PRE = [
  './', './index.html', './config.local.js', 
  './js/cache.js', './js/offline.js', './js/push-notifications.js',
  './js/site-header.js', './js/shared-ui.js',
  './icon.svg', './logo.svg', './og-image.png',
  './offline.html',
  './pages/digest.html', './pages/digest-confirm.html', './pages/iniciativa-cidada.html',
  './css/main.css', './css/design-system.css'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(SHELL).then(function(c) {
      return Promise.allSettled(
        PRE.map(url => c.add(url).catch(err => console.warn('[SW] Falha ao cachear:', url, err)))
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(ks) {
      return Promise.all(ks.filter(function(k) {
        return k !== SHELL;
      }).map(function(k) {
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  
  // Estratégia Cache-First para a shell e páginas estáticas
  if (u.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(function(hit) {
        var net = fetch(e.request).then(function(r) {
          if (r && r.ok) {
            var c = r.clone();
            caches.open(SHELL).then(function(cc) {
              cc.put(e.request, c);
            });
          }
          return r;
        }).catch(function() {
          // Se for navegação e falhar, retorna página offline
          if (e.request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
          return hit || Response.error();
        });
        return hit || net;
      })
    );
    return;
  }
  
  // Estratégia Network-First com fallback para APIs externas
  if (/dadosabertos\.camara|legis\.senado|portaltransparencia|cnj\.jus|tse\.jus|api\.meu-voto\.app/.test(u.host)) {
    e.respondWith(
      fetch(e.request).then(function(r) {
        var c = r.clone();
        caches.open(SHELL).then(function(cc) {
          cc.put(e.request, c);
        });
        return r;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  }
});

// Web Push Notification Handler
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {};
  var title = data.title || 'MeuVoto · Resumo Semanal';
  var options = {
    body: data.body || 'O resumo semanal das votações está disponível.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {
      url: data.url || 'https://meu-voto.app/pages/digest.html'
    },
    actions: [
      { action: 'open', title: 'Abrir Resumo' },
      { action: 'close', title: 'Dispensar' }
    ]
  };
  
  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  
  if (e.action === 'close') {
    return;
  }
  
  var urlToOpen = e.notification.data.url || 'https://meu-voto.app/';
  
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
