# ============================================================
#  IMPLANTAR-RADAR-COMPLETO.ps1 - VotaBrasil
#  Publica o site COMPLETO (pasta MudaBrasil/) como site principal
#  com rebrand MudaBrasil -> VotaBrasil.
#  Nao toca: backend Railway, chaves mb_* do localStorage, pasta raiz.
# ============================================================
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '  VotaBrasil - Implantacao do site completo na raiz'          -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan

# ---- 0) Pre-flight ----
if (-not (Test-Path 'MudaBrasil')) {
    Write-Host 'ERRO: pasta MudaBrasil/ nao encontrada.' -ForegroundColor Red
    Read-Host 'Enter para sair'; exit 1
}
git rev-parse --is-inside-work-tree 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'ERRO: este diretorio nao e um repositorio git.' -ForegroundColor Red
    Read-Host 'Enter para sair'; exit 1
}

# ---- 1) Backup ----
Write-Host '[1/6] Commit de backup...' -ForegroundColor Yellow
git add -A | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
git commit -m "backup pre-implantacao $stamp" --allow-empty | Out-Null

# ---- 2) Workflow Pages: path: . -> path: MudaBrasil ----
Write-Host '[2/6] Ajustando workflow do GitHub Pages...' -ForegroundColor Yellow
$wfChanged = 0
$wfDir = Join-Path '.github' 'workflows'
if (Test-Path $wfDir) {
    foreach ($yml in Get-ChildItem -Path $wfDir -Filter *.yml -File) {
        $c = Get-Content $yml.FullName -Raw -Encoding UTF8
        if ($c -match 'upload-pages-artifact') {
            $n = [regex]::Replace($c, 'path:\s*\.\s*$', 'path: MudaBrasil', [System.Text.RegularExpressions.RegexOptions]::Multiline)
            if ($n -ne $c) {
                [System.IO.File]::WriteAllText($yml.FullName, $n)
                Write-Host ('   ok: ' + $yml.Name) -ForegroundColor Green
                $wfChanged++
            }
        }
    }
}
if ($wfChanged -eq 0) { Write-Host '   (nenhum workflow precisou mudar)' -ForegroundColor Gray }

# ---- 3) Rebrand dentro de MudaBrasil/ ----
Write-Host '[3/6] Rebrand MudaBrasil -> VotaBrasil (somente dentro de MudaBrasil/)...' -ForegroundColor Yellow
$rb = 0
foreach ($f in Get-ChildItem -Path 'MudaBrasil' -Recurse -Include *.html,*.js,*.css,*.webmanifest,*.md,*.txt,*.svg,*.json -File) {
    if ($f.FullName -match 'node_modules') { continue }
    $c = Get-Content $f.FullName -Raw -Encoding UTF8
    $n = $c -replace 'MudaBrasil','VotaBrasil' -replace 'mudabrasil\.app','votabrasil.app'
    if ($n -ne $c) {
        [System.IO.File]::WriteAllText($f.FullName, $n)
        Write-Host ('   ok: ' + $f.Name) -ForegroundColor Gray
        $rb++
    }
}
Write-Host ("   arquivos rebrandados: " + $rb) -ForegroundColor Green

# ---- 4) Bugfixes do app ----
Write-Host '[4/6] Bugfixes do app (Deputado Distrital)...' -ForegroundColor Yellow
$appjs = Join-Path 'MudaBrasil' 'app/app.js'
if (Test-Path $appjs) {
    $c = Get-Content $appjs -Raw -Encoding UTF8
    if ($c -notmatch 'Deputado Distrital') {
        $n = $c -replace "'Deputado Estadual',\s*'Governador'", "'Deputado Estadual', 'Deputado Distrital', 'Governador'"
        if ($n -ne $c) {
            [System.IO.File]::WriteAllText($appjs, $n)
            Write-Host '   ok: app.js' -ForegroundColor Green
        } else {
            Write-Host '   (padrao nao encontrado; verifique depois)' -ForegroundColor DarkYellow
        }
    } else {
        Write-Host '   (ja continha Deputado Distrital)' -ForegroundColor Gray
    }
} else {
    Write-Host '   (app.js nao encontrado em MudaBrasil/app/)' -ForegroundColor DarkYellow
}

# ---- 5) Corrigir FIX-GIT.ps1 (linha 53) ----
Write-Host '[5/6] Corrigindo FIX-GIT.ps1 (linha 53)...' -ForegroundColor Yellow
if (Test-Path 'FIX-GIT.ps1') {
    $c = Get-Content 'FIX-GIT.ps1' -Raw -Encoding UTF8
    $n = $c -replace '\$rebaseInProgress\s*=\s*Test-Path "\.git\\rebase-merge" -or Test-Path "\.git\\rebase-apply"', '$rebaseInProgress = (Test-Path ".git\rebase-merge") -or (Test-Path ".git\rebase-apply")'
    if ($n -ne $c) {
        [System.IO.File]::WriteAllText('FIX-GIT.ps1', $n)
        Write-Host '   ok: linha 53 corrigida' -ForegroundColor Green
    } else {
        Write-Host '   (ja corrigida ou padrao diferente)' -ForegroundColor Gray
    }
} else {
    Write-Host '   (FIX-GIT.ps1 nao existe)' -ForegroundColor Gray
}

# ---- 6) Commit + push ----
Write-Host '[6/6] Commit e push...' -ForegroundColor Yellow
git add -A
git commit -m 'feat: site completo (radar politico) na raiz + rebrand VotaBrasil'
git push origin main
$hash = git rev-parse --short HEAD 2>$null

Write-Host ''
Write-Host '============================================================' -ForegroundColor Green
Write-Host "  CONCLUIDO! Commit: $hash" -ForegroundColor Green
Write-Host '  Confira em ~2 min:' -ForegroundColor Green
Write-Host '    https://xbrancox.github.io/mudabrasilv4/' -ForegroundColor Green
Write-Host '    https://xbrancox.github.io/mudabrasilv4/app/' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
Read-Host 'Enter para sair'
