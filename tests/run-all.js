/* ============================================================
   MudaBrasil — Runner da bateria de testes
   Uso: npm test   (ou: node tests/run-all.js)
   Ordem: test-engine (sobe/mata o próprio servidor e reseta o db)
          → servidor na 8091 → render → thermometer → live → e2es
   ============================================================ */
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 8091;

const ENGINE = { name: 'engine (motor de votos, migração, carga, SSE)', args: ['tests/test-engine.js'] };
const SHARED = [
  { name: 'render (páginas)', args: ['tests/test-render.js'] },
  { name: 'thermometer (fluxo de voto E2E)', args: ['tests/test-thermometer.js'] },
  { name: 'live (SSE entre páginas)', args: ['tests/test-live.js'] },
  { name: 'e2e ficha de votações nominais', args: ['tests/e2e-votos-ficha.js'] },
  { name: 'e2e verificação de político', args: ['tests/e2e-verificacao.js'] },
  { name: 'e2e parlamentares autenticado', args: ['tests/e2e-parlamentares-auth.js'] }
];

let server = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* pre-flight: libera a porta 8091 de servidores órfãos de runs anteriores */
async function freeTestPort() {
  try {
    const out = require('child_process').execSync('netstat -ano', { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (line.includes(':' + PORT) && line.includes('LISTENING')) {
        const pid = parseInt(line.trim().split(/\s+/).pop(), 10);
        if (pid && pid !== process.pid) pids.add(pid);
      }
    }
    for (const pid of pids) {
      try { process.kill(pid); console.log('🧹 liberando porta ' + PORT + ' (PID ' + pid + ')'); } catch (_) { }
    }
    if (pids.size) await sleep(2000);
  } catch (_) { }
}

(async () => {
  await freeTestPort();
  /* 1) test-engine: sobe e mata o próprio servidor, reseta o db */
  process.stdout.write('▶ ' + ENGINE.name + ' ... ');
  let r = spawnSync(process.execPath, ENGINE.args, { cwd: ROOT, encoding: 'utf8', timeout: 600000 });
  const engineOk = r.status === 0;
  console.log(engineOk ? 'OK' : 'FALHOU');
  if (!engineOk) {
    if (r.stdout) console.log(String(r.stdout).split('\n').slice(-14).join('\n'));
    if (r.stderr) console.log(String(r.stderr).split('\n').slice(-4).join('\n'));
  }

  /* 2) servidor compartilhado na 8091 */
  server = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
    env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
    cwd: ROOT
  });
  let log = '';
  server.stdout.on('data', d => log += String(d));
  server.stderr.on('data', d => log += String(d));
  await new Promise((resolve, reject) => {
    const t = setInterval(() => { if (log.includes('rodando em')) { clearInterval(t); resolve(); } }, 150);
    setTimeout(() => { clearInterval(t); reject(new Error('servidor de teste não subiu na ' + PORT)); }, 25000);
  });
  console.log('🚀 Servidor de teste na porta ' + PORT + '\n');

  const env = { ...process.env, BASE_URL: 'http://localhost:' + PORT };
  const results = [{ name: ENGINE.name, ok: engineOk, log: (r.stdout || '') + (r.stderr || '') }];
  for (const t of SHARED) {
    process.stdout.write('▶ ' + t.name + ' ... ');
    r = spawnSync(process.execPath, t.args, { cwd: ROOT, env, encoding: 'utf8', timeout: 600000 });
    const ok = r.status === 0;
    results.push({ name: t.name, ok, log: (r.stdout || '') + (r.stderr || '') });
    console.log(ok ? 'OK' : 'FALHOU');
    if (!ok) {
      if (r.stdout) console.log(String(r.stdout).split('\n').slice(-14).join('\n'));
      if (r.stderr) console.log(String(r.stderr).split('\n').slice(-4).join('\n'));
    }
  }

  server.kill();

  /* log persistente da última execução (diagnóstico de flakiness) */
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const text = 'run ' + stamp + '\n\n' + results.map(r => '=== ' + r.name + ' (' + (r.ok ? 'OK' : 'FALHOU') + ')\n' + r.log).join('\n\n');
    fs.writeFileSync(path.join(__dirname, 'last-run.log'), text);
  } catch (_) { }

  console.log('\n========== RESUMO ==========');
  let failed = 0;
  for (const res of results) { console.log((res.ok ? '✅' : '❌') + ' ' + res.name); if (!res.ok) failed++; }
  console.log(failed === 0 ? '🏆 TODOS OS GRUPOS PASSARAM' : '❌ ' + failed + ' grupo(s) falharam');
  process.exit(failed ? 1 : 0);
})().catch(e => {
  console.error('💥', e.message);
  try { if (server) server.kill(); } catch (_) { }
  process.exit(1);
});
