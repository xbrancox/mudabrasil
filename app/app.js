/* ============================================================
   MeuVoto — App PWA
   ============================================================ */
const MB = window.MeuVoto || {};
const API_BASE = MB.API_BASE || '';
const LS_VOTOS = 'mb_votos';
const LS_RECL = 'mb_reclamacoes';
const LS_COMP = 'mb_comparacao';
const LS_PLOP = 'mb_pl_opinioes';

if (API_BASE) document.getElementById('badge').style.display = 'flex';
console.log('%c🟡 MeuVoto v22', 'font-size:16px;font-weight:bold;color:#FFD700');
console.log('Modo: ' + MB.MODO + ' | Backend: ' + (API_BASE || '(nenhum)'));

/* ===== STATE ===== */
const CARGOS_ORDEM = ['Presidente', 'Senador', 'Deputado Federal', 'Deputado Estadual', 'Deputado Distrital', 'Governador'];

const CANDIDATOS = {
  'Presidente': [
    { nome: 'Ana Souza', partido: 'PSD', numero: 55 },
    { nome: 'Bruno Lima', partido: 'NOVO', numero: 30 },
    { nome: 'Carla Mendes', partido: 'PSOL', numero: 50 }
  ],
  'Senador': [
    { nome: 'Diego Franco', partido: 'MDB', numero: 151 },
    { nome: 'Elisa Prado', partido: 'PT', numero: 131 },
    { nome: 'Fábio Nunes', partido: 'PL', numero: 222 }
  ],
  'Deputado Federal': [
    { nome: 'Gil Santos', partido: 'UNIÃO', numero: 4444 },
    { nome: 'Helena Rocha', partido: 'PSDB', numero: 4545 },
    { nome: 'Igor Alves', partido: 'PSB', numero: 4040 }
  ],
  'Deputado Estadual': [
    { nome: 'Joana Pinto', partido: 'REP', numero: 1010 },
    { nome: 'Kléber Dias', partido: 'PDT', numero: 1212 },
    { nome: 'Lia Campos', partido: 'PV', numero: 4343 }
  ],
  'Deputado Distrital': [
    { nome: 'Marcelo Cruz', partido: 'PL', numero: 2222 },
    { nome: 'Patrícia Lima', partido: 'PT', numero: 1313 },
    { nome: 'Roberto Silva', partido: 'MDB', numero: 1515 }
  ],
  'Governador': [
    { nome: 'Marcos Teles', partido: 'PP', numero: 11 },
    { nome: 'Nina Barros', partido: 'CID', numero: 23 },
    { nome: 'Otávio Reis', partido: 'REDE', numero: 18 }
  ]
};

