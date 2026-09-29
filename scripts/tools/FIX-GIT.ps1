#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Script automático para resolver problemas do Git e fazer push correto
.DESCRIPTION
    Este script faz push automático para o repositório correto (mudabrasilv4)
    resolvendo conflitos e erros automaticamente
#>

$ErrorActionPreference = "Continue"
Set-Location "C:\Users\euler\MudaBrasil"

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     VotaBrasil - Script de Correção Automática Git        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Passo 1: Configurar Git para não abrir editor
Write-Host "📌 Configurando Git..." -ForegroundColor Yellow
git config --global core.editor "true"
git config --global merge.log true
Write-Host "   ✓ Git configurado para merge automático`n" -ForegroundColor Green

# Passo 2: Verificar branch atual
Write-Host "📌 Verificando branch atual..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   ✓ Branch atual: $currentBranch`n" -ForegroundColor Green

# Passo 3: Verificar remote correto
Write-Host "📌 Verificando remote..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin
Write-Host "   ✓ Remote: $remoteUrl`n" -ForegroundColor Green

if ($remoteUrl -notlike "*mudabrasilv4*") {
    Write-Host "   ⚠ Remote incorreto, ajustando..." -ForegroundColor Yellow
    git remote set-url origin https://github.com/xbrancox/mudabrasilv4.git
    $remoteUrl = git remote get-url origin
    Write-Host "   ✓ Remote ajustado para: $remoteUrl`n" -ForegroundColor Green
}

# Passo 4: Fetch do remoto
Write-Host "📌 Baixando atualizações do remoto..." -ForegroundColor Yellow
$fetchResult = git fetch origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Fetch concluído`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Aviso no fetch: $fetchResult`n" -ForegroundColor Yellow
}

# Passo 5: Tentar merge (mais tolerante que rebase)
Write-Host "📌 Fazendo merge com o remoto..." -ForegroundColor Yellow

# Abortar qualquer rebase em andamento
$rebaseInProgress = (Test-Path ".git\rebase-merge") -or (Test-Path ".git\rebase-apply")
if ($rebaseInProgress) {
    Write-Host "   ⚠ Rebase em andamento, abortando..." -ForegroundColor Yellow
    git rebase --abort
    Write-Host "   ✓ Rebase abortado`n" -ForegroundColor Green
}

# Tentar merge
$mergeResult = git merge origin/main --no-edit --allow-unrelated-histories 2>&1
$mergeExitCode = $LASTEXITCODE

if ($mergeExitCode -eq 0) {
    Write-Host "   ✓ Merge concluído com sucesso`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Conflitos detectados, resolvendo automaticamente...`n" -ForegroundColor Yellow
    
    # Pegar lista de arquivos com conflito
    $conflictedFiles = git diff --name-only --diff-filter=U
    
    if ($conflictedFiles.Count -gt 0) {
        Write-Host "   📄 Arquivos com conflito:" -ForegroundColor Yellow
        foreach ($file in $conflictedFiles) {
            Write-Host "      - $file" -ForegroundColor Gray
            # Aceitar versão local (nossa)
            git checkout --ours $file
            git add $file
        }
        
        # Commit do merge
        git commit --no-edit
        Write-Host "   ✓ Conflitos resolvidos (aceitando versão local)`n" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Erro desconhecido no merge`n" -ForegroundColor Red
        Write-Host $mergeResult -ForegroundColor Gray
    }
}

# Passo 6: Verificar status
Write-Host "📌 Verificando status do Git..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "   ⚠ Há arquivos não commitados:" -ForegroundColor Yellow
    $status | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
    Write-Host "   📦 Commitando mudanças pendentes..." -ForegroundColor Yellow
    git add .
    git commit -m "chore: arquivos pendentes" --allow-empty
    Write-Host "   ✓ Commit criado`n" -ForegroundColor Green
} else {
    Write-Host "   ✓ Working tree limpo`n" -ForegroundColor Green
}

# Passo 7: Push
Write-Host "📌 Fazendo push para o GitHub..." -ForegroundColor Yellow
$pushResult = git push origin $currentBranch 2>&1
$pushExitCode = $LASTEXITCODE

if ($pushExitCode -eq 0) {
    Write-Host "   ✓ Push concluído com sucesso`n" -ForegroundColor Green
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                    ✅ TUDO CERTO!                         ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
    Write-Host "   Repositório: $remoteUrl" -ForegroundColor Cyan
    Write-Host "   Branch: $currentBranch" -ForegroundColor Cyan
    Write-Host "   Commit: $(git log -1 --pretty=format:'%h - %s')" -ForegroundColor Cyan
} else {
    Write-Host "   ✗ Erro no push`n" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Gray
}

Write-Host "`nPressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
