#Requires -Version 5.1
<#
  MudaBrasil/VotaBrasil - aplica cache + resiliencia + handlers de erro.
  Idempotente: pode rodar 2x que nao duplica nada. Faz backup antes.
#>
$ErrorActionPreference = 'Stop'

# ---------- 1) Descobrir o projeto ----------
$candidatos = @(
    'C:\Users\euler\votabrasil',
    'C:\MeuVault\ObsidianCofre\MudaBrasil',
    'C:\Users\euler\.zcode\workspace\default\mudaBrasil-redesign'
)
$proj = $candidatos | Where-Object { Test-Path (Join-Path $_ 'index.html') } | Select-Object -First 1
if (-not $proj) {
    Write-Host 'ERRO: index.html nao encontrado em nenhum caminho conhecido.' -ForegroundColor Red
    exit 1
}
Write-Host "Projeto detectado: $proj" -ForegroundColor Cyan

# ---------- 2) Backup ----------
$stamp  = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $proj "backup-$stamp"
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Copy-Item (Join-Path $proj 'index.html') $backup -Force
if (Test-Path (Join-Path $proj 'config.js')) { Copy-Item (Join-Path $proj 'config.js') $backup -Force }
Write-Host "Backup em: $backup" -ForegroundColor DarkGray

# ---------- 3) Gravar js/cache.js (codigo corrigido, completo) ----------
$jsDir = Join-Path $proj 'js'
New-Item -ItemType Directory -Force -Path $jsDir | Out-Null

$cacheJs = @'
/* MudaBrasil - Cache, resiliencia e erros globais */
const CACHE_TTL = 30 * 60 * 1000;
const CACHE_PREFIX = 'mudabrasil_cache_';
const CACHE_STALE = {};

function fetchWithCache(url) {
  const chave = CACHE_PREFIX + url;
  try {
    const cached = localStorage.getItem(chave);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return Promise.resolve(data);
      CACHE_STALE[url] = data;
    }
  } catch (e) { console.warn('Cache ilegivel, ignorando:', e); }

  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + url);
      return r.json();
    })
    .then((data) => {
      try { localStorage.setItem(chave, JSON.stringify({ data, timestamp: Date.now() })); }
      catch (e) { console.warn('Falha ao gravar cache:', e); }
      return data;
    })
    .catch((err) => {
      if (CACHE_STALE[url]) { console.warn('Rede falhou; servindo cache antigo:', err.message); return CACHE_STALE[url]; }
      throw err;
    });
}

function limparCache() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(CACHE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

function showToast(msg) {
  let toast = document.getElementById('mb-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mb-toast';
    toast.style.cssText =
      'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
      'background:#b91c1c;color:#fff;padding:12px 20px;border-radius:10px;' +
      'font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);' +
      'opacity:0;transition:opacity .25s;z-index:9999;pointer-events:none';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.style.opacity = '0'; }, 4000);
}

window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise rejeitada:', e.reason);
  showToast('Algo deu errado ao carregar os dados. Tente novamente.');
});

window.addEventListener('error', (e) => {
  console.error('Erro capturado:', e.error);
  showToast('Erro inesperado. Recarregue a pagina se persistir.');
});
'@

$jsPath = Join-Path $jsDir 'cache.js'
[System.IO.File]::WriteAllText($jsPath, $cacheJs, (New-Object System.Text.UTF8Encoding $false))
Write-Host 'Criado/atualizado: js/cache.js' -ForegroundColor Green

# ---------- 4) Patchear index.html (idempotente) ----------
$htmlPath = Join-Path $proj 'index.html'
$html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
$mudou = $false

# 4a) preload + favicon (somente se os arquivos existirem)
$links = ''
if ((Test-Path (Join-Path $proj 'logo.svg')) -and ($html -notmatch 'rel="preload"')) {
    $links += "<link rel=`"preload`" href=`"logo.svg`" as=`"image`" type=`"image/svg+xml`">`n"
}
if ((Test-Path (Join-Path $proj 'favicon.svg')) -and ($html -notmatch 'rel="icon" href="favicon.svg"')) {
    $links += "<link rel=`"icon`" href=`"favicon.svg`" type=`"image/svg+xml`">`n"
}
if ($links -ne '') {
    $html = [regex]::Replace($html, '</head>', ($links + '</head>'), 1)
    $mudou = $true
}

# 4b) tag do cache.js logo apos o config.js (ou antes de </body>)
if ($html -notmatch 'js/cache\.js') {
    $padraoConfig = '(<script[^>]*src="[^"]*config\.js"[^>]*>\s*</script>)'
    if ([regex]::IsMatch($html, $padraoConfig)) {
        $html = [regex]::Replace($html, $padraoConfig, ("`$1`n<script src=`"js/cache.js`" defer></script>"), 1)
    } else {
        $html = [regex]::Replace($html, '</body>', ("<script src=`"js/cache.js`" defer></script>`n</body>"), 1)
    }
    $mudou = $true
}

if ($mudou) {
    [System.IO.File]::WriteAllText($htmlPath, $html, (New-Object System.Text.UTF8Encoding $false))
    Write-Host 'index.html patcheado.' -ForegroundColor Green
} else {
    Write-Host 'index.html ja estava pronto (nada a inserir).' -ForegroundColor DarkGray
}

# ---------- 5) Validacao final ----------
$checar = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
$okJs   = Test-Path $jsPath
$okTag  = $checar -match 'js/cache\.js'
Write-Host ''
Write-Host ('js/cache.js existe : ' + $okJs)   -ForegroundColor $(if ($okJs)  { 'Green' } else { 'Red' })
Write-Host ('tag no index.html  : ' + $okTag) -ForegroundColor $(if ($okTag) { 'Green' } else { 'Red' })
if ($okJs -and $okTag) {
    Write-Host 'TUDO CERTO. Abra o index.html no navegador (F12 p/ console).' -ForegroundColor Cyan
} else {
    Write-Host 'ALGO FALHOU - restaure do backup: ' $backup -ForegroundColor Red
    exit 1
}