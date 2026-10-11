/* ============================================================
   Testes Unitários — db.js
   Tests: node --test tests/unit/db.test.js
   ============================================================ */

const assert = require('node:assert');
const { describe, it, before, after, beforeEach } = require('node:test');
const path = require('path');
const fs = require('fs');

// Isola o banco em memória para testes
const TEST_DB = path.join(process.cwd(), 'server', 'data', 'test.db');

// Configura ambiente de teste antes de importar o módulo
process.env.MB_STORAGE = 'sqlite';
process.env.DB_PATH = TEST_DB;
process.env.MB_TEST_MODE = 'true';

let DB;
let initialized = false;

before(async () => {
  // Remove DB de teste anterior
  try { fs.unlinkSync(TEST_DB); } catch (_) {}

  DB = require('../../server/db.js');
  DB.init();
  initialized = true;
});

after(() => {
  if (DB) DB.close();
  try { fs.unlinkSync(TEST_DB); } catch (_) {}
});

beforeEach(async () => {
  if (DB) {
    DB.clearBallots();
    // Limpa denúncias
    if (DB.BACKEND === 'sqlite') {
      try { DB.exec('DELETE FROM denuncias'); } catch (_) {}
      try { DB.exec('DELETE FROM voters'); } catch (_) {}
      try { DB.exec('DELETE FROM complaints'); } catch (_) {}
      try { DB.exec('DELETE FROM supports'); } catch (_) {}
    }
  }
});

describe('db — backend', () => {
  it('deve inicializar corretamente', () => {
    assert.strictEqual(initialized, true);
    assert.strictEqual(DB.backend(), 'sqlite');
  });

  it('backend() deve retornar string', () => {
    assert.strictEqual(typeof DB.backend(), 'string');
  });

  it('file() deve retornar path do SQLite', () => {
    const f = DB.file();
    assert.strictEqual(typeof f, 'string');
    assert.ok(f.includes('votos.db') || f.includes('test.db'));
  });
});

describe('db — votos (ballots)', () => {
  it('upsertBallot deve salvar e getBallot deve retornar', () => {
    const ballot = {
      ballotId: 'test-ballot-1',
      politicianId: 'camara-123456',
      uf: 'SP',
      createdAt: Date.now(),
      reaffirmedAt: null,
      revoked: false,
      revokedAt: null,
      voterHash: 'hash-test-001'
    };
    DB.upsertBallot(ballot);
    const loaded = DB.getBallot('test-ballot-1');
    assert.ok(loaded, 'ballot não encontrado');
    assert.strictEqual(loaded.ballotId, 'test-ballot-1');
    assert.strictEqual(loaded.politicianId, 'camara-123456');
    assert.strictEqual(loaded.uf, 'SP');
    assert.strictEqual(loaded.revoked, false);
  });

  it('revogação deve marcar revoked=true', () => {
    const ballot = {
      ballotId: 'test-ballot-2',
      politicianId: 'camara-999',
      uf: 'RJ',
      createdAt: Date.now(),
      revoked: false,
      voterHash: 'hash-test-002'
    };
    DB.upsertBallot(ballot);
    // Revoga
    DB.upsertBallot({ ...ballot, revoked: true, revokedAt: Date.now() });
    const loaded = DB.getBallot('test-ballot-2');
    assert.strictEqual(loaded.revoked, true);
    assert.ok(loaded.revokedAt > 0);
  });

  it('countBallots deve refletir inserções', () => {
    DB.clearBallots();
    assert.strictEqual(DB.countBallots(), 0);

    for (let i = 0; i < 5; i++) {
      DB.upsertBallot({
        ballotId: `test-count-${i}`,
        politicianId: `poli-${i}`,
        createdAt: Date.now(),
        voterHash: `hash-count-${i}`
      });
    }
    assert.strictEqual(DB.countBallots(), 5);
  });
});

describe('db — denúncias (denuncias)', () => {
  it('createDenuncia deve salvar e getDenunciaByProtocolo deve retornar', () => {
    const denuncia = {
      protocolo: 'MV-2026-000001',
      candidato: 'LULA',
      tipo: 'corrupcao',
      descricao: 'Descrição de teste da denúncia com texto suficiente',
      anexo: null,
      status: 'EM ANALISE PELO MPE / TSE',
      voterIp: '::1'
    };
    DB.createDenuncia(denuncia);
    const loaded = DB.getDenunciaByProtocolo('MV-2026-000001');
    assert.ok(loaded);
    assert.strictEqual(loaded.protocolo, 'MV-2026-000001');
    assert.strictEqual(loaded.candidato, 'LULA');
    assert.strictEqual(loaded.tipo, 'corrupcao');
    assert.strictEqual(loaded.status, 'EM ANALISE PELO MPE / TSE');
  });

  it('getDenunciaByProtocolo deve retornar null para protocolo inexistente', () => {
    const result = DB.getDenunciaByProtocolo('MV-2026-999999');
    assert.strictEqual(result, null);
  });

  it('countDenuncias deve refletir inserções', () => {
    // beforeEach limpa, mas createDenuncia não tem clear dedicado
    // então verificamos que count > 0 após inserir
    DB.createDenuncia({
      protocolo: 'MV-2026-000002',
      candidato: 'TESTE',
      tipo: 'outros',
      descricao: 'Denúncia de teste dois',
      status: 'EM ANALISE PELO MPE / TSE'
    });
    assert.ok(DB.countDenuncias() >= 1);
  });
});

describe('db — politicos (politicians)', () => {
  it('upsertPolitician + getPolitician', () => {
    const poli = {
      id: 'camara-test-001',
      name: 'Político Teste',
      party: 'PT',
      state: 'SP',
      position: 'Deputado Federal',
      photo: 'http://example.com/foto.jpg'
    };
    DB.upsertPolitician(poli);
    const loaded = DB.getPolitician('camara-test-001');
    assert.ok(loaded);
    assert.strictEqual(loaded.id, 'camara-test-001');
    assert.strictEqual(loaded.name, 'Político Teste');
    assert.strictEqual(loaded.party, 'PT');
  });
});

describe('db — código de voto (vote_codes)', () => {
  it('generateVoteCode deve gerar código de 20 dígitos', () => {
    const hash = 'test-hash-vote';
    const code = DB.generateVoteCode(hash);
    assert.strictEqual(code.length, 20);
    assert.ok(/^\d+$/.test(code), 'código deve ser numérico');
  });

  it('verifyVoteCode deve validar código de 20 dígitos', () => {
    const hash = 'test-hash-verify';
    const code = DB.generateVoteCode(hash);
    const result = DB.verifyVoteCode(code);
    assert.ok(result);
    assert.strictEqual(result.voterHash, hash);
    assert.strictEqual(result.used, false);
  });
});

describe('db — dumpAll', () => {
  it('dumpAll deve retornar objeto com todas as tabelas', () => {
    DB.createDenuncia({
      protocolo: 'MV-2026-000003',
      candidato: 'DUMP',
      tipo: 'teste',
      descricao: 'Denúncia para teste de dump',
      status: 'EM ANALISE PELO MPE / TSE'
    });
    const dump = DB.dumpAll();
    assert.ok(typeof dump === 'object');
    assert.ok(Array.isArray(dump.denuncias));
    assert.ok(dump.denuncias.length >= 1);
    const d = dump.denuncias.find(x => x.protocolo === 'MV-2026-000003');
    assert.ok(d);
  });
});
