# ============================================================
# CONFIGURAR-DOMINIO.ps1 - VotaBrasil
# Troca os e-mails do config.js e os meta tags do index.html
# para o novo dominio votabrasil.app.br. Faz commit + push.
#
# Uso: botao direito > Executar com PowerShell (ou via RODAR-DOMINIO.bat)
# ============================================================

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath 'C:\Users\euler\votabrasil'

$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = "backup-dominio-$ts"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR-DOMINIO - VotaBrasil" -ForegroundColor Cyan
Write-Host "  Dominio alvo: votabrasil.app.br" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---------- 1) Backup ----------
Write-Host "[1/6] Criando backup em $backupDir\ ..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Copy-Item -LiteralPath 'config.js'      -Destination "$backupDir\config.js"      -Force
Copy-Item -LiteralPath 'index.html'     -Destination "$backupDir\index.html"     -Force
if (Test-Path -LiteralPath 'CNAME') {
    Copy-Item -LiteralPath 'CNAME' -Destination "$backupDir\CNAME" -Force
}
Write-Host "      Backup OK." -ForegroundColor Green

# ---------- 2) Verificar CNAME ----------
Write-Host "[2/6] Verificando arquivo CNAME ..." -ForegroundColor Yellow
if (-not (Test-Path -LiteralPath 'CNAME')) {
    throw "ERRO: arquivo CNAME nao encontrado na raiz do projeto."
}
$cnameContent = (Get-Content -LiteralPath 'CNAME' -Raw).Trim()
if ($cnameContent -ne 'votabrasil.app.br') {
    throw "ERRO: CNAME deveria ser 'votabrasil.app.br' mas esta '$cnameContent'."
}
Write-Host "      CNAME OK: $cnameContent" -ForegroundColor Green

# ---------- 3) Atualizar config.js ----------
Write-Host "[3/6] Atualizando e-mails no config.js ..." -ForegroundColor Yellow
$cfg = Get-Content -LiteralPath 'config.js' -Raw -Encoding UTF8

$substituicoesCfg = @(
    @{ old = "email_geral:'contato@mudabrasil.app'";    new = "email_geral:'contato@votabrasil.app.br'" },
    @{ old = "email_anuncie:'anuncie@mudabrasil.app'";  new = "email_anuncie:'anuncie@votabrasil.app.br'" },
    @{ old = "email_imprensa:'imprensa@mudabrasil.app'"; new = "email_imprensa:'imprensa@votabrasil.app.br'" }
)

$cfgTrocas = 0
foreach ($s in $substituicoesCfg) {
    if ($cfg.Contains($s.old)) {
        $cfg = $cfg.Replace($s.old, $s.new)
        $cfgTrocas++
        Write-Host "      + $($s.old) -> $($s.new)" -ForegroundColor DarkGray
    } elseif ($cfg.Contains($s.new)) {
        Write-Host "      (ja atualizado: $($s.new))" -ForegroundColor DarkGray
    } else {
        Write-Host "      AVISO: padrao nao encontrado -> $($s.old)" -ForegroundColor Red
    }
}

if ($cfgTrocas -gt 0) {
    [System.IO.File]::WriteAllText("$PWD\config.js", $cfg, [System.Text.UTF8Encoding]::new($false))
    Write-Host "      config.js atualizado ($cfgTrocas troca(s))." -ForegroundColor Green
} else {
    Write-Host "      config.js ja estava atualizado." -ForegroundColor Green
}

# ---------- 4) Atualizar index.html ----------
Write-Host "[4/6] Atualizando meta tags no index.html ..." -ForegroundColor Yellow
$idx = Get-Content -LiteralPath 'index.html' -Raw -Encoding UTF8

$substituicoesIdx = @(
    @{ old = 'https://votabrasil.app/';           new = 'https://votabrasil.app.br/' },
    @{ old = 'https://votabrasil.app/og-image.png'; new = 'https://votabrasil.app.br/og-image.png' }
)

$idxTrocas = 0
foreach ($s in $substituicoesIdx) {
    if ($idx.Contains($s.old)) {
        $count = ([regex]::Matches($idx, [regex]::Escape($s.old))).Count
        $idx = $idx.Replace($s.old, $s.new)
        $idxTrocas += $count
        Write-Host "      + $($count)x $($s.old) -> $($s.new)" -ForegroundColor DarkGray
    }
}

if ($idxTrocas -gt 0) {
    [System.IO.File]::WriteAllText("$PWD\index.html", $idx, [System.Text.UTF8Encoding]::new($false))
    Write-Host "      index.html atualizado ($idxTrocas ocorrencia(s))." -ForegroundColor Green
} else {
    Write-Host "      index.html ja estava atualizado." -ForegroundColor Green
}

# ---------- 5) Git status ----------
Write-Host "[5/6] Status do git ..." -ForegroundColor Yellow
$gitStatus = & git status --short 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "      AVISO: nao foi possivel ler status do git." -ForegroundColor Red
    Write-Host $gitStatus
} else {
    if ([string]::IsNullOrWhiteSpace($gitStatus)) {
        Write-Host "      Nada a commitar (arquivos ja estao na versao correta)." -ForegroundColor Green
        $needCommit = $false
    } else {
        Write-Host "      Arquivos modificados:" -ForegroundColor DarkGray
        Write-Host $gitStatus -ForegroundColor DarkGray
        $needCommit = $true
    }
}

# ---------- 6) Commit + push ----------
if ($needCommit) {
    Write-Host "[6/6] Commit + push ..." -ForegroundColor Yellow
    & git add CNAME config.js index.html 2>&1 | Out-Null
    $commitMsg = "chore(dominio): preparar migracao para votabrasil.app.br`n`n" +
                 "- Adiciona CNAME para GitHub Pages custom domain`n" +
                 "- Troca CONTATO no config.js (contato/anuncie/imprensa)`n" +
                 "- Atualiza canonical + og:url + og:image no index.html`n" +
                 "- Backup em $backupDir"
    & git commit -m $commitMsg 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      Commit OK." -ForegroundColor Green
    } else {
        Write-Host "      AVISO: commit retornou codigo diferente de 0." -ForegroundColor Red
    }
    Write-Host "      Push para GitHub ..." -ForegroundColor DarkGray
    & git push 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      Push OK." -ForegroundColor Green
    } else {
        Write-Host "      ERRO no push. Veja mensagem acima." -ForegroundColor Red
    }
} else {
    Write-Host "[6/6] Commit nao necessario - pulando push." -ForegroundColor Yellow
}

# ---------- Final ----------
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  CONFIGURACAO CONCLUIDA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "  1. Registrar votabrasil.app.br em https://registro.br (R`$40/ano PIX)" -ForegroundColor White
Write-Host "  2. No painel DNS do Registro.br, adicionar os registros do DOMINIO_E_EMAIL.md" -ForegroundColor White
Write-Host "  3. Criar conta Zoho Mail free e adicionar o dominio" -ForegroundColor White
Write-Host "  4. Voltar aqui e me avisar: 'dominio votabrasil.app.br registrado e DNS configurado'" -ForegroundColor White
Write-Host ""
Write-Host "Arquivo de guia completo:" -ForegroundColor Cyan
Write-Host "  C:\Users\euler\votabrasil\DOMINIO_E_EMAIL.md" -ForegroundColor Yellow
Write-Host ""
Read-Host "Pressione ENTER para fechar"
