const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 1100 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  // 1) Ficha com grid de stats
  await p.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle', timeout: 30000 });
  await p.evaluate(() => go('radar'));
  await p.fill('#cbusca', 'favacho');
  await sleep(5000); // dados + votações
  await p.screenshot({ path: 'shots/1-ficha.png', fullPage: false });

  // 2) Modal dados públicos (grupos)
  await p.$eval('[onclick*="abrirDados"]', e => e.click());
  await sleep(800);
  await p.screenshot({ path: 'shots/2-modal-dados.png', fullPage: false });
  // scroll do modal p/ segunda parte
  await p.$eval('#dadosBody', e => { const m = e.closest('.modal'); if (m) m.scrollTop = m.scrollHeight; const t = document.querySelector('#dadosBody'); if (t) window.scrollTo(0, 0); });
  await sleep(300);
  await p.evaluate(() => { const el = document.getElementById('dadosBody'); el.scrollIntoView({ block: 'end' }); });
  await p.screenshot({ path: 'shots/3-modal-dados-fim.png', fullPage: false });
  await p.$eval('[onclick="fechar(\'mDados\')"]', e => e.click()).catch(() => {});
  await sleep(300);

  // 3) Popup "Quem votou" (clicar na votação da ficha)
  const temVoto = await p.$$eval('#radList .quote.info', els => els.filter(e => e.getAttribute('onclick')).length).catch(() => 0);
  if (temVoto) {
    await p.$eval('#radList .quote.info[onclick*="abrirVotacao"]', e => e.click());
    await sleep(2500);
    await p.screenshot({ path: 'shots/4-popup-quem-votou.png', fullPage: false });
  } else { console.log('sem votação clicável na ficha (Acácio)'); }

  await p.evaluate(() => fechar('mVotos'));
  await sleep(300);
  // 4) Congresso: botão votações por PL
  await p.evaluate(() => go('congresso'));
  await sleep(2000);
  await p.screenshot({ path: 'shots/5-congresso.png', fullPage: false });
  const btnV = await p.$('[onclick*="abrirVotacoesPL"]');
  if (btnV) {
    await btnV.click();
    await sleep(2500);
    await p.screenshot({ path: 'shots/6-congresso-votacoes.png', fullPage: false });
  }

  console.log('pageerrors:', errs.length);
  await b.close();
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