const POLS_DEMO = [
  { id:1,nome:'Jair Bolsonaro',cargo:'Ex-Presidente',partido:'PL',uf:'SP',av:'JB',
    dados:{nascimento:'21/03/1955',naturalidade:'Glicério/SP',mandatos:'Deputado (7 mandatos)',escolaridade:'Superior (EsPCEx)',patrimonio:'R$ 5,8M',processos:'21 (TSE)',comparecimento:'94%',projetos:'17',votos:'22M (2018)',financiamento:'R$ 18M'},
    fontes:[{l:'TSE',u:'https://divulgacandcontas.tse.jus.br/'},{l:'Transparência',u:'https://portaldatransparencia.gov.br/'},{l:'CNJ',u:'https://www.cnj.jus.br/'}]},
  { id:2,nome:'Luiz Inácio Lula da Silva',cargo:'Presidente',partido:'PT',uf:'SP',av:'LL',
    dados:{nascimento:'27/10/1945',naturalidade:'Caetés/PE',mandatos:'Presidente (3x)',escolaridade:'Superior (Metalurgia)',patrimonio:'R$ 7,9M',processos:'0 ativos',comparecimento:'100%',projetos:'4',votos:'60M (2022)',financiamento:'R$ 118M'},
    fontes:[{l:'TSE',u:'https://divulgacandcontas.tse.jus.br/'},{l:'Planalto',u:'https://www.gov.br/planalto'}]},
  { id:3,nome:'Ciro Gomes',cargo:'Ex-Deputado',partido:'PDT',uf:'CE',av:'CG',
    dados:{nascimento:'16/08/1957',naturalidade:'Pindamonhangaba/SP',mandatos:'Governador CE, Dep Fed',escolaridade:'Superior (Direito)',patrimonio:'R$ 2,1M',processos:'3',comparecimento:'91%',projetos:'22',votos:'3,6M (2022)',financiamento:'R$ 28M'},
    fontes:[{l:'TSE',u:'https://divulgacandcontas.tse.jus.br/'},{l:'Câmara',u:'https://www.camara.leg.br/'}]},
  { id:4,nome:'Marina Silva',cargo:'Ministra',partido:'REDE',uf:'AC',av:'MS',
    dados:{nascimento:'09/02/1958',naturalidade:'Rio Branco/AC',mandatos:'Senadora, Ministra (2x)',escolaridade:'Superior (História)',patrimonio:'R$ 190K',processos:'0',comparecimento:'96%',projetos:'38',votos:'923K (2010)',financiamento:'R$ 2,4M'},
    fontes:[{l:'MMA',u:'https://www.gov.br/mma'},{l:'Senado',u:'https://www25.senado.leg.br/'}]},
  { id:5,nome:'Arthur Lira',cargo:'Deputado',partido:'PP',uf:'AL',av:'AL',
    dados:{nascimento:'30/07/1969',naturalidade:'Maceió/AL',mandatos:'Deputado (4x), Pres. Câmara',escolaridade:'Superior (Direito)',patrimonio:'R$ 3,2M',processos:'8',comparecimento:'88%',projetos:'12',votos:'128K (2022)',financiamento:'R$ 6,1M'},
    fontes:[{l:'Câmara',u:'https://www.camara.leg.br/deputados/'},{l:'CNJ',u:'https://www.cnj.jus.br/'}]},
  { id:6,nome:'Simone Tebet',cargo:'Ministra',partido:'MDB',uf:'MS',av:'ST',
    dados:{nascimento:'22/07/1970',naturalidade:'Três Lagoas/MS',mandatos:'Senadora, Ministra',escolaridade:'Superior (Direito)',patrimonio:'R$ 4,1M',processos:'2',comparecimento:'97%',projetos:'29',votos:'503K (2018)',financiamento:'R$ 14M'},
    fontes:[{l:'Senado',u:'https://www25.senado.leg.br/'},{l:'TSE',u:'https://divulgacandcontas.tse.jus.br/'}]},
  { id:7,nome:'Davi Alcolumbre',cargo:'Senador',partido:'UNIÃO',uf:'AP',av:'DA',
    dados:{nascimento:'13/09/1977',naturalidade:'Macapá/AP',mandatos:'Senador (2x), Pres. Senado',escolaridade:'Superior (Economia)',patrimonio:'R$ 2,8M',processos:'12',comparecimento:'85%',projetos:'15',votos:'220K (2022)',financiamento:'R$ 7,3M'},
    fontes:[{l:'Senado',u:'https://www25.senado.leg.br/'}]},
  { id:8,nome:'Rodrigo Pacheco',cargo:'Senador',partido:'PSD',uf:'MG',av:'RP',
    dados:{nascimento:'03/07/1976',naturalidade:'Porto Alegre/RS',mandatos:'Senador, Pres. Senado',escolaridade:'Superior (Direito)',patrimonio:'R$ 6,4M',processos:'5',comparecimento:'90%',projetos:'11',votos:'4,7M (2018)',financiamento:'R$ 21M'},
    fontes:[{l:'Senado',u:'https://www25.senado.leg.br/'},{l:'TSE',u:'https://divulgacandcontas.tse.jus.br/'}]}
];

let flowState = { uf: '', cidade: '', cargos: {}, codigo: '' };
let polList = POLS_DEMO.slice();
let polAtualal = null;
let cargoTroca = null;
let votoConferido = null;
let loginMode = 'cid';
let loginStep = 1;

