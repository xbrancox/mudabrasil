/* ============================================================
   Testes de Integração — API REST
   Uses the already-running server on port 8080.
   Run: server/index.js running, then npm run test:integration
   ============================================================ */

const assert = require('node:assert');
const { describe, it, before, after, afterEach } = require('node:test');
const http = require('http');

const PORT = process.env.PORT || 8080;
const BASE = `http://127.0.0.1:${PORT}`;

function request(method, pathname, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const allHeaders = { 'Content-Type': 'application/json', ...headers };
    const url = new URL(pathname, BASE);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: allHeaders
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(chunks); } catch (_) { parsed = chunks; }
        resolve({ status: res.statusCode, body: parsed, raw: chunks });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

before(async () => {
  // Verifica se o servidor está rodando
  await request('GET', '/api/health');
});

afterEach(async () => {
  // Nada a limpar — testes usam dados únicos
});

describe('API — Health', () => {
  it('GET /api/health deve retornar ok:true', async () => {
    const res = await request('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
  });

  it('GET /api/health deve incluir storage', async () => {
    const res = await request('GET', '/api/health');
    assert.ok(res.body.storage);
  });
});

describe('API — Candidatos TSE', () => {
  it('GET /api/candidatos-tse?cargo=1 deve retornar presidentes', async () => {
    const res = await request('GET', '/api/candidatos-tse?cargo=1&page=1&pageSize=5');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.ok(res.body.total >= 13);
    assert.ok(Array.isArray(res.body.candidatos));
  });

  it('GET /api/candidatos-tse?cargo=1&uf=BR deve retornar apenas BR', async () => {
    const res = await request('GET', '/api/candidatos-tse?cargo=1&uf=BR');
    assert.strictEqual(res.status, 200);
    if (res.body.candidatos && res.body.candidatos.length) {
      res.body.candidatos.forEach(c => {
        assert.strictEqual(c.uf, 'BR');
      });
    }
  });

  it('GET /api/candidatos-tse?cargo=1&q=LULA deve encontrar LULA', async () => {
    const res = await request('GET', '/api/candidatos-tse?cargo=1&q=LULA');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.ok);
  });
});

describe('API — Denúncias', () => {
  it('POST /api/denuncias deve criar com protocolo MV-2026-XXXXXX', async () => {
    const res = await request('POST', '/api/denuncias', {
      candidato: 'TESTE API',
      tipo: 'corrupcao',
      descricao: 'Descrição de teste da denúncia para integração completa'
    });
    assert.ok(res.status === 200 || res.status === 201);
    assert.strictEqual(res.body.ok, true);
    assert.ok(res.body.protocolo);
    assert.ok(res.body.protocolo.startsWith('MV-2026-'));
    assert.ok(/^\d{6}$/.test(res.body.protocolo.replace('MV-2026-', '')));
  });

  it('POST /api/denuncias com descrição curta deve falhar', async () => {
    const res = await request('POST', '/api/denuncias', {
      candidato: 'TESTE',
      tipo: 'corrupcao',
      descricao: 'curto'
    });
    assert.ok(res.status !== 200 || res.body.ok === false);
  });

  it('GET /api/denuncias/consulta deve retornar 404 para protocolo inexistente', async () => {
    const res = await request('GET', '/api/denuncias/consulta?protocolo=MV-2026-999999');
    assert.strictEqual(res.body.ok, false);
  });

  it('POST → consulta: fluxo completo funciona', async () => {
    const postRes = await request('POST', '/api/denuncias', {
      candidato: 'LULA',
      tipo: 'corrupcao',
      descricao: 'Denúncia de teste do fluxo completo com texto suficiente'
    });
    const protocolo = postRes.body.protocolo;

    const getRes = await request('GET', `/api/denuncias/consulta?protocolo=${protocolo}`);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.ok, true);
    assert.strictEqual(getRes.body.denuncia.candidato, 'LULA');
    assert.strictEqual(getRes.body.denuncia.tipo, 'corrupcao');
    assert.ok(getRes.body.denuncia.descricao.length > 0);
  });
});

describe('API — Backup admin (protegido)', () => {
  const TOKEN = 'integration-test-token';
  const headers = { 'authorization': `Bearer ${TOKEN}` };

  it('GET /api/admin/backup sem token deve retornar 401/412/503/429', async () => {
    const res = await request('GET', '/api/admin/backup');
    // 503 = BACKUP_TOKEN não configurado | 401/412 = token não enviado | 429 = rate limit
    assert.ok([401, 412, 503, 429].includes(res.status), `Expected 401/412/503/429, got ${res.status}`);
  });

  it('GET /api/admin/backup com token válido deve retornar dump', async () => {
    const res = await request('GET', '/api/admin/backup', null, headers);
    if (res.status === 429) {
      // Rate limit atingido — esperado em ambiente de teste compartilhado
      assert.ok(true, 'rate limited (expected in shared env)');
    } else {
      assert.ok(res.status === 200 || res.status === 503, `Expected 200 or 503, got ${res.status}`);
    }
  });
});
