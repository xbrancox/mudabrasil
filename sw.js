/* MeuVoto SW - shell offline + runtime cache */
var SHELL='vb-shell-v1';
var PRE=['./','./index.html','./config.js','./js/cache.js','./js/offline.js'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(SHELL).then(function(c){return c.addAll(PRE);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==SHELL;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);
  if(u.origin===location.origin){
    e.respondWith(caches.match(e.request).then(function(hit){
      var net=fetch(e.request).then(function(r){ if(r&&r.ok){var c=r.clone();caches.open(SHELL).then(function(cc){cc.put(e.request,c);});} return r; }).catch(function(){return hit||Response.error();});
      return hit||net;
    }));
    return;
  }
  if(/dadosabertos\.camara|legis\.senado|portaltransparencia|cnj\.jus|tse\.jus/.test(u.host)){
    e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(SHELL).then(function(cc){cc.put(e.request,c);});return r;}).catch(function(){return caches.match(e.request);}));
  }
});