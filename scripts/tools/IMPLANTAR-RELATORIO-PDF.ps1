# IMPLANTAR-RELATORIO-PDF.ps1 - VotaBrasil
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " VotaBrasil - Implantacao do Relatorio PDF de Cassacao" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 0) Backup
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
git add -A 2>$null | Out-Null
git commit -m "backup pre-pdf $stamp" --allow-empty 2>$null | Out-Null
Write-Host "  backup: $stamp" -ForegroundColor Gray

# 1) Injetar CDN jsPDF + script pdf-cassacao.js no index.html (antes de </body>)
$html = 'MudaBrasil\index.html'
if (Test-Path $html) {
  $c = Get-Content $html -Raw -Encoding UTF8
  if ($c -notmatch 'jspdf\.umd\.min\.js') {
    $bloco = @'
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="pdf-cassacao.js" defer></script>
</body>
'@
    $c = $c.Replace("</script>`n</body>", $bloco).Replace("</script>`r`n</body>", $bloco)
    [System.IO.File]::WriteAllText((Resolve-Path $html).Path, $c)
    Write-Host "  index.html: jsPDF + pdf-cassacao.js adicionados" -ForegroundColor Green
  } else {
    Write-Host "  index.html: jsPDF ja presente (skip)" -ForegroundColor Yellow
  }
} else {
  Write-Host "  [AVISO] $html nao encontrado" -ForegroundColor Red
}

# 2) Injetar botao "Relatorio de Cassacao" em renderRevogados (core.js)
$core = 'MudaBrasil\core.js'
if (Test-Path $core) {
  $c = Get-Content $core -Raw -Encoding UTF8
  if ($c -notmatch 'btn-pdf-cassacao') {
    $ancora = @"
atingiu 70% — cassação</b>'}</div></div>``).join('')
"@
    $injecao = @"
atingiu 70% — cassação</b>'}</div>
```${pct>=70?``<button class="btn red sm btn-pdf-cassacao" style="margin-top:10px" data-nome="`${p.n}" data-partido="`${p.p}" data-uf="`${p.uf}" data-elegeram="`${p.el}" data-revogados="`${p.rev}">`u{1F4C4} Relatorio de Cassacao</button>``:`'''}</div>``).join('')
"@
    if ($c.Contains($ancora)) {
      $c = $c.Replace($ancora, $injecao)
      [System.IO.File]::WriteAllText((Resolve-Path $core).Path, $c)
      Write-Host "  core.js: botao Relatorio de Cassacao injetado" -ForegroundColor Green
    } else {
      Write-Host "  [AVISO] ancora literal nao encontrada em core.js" -ForegroundColor Yellow
      Write-Host "  Procurando substring mais flexivel..." -ForegroundColor Yellow
      # Fallback: regex
      $padrao = "atingiu 70% — cassação</b>'\}</div></div>\`\)\.join\(''\)"
      if ($c -match $padrao) {
        Write-Host "  Encontrado via regex." -ForegroundColor Green
        $substituicao = @"
atingiu 70% — cassação</b>'}</div>
```${pct>=70?``<button class="btn red sm btn-pdf-cassacao" style="margin-top:10px" data-nome="`${p.n}" data-partido="`${p.p}" data-uf="`${p.uf}" data-elegeram="`${p.el}" data-revogados="`${p.rev}">`u{1F4C4} Relatorio de Cassacao</button>``:`'''}</div>``).join('')
"@
        $c = [regex]::Replace($c, $padrao, $substituicao)
        [System.IO.File]::WriteAllText((Resolve-Path $core).Path, $c)
        Write-Host "  core.js: patch via regex aplicado" -ForegroundColor Green
      } else {
        Write-Host "  [ERRO] Nao foi possivel localizar ancora em core.js" -ForegroundColor Red
      }
    }
  } else {
    Write-Host "  core.js: botao ja presente (skip)" -ForegroundColor Yellow
  }
}

# 3) Commit + push
git add -A
$diffs = git status --porcelain
if ($diffs) {
  git commit -m "feat: relatorio PDF de cassacao para politicos com >= 70% de revogacao"
  git push origin main
  Write-Host "`nOK! Push realizado." -ForegroundColor Green
} else {
  Write-Host "`nSem mudancas para commitar." -ForegroundColor Yellow
}

Write-Host "`nComo testar:" -ForegroundColor Cyan
Write-Host "  1. Acesse: https://xbrancox.github.io/mudabrasilv4/"
Write-Host "  2. Role ate 'POLITICOS COM VOTOS REVOGADOS'"
Write-Host "  3. Qualquer politico com pct >= 70% tera botao vermelho"
Write-Host "     'Relatorio de Cassacao' - clique para baixar PDF."
Read-Host "`nEnter para sair"
