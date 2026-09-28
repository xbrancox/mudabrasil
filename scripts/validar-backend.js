#!/usr/bin/env node
/**
 * validar-backend.js — Validação completa do backend Railway
 * 
 * Testa todas as APIs do backend e reporta o status.
 * 
 * Uso:
 *   node scripts/validar-backend.js
 *   node scripts/validar-backend.js https://mudabrasil-production-79eb.up.railway.app
 */

const BASE = process.argv[2] || 'https://mudabrasil-production-79eb.up.railway.app';

let pass = 0, fail = 0;
function ok(label, cond, detail = '') {
  if (cond) { pass++; console.log('  ✅', label); }
  else { fail++; console.log('  ❌', label, detail); }
}

async function test(label, fn) {
  try {
    await fn();
    ok(label, true);
  } catch (e) {
    ok(label, false, e.message);
  }
}

console.log(`\n🔍 Validando backend: ${BASE}\n`);

// 1) Health check
await test('Health check (/api/health)', async () => {
  const res = await fetch(`${BASE}/api/health`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error('ok !== true');
  if (!data.storage) throw new Error('storage não definido');
});

// 2) Candidatos
await test('Candidatos (/api/candidatos)', async () => {
  const res = await fetch(`${BASE}/api/candidatos`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (data.total < 500) throw new Error(`Total ${data.total} < 500`);
  if (data.mode !== 'real') throw new Error('mode !== real');
});

// 3) Senadores
await test('Senadores (/api/senadores)', async () => {
  const res = await fetch(`${BASE}/api/senadores`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (data.total < 80) throw new Error(`Total ${data.total} < 80`);
});

// 4) Termômetro
await test('Termômetro (/api/termometro)', async () => {
  const res = await fetch(`${BASE}/api/termometro`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error('ok !== true');
});

// 5) Votar
let code = null;
await test('Votar (/api/voto)', async () => {
  const cands = await fetch(`${BASE}/api/candidatos`).then(r => r.json());
  const pol = cands.candidatos[0];
  const res = await fetch(`${BASE}/api/voto`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ politicianId: pol.id, uf: pol.state })
  });
  if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error('ok !== true');
  if (!data.code) throw new Error('code não retornado');
  code = data.code;
});

// 6) Consultar voto
await test('Consultar voto (/api/voto?code=)', async () => {
  if (!code) throw new Error('code não disponível');
  const res = await fetch(`${BASE}/api/voto?code=${code}`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error('ok !== true');
  if (!data.ballot) throw new Error('ballot não retornado');
});

// 7) Manter voto
await test('Manter voto (/api/voto/manter)', async () => {
  if (!code) throw new Error('code não disponível');
  const res = await fetch(`${BASE}/api/voto/manter`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code })
  });
  if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error('ok !== true');
});

// 8) Revogar voto
await test('Revogar voto (/api/voto/revogar)', async () => {
  if (!code) throw new Error('code não disponível');
  const res = await fetch(`${BASE}/api/voto/revogar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code })
  });
  if (res.status !== 200 && res.status !== 201) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error('ok !== true');
});

// 9) SSE endpoint
await test('SSE endpoint (/api/stream)', async () => {
  const res = await fetch(`${BASE}/api/stream`, {
    headers: { 'accept': 'text/event-stream' }
  });
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/event-stream')) throw new Error(`content-type: ${ct}`);
  res.body?.cancel();
});

// 10) Verificação domínios
await test('Domínios autorizados (/api/verificacao/dominios)', async () => {
  const res = await fetch(`${BASE}/api/verificacao/dominios`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  // Aceita tanto array direto quanto objeto {ok, dominios}
  const dominios = Array.isArray(data) ? data : (data.dominios || []);
  if (!Array.isArray(dominios)) throw new Error('não é array');
  if (dominios.length < 3) throw new Error(`só ${dominios.length} domínios`);
});

// 11) Rankings
await test('Rankings (/api/rankings)', async () => {
  const res = await fetch(`${BASE}/api/rankings`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (!data) throw new Error('sem dados');
});

// 12) Frontend
await test('Frontend (index.html)', async () => {
  const res = await fetch(`${BASE}/`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const text = await res.text();
  if (!text.includes('MeuVoto')) throw new Error('não contém "MeuVoto"');
});

console.log(`\n==========================================`);
console.log(`✅ ${pass} OK  /  ❌ ${fail} FALHOU`);
console.log(`==========================================\n`);

process.exit(fail === 0 ? 0 : 1);
