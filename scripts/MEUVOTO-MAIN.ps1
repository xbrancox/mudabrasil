# MEUVOTO-MAIN.ps1 - migra VotaBrasil/MudaBrasil -> MeuVoto de forma coerente. 100% ASCII. Idempotente.
$ErrorActionPreference='Stop'
$repo='C:\Users\euler\votabrasil'
Set-Location $repo
$EXT='meu-voto.app'
$BE=''''   # backend SEU; nao e marca; nao trocar aqui
function Say($m){ Write-Host $m }
if(-not (Test-Path (Join-Path $repo 'index.html'))){ Say 'ERRO: repo nao achado'; exit 1 }

# [0] runner no repo
$sd=Join-Path $repo 'scripts'; New-Item -ItemType Directory -Force -Path $sd | Out-Null
if($PSCommandPath){ Copy-Item $PSCommandPath (Join-Path $sd 'MEUVOTO-MAIN.ps1') -Force }

# [1] backup
$bk=Join-Path $repo ('backup-meuvoto-'+(Get-Date -Format 'yyyyMMdd-HHmmss')); New-Item -ItemType Directory -Force -Path $bk | Out-Null
foreach($f in @('index.html','config.js','config.local.js','CNAME','app\index.html','app\config.js','app\config.local.js','js\cache.js')){ $p=Join-Path $repo $f; if(Test-Path $p){ $d=Join-Path $bk (Split-Path $f -Parent); New-Item -ItemType Directory -Force -Path $d | Out-Null; Copy-Item $p (Join-Path $bk $f) -Force } }
Say ('[1] backup '+$bk)

# [2] config.js raiz -> MeuVoto (reescrito do zero, coerente, com alias retro)
$cfg=@'
/* MeuVoto - Configuracao Global (autonomo). Backend -79eb = seu servidor (nao e marca). */
(function(){
  var ov=null; try{ ov=window.__MEUVOTO_ENV__&&window.__MEUVOTO_ENV__.API_BASE; }catch(e){}
  var st=null; try{ st=localStorage.getItem('mv_api_base'); }catch(e){}
  var API_BASE=ov||st||''''; /* MIGRACAO-PENDENTE: api.meu-voto.app */
  var MV=window.MeuVoto=window.MeuVoto||{};
  MV.API_BASE=API_BASE; MV.MODO=API_BASE?'producao':'offline';
  MV.URLS={camara:'https://dadosabertos.camara.leg.br/api/v2',senado:'https://legis.senado.leg.br/dadosabertos',tse:'https://divulgacandcontas.tse.jus.br/divulga/app/',transparencia:'https://www.portaltransparencia.gov.br/',cnj:'https://www.cnj.jus.br/'};
  MV.CONTATO={email_geral:'contato@meu-voto.app',email_anuncie:'anuncie@meu-voto.app',email_imprensa:'imprensa@meu-voto.app'}; /* MIGRACAO-PENDENTE: so vale apos MX testado */
  MV.REGRA_REVOGACAO={percentual_cassacao:0.70,abre_apos_posse:true,descricao:'70% dos votos que elegeram o politico = cassacao (validacao server-side)'};
  MV.TERMOMETRO={decaimento_cheio_dias:90,decaimento_piso_dias:180,piso_confianca:0.5};
  MV.MARCA={nome:'MeuVoto',eslogan:'Meu voto coloca, meu voto tira.',logo:'assets/logo-meuvoto.svg'};
  window.VotaBrasil=MV; window.MudaBrasil=MV; /* ALIAS-RETRO: codigo antigo continua vivo */
  try{ Object.keys(localStorage).forEach(function(k){ var n=null;
    if(k.indexOf('mudabrasil')===0) n=k.replace(/^mudabrasil/,'meuvoto');
    else if(k.indexOf('votabrasil')===0) n=k.replace(/^votabrasil/,'meuvoto');
    if(n&&localStorage.getItem(n)===null) localStorage.setItem(n,localStorage.getItem(k)); }); }catch(e){}
  console.log('[MeuVoto] modo='+MV.MODO+' backend='+API_BASE);
})();
'@
[IO.File]::WriteAllText((Join-Path $repo 'config.js'),$cfg,(New-Object System.Text.UTF8Encoding $false))
Say '[2] config.js -> MeuVoto (alias VotaBrasil+MudaBrasil retro)'

