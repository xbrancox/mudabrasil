# Deploy DIRETO via Railway CLI (pula o GitHub App que tava dando "repo not found")
# Roda esse arquivo com: clique direito → "Executar com PowerShell"
# Ou: PowerShell → cd C:\Users\euler\MudaBrasil → .\deploy-direct.ps1

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  MudaBrasil - Deploy Direto Railway" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Instalar Railway CLI se não tiver
Write-Host "[1/4] Verificando Railway CLI..." -ForegroundColor Yellow
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "      Instalando Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha ao instalar Railway CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "      OK!" -ForegroundColor Green

# 2. Login (abre navegador 1x)
Write-Host "`n[2/4] Autenticando no Railway..." -ForegroundColor Yellow
Write-Host "      (Vai abrir o navegador - autorize)" -ForegroundColor Gray
railway login
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no login" -ForegroundColor Red
    exit 1
}
Write-Host "      OK!" -ForegroundColor Green

# 3. Linkar ao projeto
Write-Host "`n[3/4] Linkando ao projeto..." -ForegroundColor Yellow
Write-Host "      Selecione:" -ForegroundColor Gray
Write-Host "        - Workspace: xbrancox's Projects" -ForegroundColor Gray
Write-Host "        - Project: wholesome-victory (ou o que aparecer)" -ForegroundColor Gray
Write-Host "        - Environment: production" -ForegroundColor Gray
railway link
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao linkar" -ForegroundColor Red
    exit 1
}
Write-Host "      OK!" -ForegroundColor Green

# 4. Deploy!
Write-Host "`n[4/4] Fazendo deploy..." -ForegroundColor Yellow
Write-Host "      (Vai subir a pasta toda direto pro Railway)" -ForegroundColor Gray
Write-Host "      Aguarde ~2 minutos...`n" -ForegroundColor Gray
railway up --detach
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha no deploy" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  DEPLOY CONCLUIDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nProximos passos:" -ForegroundColor Cyan
Write-Host "  1. Va no Railway -> Settings -> Networking -> Generate Domain" -ForegroundColor White
Write-Host "  2. Teste: https://SEU-DOMINIO.up.railway.app/api/health" -ForegroundColor White
Write-Host "  3. Me cole o link aqui no chat" -ForegroundColor White
Write-Host ""
