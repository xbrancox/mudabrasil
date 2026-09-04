const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 8099;
const SERVER_PATH = path.join(ROOT, 'server', 'index.js');

let serverProcess = null;

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', [SERVER_PATH], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('MudaBrasil rodando em') && output.includes(String(PORT))) {
        console.log('[test] Servidor MudaBrasil iniciado na porta ' + PORT);
        setTimeout(resolve, 2000); // Aguarda carregamento inicial + API
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[test-err]', data.toString());
    });

    serverProcess.on('error', (err) => reject(err));

    setTimeout(() => reject(new Error('Timeout ao iniciar servidor')), 20000);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

(async () => {
  try {
    const server = await startServer();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
    page.on('pageerror', e => errors.push('[pageerror] ' + e.message));

    const base = `http://localhost:${PORT}`;
    const pages = [
      '/index.html', '/pages/candidatos.html', '/pages/proposta.html',
      '/pages/status.html', '/pages/revogar.html', '/pages/comunidade.html'
    ];
    const results = {};

    console.log('=== Teste de Renderização ===\n');

    // 1) Testar carregamento de todas as páginas principais
    for (const p of pages) {
      try {
        await page.goto(base + p, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500);
        const title = await page.title();
        const hasBody = await page.locator('body').isVisible();
        results[p] = { status: 'ok', title, hasBody };
        console.log('  ✅ ' + p);
      } catch (e) {
        results[p] = { status: 'FAIL', error: e.message };
        console.log('  ❌ ' + p + ' - ' + e.message);
      }
    }

    // 2) Teste específico de candidatos
    await page.goto(base + '/pages/candidatos.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Espera carregar dados da API

    // Verificar cards
    const cardCount = await page.locator('.candidate-card').count();
    results['candidatos'] = { cards: cardCount };
    console.log('  ✅ candidatos.com - ' + cardCount + ' cards renderizados');

    // Contagem de resultados
    const resultEl = await page.$('#result-count');
    if (resultEl) {
      const resultText = await resultEl.textContent();
      results['result-count'] = resultText.trim();
      console.log('  ✅ result-count: ' + resultText.trim());
    } else {
      results['result-count'] = 'elemento não encontrado';
      console.log('  ⚠️  result-count: elemento não encontrado (pode ser dinâmico)');
    }

    // 3) Screenshots
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/test-home.png', fullPage: true });
    console.log('  ✅ Screenshot da home salvo');

    await page.goto(base + '/pages/candidatos.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/test-candidatos.png', fullPage: true });
    console.log('  ✅ Screenshot da candidatos salvo');

    await browser.close();
    stopServer();

    console.log('\n========== RESULTADOS DO TESTE =========');
    console.log(JSON.stringify(results, null, 2));
    console.log('\n========== ERROS DE CONSOLE/PAGE =========');
    if (errors.length === 0) console.log('  ✅ Nenhum erro de console.');
    else errors.forEach(e => console.log('  ❌ ' + e));
    console.log('\n========== FIM =========');

    process.exit(0);

  } catch (e) {
    console.error('TESTE FALHOU:', e);
    stopServer();
    process.exit(1);
  }
})();