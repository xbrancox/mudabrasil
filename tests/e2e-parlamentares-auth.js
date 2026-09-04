/* Valida fluxo autenticado: OTP login -> reclamacoes/apoios -> listagem (com cleanup) */
const { chromium } = require('playwright');
const MARK = '[TEST-AUTO]';

(async () => {
  const base = 'http://localhost:8080';
  const email = 'smoke.test@mudabrasil.dev';

  // 1) login OTP (modo dev devolve o código)
  const s1 = await fetch(base + '/api/auth/email/send', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
  }).then(r => r.json());
  console.log('send OTP:', s1.ok, '| devCode:', !!s1.devCode);
  if (!s1.devCode) { console.log('sem devCode — abortando'); process.exit(1); }

  const s2 = await fetch(base + '/api/auth/email/verify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: s1.devCode })
  }).then(r => r.json());
  console.log('verify OTP:', s2.ok, '| sessionToken:', !!s2.sessionToken);
  const tok = s2.sessionToken;

  // 2) reclamação autenticada (id prefixado)
  const r1 = await fetch(base + '/api/reclamacoes', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken: tok, politicianId: 'camara-204379', content: MARK + ' reclamacao autenticada de teste' })
  });
  console.log('POST reclamacoes (autenticado):', r1.status, '| ok:', (await r1.json()).ok);

  // 3) apoio autenticado
  const r2 = await fetch(base + '/api/apoios', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken: tok, politicianId: 'camara-204379', content: MARK + ' apoio autenticado de teste' })
  });
  console.log('POST apoios (autenticado):', r2.status, '| ok:', (await r2.json()).ok);

  // 4) listagem
  const g = await fetch(base + '/api/reclamacoes?politicianId=camara-204379').then(x => x.json());
  console.log('reclamacoes listadas:', (g.complaints || []).length);
  const a = await fetch(base + '/api/apoios?politicianId=camara-204379').then(x => x.json());
  console.log('apoios listados:', (a.supports || []).length);

  // 5) smoke UI: parlamentares.html carrega e renderiza
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/pages/parlamentares.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const cards = await page.$$eval('.candidate-card, .parlamentar-card, [data-id]', els => els.length).catch(() => 0);
  const bodyTxt = (await page.textContent('body').catch(() => '')).slice(0, 120);
  console.log('parlamentares.html cards/dados:', cards, '| body head:', bodyTxt.replace(/\s+/g, ' ').slice(0, 90));
  console.log('pageerrors:', errors.length);
  await browser.close();

  // 6) cleanup best-effort (retry p/ lock do SQLite)
  for (let att = 0; att < 3; att++) {
    try {
      const { DatabaseSync } = require('node:sqlite');
      const dbf = new DatabaseSync(require('path').join(__dirname, '..', 'server', 'data', 'votos.db'));
      const dc = dbf.prepare('DELETE FROM complaints WHERE content LIKE ?').run('%' + MARK + '%');
      const ds = dbf.prepare('DELETE FROM supports WHERE content LIKE ?').run('%' + MARK + '%');
      const dv = dbf.prepare('DELETE FROM voters WHERE email = ?').run(email);
      dbf.close();
      console.log('[cleanup] complaints:', dc.changes, '| supports:', ds.changes, '| voters:', dv.changes);
      break;
    } catch (ce) { console.log('[cleanup] tentativa ' + (att + 1) + ' falhou:', ce.message); await sleep(1500); }
  }
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
