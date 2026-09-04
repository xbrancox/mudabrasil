/* Teste Playwright — fluxo completo do Termômetro (modo real) */
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  // aceita dialogs (confirm do revogar)
  page.on('dialog', async d => { console.log('   [dialog]', d.message().slice(0, 60)); await d.accept(); });

  const step = (ok, msg) => console.log((ok ? '  ✅ ' : '  ❌ ') + msg);

  await page.goto(BASE + '/pages/termometro.html', { waitUntil: 'networkidle' });
  await sleep(1500); // espera carga real

  // 1) Modo real
  const badge = await page.textContent('#source-badge');
  step(badge.includes('Dados reais'), 'badge real: "' + badge.trim().slice(0, 50) + '"');

  // 2) Métricas carregadas
  const ativos0 = await page.textContent('#m-ativos');
  step(true, 'métricas iniciais — ativos=' + ativos0.trim() + ' revogados=' + (await page.textContent('#m-revogados')).trim());

  // 3) Buscar parlamentar
  await page.fill('#pol-search', 'marina');
  await sleep(500);
  const items = await page.$$('.pol-item[data-id]');
  step(items.length > 0, 'busca "marina" → ' + items.length + ' resultado(s)');

  // 4) Selecionar o primeiro
  await page.click('.pol-item[data-id]');
  await sleep(300);
  const selName = await page.textContent('#sp-name');
  step(true, 'selecionado: ' + selName.trim());
  const consentVisible = await page.isVisible('#consent-note');
  step(consentVisible, 'mensagem pré-confirmação (R3) visível');

  // 5) Votar
  const canVote = await page.isEnabled('#btn-votar');
  step(canVote, 'botão "Expressar confiança" habilitado');
  await page.click('#btn-votar');
  await sleep(1200);
  const modalVisible = await page.isVisible('#code-modal');
  step(modalVisible, 'modal do código (R4) abriu');
  const code = (await page.textContent('#code-display')).trim();
  step(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code), 'código gerado: ' + code);

  // 6) Fechar modal
  await page.click('#btn-close-code');
  await sleep(400);
  const inputCode = await page.inputValue('#code-input');
  step(inputCode === code, 'código pré-preenchido no campo (e salvo em mb_codigo)');

  // 7) Ver meu voto (mascarado - R6)
  await page.click('#btn-ver');
  await sleep(900);
  const masked = await page.textContent('#myvote-name');
  step(masked.includes('•'), 'nome MASCARADO por padrão (R6): "' + masked.trim() + '"');
  step(await page.isVisible('#myvote-toggle'), 'botão "Mostrar" presente');

  // 8) Revelar
  await page.click('#myvote-toggle');
  await sleep(300);
  const revealed = await page.textContent('#myvote-name');
  step(revealed === selName.trim() && !revealed.includes('•'), 'nome revelado ao tocar: "' + revealed.trim() + '"');

  // 9) Manter meu voto (reafirmar)
  await page.click('#btn-manter');
  await sleep(900);
  const manterMsg = await page.textContent('#my-vote-box');
  step(manterMsg.includes('reafirmado'), '"Manter meu voto" reafirmou');

  // 10) Métricas subiram (coloca)
  const ativos1 = parseInt((await page.textContent('#m-ativos')).trim(), 10);
  step(ativos1 >= 1, 'termômetro registrou o voto — ativos=' + ativos1);

  // 11) Revogar (tira)
  await page.click('#btn-revogar');
  await sleep(1200);
  const revMsg = await page.textContent('#my-vote-box');
  step(revMsg.includes('revogado'), 'voto REVOGADO: "' + revMsg.trim().slice(0, 50) + '"');
  const ativos2 = parseInt((await page.textContent('#m-ativos')).trim(), 10);
  const revog1 = parseInt((await page.textContent('#m-revogados')).trim(), 10);
  step(ativos2 === ativos1 - 1, 'depois de revogar: ativos ' + ativos1 + '→' + ativos2);
  step(revog1 >= 1, 'revogados contabilizados: ' + revog1);

  // 12) Ranking renderizou
  const rows = await page.$$('.thermo-row');
  step(rows.length > 0, 'ranking ao vivo com ' + rows.length + ' linha(s)');

  // 13) Gráfico de tendência
  const canvas = await page.$('#trendChart');
  step(!!canvas, 'canvas de tendência presente');

  await page.screenshot({ path: 'tests/screenshots/termometro-real.png', fullPage: true });

  console.log('\n=== ERROS DE CONSOLE/PAGE ===');
  if (errors.length === 0) console.log('  ✅ nenhum erro');
  else errors.forEach(e => console.log('  ❌ ' + e));

  await browser.close();
  process.exit(errors.length === 0 ? 0 : 1);
})().catch(e => { console.error('FALHA NO TESTE:', e); process.exit(2); });
