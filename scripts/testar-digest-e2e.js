
/* Teste E2E do fluxo digest (mockado, sem rede real) */
const assert = require('assert');

// Mock de fetch global
const VOTES = [
  { id: 'v1', dataHoraRegistro: new Date(Date.now()-2*864e5).toISOString(), descricao: 'Reforma tributária sobre economia e consumo' },
  { id: 'v2', dataHoraRegistro: new Date(Date.now()-3*864e5).toISOString(), descricao: 'Ampliação do Bolsa Família' },
  { id: 'v3', dataHoraRegistro: new Date(Date.now()-4*864e5).toISOString(), descricao: 'Pacote de segurança pública' },
  { id: 'v4', dataHoraRegistro: new Date(Date.now()-5*864e5).toISOString(), descricao: 'Meio ambiente e desmatamento' }
];

const SUBSCRIBERS = [
  { email: 'a@x.com', topics: ['economia'] },        // deve receber v1
  { email: 'b@x.com', topics: ['segurança'] },       // deve receber v3
  { email: 'c@x.com', topics: [] },                  // deve receber todas
  { email: 'd@x.com', topics: ['cultura'] }          // não bate com nada
];

const sent = [];
global.fetch = async (url, opts) => {
  if (/\/api\/digest\/list/.test(url)) {
    return { ok: true, status: 200, json: async () => ({ ok: true, subscribers: SUBSCRIBERS, emails: SUBSCRIBERS.map(s=>s.email) }) };
  }
  if (/\/api\/camara\/votacoes/.test(url)) {
    return { ok: true, status: 200, json: async () => ({ ok: true, dados: VOTES }) };
  }
  if (/\/api\/termometro/.test(url)) {
    return { ok: true, status: 200, json: async () => ({ ok: true, indice: 42 }) };
  }
  if (/\/api\/digest\/stats/.test(url)) {
    return { ok: true, status: 200, json: async () => ({ ok: true, totalSent: 5 }) };
  }
  if (/\/api\/digest\/log-send/.test(url)) {
    return { ok: true, status: 200, json: async () => ({ ok: true, total: 6 }) };
  }
  throw new Error('URL inesperada: ' + url);
};

// Mock de nodemailer — captura envios em vez de mandar SMTP
require.cache[require.resolve.paths('nodemailer')[0] + '/nodemailer'] = null;
require.cache.nodemailer = { exports: {
  createTransport: () => ({
    sendMail: async (m) => { sent.push({ to: m.to, text: m.text, html: m.html }); return { messageId: 'mock-' + sent.length }; }
  })
}};

// Replica a lógica bodyFor do digest-send.js para testar o filtro de temas
function bodyFor(sub, allItems) {
  const topics = (sub.topics || []).map(t => String(t).toLowerCase());
  const items = topics.length
    ? allItems.filter(x => { const t = String(x.descricao || '').toLowerCase(); return topics.some(k => t.indexOf(k) >= 0); })
    : allItems;
  const it = items.length
    ? items.map(x => '- ' + x.dataHoraRegistro.slice(0,10) + ' - ' + String(x.descricao).slice(0, 140)).join('\n')
    : (topics.length ? 'Nenhuma votacao nos ultimos 7 dias relacionada aos seus temas: ' + topics.join(', ') + '.' : 'Nenhuma votacao nos ultimos 7 dias (recesso).');
  return 'Resumo semanal MeuVoto\n\n' + it + '\n\nPara cancelar: https://xbrancox.github.io/votabrasil/pages/digest.html';
}

// ====== TESTES ======
let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); console.log('  ✅ ' + name); pass++; }
  catch (e) { console.log('  ❌ ' + name + ': ' + e.message); fail++; }
}

console.log('\n[A] Filtro por temas do inscrito');
test('inscrito com tema "economia" recebe apenas v1', () => {
  const b = bodyFor(SUBSCRIBERS[0], VOTES);
  assert.ok(b.indexOf('tributária') >= 0, 'deveria conter tributária');
  assert.ok(b.indexOf('Bolsa') < 0, 'não deveria conter Bolsa');
  assert.ok(b.indexOf('segurança') < 0, 'não deveria conter segurança');
  assert.ok(b.indexOf('Meio ambiente') < 0, 'não deveria conter Meio ambiente');
});
test('inscrito com tema "segurança" recebe apenas v3', () => {
  const b = bodyFor(SUBSCRIBERS[1], VOTES);
  assert.ok(b.indexOf('segurança') >= 0);
  assert.ok(b.indexOf('tributária') < 0);
});
test('inscrito sem tema recebe todas', () => {
  const b = bodyFor(SUBSCRIBERS[2], VOTES);
  assert.ok(b.indexOf('tributária') >= 0);
  assert.ok(b.indexOf('Bolsa') >= 0);
  assert.ok(b.indexOf('segurança') >= 0);
  assert.ok(b.indexOf('Meio ambiente') >= 0);
});
test('inscrito com tema sem match recebe mensagem específica', () => {
  const b = bodyFor(SUBSCRIBERS[3], VOTES);
  assert.ok(b.indexOf('relacionada aos seus temas: cultura') >= 0, 'deveria mencionar cultura: ' + b);
});

