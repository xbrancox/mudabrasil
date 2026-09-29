#Requires -Version 5.1
# VotaBrasil - autonomia total: namespace, marcas, offline-first, validacao, commit, push.
# Idempotente. Payloads 100% ASCII. Nao toca no backend -79eb (ele E o seu backend).
$ErrorActionPreference='Stop'
$repo='C:\Users\euler\votabrasil'
Set-Location $repo
function Say($m){ Write-Host $m }
if(-not (Test-Path (Join-Path $repo 'index.html'))){ Say 'ERRO: repo nao achado'; pause; exit 1 }

# [0] runner dentro do repo
$sd=Join-Path $repo 'scripts'; New-Item -ItemType Directory -Force -Path $sd | Out-Null
if($PSCommandPath){ Copy-Item $PSCommandPath (Join-Path $sd 'IMPLANTAR-AUTONOMIA.ps1') -Force }
$bat="@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"%~dp0IMPLANTAR-AUTONOMIA.ps1`"`r`npause"
[IO.File]::WriteAllText((Join-Path $sd 'RODAR-AUTONOMIA.bat'),$bat,(New-Object System.Text.UTF8Encoding $false))
Say '[0] runner ok (scripts\RODAR-AUTONOMIA.bat)'

# [1] backup
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'; $bk=Join-Path $repo ("backup-autonomia-"+$stamp)
New-Item -ItemType Directory -Force -Path $bk | Out-Null
foreach($f in @('index.html','config.js','config.local.js','app\index.html','app\config.js','app\config.local.js','js\cache.js')){
  $p=Join-Path $repo $f
  if(Test-Path $p){ $d=Join-Path $bk (Split-Path $f -Parent); New-Item -ItemType Directory -Force -Path $d | Out-Null; Copy-Item $p (Join-Path $bk $f) -Force }
}
Say ('[1] backup: '+$bk)

# [2] config.js novo: namespace VotaBrasil + alias retro + override de URL + migracao de chaves
$cfg=@'
/* ============================================================
   VotaBrasil - Configuracao Global (autonomo)
   Backend atual: -79eb  [MIGRACAO-PENDENTE: trocar por api.votabrasil.app
   assim que o dominio for registrado, OU pelo slug novo do servico]
   ============================================================ */
(function(){
  var override=null; try{ override=window.__VOTABRASIL_ENV__&&window.__VOTABRASIL_ENV__.API_BASE; }catch(e){}
  var stored=null;   try{ stored=localStorage.getItem('vb_api_base'); }catch(e){}
  var API_BASE=override||stored||'https://mudabrasil-production-79eb.up.railway.app'; /* MIGRACAO-PENDENTE */
  var VB=window.VotaBrasil=window.VotaBrasil||{};
  VB.API_BASE=API_BASE;
  VB.MODO=API_BASE?'producao':'offline';
  VB.URLS={camara:'https://dadosabertos.camara.leg.br/api/v2',senado:'https://legis.senado.leg.br/dadosabertos',tse:'https://divulgacandcontas.tse.jus.br/divulga/app/',transparencia:'https://www.portaltransparencia.gov.br/',cnj:'https://www.cnj.jus.br/'};
  VB.CONTATO={ /* MIGRACAO-PENDENTE: trocar apos MX do dominio proprio testado */
    email_geral:'contato@mudabrasil.app',
    email_anuncie:'anuncie@mudabrasil.app',
    email_imprensa:'imprensa@mudabrasil.app'};
  VB.REGRA_REVOGACAO={percentual_cassacao:0.70,abre_apos_posse:true,descricao:'70% dos votos que elegeram o pol\u00EDtico = cassa\u00E7\u00E3o (validacao server-side)'};
  VB.TERMOMETRO={decaimento_cheio_dias:90,decaimento_piso_dias:180,piso_confianca:0.5};
  window.MudaBrasil=VB; /* ALIAS-RETRO: codigo antigo continua funcionando */
  try{ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('mudabrasil')===0){ var n=k.replace(/^mudabrasil/,'votabrasil'); if(localStorage.getItem(n)===null)localStorage.setItem(n,localStorage.getItem(k)); } }); }catch(e){}
  console.log('%c\ud83d\udfe2 VotaBrasil','font-size:16px;font-weight:bold;color:#2ECC71');
  console.log('%cModo: '+VB.MODO,'color:#94A3B8');
  console.log('%cBackend: '+API_BASE,'color:#2ECC71');
})();
'@
[IO.File]::WriteAllText((Join-Path $repo 'config.js'),$cfg,(New-Object System.Text.UTF8Encoding $false))
Say '[2] config.js reescrito (VotaBrasil + alias + override vb_api_base)'

# [3] marcas nos .html (NAO toca na URL -79eb: so tokens exatos e seguros)
$htmls=Get-ChildItem -Path $repo -Include *.html -Recurse -File | Where-Object { $_.FullName -notmatch '\\backup-|\\node_modules|\\_tmp|\\scripts\\' }
foreach($f in $htmls){
  $t=[IO.File]::ReadAllText($f.FullName); $o=$t
  $t=$t.Replace('MudaBrasil','VotaBrasil').Replace('MUDABRASIL','VOTABRASIL').Replace('mudaBrasil','VotaBrasil')
  $t=$t.Replace('mudabrasil.app','votabrasil.app')
  $t=$t.Replace('xbrancox.github.io/mudabrasil','xbrancox.github.io/votabrasil')
  if($t -ne $o){ [IO.File]::WriteAllText($f.FullName,$t,(New-Object System.Text.UTF8Encoding $false)); Say ('[3] marca migrada: '+$f.Name) }
}

# [4] mesmos tokens seguros nos configs do app (preserva -79eb)
foreach($f in @('app\config.js','app\config.local.js','config.local.js')){
  $p=Join-Path $repo $f
  if(Test-Path $p){ $t=[IO.File]::ReadAllText($p); $o=$t
    $t=$t.Replace('mudabrasil.app','votabrasil.app').Replace('xbrancox.github.io/mudabrasil','xbrancox.github.io/votabrasil').Replace('MudaBrasil','VotaBrasil')
    if($t -ne $o){ [IO.File]::WriteAllText($p,$t,(New-Object System.Text.UTF8Encoding $false)); Say ('[4] tokens migrados: '+$f) } }
}

# [5] prefixo de cache
$cp=Join-Path $repo 'js\cache.js'
if(Test-Path $cp){ $t=[IO.File]::ReadAllText($cp); if($t.Contains('mudabrasil_cache_')){ [IO.File]::WriteAllText($cp,$t.Replace('mudabrasil_cache_','votabrasil_cache_'),(New-Object System.Text.UTF8Encoding $false)); Say '[5] prefixo de cache migrado' } }

# [6] offline-first: service worker + fila outbox generica
$sw=@'
/* VotaBrasil SW - shell offline + runtime cache */
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
'@
[IO.File]::WriteAllText((Join-Path $repo 'sw.js'),$sw,(New-Object System.Text.UTF8Encoding $false))
$off=@'
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
'@
New-Item -ItemType Directory -Force -Path (Join-Path $repo 'js') | Out-Null
[IO.File]::WriteAllText((Join-Path $repo 'js\offline.js'),$off,(New-Object System.Text.UTF8Encoding $false))
Say '[6] sw.js + js/offline.js criados'

# [7] registrar SW + offline.js no index.html (idempotente)
$ix=Join-Path $repo 'index.html'; $c=[IO.File]::ReadAllText($ix)
if(-not $c.Contains('sw.js')){
  $tag="<script defer src=`"js/offline.js`"></script>`r`n<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}</script>`r`n"
  $b=$c.LastIndexOf('</body>')
  if($b -ge 0){ $c=$c.Substring(0,$b)+$tag+$c.Substring($b); [IO.File]::WriteAllText($ix,$c,(New-Object System.Text.UTF8Encoding $false)); Say '[7] SW + offline.js registrados no index.html' }
} else { Say '[7] SW ja registrado (idempotente)' }

