const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('http://localhost:8091/pages/termometro.html', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(4000);
  // tab expressar + vota no primeiro resultado de 'favacho'
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab('expressar'); });
  await sleep(300);
  await page.fill('#pol-search', 'favacho');
  await sleep(500);
  const n = await page.$$eval('.pol-item[data-id]', els => els.length);
  console.log('pol-items:', n);
  if (n) {
    await page.click('.pol-item[data-id]');
    await sleep(300);
    await page.click('#btn-votar');
    await sleep(1200);
    await page.click('#btn-close-code');
    await sleep(400);
  }
  // estado dos painéis e botões
  const st = await page.evaluate(() => {
    const vis = id => { const el = document.getElementById(id); if (!el) return '(sem)'; const cs = getComputedStyle(el); return 'disp=' + cs.display + ' vis=' + cs.visibility + ' disabled=' + el.disabled; };
    return {
      tabAtiva: [...document.querySelectorAll('.vote-tab')].find(t => t.classList.contains('active'))?.dataset.tab,
      panels: [...document.querySelectorAll('.tab-panel')].map(p => p.id + ':' + (p.classList.contains('active') ? 'ativa' : 'oculta')),
      btnVer: vis('btn-ver'), btnManter: vis('btn-manter'), btnRevogar: vis('btn-revogar'),
      voteActions: vis('vote-actions'), myVoteBox: vis('my-vote-box')
    };
  });
  console.log(JSON.stringify(st, null, 1));
  await browser.close();
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