console.log('\n[B] Robustez do filtro');
test('case-insensitive (tema em maiúsculas)', () => {
  const b = bodyFor({ email: 'e@x', topics: ['ECONOMIA'] }, VOTES);
  assert.ok(b.indexOf('tributária') >= 0);
});
test('match parcial (tema "ambient" bate em "Meio ambiente")', () => {
  const b = bodyFor({ email: 'f@x', topics: ['ambient'] }, VOTES);
  assert.ok(b.indexOf('Meio ambiente') >= 0);
});
test('lista vazia de votações + inscrito sem tema = recesso', () => {
  const b = bodyFor({ email: 'g@x', topics: [] }, []);
  assert.ok(b.indexOf('Nenhuma votacao nos ultimos 7 dias (recesso)') >= 0);
});

console.log('\n[C] Sintaxe do worker');
try {
  const src = require('fs').readFileSync('./scripts/digest-send.js', 'utf8');
  new Function(src);
  test('digest-send.js compila sem erro', () => {});
} catch (e) {
  test('digest-send.js compila sem erro', () => { throw e; });
}

console.log('\n[D] Bug corrigido: ausência de "em.length" e "body" órfãos');
const src = require('fs').readFileSync('./scripts/digest-send.js', 'utf8');
test('não há mais "em.length" no worker', () => {
  assert.ok(src.indexOf('em.length') < 0, 'em.length ainda aparece: ' + src.match(/.{0,40}em\.length.{0,40}/g));
});
test('log-send usa "subs.length"', () => {
  assert.ok(/count:\s*subs\.length/.test(src), 'log-send deveria usar subs.length');
});

console.log('\n[E] Pixel de tracking está presente no HTML do email');
test('worker constrói pixelUrl com /api/digest/open?i=', () => {
  assert.ok(/pixelUrl\s*=.*?['"]\/api\/digest\/open\?i=/.test(src), 'pixelUrl deveria apontar para /api/digest/open?i=');
  assert.ok(/<img[^>]+pixelUrl/.test(src), 'HTML deveria referenciar pixelUrl em um <img>');
});

console.log('\n[F] Exportação PNG do comparador A×B (ciclo21)');
const vot = require('fs').readFileSync('./pages/votacoes.html', 'utf8');
test('função abPNG existe (exporta canvas via toDataURL)', () => {
  assert.ok(/function\s+abPNG\s*\(/.test(vot));
  assert.ok(/toDataURL\s*\(\s*['"]image\/png['"]/.test(vot));
});
test('download nomeado meuvoto-comparador-ab.png', () => {
  assert.ok(/meuvoto-comparador-ab\.png/.test(vot));
});
test('abZap abre wa.me (WhatsApp)', () => {
  assert.ok(/function\s+abZap\s*\(/.test(vot));
  assert.ok(/wa\.me\/\?text=/.test(vot));
});

console.log('\n[G] Dashboard de temas no admin (ciclo27)');
const adm = require('fs').readFileSync('./pages/digest-admin.html', 'utf8');
test('themesPanel existe', () => { assert.ok(/id="themesPanel"/.test(adm)); });
test('renderThemes existe', () => { assert.ok(/function\s+renderThemes\s*\(subscribers\)/.test(adm)); });
test('admin busca /api/digest/list em paralelo', () => {
  assert.ok(/Promise\.all\(\s*\[/.test(adm));
  assert.ok(/\/api\/digest\/list\?secret=/.test(adm));
});
test('gráfico SVG de temas renderizado', () => {
  assert.ok(/<svg[^>]+viewBox/.test(adm) && /entries\.forEach/.test(adm));
});

console.log('\n========================================');
console.log('Total: ' + (pass + fail) + ' | ✅ Passaram: ' + pass + ' | ❌ Falharam: ' + fail);
console.log('========================================');
process.exit(fail > 0 ? 1 : 0);
