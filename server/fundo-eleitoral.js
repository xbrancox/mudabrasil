/* ============================================================
   MEUVOTO — FUNDO ELEITORAL (dados públicos TSE)
   ------------------------------------------------------------
   Distribuição do FEFC (Fundo Especial de Financiamento de
   Campanha) por partido, Elections 2026.

   FONTE OFICIAL (verificada em 15/9/2026):
     https://www.tse.jus.br/eleicoes/eleicoes-2026-content/prestacao-de-contas/distribuicao-dos-recursos-do-fundo-especial-de-financiamento-de-campanha-fefc-eleicoes-2026
   A tabela "Cálculo de distribuição dos recursos do FEFC —
   Eleições 2026" foi transcrita integralmente para
   data/fundo-eleitoral.json (valores em reais, com as quatro
   cotas: 2% partidos registrados, 35% votos Câmara, 48%
   bancada Câmara, 15% bancada Senado). Soma oficial:
   R$ 4.961.519.777,00.

   POR QUE UM SNAPSHOT COMMITADO?
     - dadosabertos.tse.jus.br e cdn.tse.jus.br bloqueiam o
       servidor (Akamai 403), então a ingestão HTTP automática
       não é confiável aqui. O snapshot é dado PÚBLICO oficial
       (licença CC-BY / dados abertos) e pode ser versionado.
     - scripts/atualizar-fundo-eleitoral.js regenera o snapshot
       a partir da página do TSE quando necessário.

   SOBRE "VALOR POR POLÍTICO":
     Os repasses do FEFC aos candidatos são publicados nas
     prestações de contas (Dados Abertos / DivulgaCandContas).
     Para as Eleições 2026 o snapshot já inclui porPolitico:
     soma das receitas declaradas de origem Fundo Especial,
     agrupadas por SQ_CANDIDATO no arquivo oficial de receitas
     (captura pública de 04/09/2026 — fonte citada no JSON). São
     valores DECLARADOS pelos próprios candidatos; cobertura
     parcial é esperada (prestações em andamento), e a UI cita a
     data da fonte. Este módulo nunca inventa valor individual:
     sem registro na fonte, não há linha.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const SNAPSHOT_FILE = path.join(__dirname, '..', 'data', 'fundo-eleitoral.json');
const DETALHE_FILE = path.join(__dirname, '..', 'data', 'fundo-detalhe.json');

let cache = null;
let cacheMtime = 0;
let detCache = null;
let detCacheMtime = 0;

/* Repasses linha-a-linha (arquivo oficial de receitas), por SQ.
   Gerado junto do snapshot por scripts/atualizar-fundo-eleitoral.js. */
function carregarDetalhe() {
  try {
    const st = fs.statSync(DETALHE_FILE);
    if (detCache && st.mtimeMs === detCacheMtime) return detCache;
    detCache = JSON.parse(fs.readFileSync(DETALHE_FILE, 'utf8'));
    detCacheMtime = st.mtimeMs;
    return detCache;
  } catch (e) {
    return detCache || {}; // arquivo ausente não derruba o endpoint
  }
}

function carregarSnapshot() {
  try {
    const st = fs.statSync(SNAPSHOT_FILE);
    if (cache && st.mtimeMs === cacheMtime) return cache;
    cache = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
    cacheMtime = st.mtimeMs;
    return cache;
  } catch (e) {
    if (cache) return cache; // última cópia boa em memória
    throw new Error('Snapshot do fundo eleitoral indisponível: ' + e.message);
  }
}

/* Chave usada nos dois lados (servidor e app): nome minúsculo
   sem acentos + '|' + sigla do partido sem acentos. */
function keyPol(nome, partido) {
  const norm = s => String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return norm(nome) + '|' + norm(partido);
}

function getPartidos() {
  const d = carregarSnapshot();
  return { ano: d.ano, fonte: d.fonte, urlFonte: d.urlFonte, atualizadoEm: d.atualizadoEm, partidos: d.porPartido };
}

function getCandidatos() {
  const d = carregarSnapshot();
  return {
    ano: d.ano,
    fonte: d.fonte,
    urlFonte: d.urlFonte,
    atualizadoEm: d.atualizadoEm,
    aviso: d.avisoPorPolitico,
    candidatos: (d.porPolitico || []).map(c => ({ ...c, cargoNome: nomeCargo(c.cargo) }))
  };
}

/* Código de cargo TSE → nome legível (mesma tabela usada no cadastro
   de candidaturas; DF usa 8 = Deputado Distrital). */
const CARGO_NAMES = { 1: 'Presidente', 3: 'Governador', 5: 'Senador', 6: 'Deputado Federal', 7: 'Deputado Estadual', 8: 'Deputado Distrital', 9: 'Vice' };
function nomeCargo(c) { return CARGO_NAMES[c] || ''; }

function getResumo() {
  const d = carregarSnapshot();
  /* Índice por nome|partido (heurística) E por SQ_CANDIDATO (join
     exato oficial). Os dois coexistem: o app usa o que tiver. */
  const map = {};
  const mapSq = {};
  for (const p of (d.porPolitico || [])) {
    map[keyPol(p.nome, p.partido)] = p;
    if (p.sq) mapSq[String(p.sq)] = p;
  }
  return {
    ok: true,
    totalDistribuido: d.totalDistribuido,
    ano: d.ano,
    partidosComRecursos: (d.porPartido || []).length,
    candidatosBeneficiados: (d.porPolitico || []).length,
    atualizadoEm: d.atualizadoEm,
    fonte: d.fonte,
    urlFonte: d.urlFonte,
    aviso: d.avisoPorPolitico,
    fontePorPolitico: d.fontePorPolitico || null,
    urlFontePorPolitico: d.urlFontePorPolitico || null,
    map,
    mapSq
  };
}

