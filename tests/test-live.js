/* ============================================================
   MudaBrasil - Plataforma ao vivo (E2E SSE entre páginas)
   Pré-requisito: servidor em http://localhost:8091
   Cobre:
   1. Home: badge "políticos reais" (backend) + contador de votos
   2. SSE: voto via API atualiza a Home SEM reload
   3. Status: página carrega em modo real sem erros de console
   Uso: node tests/test-live.js  (servidor na 8091 já rodando)
   ============================================================ */
const { chromium } = require('playwright');

const BASE = 'http://localhost:8091';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let pass = 0, fail = 0;
  const step = (ok, msg) => { console.log((ok ? '✅ ' : '❌ ') + msg); ok ? pass++ : fail++; };
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  /* ---------- 1) HOME MODO REAL ---------- */
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const bReais = (await page.textContent('#bReais').catch(() => '')) || '';
  step(/políticos reais/.test(bReais), 'home em modo real: "' + bReais.trim() + '"');
  const bVotos0 = (await page.textContent('#bVotos').catch(() => '')) || '';
  step(bVotos0.length > 0, 'contador de votos presente: "' + bVotos0.trim() + '"');

  /* ---------- 2) SSE: voto atualiza a home sem reload ---------- */
  // garante a tab do radar não interferir: vota direto pela API e observa o badge
  const antes = (await page.evaluate(() => fetch('/api/termometro').then(r => r.json()))).totalVotosAtivos;
  await page.evaluate(() => fetch('/api/voto', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ politicianId: 'camara-204379', uf: 'SP' })
  }).then(r => r.json()));
  let mudou = false;
  for (let i = 0; i < 15; i++) {
    await sleep(1000);
    const agora = (await page.textContent('#bVotos').catch(() => '')) || '';
    if (/1 voto registrado/.test(agora) && antes === 0) { mudou = true; break; }
    if (antes > 0 && !agora.includes(antes + ' votos')) { mudou = true; break; }
  }
  const bVotos1 = (await page.textContent('#bVotos').catch(() => '')) || '';
  step(mudou || /1 voto/.test(bVotos1), 'SSE: home atualizou sem reload — "' + bVotos1.trim() + '"');

  /* ---------- 3) STATUS ---------- */
  const statusErrors = [];
  const p2 = await browser.newPage();
  p2.on('pageerror', e => statusErrors.push(e.message));
  await p2.goto(BASE + '/pages/status.html', { waitUntil: 'networkidle', timeout: 30000 });
  await p2.waitForTimeout(2000);
  step(statusErrors.length === 0, 'status.html carrega sem erros de página');

  console.log('\n========== test-live: ' + pass + ' passou, ' + fail + ' falharam ==========');
  if (errors.length) console.log('pageerrors na home:', errors.slice(0, 5));
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('💥 Erro fatal:', e.message); process.exit(1); });
