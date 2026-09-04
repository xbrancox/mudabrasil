/* Teste Playwright — Plataforma ao vivo (Fase 4)
   ------------------------------------------------------------
   Pré-requisito: servidor rodando em http://localhost:8091
   (a urna é limpa automaticamente no início do teste). Cobre:
   1. Home: painel "Plataforma ao vivo" em modo real
   2. Status: painel real
   3. SSE E2E entre páginas: votar no Termômetro atualiza a Home
      SEM reload (o coração batendo ao vivo)
   4. Modo demo (API bloqueada): home/termômetro/status caem no
      fallback sem quebrar

   Uso: NODE_PATH=$(npm root -g) node tests/test-live.js
*/
const path = require('path');
const { chromium } = require('playwright');
const db = require(path.join(__dirname, '..', 'server', 'db.js'));

const BASE = 'http://localhost:8091';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // urna limpa para o teste (mesma camada de armazenamento do servidor)
  db.init();
  db.clear();
  const browser = await chromium.launch();
  let pass = 0, fail = 0;
  const step = (ok, msg) => { console.log((ok ? '  ✅ ' : '  ❌ ') + msg); ok ? pass++ : fail++; };

  /* ---------- A) HOME MODO REAL ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await sleep(1800);

    const badge = (await page.textContent('#live-badge')).trim();
    step(badge.includes('Ao vivo'), 'Home: selo real — "' + badge + '"');
    const ativos = (await page.textContent('#live-ativos')).trim();
    step(/^\d+(\.\d+)?$/.test(ativos), 'Home: votos ativos numéricos — "' + ativos + '"');
    step(
      (await page.textContent('#live-top-name')).includes('Liderança') ||
      (await page.textContent('#live-top-name')).includes('Ainda não há'),
      'Home: linha de liderança presente — "' + (await page.textContent('#live-top-name')).trim() + '"'
    );
    step(errors.length === 0, 'Home real: 0 erros de JS' + (errors.length ? ' — ' + errors[0] : ''));
    await page.close();
  }

  /* ---------- B) STATUS MODO REAL ---------- */
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    await page.goto(BASE + '/pages/status.html', { waitUntil: 'networkidle' });
    await sleep(1800);
    const badge = (await page.textContent('#source-badge')).trim();
    step(badge.includes('Dados reais'), 'Status: selo real — "' + badge + '"');
    step(errors.length === 0, 'Status real: 0 erros de JS');
    await page.close();
  }

  /* ---------- C) SSE E2E ENTRE PÁGINAS ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const home = await ctx.newPage();
    const thermo = await ctx.newPage();

    await home.goto(BASE + '/', { waitUntil: 'networkidle' });
    await sleep(1800);
    const antes = parseInt((await home.textContent('#live-ativos')).trim()) || 0;

    // vota na outra página
    await thermo.goto(BASE + '/pages/termometro.html', { waitUntil: 'networkidle' });
    await sleep(1800);
    await thermo.fill('#pol-search', 'silva');
    await sleep(600);
    const items = await thermo.$$('.pol-item[data-id]');
    step(items.length > 0, 'E2E: busca encontrou parlamentar');
    await thermo.click('.pol-item[data-id]');
    await sleep(300);
    await thermo.click('#btn-votar');
    await sleep(1200);
    const modalOk = await thermo.isVisible('#code-modal');
    step(modalOk, 'E2E: voto colocado (modal do código)');
    await thermo.click('#btn-close-code');

    // a Home deve atualizar SOZINHA (SSE), sem reload
    let depois = antes, ok = false;
    for (let i = 0; i < 12; i++) {
      await sleep(500);
      depois = parseInt((await home.textContent('#live-ativos')).trim()) || 0;
      if (depois > antes) { ok = true; break; }
    }
    step(ok, 'E2E: Home atualizou sozinha via SSE (ativos ' + antes + ' → ' + depois + ', sem reload)');
    await ctx.close();
  }

  /* ---------- D) MODO DEMO (API bloqueada) ---------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route('**/api/**', route => route.abort());
    const errors = [];

    const home = await ctx.newPage();
    home.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    await home.goto(BASE + '/', { waitUntil: 'networkidle' });
    await sleep(1500);
    const b1 = (await home.textContent('#live-badge')).trim();
    const a1 = (await home.textContent('#live-ativos')).trim();
    step(b1.includes('Modo demo') && a1 === '132', 'Demo: Home em fallback (badge + 132 sintéticos) — "' + b1 + '"');

    const thermo = await ctx.newPage();
    thermo.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    await thermo.goto(BASE + '/pages/termometro.html', { waitUntil: 'networkidle' });
    await sleep(1500);
    const b2 = (await thermo.textContent('#source-badge')).trim();
    const rows = await thermo.$$('.thermo-row');
    step(b2.includes('Modo demo') && rows.length === 5, 'Demo: Termômetro com 5 linhas sintéticas — "' + b2 + '"');

    const status = await ctx.newPage();
    status.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    await status.goto(BASE + '/pages/status.html', { waitUntil: 'networkidle' });
    await sleep(1500);
    const b3 = (await status.textContent('#source-badge')).trim();
    step(b3.includes('Modo demo'), 'Demo: Status em fallback — "' + b3 + '"');

    step(errors.length === 0, 'Demo: 0 erros de JS nas 3 páginas' + (errors.length ? ' — ' + errors[0] : ''));
    await ctx.close();
  }

  await browser.close();
  console.log('');
  console.log(fail === 0 ? '🏆 TODOS OS ' + pass + ' CHECKS AO VIVO PASSARAM' : '💥 ' + fail + ' FALHAS (' + pass + ' ok)');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('💥 Erro fatal:', e.message); process.exit(1); });
