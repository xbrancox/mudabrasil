// test-render.js — Renderização das 6 páginas principais (6 checks)
// Tenta com Playwright; se não disponível, faz fetch das páginas e valida HTML.
(async () => {
  const { spawn } = require('node:child_process');
  const path = require('node:path');
  const fs = require('node:fs');

  const ROOT = path.resolve(__dirname, '..');
  const BASE = 'http://localhost:8080';
  const DATA_DIR = path.join(ROOT, 'server', 'data');
  const PAGES = ['', 'pages/candidatos.html', 'pages/termometro.html', 'pages/parlamentares.html', 'pages/status.html', 'pages/proposta.html'];

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

  let pw;
  try { pw = require('playwright'); } catch {}

  try {
    if (pw) {
      const browser = await pw.chromium.launch({ headless: true });
      const page = await browser.newPage();
      for (const p of PAGES) {
        const url = BASE + '/' + p;
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          const errors = [];
          page.on('pageerror', e => errors.push(e.message));
          await wait(800);
          ok(`${p || 'home'} renderiza sem erro`, errors.length === 0, errors.join('; '));
        } catch (e) {
          ok(`${p || 'home'} renderiza`, false, e.message);
        }
      }
      await browser.close();
    } else {
      // Fallback: apenas HTTP + HTML válido
      for (const p of PAGES) {
        try {
          const r = await fetch(BASE + '/' + p);
          const t = await r.text();
          const valid = r.status === 200 && t.includes('<html') && t.includes('</html>');
          ok(`${p || 'home'} 200 e HTML válido`, valid);
        } catch (e) {
          ok(`${p || 'home'} 200`, false, e.message);
        }
      }
    }
  } catch (e) {
    ok('render', false, e.message);
  } finally {
    srv.kill('SIGTERM');
    await wait(500);
    console.log(`\n==========================================`);
    console.log(`✅ ${pass} OK  /  ❌ ${fail} FALHOU`);
    console.log(`==========================================\n`);
    process.exit(fail === 0 ? 0 : 1);
  }
})();
