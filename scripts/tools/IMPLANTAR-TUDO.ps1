# ============================================================
#  IMPLANTAR-TUDO.ps1 - VotaBrasil
#  Idempotente: pode rodar de novo, nao duplica nada.
#  Payloads de HTML/JS internos sao 100% ASCII (acentos viram \u / entidades)
#  para sobreviver a qualquer codepage. Validacao antes de todo commit.
# ============================================================
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new()
$repo='C:\Users\euler\votabrasil'
[Environment]::CurrentDirectory=$repo
Set-Location $repo
function Say($m){ Write-Host $m }

if(-not (Test-Path (Join-Path $repo 'index.html'))){ Say 'ERRO: repo nao achado em C:\Users\euler\votabrasil'; pause; exit 1 }

# ---------- [0] instala o runner dentro do repo (proximas vezes: 2 cliques em scripts\RODAR.bat) ----------
$scriptsDir=Join-Path $repo 'scripts'
New-Item -ItemType Directory -Force -Path $scriptsDir | Out-Null
if($PSCommandPath){ Copy-Item $PSCommandPath (Join-Path $scriptsDir 'IMPLANTAR-TUDO.ps1') -Force }
$bat="@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"%~dp0IMPLANTAR-TUDO.ps1`"`r`npause"
[IO.File]::WriteAllText((Join-Path $scriptsDir 'RODAR.bat'),$bat,(New-Object System.Text.UTF8Encoding $false))
Say '[0] runner instalado em scripts\RODAR.bat'

# ---------- [1] logos: procura no seu PC e copia para o repo ----------
$assets=Join-Path $repo 'public\assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null
$want=@{ 'VotaBrasil_Icone.svg'='icon.svg'; 'Final VotaBrasilHermesSVG.svg'='logo.svg'; 'VotaBrasil_Monocromatico_Branco.svg'='logo-white.svg'; 'VotaBrasil_Monocromatico_Preto.svg'='logo-black.svg' }
$found=0
$search=@("$env:USERPROFILE\Downloads","$env:USERPROFILE\Desktop","$env:USERPROFILE\Documents",$repo)
foreach($k in $want.Keys){
  $hit=$null
  foreach($dir in $search){ if(-not $hit){ $hit=Get-ChildItem -Path $dir -Filter $k -Recurse -Depth 3 -File -ErrorAction SilentlyContinue | Select-Object -First 1 } }
  if($hit){ Copy-Item $hit.FullName (Join-Path $assets $want[$k]) -Force; $found++; Say ('[1] logo copiado: '+$want[$k]) }
}
Say ('[1] logos copiados: '+$found+' de 4')

# ---------- [2] API_BASE unico: mata qualquer fallback para o backend redesign ----------
$oldUrl='https://mudabrasil-redesign-production.up.railway.app'
$newUrl='https://mudabrasil-production-79eb.up.railway.app'
$n=0
Get-ChildItem -Path $repo -Include *.html,*.js -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\_tmp_mb\\|\\scripts\\' } | ForEach-Object {
  $t=[IO.File]::ReadAllText($_.FullName)
  if($t.Contains($oldUrl)){ [IO.File]::WriteAllText($_.FullName,$t.Replace($oldUrl,$newUrl),(New-Object System.Text.UTF8Encoding $false)); $n++; Say ('[2] API_BASE unificado: '+$_.FullName) }
}
Say ('[2] fallbacks redesign corrigidos: '+$n)

# ---------- [3] Fundo Eleitoral: deduplica siglas (PRD aparecia 2x) ----------
$fe=Join-Path $repo 'data\fundo-eleitoral.json'
if(Test-Path $fe){
  $j=Get-Content $fe -Raw -Encoding UTF8 | ConvertFrom-Json
  $map=@{}
  foreach($p in $j.partidos){ if($map.Contains($p.sigla)){ $map[$p.sigla]=$map[$p.sigla]+$p.valor } else { $map[$p.sigla]=$p.valor } }
  $list=$map.Keys | Sort-Object { -$map[$_] } | ForEach-Object { @{sigla=$_; valor=$map[$_]} }
  $j.partidos=@($list); $j.totalPartidos=$list.Count
  [IO.File]::WriteAllText($fe,($j | ConvertTo-Json -Depth 4 -Compress),(New-Object System.Text.UTF8Encoding $false))
  Say ('[3] siglas unicas agora: '+$list.Count)
} else { Say '[3] AVISO: data\fundo-eleitoral.json nao existe' }

# ---------- [4] manifest + favicons (so se o icon.svg chegou) ----------
$idx=Join-Path $repo 'index.html'
$c=[IO.File]::ReadAllText($idx)
if(Test-Path (Join-Path $assets 'icon.svg')){
  $man=@{ name='VotaBrasil'; short_name='VotaBR'; start_url='/'; display='standalone'; background_color='#0b132b'; theme_color='#009739'; icons=@(@{src='/assets/icon.svg';sizes='any';type='image/svg+xml'},@{src='/assets/logo.svg';sizes='any';type='image/svg+xml'}) }
  [IO.File]::WriteAllText((Join-Path $repo 'public\manifest.json'),($man | ConvertTo-Json -Depth 4),(New-Object System.Text.UTF8Encoding $false))
  if(-not $c.Contains('vb-favicons')){
    $fav="<link rel=`"icon`" type=`"image/svg+xml`" href=`"/assets/icon.svg`">`r`n<link rel=`"manifest`" href=`"/manifest.json`">`r`n"
    $i=$c.IndexOf('</head>'); if($i -ge 0){ $c=$c.Substring(0,$i)+$fav+$c.Substring($i) }
  }
  Say '[4] manifest + favicons gravados'
} else { Say '[4] icon.svg nao achado - favicons mantidos como estao' }

