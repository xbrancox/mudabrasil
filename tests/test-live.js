// test-live.js — SSE em tempo real (4 checks)
(async () => {
  const { spawn } = require('node:child_process');
  const path = require('node:path');
  const fs = require('node:fs');

  const ROOT = path.resolve(__dirname, '..');
  const BASE = 'http://localhost:8080';
  const DATA_DIR = path.join(ROOT, 'server', 'data');

  let pass = 0, fail = 0;
  function ok(label, cond, detail = '') {
    if (cond) { pass++; console.log('  ✅', label); }
    else { fail++; console.log('  ❌', label, detail); }
  }
  async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  for (const f of ['votos.db', '.salt', 'votos.json']) {
    try { fs.rmSync(path.join(DATA_DIR, f), { force: true }); } catch {}
  }

  const srv = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], { stdio: ['ignore', 'pipe', 'pipe'] });
  await wait(3000);

  try {
    // 1) conecta SSE
    const ctrl = new AbortController();
    const sse = await fetch(BASE + '/api/stream', {
      signal: ctrl.signal,
      headers: { 'accept': 'text/event-stream' }
    });
    ok('SSE 200', sse.status === 200);

    const reader = sse.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    const events = [];
    const timer = setTimeout(() => ctrl.abort(), 8000);

    // 2) recebe evento welcome
    const welcomePromise = new Promise((res) => {
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            while (buf.includes('\n\n')) {
              const idx = buf.indexOf('\n\n');
              const evt = buf.slice(0, idx);
              buf = buf.slice(idx + 2);
              const evType = (evt.match(/^event: (.+)$/m) || [])[1];
              const data = (evt.match(/^data: (.+)$/m) || [])[1];
              events.push({ type: evType, data });
              if (evType === 'welcome') res({ type: evType, data });
            }
          }
        } catch (e) {
          // AbortError é esperado quando fechamos a conexão
        }
      })();
    });

    const w = await welcomePromise;
    ok('welcome recebido', w.type === 'welcome');
    const wData = JSON.parse(w.data);
    ok('welcome.ok === true', wData.ok === true);

    // 3) dispara um voto e aguarda evento termometro
    const termometroPromise = new Promise((res) => {
      const check = setInterval(() => {
        const ev = events.find(e => e.type === 'termometro');
        if (ev) { clearInterval(check); res(ev); }
      }, 50);
      setTimeout(() => { clearInterval(check); res(null); }, 6000);
    });

    const pols = await fetch(BASE + '/api/candidatos').then(r => r.json());
    await fetch(BASE + '/api/voto', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ politicianId: pols.candidatos[0].id })
    });

    const ev = await termometroPromise;
    ok('evento termometro recebido após voto', ev && ev.type === 'termometro');

    ctrl.abort();
    clearTimeout(timer);
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
