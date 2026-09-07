const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 950 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
  await p.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(5000);
  await p.evaluate(() => go('radar'));
  await p.fill('#cbusca', 'favacho');
  await sleep(6000);
  const ficha = await p.$$eval('#radList .card', els => els.length).catch(() => 0);
  const fstats = await p.$eval('#fstats-0', e => e.textContent.slice(0, 120)).catch(() => '(sem fstats)');
  const modalOk = await p.$eval('[onclick*="abrirDados"]', e => !!e).catch(() => false);
  let modalGrupos = '';
  if (modalOk) {
    await p.$eval('[onclick*="abrirDados"]', e => e.click());
    await sleep(1500);
    modalGrupos = await p.$$eval('#dadosBody h4', els => els.map(e => e.textContent.trim()).join(' | ')).catch(() => '');
    await p.evaluate(() => fechar('mDados'));
  }
  await sleep(400);
  const votoClick = await p.$$eval('#radList .quote.info[onclick*="abrirVotacao"]', els => els.length).catch(() => 0);
  if (votoClick) {
    await p.$eval('#radList .quote.info[onclick*="abrirVotacao"]', e => e.click());
    await sleep(2500);
    const placar = await p.$$eval('#votosBody .badge', els => els.map(e => e.textContent.trim()).slice(0, 6).join(' | ')).catch(() => '');
    console.log('popup placar:', placar);
    await p.evaluate(() => fechar('mVotos'));
  } else console.log('popup: sem votação clicável nesta ficha agora');
  await sleep(400);
  console.log('--- RESUMO UI ---');
  console.log('fichas:', ficha, '| fstats:', fstats);
  console.log('grupos do modal:', modalGrupos);
  console.log('votações clicáveis:', votoClick);
  console.log('pageerrors:', errs.length, '|', errs.slice(0, 3).join(' | '));
  await p.screenshot({ path: 'shots/9-pos-merge-ficha.png' }).catch(() => {});
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
