/* E2E: fluxo de verificacao de politico (solicitar -> token dev -> confirmar -> selo) */
const { chromium } = require('playwright');

(async () => {
  const BASE = process.env.BASE_URL || 'http://localhost:8091';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
  let solicitResp = null;
  page.on('response', r => { if (r.url().includes('/api/verificacao/solicitar')) solicitResp = r; });

  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // abre a ficha do deputado e clica em "É você? Verificar"
  await page.evaluate(() => go('radar'));
  await page.fill('#cbusca', 'Acácio Favacho');
  await page.waitForTimeout(1500);
  await page.$eval('[onclick*="souPolitico"]', e => e.click());
  await page.waitForTimeout(500);

  const alvo = await page.$eval('#verifAlvo', e => e.textContent);
  console.log('alvo no modal:', alvo);

  // passo 1: e-mail institucional
  await page.fill('#vEmail', 'acacio.favacho@camara.leg.br');
  const respPromise = page.waitForResponse(r => r.url().includes('/api/verificacao/solicitar'), { timeout: 20000 });
  await page.$eval('#verifPasso1 [onclick*="solicitarCodigo"]', e => e.click());
  const resp = await respPromise;
  const data = await resp.json();
  console.log('solicitar status:', resp.status, '| ok:', data.ok, '| token presente:', !!data.token, '| devConfirmUrl:', !!data.devConfirmUrl);
  if (!data.token) { console.log('SEM TOKEN — abortando'); await browser.close(); process.exit(1); }

  // passo 2: cola o token e confirma
  await page.fill('#vCodigo', data.token);
  await page.$eval('#verifPasso2 [onclick*="confirmarCodigo"]', e => e.click());
  await page.waitForTimeout(1500);

  // selo visivel na ficha?
  const badgeTxt = await page.$$eval('#radList .badge', els => els.map(e => e.textContent.trim()));
  console.log('badges da ficha após confirmação:', badgeTxt.join(' | '));
  await page.screenshot({ path: 'tests/screenshots/test-verificacao-selo.png' });
  console.log('screenshot salvo: tests/screenshots/test-verificacao-selo.png');

  // /api/candidatos agora reflete o selo?
  const api = await page.evaluate(() => fetch('/api/candidatos').then(r => r.json()));
  const alvoApi = (api.candidatos || []).find(c => c.id === 'camara-204379');
  console.log('selo no /api/candidatos:', alvoApi ? !!alvoApi.selo : '(não encontrado)');

  // auto-limpeza: remove a verificação de teste do db
  try {
    const { DatabaseSync } = require('node:sqlite');
    const path = require('path');
    const dbf = new DatabaseSync(path.join(__dirname, '..', 'server', 'data', 'votos.db'));
    const del = dbf.prepare('DELETE FROM verifications').run();
    console.log('[cleanup] verificações de teste removidas:', del.changes);
    dbf.close();
  } catch (ce) { console.log('[cleanup] skip:', ce.message); }

  console.log('--- pageerrors:', errors.length);
  errors.forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(0);
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
