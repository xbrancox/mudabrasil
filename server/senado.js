/* ============================================================
   MUDABRASIL - INTEGRAÇÃO SENADO FEDERAL (v2)
   ------------------------------------------------------------
   1) Parser do schema REAL (ListaParlamentarEmExercicio.Parlamentares)
      + tolerante a array direto / {senadores:[...]}.
   2) XML tolerante a <Parlamentar> e <senador> com tags reais.
   3) id único via CodigoParlamentar (bug da URI apagada corrigido).
   4) Snapshot versionado (senadores_snapshot.json) como último
      fallback — disco do Railway é efêmero.
   Fonte: Senado Federal — Dados Abertos
============================================================ */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const SENADO_FILE = path.join(DATA_DIR, 'senadores.json');
const SNAPSHOT_FILE = path.join(__dirname, 'senadores_snapshot.json');
const API_BASE = 'https://legis.senado.leg.br/dadosabertos';
const UA = 'MudaBrasil/1.0 (plataforma civica; dados abertos)';

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}

function extractList(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  const lpe = json.ListaParlamentarEmExercicio || json.listaParlamentarEmExercicio;
  const cand =
    (lpe && (lpe.Parlamentares || lpe.parlamentares)) ||
    json.Parlamentares || json.parlamentares ||
    json.senadores || json._senadores || json.lista || null;
  if (Array.isArray(cand)) return cand;
  if (cand && Array.isArray(cand.Parlamentares)) return cand.Parlamentares;
  return [];
}

function normalizeSenador(s) {
  const ident = (s && (s.IdentificacaoParlamentar || s.identificacaoParlamentar)) || s || {};
  let codigo = pick(ident, ['CodigoParlamentar', 'codigoParlamentar', 'Codigo', 'codigo']);
  if (!codigo && ident.id) {
    const mId = String(ident.id).match(/(\d+)\s*$/);
    if (mId) codigo = mId[1];
  }
  const uri = pick(ident, ['UrlPaginaParlamentar', 'urlPaginaParlamentar', 'uri']);
  const m = String(uri || '').match(/(\d+)\s*$/);
  const nome = pick(ident, ['NomeParlamentar', 'nomeParlamentar', 'NomeCompletoParlamentar', 'nome', 'name']) || 'Senador';
  const partido = pick(ident, ['SiglaPartidoParlamentar', 'siglaPartidoParlamentar', 'SiglaPartido', 'siglaPartido', 'partido', 'party']) || 'Sem Partido';
  return {
    id: 'senado-' + (codigo || (m ? m[1] : nome.toLowerCase().replace(/\s+/g, '-'))),
    source: 'senado',
    name: nome,
    party: partido,
    partyName: partido,
    number: null, age: null, education: null,
    state: pick(ident, ['UfParlamentar', 'ufParlamentar', 'SiglaUf', 'siglaUf', 'uf', 'state']) || null,
    position: 'Senador Federal',
    termCount: null, votesLastElection: null, annualIncome: null, assets: null,
    billsAuthored: null, billsApproved: null, attendanceRate: null, lawsuits: null,
    transparencyScore: null, focusArea: null, bio: null,
    photo: pick(ident, ['UrlFotoParlamentar', 'urlFotoParlamentar', 'photo']) || null,
    email: pick(ident, ['EmailParlamentar', 'emailParlamentar', 'email']) || null,
    legislatura: null,
    dataSources: ['Senado Federal (dados abertos)'],
    hasFullData: false
  };
}

async function fetchSenadoresJson() {
  try {
    const res = await fetch(`${API_BASE}/senador/lista/atual?formato=json`, {
      headers: { 'User-Agent': UA, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const raw = extractList(json);
    if (raw.length > 0) return raw.map(normalizeSenador);
    console.warn('[senado] JSON 200 mas schema não reconhecido:', Object.keys(json || {}).join(','));
    return null;
  } catch (e) {
    console.warn('[senado] JSON endpoint falhou:', e.message);
    return null;
  }
}

function parseSimpleXML(text) {
  const result = [];
  const regexTag = /<(senador|Parlamentar)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = regexTag.exec(text)) !== null) {
    const corpo = match[2];
    const get = (tags) => {
      for (const t of tags) {
        const rx = new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>', 'i');
        const mm = rx.exec(corpo);
        if (mm && mm[1].trim()) return mm[1].trim();
      }
      return null;
    };
    result.push({
      CodigoParlamentar: get(['CodigoParlamentar', 'codigoParlamentar', 'codigo']),
      NomeParlamentar: get(['NomeParlamentar', 'nomeParlamentar', 'nome']),
      SiglaUf: get(['SiglaUf', 'UfParlamentar', 'estado', 'uf']),
      SiglaPartido: get(['SiglaPartidoParlamentar', 'SiglaPartido', 'siglaPartido', 'partido']),
      EmailParlamentar: get(['EmailParlamentar', 'email']),
      UrlPaginaParlamentar: get(['UrlPaginaParlamentar', 'uri']),
      UrlFotoParlamentar: get(['UrlFotoParlamentar', 'urlFoto'])
    });
  }
  return result;
}

async function fetchSenadoresXml() {
  try {
    const res = await fetch(`${API_BASE}/senador/lista/atual`, {
      headers: { 'User-Agent': UA, 'Accept': 'application/xml' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = parseSimpleXML(await res.text());
    if (raw.length > 0) return raw.map(normalizeSenador);
    return null;
  } catch (e) {
    console.warn('[senado] XML endpoint falhou:', e.message);
    return null;
  }
}

function leSnapshot(arquivo) {
  if (!fs.existsSync(arquivo)) return null;
  try {
    const snap = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
    const raw = Array.isArray(snap) ? snap : extractList(snap);
    const list = raw.map(normalizeSenador).filter(s => s && s.name);
    if (list.length > 0) return list;
  } catch (_) { }
  return null;
}

async function fetchSenadores({ force = false } = {}) {
  ensureDirs();
  if (!force) {
    const cache = leSnapshot(SENADO_FILE);
    if (cache) return { list: cache, fromCache: true, count: cache.length };
  }
  const jsonResult = await fetchSenadoresJson();
  if (jsonResult && jsonResult.length > 0) {
    fs.writeFileSync(SENADO_FILE, JSON.stringify(jsonResult, null, 2));
    return { list: jsonResult, fromCache: false, count: jsonResult.length };
  }
  const xmlResult = await fetchSenadoresXml();
  if (xmlResult && xmlResult.length > 0) {
    fs.writeFileSync(SENADO_FILE, JSON.stringify(xmlResult, null, 2));
    return { list: xmlResult, fromCache: false, count: xmlResult.length };
  }
  // Último fallback: snapshot versionado no repo (WAF do Senado pode bloquear IP de cloud)
  const snap = leSnapshot(SNAPSHOT_FILE) || leSnapshot(SENADO_FILE);
  if (snap) {
    console.info('[senado] API bloqueada p/ este IP — usando snapshot versionado (' + snap.length + ' senadores).');
    return { list: snap, fromCache: true, count: snap.length, note: 'senado-snapshot' };
  }
  console.info('[senado] APIs indisponíveis e sem snapshot — usando dados Câmara apenas.');
  return { list: [], fromCache: false, count: 0, note: 'senado-bloqueado' };
}

module.exports = { fetchSenadores, normalizeSenador, DATA_DIR, SENADO_FILE, SNAPSHOT_FILE };