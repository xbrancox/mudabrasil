# Valida a SINTAXE do MEUVOTO-MAIN.ps1 (sem executar) e, se limpa, roda. 100% ASCII.
$ErrorActionPreference='Stop'
$repo='C:\Users\euler\votabrasil'
$main=Join-Path $repo 'MEUVOTO-MAIN.ps1'
if(-not (Test-Path $main)){ Write-Host ('ERRO: '+$main+' nao encontrado'); pause; exit 1 }
$tok=$null; $errs=$null
$null=[System.Management.Automation.Language.Parser]::ParseFile($main,[ref]$tok,[ref]$errs)
if($errs -and $errs.Count -gt 0){
  Write-Host ('SINTAXE DO MAIN COM '+$errs.Count+' ERRO(S) - NAO executei nada:') -ForegroundColor Red
  foreach($e in $errs){ Write-Host ('  linha '+$e.Extent.StartLineNumber+' col '+$e.Extent.StartColumnNumber+': '+$e.Message) -ForegroundColor Red }
  Write-Host 'Me mande essa lista que eu corrijo o MAIN (nenhum arquivo seu foi tocado).' -ForegroundColor Yellow
  pause; exit 1
}
Write-Host 'Sintaxe do MAIN: 0 erros. Executando...' -ForegroundColor Green
Write-Host ''
. $main