/* E2E: ficha do deputado no Radar com votações nominais (leitura via DOM) */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const bad = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('[console] ' + m.text()); });
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().slice(0, 120)); });

  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // ativa a seção Radar e busca o deputado
  await page.evaluate(() => go('radar'));
  await page.fill('#cbusca', 'Acácio Favacho');
  await page.waitForTimeout(1500);

  // espera a sondagem de votações terminar no DOM (mensagem final ou badges de voto)
  let votesTxt = '';
  for (let t = 0; t < 90; t++) {
    votesTxt = await page.evaluate(() => {
      const els = [...document.querySelectorAll('#radList h4')];
      const h = els.find(e => e.textContent.includes('Como votou'));
      if (!h) return '';
      let out = h.textContent + ' :: ';
      let n = h.nextElementSibling;
      out += n ? n.textContent : '';
      return out;
    });
    if (votesTxt && !votesTxt.includes('Carregando')) break;
    await page.waitForTimeout(1000);
  }
  console.log('--- DEPUTADO: seção Como votou (DOM) ---');
  console.log(votesTxt.slice(0, 800));

  const badges = await page.$$eval('#radList .quote.info .badge', els => els.map(e => e.textContent.trim()));
  console.log('badges de voto:', badges.join(' | '));

  await page.screenshot({ path: 'tests/screenshots/test-ficha-votos.png', fullPage: true });
  console.log('screenshot salvo: tests/screenshots/test-ficha-votos.png');

  // SENADOR: Alan Rick (codigo 5672, endpoint historico de votacoes do Senado)
  await page.fill('#cbusca', 'Alan Rick');
  await page.waitForTimeout(1500);
  let votesTxtS = '';
  for (let t = 0; t < 30; t++) {
    votesTxtS = await page.evaluate(() => {
      const els = [...document.querySelectorAll('#radList h4')];
      const h = els.find(e => e.textContent.includes('Como votou'));
      if (!h) return '';
      let out = h.textContent + ' :: ';
      let n = h.nextElementSibling;
      out += n ? n.textContent : '';
      return out;
    });
    if (votesTxtS && !votesTxtS.includes('Carregando')) break;
    await page.waitForTimeout(1000);
  }
  console.log('--- SENADOR: seção Como votou (DOM) ---');
  console.log(votesTxtS.slice(0, 800));
  const badgesS = await page.$$eval('#radList .quote.info .badge', els => els.map(e => e.textContent.trim()));
  console.log('badges de voto (senador):', badgesS.join(' | '));
  await page.screenshot({ path: 'tests/screenshots/test-ficha-votos-senador.png', fullPage: true });
  console.log('screenshot salvo: tests/screenshots/test-ficha-votos-senador.png');

  // VER TODAS: modal dados públicos do senador — botão deve expandir para o histórico completo
  const btnDados = await page.$('[onclick*="abrirDados"]');
  if (btnDados) {
    await btnDados.click();
    await page.waitForTimeout(800);
    const antes = await page.$$eval('#dadosBody .quote.info', els => els.length);
    const rotulo = await page.$eval('#dadosBody [onclick*="verTodas"]', e => e.textContent).catch(() => '(sem botão)');
    await page.$eval('#dadosBody [onclick*="verTodas"]', e => e.click()).catch(() => {});
    await page.waitForTimeout(800);
    const depois = await page.$$eval('#dadosBody .quote.info', els => els.length);
    console.log('--- VER TODAS (senador) ---');
    console.log('rotulo:', rotulo.trim(), '| antes:', antes, '| depois:', depois);
    await page.screenshot({ path: 'tests/screenshots/test-modal-ver-todas.png' });
    console.log('screenshot salvo: tests/screenshots/test-modal-ver-todas.png');
  }

  console.log('--- recursos >=400:', bad.length);
  bad.forEach(e => console.log('  ', e));
  console.log('--- erros de console/pageerror:', errors.length);
  errors.forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(0);
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
