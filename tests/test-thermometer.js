// test-thermometer.js — Ciclo completo do Termômetro (21 checks)
// Requer: node 22+, fetch global. Inicia o servidor.
// Uso: node tests/test-thermometer.js

(async () => {
  const { spawn } = require('node:child_process');
  const path = require('node:path');
  const fs = require('node:fs');

  const ROOT = path.resolve(__dirname, '..');
  const DATA_DIR = path.join(ROOT, 'server', 'data');
  const BASE = 'http://localhost:8080';

  let pass = 0, fail = 0;
  function ok(label, cond, detail = '') {
    if (cond) { pass++; console.log('  ✅', label); }
    else { fail++; console.log('  ❌', label, detail); }
  }
  async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  // limpa dados
  for (const f of ['votos.db', '.salt', 'votos.json']) {
    try { fs.rmSync(path.join(DATA_DIR, f), { force: true }); } catch {}
  }

  const srv = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await wait(3000);

  async function api(path, opts) {
    const res = await fetch(BASE + path, opts);
    const text = await res.text();
    let j; try { j = JSON.parse(text); } catch { j = text; }
    return { status: res.status, ok: res.ok, data: j };
  }

  try {
    // 1) Health
    const h = await api('/api/health');
    ok('health 200', h.status === 200);

    // 2) candidatos
    const c = await api('/api/candidatos');
    ok('candidatos 200', c.status === 200);
    ok('total >= 513', c.data.total >= 513);

    const pol = c.data.candidatos[0];

    // 3) coloca voto
    const pv = await api('/api/voto', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ politicianId: pol.id, uf: pol.state })
    });
    ok('POST /api/voto sucesso', pv.status >= 200 && pv.status < 300);
    ok('responde com code', typeof pv.data.code === 'string');
    ok('code formato 4x4', /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(pv.data.code));
    const code = pv.data.code;

    // 4) consulta voto
    const gv = await api(`/api/voto?code=${code}`);
    ok('GET /api/voto ok', gv.ok);
    ok('nome mascarado (ballot.politicianId presente)', gv.data.ballot.politicianId === pol.id);
    ok('peso 1.0', gv.data.ballot.pesoAtual === 1);
    ok('precisaReafirmar false', gv.data.ballot.precisaReafirmar === false);

    // 5) manter
    const kv = await api('/api/voto/manter', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code })
    });
    ok('manter ok', kv.ok);

    // 6) termometro
    const tm = await api('/api/termometro');
    ok('termometro 200', tm.status === 200);
    ok('totalVotosAtivos >= 1', tm.data.totalVotosAtivos >= 1);
    ok('topN array', Array.isArray(tm.data.topN));
    ok('tem pol votado no topN', tm.data.topN.some(x => x.politicianId === pol.id));

    // 7) revogar
    const rv = await api('/api/voto/revogar', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code })
    });
    ok('revogar ok', rv.ok);

    const tm2 = await api('/api/termometro');
    ok('totalRevogados >= 1', tm2.data.totalRevogados >= 1);

    // 8) code inválido
    const bad = await api('/api/voto?code=INVALIDO-XXXX-YYYY-ZZZZ');
    ok('code inválido retorna erro', bad.status !== 200 || !bad.data.ok);

    // 9) rate limit (simula rápido)
    let rl = 0;
    for (let i = 0; i < 25; i++) {
      const r = await api('/api/voto', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ politicianId: pol.id })
      });
      if (r.status === 429) rl++;
    }
    ok('rate-limit ativo (>= 1 bloqueio em 25 tentativas)', rl >= 1);

    // 10) SSE endpoint existe
    const sse = await fetch(BASE + '/api/stream', { headers: { 'accept': 'text/event-stream' } });
    ok('SSE 200', sse.status === 200);
    ok('SSE content-type text/event-stream', (sse.headers.get('content-type') || '').includes('text/event-stream'));
    sse.body?.cancel();

  } catch (e) {
    ok('execução sem exceção', false, e.message);
  } finally {
    srv.kill('SIGTERM');
    await wait(500);
    console.log(`\n==========================================`);
    console.log(`✅ ${pass} OK  /  ❌ ${fail} FALHOU`);
    console.log(`==========================================\n`);
    process.exit(fail === 0 ? 0 : 1);
  }
})();
