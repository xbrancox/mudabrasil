/* VotaBrasil offline-first: outbox generico (monkey-patch de fetch) + banner de rede */
(function(){
  if(window.__vboff)return;window.__vboff=1;
  var KEY='votabrasil_outbox';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function save(q){try{localStorage.setItem(KEY,JSON.stringify(q))}catch(e){}}
  function banner(off){
    var b=document.getElementById('vb-net');
    if(off){ if(!b){ b=document.createElement('div');b.id='vb-net';b.textContent='Sem conexao - suas acoes ficam guardadas e sincronizam sozinhas.';b.style.cssText='position:fixed;top:0;left:0;right:0;background:#b45309;color:#fff;text-align:center;padding:6px 10px;font:600 13px/1.4 system-ui,sans-serif;z-index:9998';document.body.appendChild(b);} }
    else if(b){ b.remove(); }
  }
  function flush(){
    var q=load(); if(!q.length)return; var rest=[]; var chain=Promise.resolve();
    q.forEach(function(item){ chain=chain.then(function(){ return fetch(item.url,item.opts).then(function(r){ if(!r.ok)throw 0; }).catch(function(){ rest.push(item); }); }); });
    chain.then(function(){ save(rest); if(q.length&&rest.length===0)console.log('[offline] outbox sincronizado: '+q.length); });
  }
  var nat=window.fetch;
  window.fetch=function(url,opts){
    opts=opts||{};
    var isPost=String(opts.method||'GET').toUpperCase()==='POST';
    var base=(window.VotaBrasil&&window.VotaBrasil.API_BASE)||'';
    var target=String(url);
    var isApi=base&&target.indexOf(base)===0;
    function enfileira(){ var q=load(); q.push({url:target,opts:{method:opts.method,headers:opts.headers,body:opts.body}}); save(q);
      return new Response(JSON.stringify({ok:true,offline:true,fila:q.length}),{status:202,headers:{'Content-Type':'application/json'}}); }
    if(isPost&&isApi&&!navigator.onLine){ return Promise.resolve(enfileira()); }
    return nat.apply(window,arguments).catch(function(err){ if(isPost&&isApi){ return enfileira(); } throw err; });
  };
  window.addEventListener('offline',function(){banner(true);});
  window.addEventListener('online',function(){banner(false);flush();});
  if(!navigator.onLine)banner(true);
  window.addEventListener('load',function(){ if(navigator.onLine)flush(); });
})();