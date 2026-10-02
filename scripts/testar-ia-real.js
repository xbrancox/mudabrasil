// Teste com DADOS REAIS da API de producao (sem stubs): prova que o reparo dos
// ids com traco ("2634392-21") funciona no payload verdadeiro da Camara.
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'pages', 'votacoes.html');
let html = fs.readFileSync(FILE, 'utf8').replace(/<script src="[^"]*"><\/script>/g, '');

let fails = 0;
const ok = m => console.log('  ✅ ' + m);
const bad = m => { fails++; console.log('  ❌ ' + m); };
const chk = (c, m) => c ? ok(m) : bad(m);

const dom = new JSDOM(html, {
  url: 'https://meu-voto.app/pages/votacoes.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.fetch = (u) => globalThis.fetch(String(u), { headers: { 'User-Agent': 'meuvoto-teste' } })
      .then(async r => ({
        ok: r.ok, status: r.status,
        headers: { get: (k) => r.headers.get(k) },
        json: async () => JSON.parse(await r.text()),
        text: async () => r.text()
      }));
    window.Notification = function () {};
    window.Notification.permission = 'default';
    window.Notification.requestPermission = () => Promise.resolve('default');
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push(String(e.message)));
    window.print = () => {};
    window.open = () => ({});
  }
});

const { window } = dom;
const D = window.document;
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await wait(9000);
  console.log('\n[REAL] DADOS DE PRODUCAO');
  chk(window.__errs.length === 0, 'sem erros de execucao' + (window.__errs.length ? ' → ' + window.__errs.join(' | ') : ''));

  const ALL = window.eval('typeof ALL!=="undefined"?ALL:[]');
  chk(Array.isArray(ALL) && ALL.length > 0, 'API devolveu votacoes reais: ' + (ALL ? ALL.length : 0));
  const comTraco = ALL.filter(v => String(v.id).indexOf('-') >= 0);
  chk(comTraco.length > 0, 'ids reais contem traco (o caso que quebrava): ' + comTraco.length + '/' + ALL.length + ' ex. ' + (comTraco[0] ? comTraco[0].id : ''));

  const cards = D.querySelectorAll('#list .vcard');
  chk(cards.length > 0, cards.length + ' cards renderizados');

  const primeiro = cards[0];
  const oid = primeiro.querySelector('.vdet') ? primeiro.querySelector('.vdet').id : '';
  chk(!!oid, 'card tem container de detalhes (' + oid + ')');

  const btn = primeiro.querySelector('button[data-tip]');
  const oc = btn.getAttribute('onclick');
  chk(oc.indexOf("'") >= 0, 'onclick passa o id ENTRE ASPAS: ' + oc);

  btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(4000);
  const det = D.getElementById(oid);
  chk(det && !det.hidden, 'detalhes ABREM com id real (bug corrigido)');
  const ehNominal = det.textContent.indexOf('Votação NOMINAL') >= 0;
  const ehSimbolica = det.textContent.indexOf('Votação SIMBÓLICA') >= 0;
  chk(ehNominal || ehSimbolica, 'tipo identificado: ' + (ehNominal ? 'nominal' : (ehSimbolica ? 'simbólica' : 'NENHUM')));
  if (ehNominal) {
    chk(det.textContent.indexOf('Quórum') >= 0, 'bloco de quorum presente');
    chk(det.querySelectorAll('.cbar div').length >= 2, 'barra de placar desenhada');
    chk(det.querySelectorAll('.ochips span').length >= 1, 'placar por UF presente');
    const linhas = det.querySelectorAll('tbody tr').length;
    chk(linhas > 0, 'voto a voto com ' + linhas + ' linhas');
  } else {
    ok('(simbolica: sem voto a voto — comportamento esperado)');
  }

  const seg = D.querySelectorAll('#list .vcard')[1];
  if (seg) {
    seg.querySelector('button[data-tip]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await wait(3500);
    const d2 = seg.querySelector('.vdet');
    chk(d2 && !d2.hidden, 'segundo card tambem abre (' + d2.id + ')');
  }

  console.log('\n[REAL] ABAS E ESTRUTURA');
  chk(D.querySelectorAll('.ia-tab').length === 6, '6 abas presentes');
  chk(D.querySelectorAll('.painel.ia-enh').length >= 12, D.querySelectorAll('.painel.ia-enh').length + ' cartoes organizados');
  chk(D.getElementById('iaS1').textContent !== '—', 'estatisticas populadas: ' + ['iaS1','iaS2','iaS3','iaS4'].map(i => D.getElementById(i).textContent).join(' / '));

  console.log('\n=== RESULTADO (dados reais): ' + (fails ? ('❌ ' + fails + ' falha(s)') : '✅ TUDO OK') + ' ===');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('ERRO: ' + (e && e.stack || e)); process.exit(1); });
