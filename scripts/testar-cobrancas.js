/* =======================================================
   Testes de integração do pipeline de cobranças verificadas
   - Sobe o servidor em porta efêmera
   - Testa todas as rotas /api/cobrancas/*
   - Valida ciclo completo: gerar → abrir → responder → ranking
   ======================================================= */
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SERVER_PORT = 3877;
const BASE = 'http://127.0.0.1:' + SERVER_PORT;
const COB_FILE = path.join(__dirname, '..', 'server', 'data', 'cobrancas.json');

let failures = 0, passes = 0;
function assert(cond, label) {
  if (cond) { passes++; console.log('✅ ' + label); }
  else { failures++; console.log('❌ ' + label); }
}

function req(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE);
    const opts = {
      method, hostname: url.hostname, port: url.port, path: url.pathname + url.search,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      timeout: 8000
    };
    const r = http.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const txt = Buffer.concat(chunks).toString('utf8');
        let json; try { json = JSON.parse(txt); } catch (e) { json = null; }
        resolve({ status: res.statusCode, body: txt, json });
      });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  // Limpa arquivo de cobrança de testes anteriores
  try { fs.unlinkSync(COB_FILE); } catch (e) {}

  console.log('Subindo servidor em porta ' + SERVER_PORT + '...');
  const srv = spawn(process.execPath, ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: Object.assign({}, process.env, { PORT: String(SERVER_PORT) }),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let started = false;
  srv.stdout.on('data', d => { if (/rodando/.test(String(d))) started = true; });
  srv.stderr.on('data', d => process.stderr.write('[srv] ' + d));

  // Espera até 8s o servidor responder
  for (let i = 0; i < 40 && !started; i++) {
    await new Promise(r => setTimeout(r, 200));
    try { await req('GET', '/api/health'); started = true; } catch (e) {}
  }
  if (!started) { console.log('❌ servidor não subiu em 8s'); srv.kill(); process.exit(1); }
  console.log('Servidor no ar.\n');

  try {
    // 1. GET /api/cobrancas (vazio)
    const r1 = await req('GET', '/api/cobrancas');
    assert(r1.status === 200 && r1.json && r1.json.total === 0, 'GET /api/cobrancas vazio -> 200, total=0');

    // 2. POST /api/cobrancas/gerar
    const body2 = {
      politicianId: 'camara-204379',
      politicianNome: 'Deputado Teste',
      promessa: 'Defender a educação pública de qualidade',
      votacoes: [
        { id: '2611313-31', assunto: 'PL da Educação', data: '2026-09-25T14:00:00', voto: 'Sim' }
      ]
    };
    const r2 = await req('POST', '/api/cobrancas/gerar', body2);
    assert(r2.status === 201 && r2.json && r2.json.ok, 'POST gerar -> 201 created');
    assert(!!r2.json.id && !!r2.json.token && !!r2.json.url, 'gerar retorna id+token+url');
    assert(r2.json.url.indexOf('/pages/cobranca.html?id=') > 0, 'url aponta para página pública');
    const id = r2.json.id, token = r2.json.token;

    // 3. POST gerar sem campos obrigatórios
    const r3 = await req('POST', '/api/cobrancas/gerar', { promessa: 'so promessa' });
    assert(r3.status === 400 && /politicianId/.test(r3.json.error), 'gerar sem politicianId -> 400');

    // 4. GET /api/cobrancas/:id (sem token, marca aberta)
    const r4 = await req('GET', '/api/cobrancas/' + id);
    assert(r4.status === 200 && r4.json && r4.json.ok, 'GET /api/cobrancas/:id -> 200');
    assert(r4.json.cobranca.status === 'aberta', 'GET sem token marca como aberta');
    assert(r4.json.cobranca.autorizadoParaResponder === false, 'sem token, autorizado=false');
    assert(!r4.json.cobranca.resposta, 'ainda sem resposta');

    // 5. GET /api/cobrancas/:id?token=<token>
    const r5 = await req('GET', '/api/cobrancas/' + id + '?token=' + token);
    assert(r5.status === 200 && r5.json.cobranca.autorizadoParaResponder === true, 'GET com token correto -> autorizado=true');

    // 6. GET /api/cobrancas/:id?token=errado
    const r6 = await req('GET', '/api/cobrancas/' + id + '?token=xxxx');
    assert(r6.status === 200 && r6.json.cobranca.autorizadoParaResponder === false, 'token errado -> autorizado=false');

    // 7. POST /api/cobrancas/:id/responder sem token
    const r7 = await req('POST', '/api/cobrancas/' + id + '/responder', { texto: 'resposta do gabinete oficial' });
    assert(r7.status === 403 && /token/i.test(r7.json.error), 'responder sem token -> 403');

    // 8. POST /api/cobrancas/:id/responder token errado
    const r8 = await req('POST', '/api/cobrancas/' + id + '/responder?token=xxxx', { texto: 'resposta do gabinete oficial' });
    assert(r8.status === 403 && /token/i.test(r8.json.error), 'responder com token errado -> 403');

    // 9. POST /api/cobrancas/:id/responder resposta muito curta
    const r9 = await req('POST', '/api/cobrancas/' + id + '/responder?token=' + token, { texto: 'curta' });
    assert(r9.status === 400 && /curta/.test(r9.json.error), 'resposta curta -> 400');

    // 10. POST /api/cobrancas/:id/responder sucesso
    const r10 = await req('POST', '/api/cobrancas/' + id + '/responder?token=' + token, { texto: 'Agradecemos a cobrança. Estamos atuando na emenda.' });
    assert(r10.status === 200 && r10.json.ok && r10.json.respondidaEm, 'responder OK -> 200 com respondidaEm');

    // 11. GET :id após resposta
    const r11 = await req('GET', '/api/cobrancas/' + id);
    assert(r11.status === 200 && r11.json.cobranca.status === 'respondida' && r11.json.cobranca.resposta && /Agradecemos/.test(r11.json.cobranca.resposta.texto), 'cobrança respondida com texto público');

    // 12. GET /api/cobrancas?politicianId=X
    const r12 = await req('GET', '/api/cobrancas?politicianId=camara-204379');
    assert(r12.status === 200 && r12.json.ok && r12.json.counts.total === 1, 'aggregate por politicianId retorna counts');
    assert(r12.json.counts.respondida === 1 && r12.json.medianDays !== null, 'counts.respondida=1 e medianDays calculado');
    assert(r12.json.selo === 'bronze', 'selo bronze (1 respondida)');

    // 13. GET /api/cobrancas/ranking
    const r13 = await req('GET', '/api/cobrancas/ranking');
    assert(r13.status === 200 && Array.isArray(r13.json.ranking) && r13.json.ranking.length === 1, 'ranking retorna array com 1 parlamentar');
    assert(r13.json.ranking[0].politicianId === 'camara-204379' && r13.json.ranking[0].selo === 'bronze', 'ranking tem parlamentar correto com selo bronze');

    // 14. GET :id inexistente -> 404
    const r14 = await req('GET', '/api/cobrancas/00000000-0000-0000-0000-000000000000');
    assert(r14.status === 404, 'cobrança inexistente -> 404');

    // 15. GET ranking público não vaza tokens nem e-mails
    const r15 = await req('GET', '/api/cobrancas/ranking');
    const rankStr = JSON.stringify(r15.json);
    assert(!/token/.test(rankStr) && !/e?-?mail/i.test(rankStr), 'ranking público não vaza tokens/e-mails');

  } catch (e) {
    failures++;
    console.log('❌ exceção: ' + e.message);
  }

  srv.kill();
  try { fs.unlinkSync(COB_FILE); } catch (e) {}

  console.log('\n=== RESULTADO: ' + passes + ' passaram, ' + failures + ' falharam ===');
  process.exit(failures ? 1 : 0);
}

run().catch(e => { console.log('❌ falha geral: ' + e.message); process.exit(1); });