/* ===== STORAGE HELPERS ===== */
function getVotos() { try { return JSON.parse(localStorage.getItem(LS_VOTOS) || '[]'); } catch(e) { return []; } }
function saveVotos(v) { localStorage.setItem(LS_VOTOS, JSON.stringify(v)); }
function getRecl() { try { return JSON.parse(localStorage.getItem(LS_RECL) || '[]'); } catch(e) { return []; } }
function saveRecl(r) { localStorage.setItem(LS_RECL, JSON.stringify(r)); }
function getComp() { try { return JSON.parse(localStorage.getItem(LS_COMP) || '[]'); } catch(e) { return []; } }
function saveComp(c) { localStorage.setItem(LS_COMP, JSON.stringify(c)); }
function getPLOp() { try { return JSON.parse(localStorage.getItem(LS_PLOP) || '{}'); } catch(e) { return {}; } }
function savePLOp(o) { localStorage.setItem(LS_PLOP, JSON.stringify(o)); }

/* ===== NAVEGAÇÃO ===== */
function ir(id) {
  document.querySelectorAll('.sec,.flow').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  document.getElementById('h-title').textContent = 'MeuVoto';
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  const nb = document.querySelector('.nav button[data-s="' + id + '"]');
  if (nb) nb.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function iniciarVotacao() {
  document.querySelectorAll('.sec,.flow').forEach(s => s.classList.remove('active'));
  document.getElementById('flow-t1').classList.add('active');
  document.getElementById('h-title').textContent = 'Votar';
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  const votarBtn = document.querySelector('.nav button[data-s="votar"]');
  if (votarBtn) votarBtn.classList.add('active');
  // reset flow
  flowState = { uf: '', cidade: '', cargos: {}, codigo: '' };
  document.getElementById('sel-estado').value = '';
  document.getElementById('sel-cidade').value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function flowIr(id) {
  document.querySelectorAll('.flow').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function voltarHome() { ir('s-inicio'); }

/* ===== FLOW: TELA 1 ===== */
function confirmarLocal() {
  const uf = document.getElementById('sel-estado').value;
  const cidade = document.getElementById('sel-cidade').value;
  if (!uf || !cidade) { toast('Selecione estado e cidade', 'error'); return; }
  flowState.uf = uf;
  flowState.cidade = cidade;
  CARGOS_ORDEM.forEach(c => {
    if (!flowState.cargos[c]) flowState.cargos[c] = { ...CANDIDATOS[c][0] };
  });
  flowIr('flow-t2');
}

/* ===== FLOW: TELA 2 ===== */
function gerarCodigoEAvancar() {
  // gerar codigo de 20 digitos
  let c = '';
  for (let i = 0; i < 5; i++) {
    c += Math.floor(1000 + Math.random() * 9000) + (i < 4 ? ' ' : '');
  }
  flowState.codigo = c;
  renderReview();
  flowIr('flow-t3');
}

/* ===== FLOW: TELA 3 ===== */
function renderReview() {
  const list = document.getElementById('review-list');
  list.innerHTML = CARGOS_ORDEM.map(c => {
    const cand = flowState.cargos[c] || CANDIDATOS[c][0];
    flowState.cargos[c] = cand;
    return '<div class="vote-item"><div class="vote-info"><h3>' + c + '</h3><p>' + cand.nome + ' · ' + cand.partido + ' · nº ' + cand.numero + '</p></div><button class="btn-trocar" onclick="abrirCand(\'' + c + '\')">Trocar</button></div>';
  }).join('');
}

function abrirCand(cargo) {
  cargoTroca = cargo;
  document.getElementById('cand-cargo').textContent = cargo;
  const opts = CANDIDATOS[cargo];
  document.getElementById('cand-list').innerHTML = opts.map((o, i) => {
    return '<div class="cand-row" onclick="escolherCand(' + i + ')"><div><div class="cand-nome">' + o.nome + '</div><div class="cand-p">' + o.partido + ' · nº ' + o.numero + '</div></div><span style="color:var(--gold)">→</span></div>';
  }).join('');
  abrirSheet('cand-sheet');
}

function escolherCand(i) {
  if (!cargoTroca) return;
  flowState.cargos[cargoTroca] = CANDIDATOS[cargoTroca][i];
  renderReview();
  fecharSheet('cand-sheet');
  toast('Candidato de ' + cargoTroca + ' atualizado');
}

/* ===== FLOW: TELA 4 ===== */
function finalizarVoto() {
  document.getElementById('codigo-gerado').textContent = flowState.codigo;
  // salvar em localStorage
  const votos = getVotos();
  const novo = {
    codigo: flowState.codigo.replace(/\s/g, ''),
    uf: flowState.uf,
    cidade: flowState.cidade,
    cargos: JSON.parse(JSON.stringify(flowState.cargos)),
    status: 'ATIVO',
    data: new Date().toISOString()
  };
  votos.unshift(novo);
  saveVotos(votos);
  // FIX: também salvar em mb_eleicao_codigo para compatibilidade com o site
  localStorage.setItem('mb_eleicao_codigo', flowState.codigo);
  localStorage.setItem('mb_eleicao_votos', JSON.stringify(flowState.cargos));
  atualizarStats();
  flowIr('flow-t4');
}

function copiarCodigo() {
  const c = document.getElementById('codigo-gerado').textContent.replace(/\s/g, '');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(c).then(() => toast('Código copiado!', 'success'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = c; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Código copiado!', 'success'); } catch(e) { toast('Não foi possível copiar', 'error'); }
    document.body.removeChild(ta);
  }
}

function verMeuVoto() {
  ir('s-conferir');
  setTimeout(() => {
    const c = flowState.codigo.replace(/\s/g, '');
    preencherCodigo(c);
    conferirCodigo();
  }, 200);
}

/* ===== CONFERIR ===== */
function preencherCodigo(c) {
  const digits = c.replace(/\D/g, '');
  const ins = document.querySelectorAll('#code-inputs .code-in');
  for (let i = 0; i < ins.length; i++) {
    ins[i].value = digits.substring(i * 4, i * 4 + 4) || '';
  }
}

function conferirCodigo() {
  const ins = document.querySelectorAll('#code-inputs .code-in');
  let c = '';
  ins.forEach(i => c += i.value);
  c = c.replace(/\D/g, '');
  const resEl = document.getElementById('conf-result');
  if (c.length < 20) {
    resEl.className = 'conf-result notfound';
    resEl.innerHTML = '<h3>⚠️ Código incompleto</h3><p style="color:var(--gray);font-size:.88rem">Preencha os 20 dígitos.</p>';
    return;
  }
  // buscar no localStorage
  const votos = getVotos();
  const v = votos.find(x => x.codigo === c);
  if (v) {
    renderVotoResultado(v);
  } else {
    // código de exemplo?
    if (c === '16948051304534262993') {
      const demo = {
        codigo: c,
        uf: 'RJ',
        cidade: 'Rio de Janeiro',
        cargos: {
          'Presidente': { nome: 'Ana Souza', partido: 'PSD', numero: 55 },
          'Senador': { nome: 'Diego Franco', partido: 'MDB', numero: 151 },
          'Deputado Federal': { nome: 'Gil Santos', partido: 'UNIÃO', numero: 4444 },
          'Deputado Estadual': { nome: 'Joana Pinto', partido: 'REP', numero: 1010 },
          'Governador': { nome: 'Marcos Teles', partido: 'PP', numero: 11 }
        },
        status: 'ATIVO',
        data: new Date().toISOString()
      };
      renderVotoResultado(demo);
      return;
    }
    resEl.className = 'conf-result notfound';
    resEl.innerHTML = '<h3>❌ Código não encontrado</h3><p style="color:var(--gray);font-size:.88rem;margin-top:8px">Este código não está registrado neste aparelho.</p><button class="btn-o" style="margin-top:14px" onclick="testarExemplo()">Testar com um exemplo</button>';
  }
}

function renderVotoResultado(v) {
  const resEl = document.getElementById('conf-result');
  const isAtivo = v.status === 'ATIVO';
  resEl.className = 'conf-result' + (isAtivo ? ' found' : ' notfound');
  const badge = isAtivo
    ? '<span class="badge-at">✓ ATIVO</span>'
    : '<span class="badge-rv">✕ REVOGADO em ' + new Date(v.revogadoEm).toLocaleDateString('pt-BR') + '</span>';
  let html = '<h3>' + badge + ' Seu voto</h3>';
  html += '<div class="voto-detail">';
  html += '<div class="vd-row"><span>Local</span><span>' + v.cidade + '/' + v.uf + '</span></div>';
  CARGOS_ORDEM.forEach(c => {
    const ca = v.cargos[c];
    if (ca) html += '<div class="vd-row"><span>' + c + '</span><span>' + ca.nome + ' · ' + ca.partido + ' · ' + ca.numero + '</span></div>';
  });
  html += '<div class="vd-row"><span>Registrado em</span><span>' + new Date(v.data).toLocaleString('pt-BR') + '</span></div>';
  html += '<div class="vd-row"><span>Código</span><span style="font-family:monospace;font-size:.75rem">' + v.codigo.replace(/(.{4})/g, '$1 ').trim() + '</span></div>';
  html += '</div>';
  if (isAtivo) {
    html += '<button class="btn-danger" style="margin-top:14px" onclick="revogarVotoAtual(\'' + v.codigo + '\')">Revogar este voto</button>';
    html += '<p style="font-size:.74rem;color:var(--gray);margin-top:10px;text-align:center">Regra R3: 70% dos votos que elegeram = cassação do mandato</p>';
  }
  resEl.innerHTML = html;
  votoConferido = v;
}

function testarExemplo() {
  preencherCodigo('16948051304534262993');
  conferirCodigo();
}

function revogarVotoAtual(codigo) {
  const votos = getVotos();
  const v = votos.find(x => x.codigo === codigo);
  if (!v) return;
  v.status = 'REVOGADO';
  v.revogadoEm = new Date().toISOString();
  saveVotos(votos);
  renderVotoResultado(v);
  toast('Voto revogado com sucesso', 'success');
  atualizarStats();
}

/* ===== RADAR ===== */
function renderPol(lista) {
  document.getElementById('pol-list').innerHTML = lista.map(p =>
    '<div class="pol" onclick="abrirPol(' + p.id + ')"><div class="pol-av">' + p.av + '</div><div class="pol-info"><h3>' + p.nome + '</h3><p>' + p.cargo + ' · ' + p.partido + '/' + p.uf + '</p></div><span class="pol-badge">Verificado</span></div>'
  ).join('');
}
function filtrarPol() {
  const q = document.getElementById('busca-pol').value.toLowerCase();
  renderPol(POLS_DEMO.filter(p => p.nome.toLowerCase().includes(q) || p.cargo.toLowerCase().includes(q) || p.partido.toLowerCase().includes(q)));
}
function abrirPol(id) {
  const p = POLS_DEMO.find(x => x.id === id);
  if (!p) return;
  polAtualal = p;
  document.getElementById('pol-sheet-nome').textContent = p.nome + ' · ' + p.cargo;
  let html = '<div class="dados-grid">';
  html += '<div class="dados-row"><span>Partido/UF</span><span>' + p.partido + '/' + p.uf + '</span></div>';
  Object.keys(p.dados).forEach(k => {
    const label = k.charAt(0).toUpperCase() + k.slice(1);
    html += '<div class="dados-row"><span>' + label + '</span><span>' + p.dados[k] + '</span></div>';
  });
  html += '</div>';
  html += '<div style="font-size:.82rem;color:var(--gold);font-weight:700;margin-top:14px">Fontes oficiais</div>';
  html += '<div class="fontes">';
  p.fontes.forEach(f => { html += '<a class="fonte" href="' + f.u + '" target="_blank" rel="noopener">' + f.l + ' ↗</a>'; });
  html += '</div>';
  document.getElementById('pol-sheet-body').innerHTML = html;
  abrirSheet('pol-sheet');
}
function reclamarPolitico() {
  if (!polAtualal) return;
  fecharSheet('pol-sheet');
  document.getElementById('recl-politico').textContent = 'Sobre: ' + polAtualal.nome + ' · ' + polAtualal.cargo;
  document.getElementById('recl-titulo').value = '';
  document.getElementById('recl-desc').value = '';
  abrirSheet('recl-sheet');
}
function enviarReclamacao() {
  if (!polAtualal) return;
  const t = document.getElementById('recl-titulo').value.trim();
  const d = document.getElementById('recl-desc').value.trim();
  if (!t || !d) { toast('Preencha título e descrição', 'error'); return; }
  const recls = getRecl();
  recls.unshift({ politicoId: polAtualal.id, politicoNome: polAtualal.nome, titulo: t, descricao: d, data: new Date().toISOString() });
  saveRecl(recls);
  fecharSheet('recl-sheet');
  toast('Reclamação registrada', 'success');
}
function fixarPolitico() {
  if (!polAtualal) return;
  const c = getComp();
  if (c.find(x => x.id === polAtualal.id)) { toast('Já está fixado'); return; }
  if (c.length >= 2) { toast('Máximo 2 políticos. Limpe a comparação.', 'error'); return; }
  c.push({ id: polAtualal.id, nome: polAtualal.nome, cargo: polAtualal.cargo, partido: polAtualal.partido, uf: polAtualal.uf });
  saveComp(c);
  document.getElementById('comp-count').textContent = c.length;
  fecharSheet('pol-sheet');
  toast('Fixado para comparação (' + c.length + '/2)', 'success');
}
function abrirComparar() {
  const c = getComp();
  document.getElementById('comp-count').textContent = c.length;
  if (c.length === 0) {
    document.getElementById('comp-body').innerHTML = '<p style="color:var(--gray);font-size:.88rem;text-align:center;padding:20px 0">Nenhum político fixado. No Radar, toque em "Fixar para comparar" na ficha de um político.</p>';
  } else {
    const keys = ['cargo', 'partido', 'uf', 'nascimento', 'escolaridade', 'patrimonio', 'processos', 'comparecimento', 'projetos', 'votos', 'financiamento'];
    let html = '<table class="comp-table"><thead><tr><th></th>';
    c.forEach(p => { html += '<th class="pol-nome">' + p.nome + '</th>'; });
    html += '</tr></thead><tbody>';
    keys.forEach(k => {
      html += '<tr><th>' + k + '</th>';
      c.forEach(p => {
        const full = POLS_DEMO.find(x => x.id === p.id);
        const val = full && full.dados && full.dados[k] ? full.dados[k] : (p[k] || '—');
        html += '<td>' + val + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('comp-body').innerHTML = html;
  }
  abrirSheet('comp-sheet');
}
function limparComparacao() { saveComp([]); document.getElementById('comp-count').textContent = 0; }

/* ===== CONGRESSO ===== */
const PL_FALLBACK = [
  { id:1,sigla:'PL',numero:'1234',ano:'2024',ementa:'Reforma Tributária Simplificada — unificação de impostos sobre consumo.' },
  { id:2,sigla:'PL',numero:'5678',ano:'2024',ementa:'Marco Legal das Startups e do empreendedorismo inovador.' },
  { id:3,sigla:'PL',numero:'9012',ano:'2024',ementa:'Fortalece direitos dos cidadãos sobre dados pessoais (altera LGPD).' },
  { id:4,sigla:'PL',numero:'3456',ano:'2024',ementa:'Reforma Administrativa: estabilidade e carreira no serviço público federal.' },
  { id:5,sigla:'PL',numero:'7890',ano:'2024',ementa:'Educação digital como componente curricular obrigatório no ensino fundamental.' },
  { id:6,sigla:'PL',numero:'2345',ano:'2024',ementa:'Transparência em licitações: publicação em tempo real em portal único.' }
];
function renderPls(pls) {
  const ops = getPLOp();
  document.getElementById('pl-list').innerHTML = pls.map(p => {
    const op = ops[p.id];
    const num = p.sigla + ' ' + p.numero + '/' + p.ano;
    return '<div class="pl"><div class="pl-num">' + num + '</div><h3>' + p.ementa + '</h3><div class="pl-btns">' +
      '<button class="pl-btn apoiar' + (op === 'apoiar' ? ' voted' : '') + '" onclick="opinarPL(' + p.id + ',\'apoiar\',this)">' + (op === 'apoiar' ? '✓ Apoiado' : '👍 Apoiar') + '</button>' +
      '<button class="pl-btn contra' + (op === 'contra' ? ' voted' : '') + '" onclick="opinarPL(' + p.id + ',\'contra\',this)">' + (op === 'contra' ? '✓ Contra' : '👎 Contra') + '</button>' +
      '</div></div>';
  }).join('');
}
function opinarPL(id, tipo, btn) {
  const ops = getPLOp();
  ops[id] = tipo;
  savePLOp(ops);
  btn.parentElement.querySelectorAll('.pl-btn').forEach(b => { b.classList.add('voted'); });
  btn.textContent = tipo === 'apoiar' ? '✓ Apoiado' : '✓ Contra';
  toast('Opinião registrada', 'success');
}
function fetchPls() {
  const statusEl = document.getElementById('pl-status');
  statusEl.textContent = 'Carregando PLs reais da API da Câmara...';
  fetch('https://dadosabertos.camara.leg.br/api/v2/proposicoes?sigla=PL&status=EmTramitacao&itens=6&ordem=DESC&ordenarPor=id')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(json => {
      const dados = (json && json.dados) || [];
      if (!dados.length) throw new Error('vazio');
      const pls = dados.map(p => ({
        id: p.id,
        sigla: p.siglaTipo || 'PL',
        numero: p.numero,
        ano: p.ano,
        ementa: p.ementa || '(sem ementa)'
      }));
      renderPls(pls);
      statusEl.textContent = '✓ Fonte: dadosabertos.camara.leg.br — ' + pls.length + ' PLs em tramitação';
      document.getElementById('stat-pls').textContent = String(pls.length);
    })
    .catch(err => {
      console.warn('API Câmara falhou, usando demo:', err);
      renderPls(PL_FALLBACK);
      statusEl.textContent = 'Modo demo (API Câmara indisponível) — ' + PL_FALLBACK.length + ' PLs';
      document.getElementById('stat-pls').textContent = String(PL_FALLBACK.length);
    });
}

/* ===== RESULTADOS (donuts) ===== */
const DONUTS_DEMO = [
  { cargo: 'Presidente', a: 'Ana Souza', a_pct: 46, b: 'Bruno Lima', b_pct: 38, c: 'Carla Mendes', c_pct: 16, corA: '#FFD700', corB: '#B8860B', corC: '#94A3B8' },
  { cargo: 'Governador', a: 'Marcos Teles', a_pct: 52, b: 'Nina Barros', b_pct: 32, c: 'Otávio Reis', c_pct: 16, corA: '#FFD700', corB: '#B8860B', corC: '#94A3B8' },
  { cargo: 'Senador', a: 'Diego Franco', a_pct: 41, b: 'Elisa Prado', b_pct: 39, c: 'Fábio Nunes', c_pct: 20, corA: '#FFD700', corB: '#B8860B', corC: '#94A3B8' },
  { cargo: 'Dep. Federal', a: 'Gil Santos', a_pct: 44, b: 'Helena Rocha', b_pct: 33, c: 'Igor Alves', c_pct: 23, corA: '#FFD700', corB: '#B8860B', corC: '#94A3B8' }
];
function renderDonuts() {
  const el = document.getElementById('donuts');
  el.innerHTML = DONUTS_DEMO.map(d => {
    const angA = (d.a_pct / 100) * 360;
    const angB = angA + (d.b_pct / 100) * 360;
    const grad = 'conic-gradient(' + d.corA + ' 0 ' + angA + 'deg, ' + d.corB + ' ' + angA + 'deg ' + angB + 'deg, ' + d.corC + ' ' + angB + 'deg 360deg)';
    return '<div class="donut"><h4>' + d.cargo + '</h4><div class="donut-ring" style="background:' + grad + '"><span class="donut-label">' + d.a_pct + '%</span></div><div class="donut-leg"><span><span class="dot-c" style="background:' + d.corA + '"></span>' + d.a + ' (' + d.a_pct + '%)</span><span><span class="dot-c" style="background:' + d.corB + '"></span>' + d.b + ' (' + d.b_pct + '%)</span><span><span class="dot-c" style="background:' + d.corC + '"></span>' + d.c + ' (' + d.c_pct + '%)</span></div></div>';
  }).join('');
}

/* ===== REVOGADOS ===== */
const REV_DEMO = [
  { nome: 'Exemplo Político A', cargo: 'Deputado', revPct: 87 },
  { nome: 'Exemplo Político B', cargo: 'Senador', revPct: 78 },
  { nome: 'Exemplo Político C', cargo: 'Governador', revPct: 72 },
  { nome: 'Exemplo Político D', cargo: 'Deputado', revPct: 69 },
  { nome: 'Exemplo Político E', cargo: 'Prefeito', revPct: 65 },
  { nome: 'Exemplo Político F', cargo: 'Vereador', revPct: 58 }
];
function renderRevogados() {
  document.getElementById('rev-list').innerHTML = REV_DEMO.map((r, i) =>
    '<div class="rev-item"><div class="rev-rank">' + (i + 1) + '</div><div class="rev-info"><h4>' + r.nome + '</h4><p>' + r.cargo + '</p></div><div class="rev-pct">' + r.revPct + '%</div></div>'
  ).join('');
}

/* ===== STATS ===== */
function atualizarStats() {
  const votos = getVotos();
  document.getElementById('stat-votos').textContent = String(6 + votos.length);
}

/* ===== SHEETS ===== */
function abrirSheet(id) { document.getElementById(id).classList.remove('hidden'); }
function fecharSheet(id) { document.getElementById(id).classList.add('hidden'); }

/* ===== LOGIN ===== */
function abrirLogin() {
  fecharSheet('menu-sheet');
  loginMode = 'cid';
  loginStep = 1;
  document.getElementById('login-email').value = '';
  document.getElementById('login-code').value = '';
  document.getElementById('login-step2').classList.add('hidden');
  document.querySelectorAll('#login-sheet input[name=modo]').forEach(r => r.checked = (r.value === 'cid'));
  document.getElementById('login-submit').textContent = 'Continuar';
  abrirSheet('login-sheet');
}
document.querySelectorAll('#login-sheet input[name=modo]').forEach(r => {
  r.addEventListener('change', e => { loginMode = e.target.value; });
});
function enviarLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  if (loginStep === 1) {
    if (!email || email.indexOf('@') < 0) { toast('Email inválido', 'error'); return; }
    if (loginMode === 'pol') {
      const dominio = email.split('@')[1];
      const validos = ['camara.leg.br', 'senado.leg.br', 'gov.br', 'tse.jus.br'];
      if (!validos.some(v => dominio.endsWith(v))) {
        toast('Use email institucional (ex: @camara.leg.br)', 'error');
        return;
      }
      document.getElementById('login-step2').classList.remove('hidden');
      document.getElementById('login-submit').textContent = 'Verificar';
      loginStep = 2;
      toast('Código enviado para ' + email);
      return;
    }
    fecharSheet('login-sheet');
    toast('Entrou como cidadão (simulado)', 'success');
  } else {
    const code = document.getElementById('login-code').value.trim();
    if (code.length !== 6) { toast('Código deve ter 6 dígitos', 'error'); return; }
    fecharSheet('login-sheet');
    toast('✓ Político verificado — selo aplicado', 'success');
  }
}

/* ===== TOAST ===== */
let toastTimer = null;
function toast(msg, tipo) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (tipo ? ' ' + tipo : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.add('hidden'); }, 2500);
}

/* ===== INPUTS DE CÓDIGO (auto-focus + paste) ===== */
document.querySelectorAll('#code-inputs .code-in').forEach((inp, i, arr) => {
  inp.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    if (e.target.value.length === 4 && i < arr.length - 1) arr[i + 1].focus();
  });
  inp.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && e.target.value === '' && i > 0) arr[i - 1].focus();
  });
  inp.addEventListener('paste', e => {
    e.preventDefault();
    const d = (e.clipboardData.getData('text') || '').replace(/\s/g, '').replace(/[^0-9]/g, '');
    if (d.length >= 20) {
      for (let j = 0; j < 5; j++) arr[j].value = d.substring(j * 4, j * 4 + 4);
      arr[4].focus();
    }
  });
});

/* ===== INIT ===== */
renderPol(POLS_DEMO);
renderDonuts();
renderRevogados();
atualizarStats();
fetchPls();
document.getElementById('comp-count').textContent = String(getComp().length);
