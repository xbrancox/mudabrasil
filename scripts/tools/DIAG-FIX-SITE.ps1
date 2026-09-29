#Requires -Version 5.1
# DIAG-FIX-SITE.ps1 - publica no repo CERTO sem quebrar o GitHub Pages.
# Nao cola comando em lugar nenhum. 2 cliques no RODAR-FIX-SITE.bat bastam.
$ErrorActionPreference = 'Stop'
$repo       = 'C:\Users\euler\votabrasil'
$RepoSite   = 'xbrancox/mudabrasil'   # repo que SERVE o site ao vivo (confirmado pelo passo 1)
$BranchSite = 'main'

function Say($m){ Write-Host $m }
function Line($c){ Write-Host (($c)*64) }
# Helper: roda git capturando stderr no output SEM deixar o Stop matar o script.
function Invoke-Git {
  param([string[]]$GitArgs)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $out  = (& git @GitArgs 2>&1 | Out-String)
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  return [pscustomobject]@{ Code = $code; Out = ($out -replace "`r","").Trim() }
}

Set-Location $repo
Line '='
Say '0) PRE-CONDICOES'
$inside = Invoke-Git @('rev-parse','--is-inside-work-tree')
if ($inside.Code -ne 0 -or $inside.Out -ne 'true') {
  Say "ERRO: $repo nao e um repositorio git (ou git nao esta no PATH)."
  Say ('  git disse: ' + $inside.Out)
  exit 1
}
$porc = Invoke-Git @('status','--porcelain')
$sujo = @($porc.Out -split "`n") | Where-Object { $_ -and ($_ -notmatch '^\?\?') }
if ($sujo.Count -gt 0) {
  Say 'ERRO: ha alteracoes nao commitadas (alem de untracked). Commit ou stash antes.'
  $sujo | ForEach-Object { Say ('  ' + $_) }
  exit 1
}
Say 'OK: tree limpo (apenas untracked de diagnostico).'

Line '='
Say '1) LER O CNAME DO REPO QUE SERVE O SITE'
$urlRaw = "https://raw.githubusercontent.com/$RepoSite/$BranchSite/CNAME"
$cnameSite = $null
try {
  $r = Invoke-WebRequest -Uri $urlRaw -UseBasicParsing -TimeoutSec 20
  $first = (($r.Content -split "`n")[0]).Trim()
  if ($first) { $cnameSite = $first }
  Say ("CNAME no repo site = '" + $cnameSite + "'")
} catch {
  $code = $null
  try { $code = $_.Exception.Response.StatusCode.value__ } catch {}
  if ($code -eq 404) { Say 'CNAME NAO existe no repo site -> site roda em *.github.io (sem dominio custom).' }
  else { Say ("AVISO: falha ao ler CNAME (HTTP " + $code + "). Assumindo 'sem dominio custom' por seguranca.") }
  $cnameSite = $null
}

Line '='
Say '2) GARANTIR QUE O QUE VAI PRO SITE NAO CARREGA CNAME FANTASMA'
$cnamePath = Join-Path $repo 'CNAME'
$cnameLocal = $null
if (Test-Path $cnamePath) { $cnameLocal = (((Get-Content $cnamePath -Raw) -split "`n")[0]).Trim() }
Say ("CNAME local agora = '" + $cnameLocal + "'  (len=" + $(if($cnameLocal){$cnameLocal.Length}else{0}) + ")")
$tracked = Invoke-Git @('ls-files','--','CNAME')
$trackedNow = [bool]($tracked.Out)
Say ("CNAME tracked no git? " + $trackedNow)

if ($cnameSite) {
  # site JA usa um dominio custom legitimo -> alinha o local com ele
  if ($cnameLocal -ne $cnameSite) {
    Set-Content -Path $cnamePath -Value $cnameSite -NoNewline -Encoding ASCII
    Say ("CNAME local ajustado p/ '" + $cnameSite + "' (igual ao site).")
  } else { Say 'CNAME local ja igual ao do site.' }
} else {
  # site NAO tem dominio custom -> NAO podemos levar CNAME (quebraria o Pages)
  if (Test-Path $cnamePath) { Remove-Item $cnamePath -Force; Say 'CNAME local REMOVIDO do disco.' }
  if ($trackedNow) {
    $rm = Invoke-Git @('rm','--cached','--ignore-unmatch','CNAME')
    Say ('git rm --cached CNAME -> exit ' + $rm.Code)
  }
  Say 'Garantido: nada de CNAME sera publicado no site.'
}

Line '='
Say '3) COMMIT DE SEGURANCA DO CNAME (so se mudou)'
$diffCname = Invoke-Git @('status','--porcelain','--','CNAME')
if ($diffCname.Out) {
  $null = Invoke-Git @('add','--','CNAME')
  if ($cnameSite) { $msg = "fix(cname): alinha CNAME com repo site ($cnameSite)" }
  else            { $msg = "fix(cname): remove CNAME p/ nao quebrar Pages (site em github.io)" }
  $c = Invoke-Git @('commit','-m',$msg)
  Say ('Commit criado: ' + $msg)
  Say ($c.Out)
} else {
  Say 'CNAME ja alinhado; nenhum commit novo.'
}