# [8] VALIDACAO antes de commitar
$ix2=[IO.File]::ReadAllText($ix); $cf2=[IO.File]::ReadAllText((Join-Path $repo 'config.js')); $ap=Join-Path $repo 'app\index.html'; $ap2=if(Test-Path $ap){[IO.File]::ReadAllText($ap)}else{''}
$ok = $cf2.Contains('window.VotaBrasil=window.VotaBrasil') -and $cf2.Contains('ALIAS-RETRO') -and $cf2.Contains('MIGRACAO-PENDENTE')
$ok = $ok -and $ix2.Contains('sw.js') -and (Test-Path (Join-Path $repo 'js\offline.js'))
$ok = $ok -and (-not $ix2.Contains('MudaBrasil')) -and (-not $ix2.Contains('mudabrasil.app'))
$ok = $ok -and (($ap2 -eq '') -or $ap2.Contains('-79eb'))   # app nao pode ter perdido o backend
if(-not $ok){ Say 'VALIDACAO-FALHOU - nenhum commit sera feito'; Say ('  config VotaBrasil: '+$cf2.Contains('window.VotaBrasil=window.VotaBrasil')); Say ('  index sem MudaBrasil: '+(-not $ix2.Contains('MudaBrasil'))); Say ('  app com -79eb: '+(($ap2 -eq '') -or $ap2.Contains('-79eb'))); pause; exit 1 }
Say '[8] validacao OK'

# [9] commit + push
git add -A
$st=git status --porcelain
if($st){ git commit -m "feat(autonomia): namespace VotaBrasil + alias retro, marcas migradas, offline-first (sw+outbox), override de API_BASE"; git push origin main; Say '[9] commit+push OK' }
else { Say '[9] nada a commitar' }

# [10] relatorio de acoplamento restante
Say ''
Say '=========== ACOPLAMENTO RESTANTE (infra, so painel) ==========='
Get-ChildItem -Path $repo -Include *.js,*.html -Recurse -File | Where-Object { $_.FullName -notmatch '\\backup-|\\scripts\\|\\node_modules' } | Select-String -Pattern 'mudabrasil' -SimpleMatch | Group-Object Path | ForEach-Object { Say ('  '+$_.Name+' -> '+$_.Count+' linha(s) [MIGRACAO-PENDENTE]') }
Say '  Esperado: config.js (URL -79eb + 3 emails) e app/index.html (fallback -79eb).'
Say '  Some com elas assim que: (a) registrar dominio + custom domain no Railway, OU'
Say '  (b) criar servico novo com slug limpo (banco tem 0 votos hoje = perda zero).'
Say ''
pause