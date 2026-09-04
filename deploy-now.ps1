# MudaBrasil - Deploy automático no Railway (1 arquivo só)
# Clique com botão direito → "Executar com PowerShell"

Write-Host "🚀 Iniciando deploy do MudaBrasil..." -ForegroundColor Yellow

# 1. Instala a Railway CLI se não existir
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Instalando Railway CLI..." -ForegroundColor Cyan
    npm i -g @railway/cli
}

# 2. Login (abre o navegador uma vez)
Write-Host "🔑 Fazendo login no Railway (autorize no navegador)..." -ForegroundColor Cyan
railway login

# 3. Linka ao projeto
Write-Host "🔗 Linkando ao projeto (use setas para selecionar):" -ForegroundColor Cyan
Write-Host "   Workspace: xbrancox's Projects" -ForegroundColor DarkGray
Write-Host "   Project:   wholesome-victory" -ForegroundColor DarkGray
Write-Host "   Service:   mudabrasil" -ForegroundColor DarkGray
railway link

# 4. Deploy (sobe o código da pasta local direto pro Railway, sem precisar de GitHub App)
Write-Host "☁️  Fazendo deploy (pode levar ~2 min)..." -ForegroundColor Cyan
railway up

Write-Host "`n✅ DEPLOY FINALIZADO!" -ForegroundColor Green
Write-Host "Agora vá no Railway → Settings → Networking → Generate Domain" -ForegroundColor Yellow
Write-Host "Cole o domínio aqui e me manda: https://xxxx.up.railway.app" -ForegroundColor White
pause
