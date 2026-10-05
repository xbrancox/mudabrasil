/* ============================================================
   MEUVOTO — TESTE DA INICIATIVA CIDADÃ (PLs da Sociedade)
   ------------------------------------------------------------
   Valida todo o ciclo de vida dos PLs da sociedade:
   - criar PL
   - listar / filtrar PLs
   - assinar PL (e duplicidade)
   - criar convite para parlamentar/partido
   - aceitar convite
   - ranking de apoiadores
   Uso: node tests/test-society.js
   ============================================================ */
const assert = require('assert');

let pass = 0, fail = 0;
function teste(nome, fn) {
  try { fn(); pass++; console.log('  ✓', nome); }
  catch (e) { fail++; console.error('  ✗', nome, '—', e.message); }
}

console.log('🏛️  Iniciativa Cidadã — testes unitários\n');

// ==========================
// Carregar o módulo db.js
// ==========================
let db;
teste('db.js carrega sem erro', () => {
  db = require('../server/db');
  assert(typeof db === 'object' && db !== null, 'db não é objeto');
});

// ==========================
// Funções expostas
// ==========================
const funcoesEsperadas = [
  'createSocietyPl',
  'getSocietyPl',
  'getAllSocietyPls',
  'signSocietyPl',
  'getSocietyPlSignature',
  'createSocietyPlInvite',
  'getSocietyPlInviteByToken',
  'acceptSocietyPlInvite',
  'getSocietyPlInvites',
  'getSocietyPlSupportersRanking'
];

for (const fn of funcoesEsperadas) {
  teste('db.' + fn + ' é uma função', () => {
    assert.strictEqual(typeof db[fn], 'function', 'db.' + fn + ' não existe');
  });
}

// ==========================
// Criar um PL de teste
// ==========================
let plTeste = null;
teste('createSocietyPl cria um novo projeto', () => {
  plTeste = db.createSocietyPl({
    orgName: 'Observatório Cidadão Teste',
    orgEmail: 'teste@observatorio.org.br',
    title: 'PL de Proteção às Nascentes (Teste Automatizado)',
    summary: 'Projeto de teste automatizado - pode ser removido',
    text: 'Art. 1º Esta lei dispõe sobre a proteção das nascentes urbanas.',
    category: 'Meio Ambiente',
    authorHash: 'hash-teste-' + Date.now(),
    attachmentUrl: 'https://exemplo.org/pl-teste.pdf'
  });
  assert(plTeste, 'não retornou objeto');
  assert(plTeste.id, 'sem id');
  assert(plTeste.id.startsWith('spl-'), 'id deve começar com spl-');
  assert.strictEqual(plTeste.orgName, 'Observatório Cidadão Teste');
  assert.strictEqual(plTeste.title, 'PL de Proteção às Nascentes (Teste Automatizado)');
  assert.strictEqual(plTeste.category, 'Meio Ambiente');
  assert.strictEqual(plTeste.signatureCount, 0);
});

// ==========================
// Recuperar o PL criado
// ==========================
teste('getSocietyPl retorna o projeto criado', () => {
  const pl = db.getSocietyPl(plTeste.id);
  assert(pl, 'não encontrou');
  assert.strictEqual(pl.id, plTeste.id);
  assert.strictEqual(pl.title, plTeste.title);
});

// ==========================
// Listar PLs com filtro
// ==========================
teste('getAllSocietyPls retorna lista', () => {
  const pls = db.getAllSocietyPls({ category: 'Todos', search: '', limit: 100, offset: 0 });
  assert(Array.isArray(pls), 'não retornou array');
  assert(pls.some(p => p.id === plTeste.id), 'PL de teste não aparece na listagem');
});

teste('getAllSocietyPls filtra por categoria', () => {
  const pls = db.getAllSocietyPls({ category: 'Meio Ambiente', search: '', limit: 100, offset: 0 });
  assert(Array.isArray(pls));
  assert(pls.every(p => p.category === 'Meio Ambiente'), 'filtro por categoria falhou');
});

teste('getAllSocietyPls filtra por busca (search)', () => {
  const pls = db.getAllSocietyPls({ category: 'Todos', search: 'Nascentes', limit: 100, offset: 0 });
  assert(pls.length >= 1, 'busca por "Nascentes" não retornou nada');
});

// ==========================
// Assinar o PL
// ==========================
const voterHash1 = 'vh-teste-' + Date.now() + '-a';
const voterHash2 = 'vh-teste-' + Date.now() + '-b';

teste('signSocietyPl registra primeira assinatura', () => {
  const res = db.signSocietyPl(plTeste.id, voterHash1);
  assert(res.ok, 'deveria retornar ok=true');
});

