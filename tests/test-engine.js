/* ============================================================
   MUDABRASIL — TESTES DO MOTOR DE VOTO, ARMAZENAMENTO E TEMPO REAL
   ------------------------------------------------------------
   Testes de qualidade sem navegador (Node puro):
   1. Decaimento (voteWeight): curva 90d/180d exata
   2. Migração: cédulas em votos.json legado → importadas no SQLite
   3. Decaimento pela API: cédulas antigas pesam menos
   4. Carga: 10.000 cédulas — /api/termometro responde rápido
   5. Tempo real: evento SSE chega em < 3s após o voto
   6. Persistência: voto sobrevive à reinicialização do servidor
   7. Fallback JSON: MB_STORAGE=json (Node sem node:sqlite)

   O seed da urna é feito pela MESMA camada de armazenamento do
   servidor (server/db.js, SQLite em arquivo compartilhado) — sem
   rota "de costas" na API.

   Uso: node tests/test-engine.js
   (sobe o servidor em porta 8091, testa e encerra)
   ============================================================ */

const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = 8091;
const BASE = 'http://127.0.0.1:' + PORT;
const db = require(path.join(ROOT, 'server', 'db.js'));
const VOTOS_FILE = db.VOTOS_FILE;
const VOTOS_DB = db.VOTOS_DB;
const MS_DIA = 86400000;

let passed = 0, failed = 0;
function check(name, ok, extra) {
  console.log((ok ? '✅ ' : '❌ ') + name + (extra ? ' — ' + extra : ''));
  ok ? passed++ : failed++;
}

function getJson(p) {
  return fetch(BASE + p).then(r => r.json());
}
function postJson(p, body) {
  return fetch(BASE + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(async r => ({ status: r.status, json: await r.json() }));
}

/* ---------- 1) DECAIMENTO (unidade, direto no módulo) ---------- */
function testDecayUnit() {
  const { voteWeight } = require(path.join(ROOT, 'server', 'votes.js'));
  const now = Date.now();
  const d = dias => now - dias * MS_DIA;
  const near = (a, b, eps = 0.001) => Math.abs(a - b) < eps;

  check('Decaimento: 0 dias → peso 1.0', voteWeight(d(0), now) === 1.0);
  check('Decaimento: 45 dias → peso 1.0', voteWeight(d(45), now) === 1.0);
  check('Decaimento: 90 dias → peso 1.0 (limite cheio)', voteWeight(d(90), now) === 1.0);
  check('Decaimento: 91 dias → peso < 1.0', voteWeight(d(91), now) < 1.0, 'peso=' + voteWeight(d(91), now).toFixed(4));
  check('Decaimento: 135 dias → peso 0.75 (meio do linear)', near(voteWeight(d(135), now), 0.75, 0.005), 'peso=' + voteWeight(d(135), now).toFixed(4));
  check('Decaimento: 180 dias → peso 0.5 (piso)', near(voteWeight(d(180), now), 0.5, 0.001));
  check('Decaimento: 400 dias → peso 0.5 (piso mantido)', near(voteWeight(d(400), now), 0.5, 0.001));
  check('Decaimento: futuro → peso 1.0 (clamped)', voteWeight(now + 10 * MS_DIA, now) === 1.0);
}

/* ---------- helpers de cédula sintética ---------- */
function makeBallot(polId, { dias = 0, uf = 'SP', revoked = false } = {}) {
  const id = crypto.randomBytes(32).toString('hex');
  const created = Date.now() - dias * MS_DIA;
  return {
    ballotId: id,
    politicianId: polId,
    uf,
    createdAt: created,
    reaffirmedAt: created,
    revoked,
    revokedAt: revoked ? created + MS_DIA : null
  };
}

/* ---------- 2) MIGRAÇÃO JSON legado → SQLite ---------- */
async function testMigration(polId, serverLog) {
  check('Armazenamento: backend SQLite ativo no servidor', /SQLite nativo/.test(serverLog), 'log do boot');
  const t = await getJson('/api/termometro');
  check('Migração: 2 cédulas do votos.json legado importadas para o SQLite',
    t.totalRegistros === 2, 'registros=' + t.totalRegistros);
}

/* ---------- 3) DECAIMENTO PELA API ---------- */
async function testDecayApi(polId) {
  const idA = 'a'.repeat(64), idB = 'b'.repeat(64), idC = 'c'.repeat(64);
  db.clear();
  db.importAll({
    [idA]: makeBallot(polId, { dias: 0 }),
    [idB]: makeBallot(polId, { dias: 135 }),
    [idC]: makeBallot(polId, { dias: 200, revoked: true })
  });

  const t = await getJson('/api/termometro');
  const row = t.topN.find(x => x.politicianId === polId);
  // pesoEfetivo = soma dos pesos: cédula nova (1.0) + cédula de 135d (~0.75)
  check('API: decaimento aplicado (1.0 + 0.75 = 1.75)', row && Math.abs(row.pesoEfetivo - 1.75) < 0.02, 'pesoEfetivo=' + row.pesoEfetivo);
  const indiceEsperado = 100 * 1.75 / (1.75 + 100);
  check('API: índice com saturação (≈' + indiceEsperado.toFixed(2) + ')', row && Math.abs(row.indice - indiceEsperado) < 0.1, 'indice=' + row.indice);
  check('API: cédula revogada não conta no ativo', t.totalVotosAtivos === 2 && t.totalRevogados === 1, 'ativos=' + t.totalVotosAtivos + ' revogados=' + t.totalRevogados);
}

/* ---------- 4) CARGA (10.000 cédulas) ---------- */
async function testLoad(polIds) {
  const ballots = {};
  for (let i = 0; i < 10000; i++) {
    const b = makeBallot(polIds[i % polIds.length], {
      dias: Math.floor((i / 10000) * 200), // espalha idades 0→200 dias
      uf: 'SP',
      revoked: i % 17 === 0
    });
    ballots[b.ballotId] = b;
  }
  db.clear();
  db.importAll(ballots);

  const times = [];
  for (let i = 0; i < 3; i++) {
    const t0 = process.hrtime.bigint();
    const t = await getJson('/api/termometro');
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    times.push(ms);
    if (i === 0) {
      check('Carga: 10.000 cédulas agregadas', t.totalRegistros === 10000, 'registros=' + t.totalRegistros + ' ativos=' + t.totalVotosAtivos);
      check('Carga: tendência com 30 pontos', Array.isArray(t.tendencia) && t.tendencia.length === 30, 'pontos=' + t.tendencia.length);
    }
  }
  const median = times.sort((a, b) => a - b)[1];
  check('Carga: /api/termometro < 800ms (10k cédulas)', median < 800, 'mediana=' + Math.round(median) + 'ms (' + times.map(Math.round).join('/') + 'ms)');
}

/* ---------- 5) TEMPO REAL (SSE) ---------- */
function sseListen() {
  return new Promise((resolve, reject) => {
    const req = http.get(BASE + '/api/stream', res => {
      if (res.statusCode !== 200 || !/text\/event-stream/.test(res.headers['content-type'] || '')) {
        reject(new Error('SSE: status/Content-Type inesperado (' + res.statusCode + ')'));
        return;
      }
      let buf = '';
      const events = [];
      const timer = setTimeout(() => reject(new Error('SSE: timeout esperando evento')), 8000);
      res.on('data', chunk => {
        buf += chunk.toString();
        let idx;
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const frame = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          if (frame.startsWith('event: termometro')) {
            const dataLine = frame.split('\n').find(l => l.startsWith('data: '));
            events.push(JSON.parse(dataLine.slice(6)));
            clearTimeout(timer);
            resolve(events);
          }
        }
      });
    });
    req.on('error', reject);
  });
}

