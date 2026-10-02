#Requires -Version 5.1
# DIAG-MEUVOTO.ps1 - SOMENTE LEITURA. Nao altera arquivo, nao faz push, nao faz commit.
# Mede: (a) sha local, (b) sha remoto dos 3 repos (chega o push?), (c) registro dos dominios meuvoto.*
# 100% ASCII. Rode com 2 cliques no RODAR-DIAG.bat e me mande o print inteiro.
$ErrorActionPreference='Continue'   # CRUCIAL: nao deixar stderr do git virar erro fatal
$repo='C:\Users\euler\votabrasil'
Set-Location $repo
function Say($m){ Write-Host $m }

function Invoke-Git {
  param([string[]]$GitArgs)
  $prev=$ErrorActionPreference; $ErrorActionPreference='Continue'
  $out = (& git @GitArgs 2>&1 | Out-String)
  $code = $LASTEXITCODE
  $ErrorActionPreference=$prev
  return [pscustomobject]@{ Code=$code; Out=($out -replace "`r","").Trim() }
}

Say '================ 1) ESTADO LOCAL ================'
$head = Invoke-Git @('rev-parse','HEAD')
$localFull = ($head.Out -split "`n")[0].Trim()
$localShort = if($localFull.Length -ge 7){ $localFull.Substring(0,7) } else { $localFull }
Say ('HEAD local      : ' + $localFull)
Say ('HEAD curto      : ' + $localShort)
$log = Invoke-Git @('log','--oneline','-5')
Say '--- ultimos 5 commits ---'; Say $log.Out
$rem = Invoke-Git @('remote','-v')
Say '--- remotos ---'; Say $rem.Out
$br = Invoke-Git @('branch','-vv')
Say '--- branch tracking ---'; Say $br.Out
$st = Invoke-Git @('status','-sb')
Say '--- status ---'; Say $st.Out

Say ''
Say '================ 2) O PUSH CHEGOU? (ls-remote, so leitura) ================'
$repos = @('votabrasil','mudabrasil','MudaBrZclone280826')
$remoteSha = @{}
foreach($r in $repos){
  $url = "https://github.com/xbrancox/$r.git"
  $lr = Invoke-Git @('ls-remote',$url,'refs/heads/main')
  if($lr.Code -ne 0 -or -not $lr.Out){
    $remoteSha[$r] = $null
    Say ('  ' + $r.PadRight(20) + ' : SEM ACESSO / nao existe / sem branch main (exit ' + $lr.Code + ')')
  } else {
    $sha = ($lr.Out -split "`t")[0].Trim()
    $remoteSha[$r] = $sha
    $s7 = if($sha.Length -ge 7){ $sha.Substring(0,7) } else { $sha }
    if($sha -eq $localFull){ $verdict = 'IGUAL ao local  ==> O PUSH CHEGOU AQUI' }
    elseif($localFull.StartsWith($s7) -or $sha.StartsWith($localShort)){ $verdict = 'CONTEM o local (parcial?)' }
    else { $verdict = 'DIFERENTE do local  ==> push NAO chegou (repo atrasado ou divergente)' }
    Say ('  ' + $r.PadRight(20) + ' : main=' + $s7 + '  ' + $verdict)
  }
}

Say ''
Say '================ 3) DOMINIOS meuvoto.* (RDAP, so consulta) ================'
function Get-DomainStatus {
  param([string]$d)
  $urls = @()
  if($d -like '*.br'){ $urls += "https://rdap.registro.br/domain/$d" }
  $urls += "https://rdap.org/domain/$d"
  foreach($u in $urls){
    try{
      $null = Invoke-RestMethod -Uri $u -TimeoutSec 12 -Headers @{'User-Agent'='Mozilla/5.0 (diagnostico)'} -ErrorAction Stop
      return 'REGISTRADO (ocupado)'
    } catch {
      $resp = $_.Exception.Response
      if($resp){
        $code = [int]$resp.StatusCode
        if($code -eq 404){ return 'LIVRE (pode registrar)' }
        if($code -ge 500){ continue }   # tenta proxima URL
        return ('ERRO HTTP ' + $code)
      }
      continue   # sem resposta (rede/timeout): tenta proxima URL
    }
  }
  return 'NAO SEI (sem rede / bloqueado / timeout)'
}
foreach($d in @('meu-voto.app','meuvoto.com.br','meuvoto.app')){
  Say ('  ' + $d.PadRight(18) + ' : ' + (Get-DomainStatus $d))
}

Say ''
Say '================ VEREDITO (leia e me mande este bloco) ================'
$chegouEm = @(); foreach($r in $repos){ if($remoteSha[$r] -eq $localFull){ $chegouEm += $r } }
if($chegouEm.Count -gt 0){ Say ('  Push CONFIRMADO em: ' + ($chegouEm -join ', ')) }
else { Say '  Push NAO confirmado em nenhum dos 3 (ou divergente). O commit esta SO no seu disco.' }
Say '  Site ao vivo que voce apontou = repo "mudabrasil".'
Say '  CNAME no commit = meu-voto.app  ->  se o dominio acima nao estiver REGISTRADO,'
Say '     NAO publique este commit no repo que serve o site (Pages pode quebrar).'
Say '  Proximo passo (MEU, no proximo turno, com este print): empurro para o repo certo e,'
Say '     se preciso, neutralizo o CNAME antes de publicar. Voce nao faz nada alem deste clique.'
Say ''
Say 'FIM (nenhum arquivo foi alterado; nenhum push foi feito).'
pause