/* Lookup individual — para o popup "Fundo Eleitoral" dos cards.
   Aceita ?sq= (chave oficial TSE, join exato) ou ?nome=&partido=
   (heurística nome normalizado + sigla). Retorna também o total
   distribuído ao PARTIDO e metadados de fonte/aviso para a UI
   citar com honestidade. */
function getPolitico({ sq, nome, partido }) {
  const d = carregarSnapshot();
  let registro = null;
  if (sq) {
    registro = (d.porPolitico || []).find(p => String(p.sq) === String(sq)) || null;
  }
  if (!registro && nome) {
    registro = (d.porPolitico || []).find(p => keyPol(p.nome, p.partido) === keyPol(nome, partido)) || null;
  }
  const pt = registro ? (d.porPartido || []).find(x => x.sigla === registro.partido) : null;
  /* Comparativo honesto: quanto o partido recebeu do FEFC × quanto os
     candidatos dele já declararam ter recebido na prestação de contas
     (soma da fonte pública). Dado real dos dois lados — nunca estimativa. */
  let comparativo = null;
  if (pt) {
    const declaradoPartido = (d.porPolitico || [])
      .filter(p => p.partido === pt.sigla)
      .reduce((s, p) => s + (p.valor || 0), 0);
    comparativo = {
      totalPartido: pt.valor,
      declaradoCandidatos: Math.round(declaradoPartido * 100) / 100,
      percentualDeclarado: pt.valor > 0 ? Math.round(declaradoPartido / pt.valor * 1000) / 10 : 0
    };
  }
  return {
    ok: true,
    encontrado: !!registro,
    candidato: registro ? { ...registro, cargoNome: nomeCargo(registro.cargo) } : null,
    partido: pt ? { sigla: pt.sigla, nome: pt.nome, valor: pt.valor, percentual: pt.percentual } : null,
    comparativo,
    ano: d.ano,
    atualizadoEm: d.atualizadoEm,
    aviso: d.avisoPorPolitico,
    fonte: d.fonte,
    urlFonte: d.urlFonte,
    fontePorPolitico: d.fontePorPolitico || null,
    urlFontePorPolitico: d.urlFontePorPolitico || null
  };
}

/* Detalhe linha-a-linha dos repasses FEFC de um candidato (chave
   oficial SQ_CANDIDATO). Usado pelo botão "ver todos os repasses"
   do popup. Sem registro → linhas vazias (nunca inventa). */
function getDetalhe(sq) {
  const d = carregarSnapshot();
  const det = carregarDetalhe();
  const registro = (d.porPolitico || []).find(p => String(p.sq) === String(sq)) || null;
  const linhas = (det[String(sq)] || []).map(l => ({
    data: l.data, doador: l.doador, esfera: l.esfera, tipo: l.tipo, valor: l.valor
  }));
  return {
    ok: true,
    encontrado: !!registro || linhas.length > 0,
    candidato: registro,
    linhas,
    soma: Math.round(linhas.reduce((s, l) => s + l.valor, 0) * 100) / 100,
    atualizadoEm: d.atualizadoEm,
    fonte: d.fontePorPolitico || d.fonte,
    urlFonte: d.urlFontePorPolitico || d.urlFonte
  };
}

/* Exportação CSV (ponto-e-vírgula, padrão Excel pt-BR) dos dados
   públicos do fundo — para jornalistas, pesquisadores e cidadãos. */
function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function brl(v) {
  return Number(v || 0).toFixed(2).replace('.', ',');
}
function getCSV() {
  const d = carregarSnapshot();
  const linhas = ['sigla_partido;nome_partido;valor_total_brl;percentual_do_fundo;cota_2pct_registrados_brl;cota_35pct_votos_camara_brl;cota_48pct_bancada_camara_brl;cota_15pct_bancada_senado_brl'];
  for (const p of (d.porPartido || [])) {
    const c = {};
    for (const q of (p.cotas || [])) {
      if (/^Cota 2%/.test(q.destino)) c.c2 = q.valor;
      else if (/^Cota 35%/.test(q.destino)) c.c35 = q.valor;
      else if (/^Cota 48%/.test(q.destino)) c.c48 = q.valor;
      else if (/^Cota 15%/.test(q.destino)) c.c15 = q.valor;
    }
    linhas.push([csvEscape(p.sigla), csvEscape(p.nome), brl(p.valor), String(p.percentual == null ? '' : p.percentual).replace('.', ','), brl(c.c2), brl(c.c35), brl(c.c48), brl(c.c15)].join(';'));
  }
  // candidatos (quando existirem prestações de contas publicadas)
  if ((d.porPolitico || []).length) {
    linhas.push('');
    linhas.push('nome_candidato;cargo;uf;sigla_partido;ano;valor_recebido_brl;origem');
    for (const c of d.porPolitico) {
      linhas.push([csvEscape(c.nome), csvEscape(c.cargo), csvEscape(c.uf), csvEscape(c.partido), csvEscape(c.ano), brl(c.valor), csvEscape(c.origem)].join(';'));
    }
  }
  // BOM UTF-8: Excel abre acentos corretamente
  return '\uFEFF' + linhas.join('\r\n') + '\r\n';
}

module.exports = { getPartidos, getCandidatos, getPolitico, getDetalhe, getResumo, getCSV, keyPol, SNAPSHOT_FILE };