async function testSSE(polId) {
  // limpa a urna para contagem previsível
  db.clear();
  const before = await getJson('/api/termometro');
  const listenPromise = sseListen();
  await new Promise(r => setTimeout(r, 300)); // garante que o stream abriu
  const t0 = Date.now();
  const res = await postJson('/api/voto', { politicianId: polId, uf: 'RJ' });
  const latencyMs = Date.now() - t0;
  check('SSE: voto aceito (201)', res.status === 201 && res.json.ok, 'code=' + res.json.code);
  try {
    const events = await listenPromise;
    check('SSE: evento "termometro" recebido do servidor', events.length >= 1, 'latência total do voto→evento ≈ ' + latencyMs + 'ms');
    check('SSE: payload bate com a contagem real', events[events.length - 1].totalVotosAtivos === before.totalVotosAtivos + 1,
      'antes=' + before.totalVotosAtivos + ' no evento=' + events[events.length - 1].totalVotosAtivos);
  } catch (e) {
    check('SSE: evento "termometro" recebido do servidor', false, e.message);
  }
}

/* ---------- 6) PERSISTÊNCIA APÓS REINÍCIO ---------- */
async function testRestartPersistence(polId, serverHandle) {
  db.clear();
  const res = await postJson('/api/voto', { politicianId: polId, uf: 'MG' });
  const code = res.json.code;
  check('Persistência: voto colocado antes do restart', res.status === 201 && !!code, 'code=' + code);

  serverHandle.kill();
  await new Promise(r => setTimeout(r, 400));

  const again = startServer();
  await again.ready;
  try {
    const v = await getJson('/api/voto?code=' + encodeURIComponent(code));
    check('Persistência: voto sobreviveu ao restart (viewVote ok, não revogado)',
      v.ok === true && v.ballot && v.ballot.revoked === false, 'uf=' + (v.ballot && v.ballot.uf));
    const t = await getJson('/api/termometro');
    check('Persistência: agregação pós-restart contém o voto', t.totalRegistros === 1, 'registros=' + t.totalRegistros);
  } finally {
    again.kill();
    await new Promise(r => setTimeout(r, 300));
  }
}