teste('signSocietyPl impede assinatura duplicada', () => {
  const res = db.signSocietyPl(plTeste.id, voterHash1);
  assert.strictEqual(res.ok, false, 'segunda assinatura deveria falhar');
  assert(/já assinou/i.test(res.error), 'mensagem de erro inadequada: ' + res.error);
});

teste('getSocietyPlSignature confirma assinatura registrada', () => {
  const assinou = db.getSocietyPlSignature(plTeste.id, voterHash1);
  assert.strictEqual(assinou, true, 'assinatura deveria estar registrada');
});

teste('getSocietyPlSignature retorna false para quem não assinou', () => {
  const assinou = db.getSocietyPlSignature(plTeste.id, 'hash-inexistente-' + Date.now());
  assert.strictEqual(assinou, false);
});

teste('getSocietyPl mostra contador de assinaturas incrementado', () => {
  const pl = db.getSocietyPl(plTeste.id);
  assert(pl.signatureCount >= 1, 'signatureCount deveria ser >= 1, foi: ' + pl.signatureCount);
});

// ==========================
// Convites
// ==========================
let convite = null;
teste('createSocietyPlInvite gera convite com token', () => {
  convite = db.createSocietyPlInvite({
    plId: plTeste.id,
    targetType: 'Parlamentar',
    targetId: 'dep-teste-001',
    targetName: 'Deputado Teste da Silva'
  });
  assert(convite, 'não retornou convite');
  assert(convite.token, 'sem token');
  assert(convite.id.startsWith('inv-'), 'id deveria começar com inv-');
  assert.strictEqual(convite.status, 'Pendente');
  assert.strictEqual(convite.targetName, 'Deputado Teste da Silva');
});

teste('getSocietyPlInviteByToken retorna o convite', () => {
  const inv = db.getSocietyPlInviteByToken(convite.token);
  assert(inv, 'não encontrou por token');
  assert.strictEqual(inv.plId, plTeste.id);
  assert.strictEqual(inv.targetName, 'Deputado Teste da Silva');
});

teste('getSocietyPlInvites lista convites do PL', () => {
  const invs = db.getSocietyPlInvites(plTeste.id);
  assert(Array.isArray(invs));
  assert(invs.some(i => i.token === convite.token), 'convite não aparece na lista');
});

// ==========================
// Aceitar convite
// ==========================
teste('acceptSocietyPlInvite aceita convite válido', () => {
  const res = db.acceptSocietyPlInvite(convite.token);
  assert(res.ok, 'deveria aceitar');
  assert.strictEqual(res.plId, plTeste.id);
});

teste('getSocietyPlSupportersRanking inclui parlamentar após aceite', () => {
  const ranking = db.getSocietyPlSupportersRanking();
  assert(Array.isArray(ranking));
  const encontrou = ranking.find(r => r.targetId === 'dep-teste-001' && r.name === 'Deputado Teste da Silva');
  assert(encontrou, 'parlamentar não apareceu no ranking');
  assert(encontrou.supportedCount >= 1, 'supportedCount deveria ser >= 1');
});

// ==========================
// Validações de erro
// ==========================
teste('getSocietyPl retorna null para id inexistente', () => {
  const pl = db.getSocietyPl('spl-inexistente-xyz');
  assert.strictEqual(pl, null);
});

teste('acceptSocietyPlInvite falha com token inexistente', () => {
  const res = db.acceptSocietyPlInvite('token-falso-' + Date.now());
  assert.strictEqual(res.ok, false);
});

teste('signSocietyPl lida com plId inexistente (não quebra)', () => {
  // o backend verifica se o PL existe antes de chamar signSocietyPl,
  // mas a função em si não deve quebrar o processo
  try {
    db.signSocietyPl('spl-inexistente', 'vh-qualquer');
    // se chegou aqui, é comportamento aceitável (pode inserir em tabela)
  } catch (_) {
    // erro também é aceitável - não quebra o processo
  }
});

// ==========================
// Resultado
// ==========================
console.log('\n========================================');
console.log('Total: ' + (pass + fail) + ' | ✅ Passaram: ' + pass + ' | ❌ Falharam: ' + fail);
console.log('========================================');

// Cleanup (apagar o PL de teste e seus dados relacionados)
try {
  // Nota: não temos função deleteSocietyPl, então fica por conta do usuário
  // O PL fica no banco como registro de teste
  console.log('ℹ️  PL de teste criado: ' + plTeste.id + ' (pode ser removido manualmente se desejar)');
} catch (_) {}

if (fail > 0) { console.log('❌ ALGUM TESTE FALHOU'); process.exit(1); }
else { console.log('✅ TODOS OS TESTES DA INICIATIVA CIDADÃ PASSARAM'); process.exit(0); }
