const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => { console.log('[pageerror]', e.message); console.log((e.stack || '').split('\n').slice(0, 6).join('\n')); console.log('---'); });
  page.on('response', r => { if (r.url().includes('/api/')) console.log('[api]', r.status(), r.url().slice(0, 80)); });
  await page.goto('http://localhost:8091/pages/termometro.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log('URL final:', page.url());
  const badge = await page.textContent('#source-badge').catch(() => '(sem badge)');
  const pols = await page.$$eval('.pol-item[data-id]', els => els.length).catch(() => -1);
  console.log('badge final:', String(badge).trim().slice(0, 80), '| pol-items:', pols);
  await browser.close();
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