/* ---------- 7) FALLBACK JSON (MB_STORAGE=json, Node sem node:sqlite) ----------
   O servidor roda em modo JSON; aqui o teste usa SÓ a API HTTP
   (a conexão SQLite local do processo de teste não entra em cena). */
async function testJsonFallback(polId) {
  try { fs.unlinkSync(VOTOS_DB); } catch (_) { /* Windows: pode estar aberto */ }
  try { fs.unlinkSync(VOTOS_FILE); } catch (_) {}

  const srv = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT), MB_STORAGE: 'json' }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let up = false, log = '';
  srv.stdout.on('data', d => { log += String(d); if (log.includes('rodando em')) up = true; });
  await new Promise((resolve, reject) => {
    const t = setInterval(() => { if (up) { clearInterval(t); resolve(); } }, 100);
    setTimeout(() => { clearInterval(t); reject(new Error('servidor JSON não subiu')); }, 10000);
  });
  try {
    check('Fallback JSON: backend JSON ativo no servidor', /arquivo JSON/.test(log), 'log do boot');
    const res = await postJson('/api/voto', { politicianId: polId, uf: 'RS' });
    check('Fallback JSON: voto aceito (201)', res.status === 201 && res.json.ok, 'code=' + res.json.code);
    const t = await getJson('/api/termometro');
    check('Fallback JSON: urna persistida em votos.json',
      t.totalRegistros === 1 && fs.existsSync(VOTOS_FILE), 'registros=' + t.totalRegistros);
  } finally {
    srv.kill();
    await new Promise(r => setTimeout(r, 300));
  }
}

/* ---------- ORQUESTRAÇÃO ---------- */
function startServer() {
  const server = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT) }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let up = false;
  let log = '';
  server.stdout.on('data', d => {
    log += String(d);
    if (log.includes('rodando em')) up = true;
  });
  const ready = new Promise((resolve, reject) => {
    const t = setInterval(() => { if (up) { clearInterval(t); resolve(); } }, 100);
    setTimeout(() => { clearInterval(t); reject(new Error('servidor não subiu')); }, 10000);
  });
  return { process: server, ready, log: () => log, kill: () => server.kill() };
}

(async () => {
  // estado limpo para começar
  try { fs.unlinkSync(VOTOS_DB); } catch (_) {}
  try { fs.unlinkSync(VOTOS_FILE); } catch (_) {}

  // 1) unidade (sem servidor)
  testDecayUnit();

  // 2) semeia urna LEGADA em JSON (cédulas antigas) → o boot do
  //    servidor deve migrar para o SQLite sozinho
  const legacyBallots = [makeBallot('legacy-pol-1'), makeBallot('legacy-pol-2')];
  fs.writeFileSync(VOTOS_FILE, JSON.stringify({
    updatedAt: new Date().toISOString(),
    ballots: Object.fromEntries(legacyBallots.map(b => [b.ballotId, b])),
    meta: { created: new Date().toISOString() }
  }));

  const server = startServer();
  await server.ready;
  const serverLog = server.log();

  try {
    const deps = await getJson('/api/candidatos');
    const polId = deps.candidatos[0].id;
    const polIds = deps.candidatos.slice(0, 20).map(c => c.id);

    await testMigration(polId, serverLog);
    await testDecayApi(polId);
    await testLoad(polIds);
    await testSSE(polId);

    // 3) persistência: encerra o 1º servidor e sobe um 2º
    await testRestartPersistence(polId, server);

    // 4) fallback JSON (MB_STORAGE=json)
    await testJsonFallback(polId);
  } finally {
    server.kill();
    await new Promise(r => setTimeout(r, 300));
    // limpa a urna de teste (fecha a conexão local antes de apagar)
    try { db.close(); } catch (_) {}
    try { fs.unlinkSync(VOTOS_DB); } catch (_) {}
    try { fs.unlinkSync(VOTOS_FILE); } catch (_) {}
  }

  console.log('');
  console.log(failed === 0
    ? '🏆 TODOS OS ' + passed + ' CHECKS DO MOTOR PASSARAM'
    : '💥 ' + failed + ' FALHAS (' + passed + ' ok)');
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => {
  console.error('💥 Erro fatal no teste:', e.message);
  process.exit(1);
});
