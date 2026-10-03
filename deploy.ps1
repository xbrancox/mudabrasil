# PowerShell Deploy Script - VotaBrasil
# Uso: .\deploy.ps1 [-CommitMessage "sua mensagem"]

param(
    [string]$CommitMessage = "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

# Cores
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }

Write-Host ""
Write-Host "=========================================" -ForegroundColor Blue
Write-Host "🚀 Deploy VotaBrasil" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue
Write-Host ""

# Verificar branch atual
$branch = git branch --show-current
Write-Info "Branch atual: $branch"

if ($branch -ne "main" -and $branch -ne "master") {
    Write-Warning "Você não está na branch main/master"
    $continue = Read-Host "Deseja continuar mesmo assim? (y/n)"
    if ($continue -ne "y") {
        Write-Error "Deploy cancelado"
        exit 1
    }
}

# Verificar status do Git
Write-Info "Verificando status do Git..."
$status = git status --porcelain

if ($status) {
    Write-Warning "Há mudanças não commitadas:"
    git status --short
    
    $commit = Read-Host "Deseja commitar todas as mudanças? (y/n)"
    if ($commit -eq "y") {
        git add .
        git commit -m $CommitMessage
        Write-Success "Mudanças commitadas: $CommitMessage"
    } else {
        Write-Error "Deploy cancelado. Commite as mudanças manualmente."
        exit 1
    }
} else {
    Write-Success "Working tree limpo"
}

# Push para GitHub
Write-Info "Fazendo push para GitHub..."
$remote = git remote get-url origin
Write-Info "Remote: $remote"

git push origin $branch
Write-Success "Push concluído"

# Verificar Railway CLI
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if ($railwayInstalled) {
    Write-Success "Railway CLI detectado: $(railway --version)"
    
    # Verificar autenticação
    try {
        $whoami = railway whoami 2>&1
        Write-Success "Autenticado no Railway como: $whoami"
        
        Write-Info "Iniciando deploy no Railway..."
        Write-Success "Deploy iniciado! O Railway detectará o push automaticamente."
    } catch {
        Write-Warning "Não autenticado no Railway"
        Write-Info "Execute: railway login"
    }
} else {
    Write-Warning "Railway CLI não está instalado"
    Write-Info "Instale com: npm install -g @railway/cli"
    Write-Info "Deploy será feito automaticamente pelo Railway"
}

# Aguardar deploy
Write-Info "Aguardando 10 segundos para o deploy iniciar..."
Start-Sleep -Seconds 10

# Verificar status do site
Write-Info "Verificando status do site..."

try {
    $response = Invoke-WebRequest -Uri "https://meu-voto.app/api/health" -UseBasicParsing -TimeoutSec 10
    
    if ($response.StatusCode -eq 200) {
        Write-Success "Site está no ar! (HTTP $($response.StatusCode))"
    } else {
        Write-Warning "Site retornou HTTP $($response.StatusCode)"
    }
} catch {
    Write-Warning "Não foi possível verificar o site: $($_.Exception.Message)"
}

# Resumo final
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "🚀 DEPLOY CONCLUÍDO!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Acompanhe o deploy:"
Write-Host "   Railway: https://railway.app/dashboard"
Write-Host ""
Write-Host "🌐 Site:"
Write-Host "   https://meu-voto.app"
Write-Host ""
Write-Host "📈 Analytics:"
Write-Host "   GA4: https://analytics.google.com/"
Write-Host "   Clarity: https://clarity.microsoft.com/"
Write-Host ""
Write-Host "📝 Logs:"
Write-Host "   railway logs"
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
