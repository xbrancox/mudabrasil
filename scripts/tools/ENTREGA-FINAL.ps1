cd C:\Users\euler\MudaBrasil
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
# 1) logo oficial
$src='C:\Users\euler\OneDrive\Documentos\MudaBrasil Todos Arquivos e Docs\Logo\votabrasil-logo.svg'
if(Test-Path $src){Copy-Item $src app\logo.svg -Force;Write-Host 'logo oficial copiada' -ForegroundColor Green}
else{@'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#061a3a"/><rect x="56" y="56" width="396" height="396" rx="90" fill="#2ECC71"/><text x="256" y="330" font-family="Arial Black,Arial" font-size="180" font-weight="900" fill="#061a3a" text-anchor="middle">VB</text></svg>
'@|Set-Content app\logo.svg -Encoding UTF8;Write-Host 'logo fallback criada' -ForegroundColor Yellow}
$j=Get-Content app\app.js -Raw
# 2) Inicio = layout do print (substitui a funcao inteira)
$novo=@'
function telaInicio(){
  var d1=new Date(2026,9,4,8),d2=new Date(2026,9,25,8),ag=new Date();
  function dd(a){var x=Math.ceil((a-ag)/864e5);return x>=0?x:0}
  return '<section class="hero"><h1>O PODER EMANA DO POVO<br>NÃO ACABA NO DIA DA ELEIÇÃO.</h1><h2>Seu voto coloca. Seu voto tira.</h2><p>Eleição pelo celular com comprovante verificável.<br>Protótipo de viabilidade, sem valor jurídico.</p></section>'+
  '<h3 class="sect">PÁGINAS DO APP</h3>'+
  '<div class="grid2">'+
  '<div class="card c-row"><span class="c-ico">🗳️</span><div class="c-body"><b>VOTAÇÃO</b><small>Teclado estilo urna, 5 cargos</small><button class="btn-gold" data-go="votar">VOTAR AGORA</button></div></div>'+
  '<div class="card c-row"><span class="c-ico">📊</span><div class="c-body"><b>RESULTADOS</b><small>Apuração ao vivo em donuts</small><button class="btn-gold" data-go="apuracoes">VER AGORA</button></div></div>'+
  '<div class="card c-row"><span class="c-ico">👤</span><div class="c-body"><b>RADAR POLÍTICO</b><small>Quem é, reclamar e apoiar</small><button class="btn-gold" data-go="radar">ABRIR RADAR</button></div></div>'+
  '<div class="card c-row"><span class="c-ico">🔍</span><div class="c-body"><b>CONFERIR VOTO</b><small>Seu código de 20 dígitos no site</small><button class="btn-gold" data-go="conferir">CONFERIR</button></div></div>'+
  '</div>'+
  '<div class="chips"><span>🔒 100% anônimo</span><span>🔗 trilha de hash</span><span>🇧🇷 fontes oficiais</span><span>⚖️ regra dos 70%</span></div>'+
  '<div class="card diad"><b>🗓️ DIA D</b><div class="grid2" id="diad-dados"><div class="tile"><b>'+dd(d1)+'</b><span>dias pro 1º turno (04/10)</span></div><div class="tile"><b>'+dd(d2)+'</b><span>dias pro 2º turno (25/10)</span></div></div><small data-tip="Datas fixas da Constituição (art. 77): 1º e 2º domingos de outubro">ℹ️ datas constitucionais</small></div>';
}
'@
$s=$j.IndexOf('function telaInicio(){')
$e=$j.IndexOf('function progHTML',$s)
if($s -ge 0 -and $e -gt $s){$j=$j.Remove($s,$e-$s).Insert($s,$novo);Write-Host 'inicio reescrito' -ForegroundColor Green}else{Write-Host 'ERRO: ancora telaInicio nao achou' -ForegroundColor Red}
# 3) glossario so na aba votar
if(-not $j.Contains('glossarioVotacao')){
$g=@'
function glossarioVotacao(){return '<div class="card gloss"><b>📖 GLOSSÁRIO ELEITORAL</b><div class="chips"><span data-tip="Você vota, mas não escolhe ninguém: registra indiferença. Conta no total, não elege ninguém.">VOTO EM BRANCO</span><span data-tip="Voto de protesto: você anula de propósito. Não elege ninguém e não cancela os outros cargos.">VOTO NULO</span><span data-tip="Perda do mandato. No VotaBrasil: se 70% de quem elegeu revoga, o mandato cai.">CASSAÇÃO</span><span data-tip="Cerimônia que inicia o mandato. A revogação só abre depois dela.">POSSE</span><span data-tip="70% dos votos que elegeram = cassação. É o poder contínuo do povo.">REGRA DOS 70%</span></div></div>'}
'@
$k=$j.IndexOf('function telaVotar(){');if($k -ge 0){$j=$j.Insert($k,$g+"`r`n")}
$j=$j.Replace('m.innerHTML=h+navHTML();','if(scr==''votar''&&VOTA.passo>=1&&VOTA.passo<=5){h+=glossarioVotacao()}'+"`r`n"+'  m.innerHTML=h+navHTML();')
Write-Host 'glossario movido pra votacao' -ForegroundColor Green}
# 4) header com logo + VotaBrasil
$j=$j.Replace('<b>''+esc(t)+''</b>','<img class="logo" src="logo.svg" alt=""><b>''+esc(t===''MudaBrasil''?''VotaBrasil'':t)+''</b>')
Set-Content app\app.js $j -Encoding UTF8
# 5) css override (visual do print)
$c=Get-Content app\app.css -Raw
if(-not $c.Contains('VB-OVERRIDE')){Add-Content app\app.css @"

/* VB-OVERRIDE */
header .logo{width:32px;height:32px;border-radius:8px;flex:none}
.card.c-row{display:flex;gap:10px;align-items:flex-start}
.card.c-row .c-ico{font-size:22px;line-height:1.1}
.card.c-row .c-body{flex:1}
.card.c-row .btn-gold{margin-top:8px}
nav.bot button.on{border:1.5px solid var(--gold);border-radius:12px}
.hero h1{font-size:26px}
"@ -Encoding UTF8;Write-Host 'css override' -ForegroundColor Green}
# 6) cache v15
@'
const CACHE='vb-app-v15';
self.addEventListener('install',function(e){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var u=new URL(e.request.url);if(u.pathname.indexOf('/api/')>=0)return;if(e.request.method!=='GET')return;if(u.origin!==location.origin)return;e.respondWith(fetch(e.request).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,cp).catch(function(){})});return r}).catch(function(){return caches.match(e.request).then(function(h){return h||caches.match('./index.html')})}))});
'@|Set-Content app\sw.js -Encoding UTF8
$ix=Get-Content app\index.html -Raw;$ix=$ix -replace 'v=1[0-9]','v=15';$ix=$ix -replace '<title>.*</title>','<title>VotaBrasil · Urna Digital</title>';Set-Content app\index.html $ix -Encoding UTF8
git add app/|Out-Null;git commit -m "feat: layout final do print + glossario na votacao + logo VotaBrasil"|Out-Null;git push origin master|Out-Null
Write-Host 'PUSH OK' -ForegroundColor Green
$ok=$false
for($t=1;$t -le 3;$t++){Start-Sleep 50;try{$js=(Invoke-WebRequest 'https://raw.githubusercontent.com/xbrancox/mudabrasil/master/app/app.js' -UseBasicParsing).Content;$cs=(Invoke-WebRequest 'https://raw.githubusercontent.com/xbrancox/mudabrasil/master/app/app.css' -UseBasicParsing).Content;$sw=(Invoke-WebRequest 'https://raw.githubusercontent.com/xbrancox/mudabrasil/master/app/sw.js' -UseBasicParsing).Content;if($js.Contains('PÁGINAS DO APP') -and $js.Contains('c-row') -and $js.Contains('glossarioVotacao') -and $js.Contains('logo.svg') -and $cs.Contains('VB-OVERRIDE') -and $sw.Contains('vb-app-v15')){Write-Host "TENTATIVA $t : LAYOUT NO AR ✅" -ForegroundColor Green;$ok=$true;break}else{Write-Host "TENTATIVA $t : cache do GitHub, espero…" -ForegroundColor Yellow}}catch{Write-Host "TENTATIVA $t : rede oscilou" -ForegroundColor Yellow}}
if($ok){Write-Host 'FECHADO: abra o app 2x no celular.' -ForegroundColor Cyan}else{Write-Host 'AINDA NÃO: me manda este print.' -ForegroundColor Red}
Read-Host "Enter"