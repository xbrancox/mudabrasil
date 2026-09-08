const CACHE='mb-app-v11';
self.addEventListener('install',function(e){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(u.pathname.indexOf('/api/')>=0)return;
  if(e.request.method!=='GET')return;
  if(u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,cp).catch(function(){})});return r}).catch(function(){return caches.match(e.request).then(function(h){return h||caches.match('./index.html')})}));
});
