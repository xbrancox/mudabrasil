const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'pages', 'votacoes.html');
let html = fs.readFileSync(FILE, 'utf8');

// remove scripts externos (jsdom nao carregaria mesmo; deixa o teste deterministico)
html = html.replace(/<script src="[^"]*"><\/script>/g, '');

const HOJE = new Date();
const ISO = d => d.toISOString().slice(0, 19);
const VOTOS = [
  { idDeputado: '1001', nome: 'Ana Souza', siglaPartido: 'AAA', siglaUf: 'SP', voto: 'Sim' },
  { idDeputado: '1002', nome: 'Bruno Lima', siglaPartido: 'BBB', siglaUf: 'MG', voto: 'Não' },
  { idDeputado: '1003', nome: 'Carla Dias', siglaPartido: 'AAA', siglaUf: 'SP', voto: 'Abstenção' }
];
const VOTS = [
  { id: '9001-1', dataHora: ISO(HOJE), dataHoraRegistro: ISO(HOJE), siglaProposicao: 'PL', numeroProposicao: '1234', anoProposicao: '2026', tituloVotacao: 'PL 1234/2026 — diretrizes da educação básica', proposicao: { id: '7001', sigla: 'PL', numero: '1234', ano: '2026', titulo: 'PL 1234/2026 — diretrizes da educação básica' } },
  { id: '9001-2', dataHora: ISO(HOJE), dataHoraRegistro: ISO(HOJE), siglaProposicao: 'MPV', numeroProposicao: '1369', anoProposicao: '2026', tituloVotacao: 'MPV 1369/2026 — crédito extraordinário para a saúde', proposicao: { id: '7002', sigla: 'MPV', numero: '1369', ano: '2026', titulo: 'MPV 1369/2026 — crédito extraordinário para a saúde' } },
  { id: '9001-3', dataHora: ISO(HOJE), dataHoraRegistro: ISO(HOJE), siglaProposicao: '', numeroProposicao: '', anoProposicao: '', tituloVotacao: 'Requerimento de urgência', proposicao: null }
];

function stubFor(url) {
  const u = String(url);
  if (u.indexOf('/api/camara/votacoes') >= 0 && u.indexOf('/votos') >= 0) return { dados: VOTOS };
  if (u.indexOf('/orientacoes') >= 0) return { dados: [{ siglaPartido: 'AAA', voto: 'Sim' }, { siglaPartido: 'BBB', voto: 'Não' }] };
  if (/\/api\/camara\/votacoes\?/.test(u)) return { dados: VOTS };
  if (u.indexOf('/api/camara/eventos') >= 0) return { dados: [
    { id: 'e1', titulo: 'Sessão deliberativa extraordinária — debate sobre educação', dataHora: new Date(Date.now() + 2 * 864e5).toISOString(), situacao: 'Convocada' },
    { id: 'e2', titulo: 'Sessão ordinária — crédito para a saúde', dataHora: new Date(Date.now() + 4 * 864e5).toISOString(), situacao: 'Convocada' }
  ] };
  if (u.indexOf('/api/camara/proposicoes/') >= 0) return { dados: { ementa: 'Dispõe sobre normas gerais do tema.' } };
  if (u.indexOf('/api/candidatos') >= 0) return { candidatos: [
    { id: 'camara-1001', name: 'Ana Souza', party: 'AAA', state: 'SP', position: 'Deputado Federal', photo: '' },
    { id: 'camara-1002', name: 'Bruno Lima', party: 'BBB', state: 'MG', position: 'Deputado Federal', photo: '' }
  ] };
  if (u.indexOf('/api/reclamacoes') >= 0) return { complaints: [{}, {}] };
  if (u.indexOf('/api/apoios') >= 0) return { supports: [{}] };
  if (u.indexOf('senado.leg.br') >= 0) throw new Error('WAF simulado');
  return {};
}

let fails = 0;
const ok = m => console.log('  ✅ ' + m);
const bad = m => { fails++; console.log('  ❌ ' + m); };
const chk = (cond, msg) => cond ? ok(msg) : bad(msg);

const dom = new JSDOM(html, {
  url: 'https://meu-voto.app/pages/votacoes.html',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.fetch = (u) => Promise.resolve({
      ok: true, status: 200,
      headers: { get: () => 'application/json' },
      json: async () => stubFor(u),
      text: async () => JSON.stringify(stubFor(u))
    });
    window.Notification = function (t, o) { window.__notifs.push([t, o && o.body]); };
    window.Notification.permission = 'granted';
    window.Notification.requestPermission = () => Promise.resolve('granted');
    window.__notifs = [];
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push(String(e.message)));
    window.print = () => { window.__printed = (window.__printed || 0) + 1; };
    window.open = () => ({});
  }
});