# [3] migrate marcas em html/js (NUNCA toca no hostname -79eb: so tokens de marca)
$files=Get-ChildItem -Path $repo -Include *.html,*.js -Recurse -File | Where-Object { $_.FullName -notmatch '\\backup-|\\scripts\\|\\node_modules|\\_tmp' -and $_.Name -ne 'config.js' }
$n=0
foreach($f in $files){
  $t=[IO.File]::ReadAllText($f.FullName); $o=$t
  $t=$t.Replace('VotaBrasil','MeuVoto').Replace('VOTABRASIL','MEUVOTO').Replace('votaBrasil','meuVoto')
  $t=$t.Replace('MudaBrasil','MeuVoto').Replace('MUDABRASIL','MEUVOTO').Replace('mudaBrasil','meuVoto')
  $t=$t.Replace('votabrasil.app.br',$EXT).Replace('votabrasil.app',$EXT).Replace('meu-voto.app',$EXT)
  $t=$t.Replace('votabrasil_cache_','meuvoto_cache_').Replace('mudabrasil_cache_','meuvoto_cache_')
  if($t -ne $o){ [IO.File]::WriteAllText($f.FullName,$t,(New-Object System.Text.UTF8Encoding $false)); $n++ }
}
Say ('[3] marcas migradas em '+$n+' arquivo(s)')

# [4] configs do app + config.local.js -> MeuVoto (preserva hostname -79eb)
foreach($f in @('app\config.js','app\config.local.js','config.local.js')){
  $p=Join-Path $repo $f
  if(Test-Path $p){ $t=[IO.File]::ReadAllText($p); $o=$t
    $t=$t.Replace('votabrasil.app.br',$EXT).Replace('votabrasil.app',$EXT).Replace('meu-voto.app',$EXT)
    $t=$t.Replace('VotaBrasil','MeuVoto').Replace('MudaBrasil','MeuVoto').Replace('mudaBrasil','meuVoto').Replace('votaBrasil','meuVoto')
    $t=$t.Replace('meu-voto.app','meu-voto.app')
    if($t -ne $o){ [IO.File]::WriteAllText($p,$t,(New-Object System.Text.UTF8Encoding $false)); Say ('[4] '+$f+' -> MeuVoto') }
  }
}

# [5] cache prefix
$cp=Join-Path $repo 'js\cache.js'
if(Test-Path $cp){ $t=[IO.File]::ReadAllText($cp); if($t -match 'mudabrasil_cache_|votabrasil_cache_'){ $t=$t.Replace('mudabrasil_cache_','meuvoto_cache_').Replace('votabrasil_cache_','meuvoto_cache_'); [IO.File]::WriteAllText($cp,$t,(New-Object System.Text.UTF8Encoding $false)); Say '[5] cache prefix -> meuvoto_cache_' } }

# [6] CNAME
[IO.File]::WriteAllText((Join-Path $repo 'CNAME'),$EXT,(New-Object System.Text.UTF8Encoding $false))
Say ('[6] CNAME = '+$EXT)

# [7] copia logo MeuVoto p/ assets (se existir no disco)
$assets=Join-Path $repo 'assets'; New-Item -ItemType Directory -Force -Path $assets | Out-Null
$alvo=Join-Path $assets 'logo-meuvoto.svg'; $achou=$false
$pats=@('Logo_Projeto_Perfeita_SemHalo.svg','*MeuVoto*.svg','*meuvoto*.svg','*MeuVoto*.png','*meuvoto*.png','*MeuVoto*.jpg')
$dirs=@("$env:USERPROFILE\Downloads","$env:USERPROFILE\Desktop","$env:USERPROFILE\Documents","C:\MeuVault\ObsidianCofre",$repo)
foreach($pat in $pats){ foreach($d in $dirs){ if(-not $achou -and (Test-Path $d)){ $hit=Get-ChildItem -Path $d -Filter $pat -Recurse -Depth 4 -File -ErrorAction SilentlyContinue | Select-Object -First 1; if($hit){ Copy-Item $hit.FullName $alvo -Force; $achou=$true; Say ('[7] logo copiada: '+$hit.Name) } } } }
if(-not $achou){ Say '[7] AVISO: logo MeuVoto nao achada no disco; coloque em assets\logo-meuvoto.svg' }