Line '='
Say "4) REMOTO DO SITE + ANALISE DE DIVERGENCIA"
$remList = Invoke-Git @('remote')
$hasSite = @($remList.Out -split "`n") | Where-Object { $_.Trim() -eq 'site' }
if (-not $hasSite) {
  $add = Invoke-Git @('remote','add','site',"https://github.com/$RepoSite.git")
  Say ("Remote 'site' criado -> $RepoSite (exit " + $add.Code + ")")
} else { Say "Remote 'site' ja existe." }
$f = Invoke-Git @('fetch','site',$BranchSite)
Say ('fetch exit=' + $f.Code)
$siteRef = "site/$BranchSite"
$vp = Invoke-Git @('rev-parse','--verify',$siteRef)
if ($vp.Code -ne 0) { Say ("ERRO: ref $siteRef nao existe apos fetch (repo/branch errados?)."); Say $vp.Out; exit 1 }
$head    = (Invoke-Git @('rev-parse','HEAD')).Out
$siteSha = $vp.Out
Say ('HEAD local      = ' + $head.Substring(0,[Math]::Min(7,$head.Length)))
Say ($siteRef + ' = ' + $siteSha.Substring(0,[Math]::Min(7,$siteSha.Length)))
$a1 = Invoke-Git @('merge-base','--is-ancestor',$siteRef,'HEAD'); $siteAnc = ($a1.Code -eq 0)
$a2 = Invoke-Git @('merge-base','--is-ancestor','HEAD',$siteRef);  $headAnc = ($a2.Code -eq 0)
if     ($siteSha -eq $head) { $modo = 'IGUAL' }
elseif ($siteAnc)           { $modo = 'FAST-FORWARD' }
elseif ($headAnc)           { $modo = 'LOCAL-ATRASADO' }
else                        { $modo = 'DIVERGENTE' }
Say ('MODO = ' + $modo)

Line '='
Say '5) VEREDITO / PROXIMO PASSO'
$pubBat = Join-Path $repo 'PUBLICAR-SITE.bat'
if (Test-Path $pubBat) { Remove-Item $pubBat -Force }   # limpa botao de runs anteriores
if ($modo -eq 'FAST-FORWARD') {
  Say 'SEGURO: o site esta atrasado e aceita um push simples (sem forcar, sem perder nada).'
  Say 'Gerando PUBLICAR-SITE.bat na raiz. De 2 cliques nele para ir ao ar.'
  $bat = "@echo off`r`ncd /d `"$repo`"`r`necho Publicando HEAD no repo $RepoSite ($BranchSite)...`r`ngit push site HEAD:$BranchSite`r`necho.`r`necho Se apareceu 'main -> main' ou um hash, deu certo. O Pages atualiza em ~1-2 min.`r`npause"
  [IO.File]::WriteAllText($pubBat, $bat, (New-Object System.Text.UTF8Encoding $false))
  Say ('  criado: ' + $pubBat)
}
elseif ($modo -eq 'IGUAL') {
  Say 'Nada a publicar (site ja esta no mesmo commit).'
}
elseif ($modo -eq 'LOCAL-ATRASADO') {
  Say 'O repo do site tem commits que o local nao tem. NAO publiche ainda.'
  Say ('  Integre antes:  git pull site ' + $BranchSite + ' --rebase')
  Say '  Depois rode este diagnostico de novo.'
}
else {
  Say 'DIVERGENCIA REAL. NAO publiche. Commits unicos de cada lado:'
  Say '  [so no site]:';  (Invoke-Git @('log','--oneline',"HEAD..$siteRef")).Out -split "`n" | ForEach-Object { if($_){Say ('    '+$_)} }
  Say '  [so no local]:'; (Invoke-Git @('log','--oneline',"$siteRef..HEAD")).Out  -split "`n" | ForEach-Object { if($_){Say ('    '+$_)} }
  Say '  Me mande ESTE bloco que eu resolvo a integracao no proximo turno.'
}

Line '='
Say '6) .GITIGNORE DO REPO (escrito por mim, idempotente)'
$gi = Join-Path $repo '.gitignore'
$want = @('/DIAG-*.ps1','/RODAR-*.bat','/PUBLICAR-SITE.bat','/MEUVOTO-*.ps1','/CONVERTER-*.ps1','/IMPLANTAR-*.ps1','/CONFIGURAR-*.ps1','/FIX-*.ps1','/PUBLICAR.*','/backup-*/','/backup-*')
$have = @()
if (Test-Path $gi) { $have = @((Get-Content $gi) | ForEach-Object { $_.Trim() }) }
$addLines = @($want | Where-Object { $have -notcontains $_ })
if ($addLines.Count -gt 0) {
  $new = $have + $addLines
  [IO.File]::WriteAllLines($gi, $new, (New-Object System.Text.UTF8Encoding $false))
  Say ('  adicionadas ' + $addLines.Count + ' linha(s) ao .gitignore do repo.')
} else { Say '  .gitignore ja cobre tudo.' }

Line '='
Say 'FIM. (nenhum push foi feito aqui; o push so acontece se voce rodar o PUBLICAR-SITE.bat gerado).'
pause