const { window } = dom;
const D = window.document;
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await wait(600);
  console.log('\n[A] ERROS DE EXECUCAO');
  chk(window.__errs.length === 0, 'sem erros nao capturados (' + window.__errs.length + ')' + (window.__errs.length ? ' → ' + window.__errs.join(' | ') : ''));

  console.log('\n[B] BARRA DE ABAS');
  const bar = D.getElementById('iaBar');
  chk(!!bar, 'iaBar existe');
  const tabs = D.querySelectorAll('.ia-tab');
  chk(tabs.length === 6, '6 abas criadas (achei ' + tabs.length + ')');
  chk(D.querySelectorAll('[role="tab"]').length === 6, 'role=tab nas 6 abas');
  chk(D.querySelectorAll('[role="tabpanel"]').length === 6, '6 paineis role=tabpanel');
  const sel = D.querySelector('.ia-tab[aria-selected="true"]');
  chk(!!sel && sel.dataset.id === 'vot', 'aba inicial = Votações');
  chk(D.getElementById('ia-v-vot').classList.contains('on'), 'painel vot visivel');
  chk(!D.getElementById('ia-v-analise').classList.contains('on'), 'painel analise oculto');

  console.log('\n[C] CARTOES MOVIDOS E IDENTIFICADOS');
  const cards = D.querySelectorAll('.painel.ia-enh');
  chk(cards.length >= 12, cards.length + ' cartoes aprimorados (esperado >=12)');
  const perdido = Array.from(D.querySelectorAll('.painel')).filter(p => !p.classList.contains('ia-enh'));
  chk(perdido.length === 0, 'nenhum cartao ficou fora das abas');
  const porAba = {};
  ['vot','meus','analise','gerar','avisos','brasil'].forEach(id => porAba[id] = D.getElementById('ia-v-' + id).querySelectorAll('.ia-enh').length);
  console.log('     distribuicao: ' + JSON.stringify(porAba));
  chk(porAba.meus >= 3, 'Meus Representantes recebeu os 3 cartoes (⭐/🤝/📌)');
  chk(porAba.analise >= 3, 'Análise recebeu >=3 cartoes');
  chk(porAba.gerar >= 3, 'Materiais recebeu >=3 cartoes');
  chk(porAba.brasil >= 2, 'Brasil & Sistema recebeu >=2 cartoes');
  chk(D.getElementById('agenda').closest('.ia-view').id === 'ia-v-vot', 'agenda esta dentro da aba Votações');
  chk(D.getElementById('list').closest('.ia-view').id === 'ia-v-vot', 'lista de votacoes esta na aba Votações');
  chk(D.querySelector('.fbar').closest('.ia-view').id === 'ia-v-vot', 'barra de filtros esta na aba Votações');

  console.log('\n[D] INFORMACAO (i)');
  const infos = D.querySelectorAll('.ia-hd .ia-i');
  chk(infos.length === cards.length, 'todo cartao tem botao i (' + infos.length + '/' + cards.length + ')');
  const semTexto = Array.from(infos).filter(i => !i.dataset.d || i.dataset.d.length < 40);
  chk(semTexto.length === 0, 'todo botao i tem descricao substancial');
  infos[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(30);
  const pop = D.getElementById('iaPop');
  chk(pop.style.display === 'block', 'popover abre ao clicar no i');
  chk(!!pop.querySelector('h4') && !!pop.querySelector('p'), 'popover tem titulo e corpo');
  chk(infos[0].getAttribute('aria-expanded') === 'true', 'aria-expanded=true no gatilho');
  D.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await wait(20);
  chk(pop.style.display === 'none', 'Esc fecha o popover');

  console.log('\n[E] RECOLHER/EXPANDIR');
  const alvo = cards[0];
  const col = alvo.querySelector('.ia-col');
  col.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(20);
  chk(alvo.classList.contains('ia-min'), 'cartao recolhe');
  chk(window.localStorage.getItem(col ? 'ia_col:' + alvo.dataset.iaKey : '') === '1', 'estado recolhido persiste no localStorage');
  col.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(20);
  chk(!alvo.classList.contains('ia-min'), 'cartao expande de novo');

  console.log('\n[F] TROCA DE ABA + URL');
  D.getElementById('ia-b-brasil').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(40);
  chk(D.getElementById('ia-v-brasil').classList.contains('on'), 'aba Brasil abre');
  chk(!D.getElementById('ia-v-vot').classList.contains('on'), 'aba Votacoes fecha');
  chk(window.location.hash === '#tab-brasil', 'URL reflete a aba (' + window.location.hash + ')');
  const ev = new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
  D.getElementById('ia-b-brasil').dispatchEvent(ev);
  await wait(20);

  console.log('\n[G] AGENDA COM JANELAS');
  D.getElementById('ia-b-vot').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(200);
  const ag = D.getElementById('agenda');
  chk(ag.querySelectorAll('.ia-rngb').length === 3, '3 botoes de janela (10 dias / ultimo mes / todas)');
  chk(!!ag.querySelector('.ia-rngb.on'), 'uma janela marcada como ativa');
  chk(ag.textContent.indexOf('O que SERÁ votado') >= 0, 'cabecalho da agenda presente');
  const itens = ag.querySelectorAll('.ecard p');
  chk(itens.length >= 1, 'agenda renderizou sessoes (' + itens.length + ' paragrafos)');
  chk(ag.textContent.indexOf('Última semelhante') >= 0, 'cruzamento com votacoes passadas funcionando');
  ag.querySelector('.ia-rngb[data-m="mes"]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(200);
  chk(!!ag.querySelector('.ia-rngb[data-m="mes"].on'), 'troca para "ultimo mes" aplica');
  chk(ag.textContent.indexOf('próximo mês') >= 0, 'rotulo da janela atualizado');

  console.log('\n[H] FAIXA DE ESTATISTICAS');
  const st = ['iaS1','iaS2','iaS3','iaS4'].map(id => D.getElementById(id));
  chk(st.every(Boolean), '4 estatisticas presentes');
  console.log('     valores: ' + st.map(e => e.textContent).join(' / '));
  chk(Number(st[1].textContent) === 3, 'todas as 3 votacoes marcadas como nominais');
  chk(Number(st[3].textContent) === 0, 'lista de acompanhados comeca vazia');
  chk(st[0].textContent === '3', 'total de votacoes na janela = 3');
  chk(Number(st[2].textContent) === 2, 'sessoes futuras = 2');

  console.log('\n[I] LISTA DE VOTACOES');
  const vc = D.querySelectorAll('#list .vcard');
  chk(vc.length === 3, '3 cards de votacao renderizados (' + vc.length + ')');
  const btn = vc[0].querySelector('button[data-tip]');
  chk(!!btn, 'card tem botao "Como foi esta votacao?"');
  btn.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(250);
  const det = D.getElementById('vd-9001-1');
  chk(det && !det.hidden, 'detalhes expandem');
  chk(det.textContent.indexOf('Quórum') >= 0, 'bloco de quorum presente');
  chk(det.textContent.indexOf('Coerência') >= 0, 'bloco de coerencia de bancada presente');
  chk(det.querySelectorAll('.ochips span').length >= 1, 'placar por UF renderizado');
  chk(det.querySelectorAll('#nvt-9001-1 tr').length === 3, 'tabela voto a voto com 3 linhas');

  console.log('\n[J] ACESSIBILIDADE BASICA');
  chk(D.querySelectorAll('.ia-tab[id]').length === 6 && Array.from(D.querySelectorAll('.ia-tab')).every(t => t.getAttribute('aria-controls')), 'cada aba aponta para seu painel');
  chk(D.getElementById('ia-main') !== null, 'ancora #ia-main existe (skip target)');
  chk(D.querySelectorAll('.ia-hd h3').length === cards.length, 'todo cartao tem titulo legivel por leitor de tela');
  const foco = D.querySelectorAll('[tabindex="0"]');
  chk(foco.length >= 6, 'elementos navegaveis por teclado: ' + foco.length);

  console.log('\n[K] ONBOARDING');
  const onb = D.getElementById('iaOnb');
  chk(!!onb, 'modal de boas-vindas aparece na primeira visita');
  chk(onb.textContent.indexOf('Meus Representantes') >= 0, 'modal cita o caminho sugerido');
  D.getElementById('iaOnbOk').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  await wait(30);
  chk(!D.getElementById('iaOnb'), 'modal fecha e fica marcado');
  chk(window.localStorage.getItem('ia_onb') === '1', 'nao reaparecera na proxima visita');

  console.log('\n[L] FUNCOES ORIGINAIS INTACTAS');
  ['render','expand','setTab','dossie','ciclo7','ciclo9auto','meuCongresso','mapaBrasil','csv9','recibo9','linkCompartilhar','temasUI16','buildNav16','digestAssinar','grafCoerencia'].forEach(fn => {
    if (typeof window[fn] !== 'function') bad('funcao perdida: ' + fn);
  });
  ok('API publica de funcoes preservada (15/15 verificadas)');

  console.log('\n=== RESULTADO: ' + (fails ? ('❌ ' + fails + ' falha(s)') : '✅ TODOS OS TESTES PASSARAM') + ' ===');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('ERRO DO TESTE: ' + (e && e.stack || e)); process.exit(1); });