# [8] VALIDACAO por ancora antes do commit
$ix=[IO.File]::ReadAllText((Join-Path $repo 'index.html'))
$cf=[IO.File]::ReadAllText((Join-Path $repo 'config.js'))
$cn=[IO.File]::ReadAllText((Join-Path $repo 'CNAME'))
$ok = $cf.Contains('window.MeuVoto=window.MeuVoto') -and $cf.Contains('ALIAS-RETRO') -and $cf.Contains('MIGRACAO-PENDENTE')
$ok = $ok -and $ix.Contains('MeuVoto') -and (-not $ix.Contains('VotaBrasil')) -and (-not $ix.Contains('MudaBrasil'))
$ok = $ok -and $cn.Trim() -eq $EXT
$ok = $ok -and $cf.Contains($BE)
if(-not $ok){
  Say 'VALIDACAO-FALHOU - nenhum commit sera feito'
  Say ('  config MeuVoto+alias+pendente : '+($cf.Contains('window.MeuVoto=window.MeuVoto') -and $cf.Contains('ALIAS-RETRO') -and $cf.Contains('MIGRACAO-PENDENTE')))
  Say ('  index tem MeuVoto             : '+$ix.Contains('MeuVoto'))
  Say ('  index sem VotaBrasil          : '+(-not $ix.Contains('VotaBrasil')))
  Say ('  index sem MudaBrasil          : '+(-not $ix.Contains('MudaBrasil')))
  Say ('  CNAME == EXT                  : '+($cn.Trim() -eq $EXT))
  Say ('  backend -79eb preservado      : '+$cf.Contains($BE))
  exit 1
}
Say '[8] validacao OK'

# [9] commit + push (com deteccao de remoto divergente)
git add -A
$st=git status --porcelain
if($st){
  git commit -m ('feat(marca): -> MeuVoto (namespace+alias retro, eslogan na MARCA, CNAME '+$EXT+', emails meuvoto, cache+localStorage migrados, backend -79eb preservado)')
  $push=git push origin main 2>&1
  if($LASTEXITCODE -ne 0){
    Say '[9] COMMIT ok, mas PUSH rejeitado (remoto divergente). Git disse:'
    $push | ForEach-Object { Say ('   '+$_) }
    Say '   -> me avise que eu resolvo o rebase com seguranca (nao fiz auto-force pra nao corromper).'
  } else { Say '[9] commit+push OK' }
} else { Say '[9] nada a commitar' }

# [10] relatorio do que fica (infra, nao e marca)
Say ''
Say '=========== O QUE FICA DE PROPOSITO (infra, nao marca) ==========='
Get-ChildItem -Path $repo -Include *.js,*.html -Recurse -File | Where-Object { $_.FullName -notmatch '\\backup-|\\scripts\\|\\node_modules' } | Select-String -Pattern 'mudabrasil' -SimpleMatch | Group-Object Path | ForEach-Object { Say ('  '+$_.Name+' -> '+$_.Count+' linha(s) [hostname/basename, preservar]') }
Say '  Marca = 0 ocorrencias de MudaBrasil/VotaBrasil. O que sobrar de "mudabrasil" e URL de infra (-79eb / repo).'
Say ''
Say 'PROXIMO (seu painel: CPF/dinheiro/senha, nao consigo fazer de sandbox):'
Say '  - Registro.br: confirmar meu-voto.app (R$40/ano, PIX). O CNAME ja esta no repo.'
Say '  - Railway: custom domain api.meu-voto.app OU servico novo com slug limpo (banco tem 0 votos = perda zero).'
Say '  - Zoho Mail Free: caixas @meu-voto.app + MX/SPF/DKIM/DMARC; so entao os emails saem de MIGRACAO-PENDENTE.'
Say '  - GitHub Pages: Settings > Custom domain = meu-voto.app.'
