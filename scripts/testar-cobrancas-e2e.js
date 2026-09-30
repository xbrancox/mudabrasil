#!/usr/bin/env node
/*
 * Testes E2E do pipeline de cobrança verificada
 * Sobe o servidor na porta 3999 e valida o fluxo completo:
 *   POST /api/cobrancas/gerar → GET /api/cobrancas/:id → POST /api/cobrancas/:id/responder
 * Limpa o arquivo server/data/cobrancas.json ao final.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3999;
const BASE = `http://127.0.0.1:${PORT}`;
const COB_FILE = path.join(__dirname, '..', 'server', 'data', 'cobrancas.json');

let passed = 0, failed = 0;

function assert(cond, msg) {
  if (cond) { console.log('  ✅ ' + msg); passed++; }
  else { console.log('  ❌ ' + msg); failed++; }
}

async function waitServer(timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const r = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(800) });
      if (r.status === 200) return true;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  console.log('=== Testes E2E: Cobranças Verificadas ===\n');

  // Cleanup antes
  try { fs.rmSync(COB_FILE, { force: true }); } catch (_) {}

  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderr = '';
  child.stderr.on('data', d => { stderr += String(d); });

  const ok = await waitServer();
  if (!ok) {
    console.log('❌ Servidor não subiu em ' + PORT + 'ms');
    if (stderr) console.log('stderr: ' + stderr.slice(0, 500));
    child.kill();
    process.exit(1);
  }
  console.log('✅ Servidor subiu na porta ' + PORT + '\n');

  try {
    // [A] POST /api/cobrancas/gerar
    console.log('[A] Criar cobrança');
    const gerar = await fetch(`${BASE}/api/cobrancas/gerar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        politicianId: 'camara-204379',
        politicianNome: 'Acácio Favacho',
        promessa: 'Defender a educação pública',
        votacoes: [{ id: '2634392-23', assunto: 'MP 1.369/2026', data: '2026-09-03', voto: 'Sim' }]
      })
    });
    const g = await gerar.json();
    assert(g.ok === true, 'gerar retorna ok:true');
    assert(typeof g.id === 'string' && g.id.length > 10, 'gerar retorna id string');
    assert(typeof g.token === 'string' && g.token.length > 10, 'gerar retorna token string');
    assert(typeof g.url === 'string' && g.url.indexOf('cobranca.html') >= 0, 'gerar retorna url pública');
    const cobId = g.id, cobToken = g.token;

    // [B] GET /api/cobrancas/:id (público, sem token)
    console.log('\n[B] Ler cobrança pública');
    const ver = await fetch(`${BASE}/api/cobrancas/${cobId}`);
    const v = await ver.json();
    assert(v.ok === true, 'ver retorna ok:true');
    assert(v.cobranca && v.cobranca.id === cobId, 'ver retorna cobrança com id correto');
    assert(v.cobranca.status === 'gerada' || v.cobranca.status === 'aberta', 'ver retorna status gerada/aberta');
    assert(v.cobranca.promessa === 'Defender a educação pública', 'ver retorna promessa correta');

    // [C] POST /api/cobrancas/:id/responder com token ERRADO
    console.log('\n[C] Responder com token errado');
    const wrongToken = await fetch(`${BASE}/api/cobrancas/${cobId}/responder?token=invalido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: 'Resposta do gabinete' })
    });
    const wt = await wrongToken.json();
    assert(wt.ok === false, 'responder com token errado retorna ok:false');

    // [D] POST /api/cobrancas/:id/responder com token CORRETO
    console.log('\n[D] Responder com token correto');
    const rightToken = await fetch(`${BASE}/api/cobrancas/${cobId}/responder?token=${cobToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: 'Prezado cidadão, agradecemos sua cobrança. Estamos trabalhando na matéria.' })
    });
    const rt = await rightToken.json();
    assert(rt.ok === true, 'responder com token correto retorna ok:true');

    // [E] GET /api/cobrancas/:id após resposta
    console.log('\n[E] Ver cobrança após resposta');
    const ver2 = await fetch(`${BASE}/api/cobrancas/${cobId}`);
    const v2 = await ver2.json();
    assert(v2.cobranca.status === 'respondida', 'status atualizado para respondida');
    assert(v2.cobranca.resposta && v2.cobranca.resposta.texto.indexOf('agradecemos') >= 0, 'resposta presente com texto correto');

    // [F] GET /api/cobrancas/ranking
    console.log('\n[F] Ranking de selos');
    const rank = await fetch(`${BASE}/api/cobrancas/ranking`);
    const r = await rank.json();
    assert(r.ok === true, 'ranking retorna ok:true');
    assert(Array.isArray(r.ranking), 'ranking retorna array');

    // [G] POST /api/cobrancas/gerar sem promessa (validação)
    console.log('\n[G] Validação: gerar sem promessa');
    const noProm = await fetch(`${BASE}/api/cobrancas/gerar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ politicianId: 'camara-204379', politicianNome: 'Teste' })
    });
    const np = await noProm.json();
    assert(np.ok === false || noProm.status === 400, 'gerar sem promessa retorna erro');

    console.log('\n=== RESULTADO ===');
    console.log(`Passaram: ${passed}`);
    console.log(`Falharam: ${failed}`);
    console.log(failed === 0 ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM');

  } finally {
    child.kill();
    try { fs.rmSync(COB_FILE, { force: true }); } catch (_) {}
    console.log('\nCleanup: server/data/cobrancas.json removido');
  }

  process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('❌ Erro fatal:', e);
  process.exit(1);
});
