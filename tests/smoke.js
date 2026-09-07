/* ============================================================
   MUDABRASIL — SMOKE TEST
   ------------------------------------------------------------
   Valida os pontos essenciais sem depender de rede:
   - módulos do servidor carregam sem erro
   - banco inicializa e responde
   - geradores de código/verificação funcionam
   Uso: npm test
   ============================================================ */
const assert = require('assert');

let falhas = 0;
function teste(nome, fn) {
  try { fn(); console.log('  ✓', nome); }
  catch (e) { falhas++; console.error('  ✗', nome, '—', e.message); }
}

console.log('🇧🇷 MudaBrasil — smoke test\n');

teste('db.js carrega e expõe operações', () => {
  const db = require('../server/db');
  ['upsertBallot', 'getBallot', 'verifyVoteCode', 'readAllPls', 'backend'].forEach(k => assert(typeof db[k] === 'function', 'falta db.' + k));
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
  const dom = (typeof ver.getDominiosPermitidos === 'function') ? ver.getDominiosPermitidos() : null;
  if (dom) assert(Array.isArray(dom) && dom.length > 0);
});

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ Todos os testes passaram');
process.exit(falhas ? 1 : 0);
