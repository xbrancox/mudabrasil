/* ============================================================
   MUDABRASIL - INGESTÃO DE DADOS PÚBLICOS
   ------------------------------------------------------------
   Busca dados REAIS de parlamentares da Câmara dos Deputados
   (dadosabertos.camara.leg.br), normaliza para o schema do
   frontend e faz cache em disco para respostas rápidas e
   baixo custo de API.

   Sem dependências externas (usa o fetch global do Node 18+).

   Fontes públicas integradas / documentadas:
   - Câmara dos Deputados  -> dadosabertos.camara.leg.br  (USADA AQUI)
   - TSE                   -> dadosabertos.tse.jus.br     (produção)
   - Portal da Transparência -> dadosabertos.portaltransparencia.gov.br (produção)
   - CNJ                   -> consultaprocessos.cnj.jus.br (produção)
   ============================================================ */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DEP_FILE = path.join(DATA_DIR, 'deputados.json');
const ENRICH_DIR = path.join(DATA_DIR, 'enrich');
const API_BASE = 'https://dadosabertos.camara.leg.br/api/v2';
const UA = 'MudaBrasil/1.0 (plataforma civica de transparencia; uso de dados abertos)';

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ENRICH_DIR)) fs.mkdirSync(ENRICH_DIR, { recursive: true });
}

function normalizeDep(dep) {
  return {
    id: 'camara-' + dep.id,
    source: 'camara',
    name: dep.nome,
    party: dep.siglaPartido,
    partyName: dep.siglaPartido,
    number: null,
    age: null,
    education: null,
    state: dep.siglaUf,
    position: 'Deputado Federal',
    termCount: null,
    votesLastElection: null,
    annualIncome: null,
    assets: null,
    billsAuthored: null,
    billsApproved: null,
    attendanceRate: null,
    lawsuits: null,
    transparencyScore: null,
    focusArea: null,
    bio: null,
    photo: dep.urlFoto || null,
    email: dep.email || null,
    legislatura: dep.idLegislatura,
    dataSources: ['Câmara dos Deputados (dados reais)'],
    hasFullData: false
  };
}

async function fetchDeputados({ force = false } = {}) {
  ensureDirs();
  if (!force && fs.existsSync(DEP_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(DEP_FILE, 'utf8'));
      if (cached && Array.isArray(cached.dados) && cached.dados.length > 0) {
        return {
          list: cached.dados.map(normalizeDep),
          fromCache: true,
          updatedAt: cached.updatedAt || null,
          count: cached.dados.length
        };
      }
    } catch (_) { }
  }

  const res = await fetch(API_BASE + '/deputados', {
    headers: { 'User-Agent': UA, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error('API da Câmara retornou HTTP ' + res.status);
  const json = await res.json();
  const dados = json.dados || json.deputados || [];
  const payload = { updatedAt: new Date().toISOString(), dados };
  fs.writeFileSync(DEP_FILE, JSON.stringify(payload, null, 2));
  return {
    list: dados.map(normalizeDep),
    fromCache: false,
    updatedAt: payload.updatedAt,
    count: dados.length
  };
}

async function enrichBills(camaraId) {
  ensureDirs();
  const f = path.join(ENRICH_DIR, String(camaraId) + '.json');
  if (fs.existsSync(f)) {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) {}
  }
  try {
    const res = await fetch(API_BASE + '/proposicoes?autorId=' + encodeURIComponent(camaraId), {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' }
    });
    if (!res.ok) return { billsAuthored: null, error: 'HTTP ' + res.status };
    const json = await res.json();
    const total = (json._meta && json._meta.total) || (json.dados ? json.dados.length : null);
    const out = { billsAuthored: total, updatedAt: new Date().toISOString() };
    fs.writeFileSync(f, JSON.stringify(out, null, 2));
    return out;
  } catch (e) {
    return { billsAuthored: null, error: e.message };
  }
}

module.exports = { fetchDeputados, enrichBills, normalizeDep, DATA_DIR, DEP_FILE };
