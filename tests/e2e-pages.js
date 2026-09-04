/* E2E no GitHub Pages real: ficha deve usar o Railway como proxy */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));

  await page.goto('https://xbrancox.github.io/mudabrasil/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  async function check(nome, label) {
    await page.evaluate(() => go('radar'));
    await page.fill('#cbusca', nome);
    await page.waitForTimeout(1500);
    let txt = '';
    for (let t = 0; t < 45; t++) {
      txt = await page.evaluate(() => {
        const h = [...document.querySelectorAll('#radList h4')].find(e => e.textContent.includes('Como votou'));
        if (!h) return '';
        return h.textContent + ' :: ' + (h.nextElementSibling ? h.nextElementSibling.textContent : '');
      });
      if (txt && !txt.includes('Carregando')) break;
      await page.waitForTimeout(1000);
    }
    console.log('--- ' + label + ' ---');
    console.log(txt.slice(0, 300));
    await page.fill('#cbusca', '');
  }

  await check('Acácio Favacho', 'DEPUTADO no Pages');
  await check('Alan Rick', 'SENADOR no Pages');

  console.log('--- pageerrors:', errors.length);
  errors.forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(0);
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
