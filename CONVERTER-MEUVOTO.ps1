#Requires -Version 5.1
# VotaBrasil -> MeuVoto : renomeacao integral, idempotente, valida antes do commit.
# NAO toca na URL -79eb (e o seu backend) nem no basename github.io/votabrasil (so o repo).
$ErrorActionPreference='Stop'
$repo='C:\Users\euler\votabrasil'
Set-Location $repo
function Say($m){ Write-Host $m }
if(-not (Test-Path (Join-Path $repo 'index.html'))){ Say 'ERRO: repo nao achado'; pause; exit 1 }
$EXT='meuvoto.app.br'   # alinhe aqui se registrar outra extensao (.com.br / .org.br)

# [0] runner no repo
$sd=Join-Path $repo 'scripts'; New-Item -ItemType Directory -Force -Path $sd | Out-Null
if($PSCommandPath){ Copy-Item $PSCommandPath (Join-Path $sd 'CONVERTER-MEUVOTO.ps1') -Force }
$bat="@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"%~dp0CONVERTER-MEUVOTO.ps1`"`r`npause"
[IO.File]::WriteAllText((Join-Path $sd 'RODAR-MEUVOTO.bat'),$bat,(New-Object System.Text.UTF8Encoding $false))

# [1] backup
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'; $bk=Join-Path $repo ("backup-meuvoto-"+$stamp)
New-Item -ItemType Directory -Force -Path $bk | Out-Null
foreach($f in @('index.html','config.js','config.local.js','CNAME','app\index.html','app\config.js','app\config.local.js','js\cache.js')){
  $p=Join-Path $repo $f; if(Test-Path $p){ $d=Join-Path $bk (Split-Path $f -Parent); New-Item -ItemType Directory -Force -Path $d | Out-Null; Copy-Item $p (Join-Path $bk $f) -Force } }
Say ('[1] backup: '+$bk)

# [2] config.js reescrito integral em MeuVoto (+ alias retro + override de URL + migracao de chaves)
$cfg=@'
/* ============================================================
   MeuVoto - Configuracao Global (autonomo)
   Backend atual: -79eb  [MIGRACAO-PENDENTE: api.meuvoto.app.br quando o
   dominio/custom domain existir; ou slug novo do servico no Railway]
   ============================================================ */
(function(){
  var override=null; try{ override=window.__MEUVOTO_ENV__&&window.__MEUVOTO_ENV__.API_BASE; }catch(e){}
  var stored=null;   try{ stored=localStorage.getItem('mv_api_base'); }catch(e){}
  var API_BASE=override||stored||'https://mudabrasil-production-79eb.up.railway.app'; /* MIGRACAO-PENDENTE */
  var MV=window.MeuVoto=window.MeuVoto||{};
  MV.API_BASE=API_BASE;
  MV.MODO=API_BASE?'producao':'offline';
  MV.URLS={camara:'https://dadosabertos.camara.leg.br/api/v2',senado:'https://legis.senado.leg.br/dadosabertos',tse:'https://divulgacandcontas.tse.jus.br/divulga/app/',transparencia:'https://www.portaltransparencia.gov.br/',cnj:'https://www.cnj.jus.br/'};
  MV.CONTATO={ /* MIGRACAO-PENDENTE: confirmar apos MX do dominio testado */
    email_geral:'contato@'+('meuvoto.app.br'),
    email_anuncie:'anuncie@'+('meuvoto.app.br'),
    email_imprensa:'imprensa@'+('meuvoto.app.br')};
  MV.REGRA_REVOGACAO={percentual_cassacao:0.70,abre_apos_posse:true,descricao:'70% dos votos que elegeram o pol\u00EDtico = cassa\u00E7\u00E3o (validacao server-side)'};
  MV.TERMOMETRO={decaimento_cheio_dias:90,decaimento_piso_dias:180,piso_confianca:0.5};
  MV.MARCA={nome:'MeuVoto',eslogan:'Meu voto coloca, meu voto tira.',logo:'assets/logo-meuvoto.svg'};
  window.VotaBrasil=MV;  /* ALIAS-RETRO: codigo antigo que chama window.VotaBrasil continua vivo */
  try{ Object.keys(localStorage).forEach(function(k){ var n=null;
    if(k.indexOf('mudabrasil')===0) n=k.replace(/^mudabrasil/,'meuvoto');
    else if(k.indexOf('votabrasil')===0) n=k.replace(/^votabrasil/,'meuvoto');
    if(n && localStorage.getItem(n)===null) localStorage.setItem(n,localStorage.getItem(k)); }); }catch(e){}
  console.log('%c\ud83d\udfe2 MeuVoto','font-size:16px;font-weight:bold;color:#2ECC71');
  console.log('%cModo: '+MV.MODO,'color:#94A3B8');
  console.log('%cBackend: '+API_BASE,'color:#2ECC71');
})();
'@
[IO.File]::WriteAllText((Join-Path $repo 'config.js'),$cfg,(New-Object System.Text.UTF8Encoding $false))
Say '[2] config.js -> MeuVoto (com alias window.VotaBrasil)'

# [3] renomeacao de marca em todo html/js (PULA config.js, que ja foi reescrito)
$files=Get-ChildItem -Path $repo -Include *.html,*.js -Recurse -File | Where-Object {
  $_.FullName -notmatch '\\backup-|\\scripts\\|\\node_modules|\\_tmp' -and $_.Name -ne 'config.js' }
$n=0
foreach($f in $files){
  $t=[IO.File]::ReadAllText($f.FullName); $o=$t
  $t=$t.Replace('VotaBrasil','MeuVoto').Replace('VOTABRASIL','MEUVOTO').Replace('votaBrasil','meuVoto')
  $t=$t.Replace('votabrasil.app.br',$EXT).Replace('votabrasil.app',$EXT)
  $t=$t.Replace('votabrasil_cache_','meuvoto_cache_')
  if($t -ne $o){ [IO.File]::WriteAllText($f.FullName,$t,(New-Object System.Text.UTF8Encoding $false)); $n++ } }
Say ('[3] marca migrada em '+$n+' arquivo(s)')

# [4] CNAME -> dominio MeuVoto
[IO.File]::WriteAllText((Join-Path $repo 'CNAME'),$EXT,(New-Object System.Text.UTF8Encoding $false))
Say ('[4] CNAME = '+$EXT)

# [5] copia a logo MeuVoto p/ assets (nao injeta no HTML ainda - ver nota)
$assets=Join-Path $repo 'assets'; New-Item -ItemType Directory -Force -Path $assets | Out-Null
$alvo=Join-Path $assets 'logo-meuvoto.svg'; $achou=$false
$procura=@('Logo_Projeto_Perfeita_SemHalo.svg','*MeuVoto*.svg','*meuvoto*.svg','*MeuVoto*.png','*meuvoto*.png')
$search=@("$env:USERPROFILE\Downloads","$env:USERPROFILE\Desktop","$env:USERPROFILE\Documents","C:\MeuVault\ObsidianCofre","$repo")
foreach($pat in $procura){ foreach($dir in $search){ if(-not $achou){
  $hit=Get-ChildItem -Path $dir -Filter $pat -Recurse -Depth 4 -File -ErrorAction SilentlyContinue | Select-Object -First 1
  if($hit){ Copy-Item $hit.FullName $alvo -Force; $achou=$true; Say ('[5] logo copiada: '+$hit.Name) } } } }
if(-not $achou){ Say '[5] AVISO: logo MeuVoto nao achada no disco - coloque o SVG em assets\logo-meuvoto.svg' }

# [6] VALIDACAO antes de commitar
$ix=[IO.File]::ReadAllText((Join-Path $repo 'index.html'))
$cf=[IO.File]::ReadAllText((Join-Path $repo 'config.js'))
$cn=[IO.File]::ReadAllText((Join-Path $repo 'CNAME'))
$ok = $cf.Contains('window.MeuVoto=window.MeuVoto') -and $cf.Contains('ALIAS-RETRO') -and $cf.Contains('MIGRACAO-PENDENTE')
$ok = $ok -and $ix.Contains('MeuVoto') -and (-not $ix.Contains('VotaBrasil'))
$ok = $ok -and $cn.Trim() -eq $EXT
if(-not $ok){
  Say 'VALIDACAO-FALHOU - nenhum commit sera feito'
  Say ('  config MeuVoto+alias : '+($cf.Contains('window.MeuVoto=window.MeuVoto') -and $cf.Contains('ALIAS-RETRO')))
  Say ('  index tem MeuVoto    : '+$ix.Contains('MeuVoto'))
  Say ('  index sem VotaBrasil : '+(-not $ix.Contains('VotaBrasil')))
  Say ('  CNAME correto        : '($cn.Trim() -eq $EXT))
  pause; exit 1 }
Say '[6] validacao OK'

# [7] commit + push
git add -A
$st=git status --porcelain
if($st){ git commit -m "feat(marca): VotaBrasil -> MeuVoto (namespace+alias retro, eslogan na MARCA, CNAME $EXT, e-mails meuvoto, cache+localStorage migrados)"; git push origin main; Say '[7] commit+push OK' }
else { Say '[7] nada a commitar' }

# [8] relatorio de acoplamento preservado de proposito
Say ''
Say '=========== PRESERVADO DE PROPOSITO (nao e bug) ==========='
Say '  - URL backend -79eb  : e o SEU backend; troca por api.meuvoto.app.br so com custom domain.'
Say '  - github.io/votabrasil : basename do REPO no GitHub; so muda se renomear o repo (infra).'
Say '  - e-mails @meuvoto.app.br : MARCADOS MIGRACAO-PENDENTE ate o MX do dominio ser testado.'
Say '  - logo copiada p/ assets, mas AINDA NAO injetada nos 3 pontos do HTML (ver nota abaixo).'
Say ''
pause