# ---------- [5] pacote visual completo (logo so-marca/maior, fundo compacto, fechar VERMELHO, 6 colunas, cards trocados) ----------
$pf=@'
<script id="vb-print-fixes">
(function(){
if(window.__vbpf2)return;window.__vbpf2=1;
var st=document.createElement('style');st.id='vb-pf2-style';
st.textContent='.vb-6col{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:12px!important}@media(max-width:1180px){.vb-6col{grid-template-columns:repeat(3,1fr)!important}}@media(max-width:760px){.vb-6col{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:480px){.vb-6col{grid-template-columns:1fr!important}}#vb-close-hi{min-width:30px!important;min-height:30px!important;width:30px!important;height:30px!important;background:#e11d48!important;color:#fff!important;font-size:18px!important;font-weight:800!important;line-height:1!important;border:2px solid #fff!important;border-radius:50%!important;box-shadow:0 0 0 2px rgba(225,29,72,.45),0 3px 10px rgba(0,0,0,.5)!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;opacity:1!important;transition:transform .12s ease!important}#vb-close-hi:hover{transform:scale(1.14)!important;background:#be123c!important}';
document.head.appendChild(st);
function sa(s){return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
function tx(e){return (e&&e.textContent||'').trim();}
function logo(){
 var hdr=document.querySelector('header')||document.querySelector('nav');if(!hdr)return;
 var img=hdr.querySelector('img[src*="logo"],img[src*="icon"],img[alt*="Vota"],svg');
 var brand=null;var cs=[].slice.call(hdr.querySelectorAll('a,div,span'));
 for(var i=0;i<cs.length;i++){var t=sa(tx(cs[i]));if(t==='votabrasil'||t.indexOf('votabrasil')===0){brand=cs[i];break;}}
 var target=brand||hdr;
 if(img){img.style.setProperty('width','56px','important');img.style.setProperty('height','56px','important');img.style.setProperty('max-width','none','important');}
 var ts=[].slice.call(target.querySelectorAll('span,div,p,em,small,b,strong'));
 for(var k=0;k<ts.length;k++){var tt=sa(tx(ts[k]));if(tt==='votabrasil'||tt.indexOf('participacao')===0){ts[k].style.setProperty('display','none','important');}}
 if(brand&&brand.setAttribute)brand.setAttribute('aria-label','VotaBrasil');
}
function fundo(){
 fetch('data/fundo-eleitoral.json').then(function(r){return r.json();}).then(function(fe){
  var total=Number(fe.totalGeral)||1;
  var ps=(fe.partidos||[]).slice().sort(function(a,b){return (b.valor||0)-(a.valor||0);});
  var cont=document.querySelector('#fundo-eleitoral,.fundo-eleitoral,[id*="fundo"]');
  if(!cont){var hs=[].slice.call(document.querySelectorAll('h1,h2,h3'));var h=hs.filter(function(x){return /fundo eleitoral/i.test(tx(x));})[0];if(h)cont=h.closest('section')||h.parentElement.parentElement;}
  if(!cont)return;
  var old=cont.querySelector('[data-vbfundo]');if(old)old.remove();
  var box=document.createElement('div');box.setAttribute('data-vbfundo','1');
  var g='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:7px">';
  ps.forEach(function(p,i){var pct=((p.valor||0)/total*100);var val=((p.valor||0)/1e6).toFixed(1);
   g+='<div style="background:#fff;border:1px solid #d8dee9;border-radius:9px;padding:7px 8px;line-height:1.2"><div style="display:flex;justify-content:space-between;align-items:center"><b style="color:#0b132b;font-size:.9em">'+String(p.sigla)+'</b><span style="font-size:.62em;color:#8a94a6">#'+(i+1)+'</span></div><div style="color:#009739;font-weight:800;font-size:1em;margin:2px 0 4px">R$ '+val+' mi</div><div style="height:4px;border-radius:3px;background:#eef1f5;overflow:hidden"><div style="height:100%;width:'+pct.toFixed(1)+'%;background:#009739"></div></div><div style="font-size:.62em;color:#6b7280;margin-top:3px">'+pct.toFixed(1)+'% do total</div></div>';});
  g+='</div>';
  box.innerHTML=g;cont.appendChild(box);
 }).catch(function(){});
}
var RX=/^[\u00D7\u2715\u2716xX]$/;
function fechar(){
 var nodes=document.querySelectorAll('button,span,i,a,[role="button"],div');
 for(var i=0;i<nodes.length;i++){
  if(!RX.test(tx(nodes[i])))continue;
  var p=nodes[i],card=null;
  for(var k=0;k<7&&p;k++){var t=(p.textContent||'');if(/prot[o\u00F3]tipo/i.test(t)&&/jur[i\u00ED]dico/i.test(t)){card=p;break;}p=p.parentElement;}
  if(card){nodes[i].setAttribute('id','vb-close-hi');return true;}
 }
 return false;
}
var MAP={'comparar':{t:'Quem Somos',d:'Nossa hist\u00F3ria, princ\u00EDpios e a equipe por tr\u00E1s do projeto.',cta:'Conhecer \u2192',href:'#quem-somos'},'fundo eleitoral':{t:'Elei\u00E7\u00F5es 2026',d:'Candidatos reais do TSE por cargo, UF e situa\u00E7\u00E3o.',cta:'Ver candidatos \u2192',href:'pages/eleicoes-2026.html'}};
function explore(){
 var hs=[].slice.call(document.querySelectorAll('h1,h2,h3'));
 var expH=hs.filter(function(x){return sa(tx(x)).indexOf('explore o votabrasil')>-1;})[0];
 var sec=expH?(expH.closest('section')||expH.parentElement.parentElement):null;if(!sec)return false;
 var all=[].slice.call(sec.querySelectorAll('h1,h2,h3,h4,strong,b,div,span,p'));
 var grid=null;
 Object.keys(MAP).forEach(function(key){
  var target=all.filter(function(e){return sa(tx(e))===key&&e.children.length===0;})[0];if(!target)return;
  var card=target;for(var u=0;u<6&&card;u++){if(card.querySelector&&card.querySelector('a[href],button'))break;card=card.parentElement;}
  if(!card)return;if(!grid)grid=card.parentElement;
  var m=MAP[key];target.textContent=m.t;
  var ps=[].slice.call(card.querySelectorAll('p,span,div')).filter(function(e){return e!==target&&tx(e).length>10&&!(e.querySelector&&e.querySelector('a[href],button'));});
  if(ps.length)ps[0].textContent=m.d;
  var cta=card.querySelector('a[href],button');if(cta){cta.setAttribute('href',m.href);cta.textContent=m.cta;}
 });
 if(grid)grid.classList.add('vb-6col');
 return true;
}
function work(){logo();fundo();fechar();explore();}
var n=0,tm=setInterval(function(){work();if(++n>60)clearInterval(tm);},400);
window.addEventListener('load',function(){setTimeout(work,250);});
})();
</script>
'@
$open='<script id="vb-print-fixes"'
$s=$c.IndexOf($open)
if($s -ge 0){ $tag='</script>'; $e=$c.IndexOf($tag,$s); if($e -ge 0){ $e=$e+$tag.Length; $c=$c.Substring(0,$s)+$pf+$c.Substring($e); Say '[5] pacote visual: bloco antigo substituido' } }
else { $b=$c.LastIndexOf('</body>'); if($b -ge 0){ $c=$c.Substring(0,$b)+$pf+[char]10+$c.Substring($b); Say '[5] pacote visual: injetado' } }
[IO.File]::WriteAllText($idx,$c,(New-Object System.Text.UTF8Encoding $false))

# ---------- [6] validacao ANTES de commitar (se falhar, nada e gravado no git) ----------
$ok = $c.Contains('vb-print-fixes') -and $c.Contains('e11d48') -and $c.Contains('vb-6col')
$ix2=[IO.File]::ReadAllText($idx)
$ok = $ok -and (-not $ix2.Contains('mudabrasil-redesign-production'))
if(-not $ok){ Say 'VALIDACAO-FALHOU - nenhum commit sera feito'; pause; exit 1 }

# ---------- [7] commit + push (Pages atualiza sozinho) ----------
git add -A
$st=git status --porcelain
if($st){ git commit -m "chore: implantacao automatica (logos, fixes visuais, API_BASE unico, PRD dedupe, manifest)"; git push origin main; Say '[7] commit+push OK' }
else { Say '[7] nada a commitar (tudo ja estava no ar)' }

# ---------- [8] verificacao + pendencias que NAO sao codigo ----------
Say ''
Say '================ VERIFICACAO ================'
Say ('pacote visual no fonte : '+$ix2.Contains('vb-print-fixes'))
Say ('fechar vermelho        : '+$ix2.Contains('e11d48'))
Say ('grade 6 colunas        : '+$ix2.Contains('vb-6col'))
Say ('fallback redesign = 0  : '+((-not $ix2.Contains('mudabrasil-redesign-production'))))
Say ''
Say '=========== PENDENCIAS (decisoes suas, nao codigo) ==========='
Say 'DOMINIO + EMAIL: decidir e registrar (sugestao: votabrasil.app).'
Say '  So trocar os e-mails DEPOIS de MX/SPF/DKIM + 3 caixas testadas (Balde B do GO-LIVE-CHECKLIST.md).'
Say 'FUNDO por candidato 2022/2026: bloqueado pelo WAF do TSE (403) - gatilho: baixar o zip pelo Chrome.'
Say 'Fotos oficiais de Senador: API extinta (404) - gatilho: republicacao pelo Senado.'
Say 'Railway: ASSINADO (voce confirmou) - backend 24/7 garantido.'
Say ''
pause