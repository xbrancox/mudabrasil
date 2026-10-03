param(
    [string]$CommitMessage = "Deploy automatico VotaBrasil"
)

function Write-Info { param([string]$Msg) Write-Host "[INFO] $Msg" -ForegroundColor Cyan }
function Write-Ok   { param([string]$Msg) Write-Host "[OK]   $Msg" -ForegroundColor Green }
function Write-Err  { param([string]$Msg) Write-Host "[ERRO] $Msg" -ForegroundColor Red }

Write-Host ""
Write-Host "==============================================" -ForegroundColor Magenta
Write-Host "   VotaBrasil - Deploy Automatizado" -ForegroundColor Magenta
Write-Host "==============================================" -ForegroundColor Magenta

if (-not (Test-Path "server\index.js")) {
    Write-Err "Pasta invalida! Execute na raiz do projeto."
    exit 1
}
Write-Ok "Pasta do projeto confirmada."

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Info "Nenhuma mudanca pendente."
} else {
    Write-Info "Criando commit..."
    git add -A
    git commit -m $CommitMessage
    Write-Ok "Commit criado."
}

Write-Info "Enviando para GitHub (branch main)..."
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Err "Falha no push!"
    exit 1
}
Write-Ok "Push concluido! Railway deploya sozinho em ~2 min."
Write-Host ""
Write-Host "  Site:    https://meu-voto.app"
Write-Host "  Clarity: https://clarity.microsoft.com/projects/view/yyyyq7krfi"
