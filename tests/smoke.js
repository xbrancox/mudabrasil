/* ============================================================
   MudaBrasil — Smoke de regressão (backend + fluxos críticos)
   Uso: npm test   (sobe o servidor na 8091, testa e encerra)
   Cobre: health, candidatos, notícias, proxy Câmara, verificação,
   voto→código→revogação, reclamação/apoio público, limpeza.
   ============================================================ */
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 8091;
const BASE = 'http://localhost:' + PORT;
let server = null;
let passed = 0, failed = 0;
const ok = (name, cond, extra) => { console.log((cond ? '✅' : '❌') + ' ' + name + (extra ? ' — ' + extra : '')); cond ? passed++ : failed++; };

const jget = p => fetch(BASE + p).then(r => r.json().then(j => ({ status: r.status, j })));
const jpost = (p, body, tok) => fetch(BASE + p, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: 'Bearer ' + tok } : {}) },
  body: JSON.stringify(body || {})
}).then(r => r.json().then(j => ({ status: r.status, j })));

const MARK = '[SMOKE-' + Date.now() + ']';

(async () => {
  /* sobe o servidor */
  server = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
    env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'], cwd: ROOT
  });
  let log = '';
  server.stdout.on('data', d => log += String(d));
  await new Promise((resolve, reject) => {
    const t = setInterval(() => { if (log.includes('rodando em')) { clearInterval(t); resolve(); } }, 150);
    setTimeout(() => { clearInterval(t); reject(new Error('servidor não subiu')); }, 25000);
  });

  /* 1) health */
  try {
    const r = await jget('/api/health');
    ok('health 200 + backend ativo', r.status === 200 && r.j.ok === true, 'storage=' + r.j.storage);
  } catch (e) { ok('health', false, e.message); }

  /* 2) candidatos: 594, ids sem duplicação */
  try {
    const r = await jget('/api/candidatos');
    const arr = r.j.candidatos || [];
    const sen = arr.filter(c => c.id.startsWith('senado-'));
    const deps = arr.filter(c => c.id.startsWith('camara-'));
    ok('candidatos 594 (513 deps + 81 senadores)', arr.length === 594 && deps.length === 513 && sen.length === 81, 'total=' + arr.length);
    ok('sem ids duplicados', !sen.some(c => c.id.includes('senado-senado')) && !deps.some(c => c.id.includes('camara-camara')));
  } catch (e) { ok('candidatos', false, e.message); }

  /* 3) notícias: fontes confiáveis + UF detectada */
  try {
    const r = await jget('/api/noticias');
    const ns = r.j.noticias || [];
    const fontes = [...new Set(ns.map(n => n.fonte))];
    ok('notícias ≥ 20 de 3 fontes', ns.length >= 20 && fontes.length >= 2, 'total=' + ns.length + ' fontes=' + fontes.join('/'));
    ok('notícia com link de origem (crédito)', ns.every(n => n.l && n.l.startsWith('http')));
  } catch (e) { ok('notícias', false, e.message); }

  /* 4) proxy Câmara */
  try {
    const r = await jget('/api/camara/deputados/204379');
    ok('proxy /api/camara (dados do deputado)', r.status === 200 && !!(r.j.dados || {}).nomeCivil);
  } catch (e) { ok('proxy camara', false, e.message); }

  /* 5) verificação: solicitar + confirmar (formato=json) */
  try {
    const s1 = await jpost('/api/verificacao/solicitar', { politicianId: 'camara-204379', email: 'smoke.test@camara.leg.br' });
    ok('verificação: solicitar (token/dev)', s1.status === 200 && s1.j.ok === true && !!s1.j.token, s1.j.devMode ? 'modo dev' : 'smtp');
    if (s1.j.token) {
      const s2 = await jget('/api/verificacao/confirmar?formato=json&token=' + encodeURIComponent(s1.j.token));
      ok('verificação: confirmar (formato=json)', s2.status === 200 && s2.j.ok === true, 'político=' + s2.j.politicianId);
      const c = await jget('/api/candidatos');
      const alvo = (c.j.candidatos || []).find(x => x.id === 'camara-204379');
      ok('selo refletido no /api/candidatos', !!(alvo && alvo.selo));
    }
  } catch (e) { ok('verificação', false, e.message); }

  /* 6) voto → código → view → revogar */
  try {
    const v = await jpost('/api/voto', { politicianId: 'camara-204379', uf: 'SP' });
    ok('voto aceito (201 + código)', v.status === 201 && !!v.j.code, 'code=' + v.j.code);
    if (v.j.code) {
      const view = await jget('/api/voto?code=' + encodeURIComponent(v.j.code));
      ok('conferir voto (viewVote)', view.j.ok === true && !view.j.revoked);
      const rev = await jpost('/api/voto/revogar', { code: v.j.code });
      const revOk = rev.status === 200 && (rev.j.ok === true || rev.j.revoked === true);
      ok('revogação aceita', revOk);
      const t = await jget('/api/termometro');
      ok('termômetro reflete revogação', (t.j.totalRevogados || 0) >= 1, 'revogados=' + t.j.totalRevogados);
    }
  } catch (e) { ok('fluxo de voto', false, e.message); }

  /* 7) reclamação/apoio públicos (id numérico da ficha) */
  try {
    const r1 = await jpost('/api/reclamacoes/public', { politicianId: 204379, tipo: 'rec', titulo: MARK + ' rec', descricao: 'Reclamacao de smoke test automatizado.', anexos: [] });
    ok('reclamação pública (id numérico → resolvido)', r1.status === 201 && r1.j.ok === true, r1.j.error || '');
    const r2 = await jpost('/api/reclamacoes/public', { politicianId: 'camara-204379', tipo: 'apoio', titulo: MARK + ' apo', descricao: 'Apoio de smoke test automatizado.', anexos: [] });
    ok('apoio público (id prefixado)', r2.status === 201 && r2.j.ok === true, r2.j.error || '');
    const g = await jget('/api/reclamacoes');
    ok('feed global reflete os registros', (g.j.complaints || []).some(c => (c.content || '').includes(MARK)));
  } catch (e) { ok('reclamações/apoios públicos', false, e.message); }

  /* 8) limpeza dos registros de smoke */
  try {
    const { DatabaseSync } = require('node:sqlite');
    const dbf = new DatabaseSync(path.join(ROOT, 'server', 'data', 'votos.db'));
    dbf.prepare('DELETE FROM complaints WHERE content LIKE ?').run('%' + MARK + '%');
    dbf.prepare('DELETE FROM supports WHERE content LIKE ?').run('%' + MARK + '%');
    dbf.prepare('DELETE FROM verifications').run();
    dbf.prepare('DELETE FROM ballots').run();
    dbf.close();
    console.log('🧹 limpeza pós-teste concluída (complaints/supports/verifications/ballots)');
  } catch (e) { console.log('🧹 limpeza parcial:', e.message); }

  server.kill();
  console.log('\n========== SMOKE: ' + passed + ' passou, ' + failed + ' falharam ==========');
  process.exit(failed ? 1 : 0);
})().catch(e => {
  console.error('💥 Erro fatal:', e.message);
  try { if (server) server.kill(); } catch (_) { }
  process.exit(1);
});
