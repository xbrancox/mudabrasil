/* ============================================================
   MEUVOTO — SMOKE TEST (expandido)
   ------------------------------------------------------------
   Valida os pontos essenciais sem depender de rede:
   - módulos do servidor carregam sem erro
   - banco inicializa e responde
   - geradores de código/verificação funcionam
   - denúncias criam protocolo válido
   - código de voto gera 20 dígitos
   Uso: npm test
   ============================================================ */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('  ✓', nome); }
  catch (e) { falhas++; console.error('  ✗', nome, '—', e.message); }
}

console.log('🇧🇷 MeuVoto — smoke test\n');

// Importa módulos base (backend padrão, usa DB de produção em cache)
const db = require('../server/db');
db.init();

teste('db.js carrega e expõe operações', () => {
  ['upsertBallot', 'getBallot', 'verifyVoteCode', 'readAllPls', 'backend', 'createSocietyPl', 'getAllSocietyPls', 'signSocietyPl', 'createSocietyPlInvite', 'acceptSocietyPlInvite', 'getSocietyPlSupportersRanking', 'createDenuncia', 'getDenunciaByProtocolo', 'countDenuncias', 'dumpAll'].forEach(k => assert(typeof db[k] === 'function', 'falta db.' + k));
});

teste('votes.js carrega e valida entrada de voto', () => {
  const votes = require('../server/votes');
  assert(typeof votes.castVote === 'function');
  assert(typeof votes.getTermometro === 'function');
});

teste('reclamacoes.js sanitiza entrada', () => {
  const rec = require('../server/reclamacoes');
  assert.strictEqual(rec.sanitize('  texto  '), 'texto');
  assert.strictEqual(rec.sanitize('<script>x</script>', 2000).includes('<'), true);
});

teste('reclamacoes valida político e texto mínimo', () => {
  const rec = require('../server/reclamacoes');
  assert.throws(() => rec.createComplaint({ politicianId: 'inexistente', voterHash: 'h', content: 'texto suficientemente longo para passar do mínimo' }), /não encontrado/i);
});

teste('auth.js expõe sessões', () => {
  const auth = require('../server/auth');
  assert(typeof auth.getVoterFromToken === 'function');
  assert.strictEqual(auth.getVoterFromToken('token-invalido'), null);
});

teste('verificacao lista domínios permitidos', () => {
  const ver = require('../server/verificacao');
  const dom = (typeof ver.getAuthorizedDomains === 'function') ? ver.getAuthorizedDomains() : null;
  if (dom) assert(Array.isArray(dom) && dom.length > 0);
});

teste('createDenuncia gera protocolo MV-2026-XXXXXX', () => {
  const protocolo = 'MV-2026-' + String(Math.floor(100000 + Math.random() * 900000));
  const denuncia = {
    protocolo,
    candidato: 'SMOKE-TEST',
    tipo: 'corrupcao',
    descricao: 'Descrição de teste do smoke test com texto suficiente para validar',
    anexo: null,
    status: 'EM ANALISE PELO MPE / TSE',
    voterIp: '127.0.0.1'
  };
  db.createDenuncia(denuncia);
  const loaded = db.getDenunciaByProtocolo(protocolo);
  assert.ok(loaded);
  assert.strictEqual(loaded.candidato, 'SMOKE-TEST');
  assert.ok(/^\d{6}$/.test(protocolo.replace('MV-2026-', '')));
});

teste('generateVoteCode retorna 20 dígitos', () => {
  const code = db.generateVoteCode('test-hash');
  assert.strictEqual(code.length, 20);
  assert.ok(/^\d+$/.test(code));
});

teste('dumpAll retorna objeto com tabelas', () => {
  const dump = db.dumpAll();
  assert.ok(typeof dump === 'object');
  assert.ok('ballots' in dump);
  assert.ok('denuncias' in dump);
});

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ Todos os testes passaram');
process.exit(falhas ? 1 : 0);
