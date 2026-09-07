/* ============================================================
   MUDABRASIL - MOTOR DE VOTO CONTÍNUO E REVOGÁVEL
   ------------------------------------------------------------
   O coração da plataforma: um "termômetro de confiança" em que o
   cidadão expressa VOTO DE CONFIANÇA em um parlamentar e pode
   REVOGÁ-LO a qualquer momento ("Seu voto coloca, seu voto tira").

   DECISÕES DE PROJETO (regras inegociáveis do fundador):
   - ANONIMATO / ANTI-COERÇÃO (R1, R6, LGPD): o sistema NUNCA liga
     um cidadão a um voto na visão pública. O único vínculo é um
     CÓDIGO (R4) gerado UMA vez e mostrado só UMA vez ao eleitor.
     O servidor guarda apenas o HASH do código (nunca o bruto).
     A agregação (termômetro) é irreversível: ninguém — nem o
     próprio servidor — descobre "quem votou em quem".
   - DECAIMENTO: o voto nunca morre, só esfria (peso cheio até
     90 dias → linear até o piso 0,5 aos 180 dias). Reafirmar
     ("manter meu voto") reinicia a contagem.
   - SEM PEDIDO DE VOTO: a API é neutra; a pressão de campanha é
     responsabilidade da UI (que também deve ser neutra).
   - ANTI-BRIGADA: rate-limit em memória por IP (riscos citados na
     visão do fundador: manipulação por brigadas / fake votes).

   Sem dependências de npm (http, fs, crypto do Node 18+).
   Persistência em server/db.js: SQLite nativo do Node (node:sqlite,
   Node 22.5+) com fallback automático para arquivo JSON atômico —
   cada cédula é um registro autônomo (fonte de verdade: o banco).
   ============================================================ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { fetchDeputados } = require('./ingest');
const { fetchSenadores } = require('./senado');
const db = require('./db');

const DATA_DIR = path.join(__dirname, 'data');
const VOTOS_FILE = db.VOTOS_FILE;
const VOTOS_DB = db.VOTOS_DB;
const SALT_FILE = path.join(DATA_DIR, '.salt');

/* ---- Configuração pública (espelha o contrato do config.js) ---- */
const DECADENCIA = { cheioDias: 90, pisoDias: 180, piso: 0.5 };
const ICM = {
  versao: 'v1.0',
  vigenteDesde: '2026-08-18',
  pesos: { resposta: 0.40, cumprimento: 0.35, devolucao: 0.25 }
};
const K_SATURACAO = 100;

/* ---- Rate-limit em memória (anti-brigada) ---- */
const RATE_LIMIT = { max: 20, windowMs: 60 * 1000 };
const rateBuckets = new Map();

let voteChangeHook = null;
function onVoteChange(fn) { voteChangeHook = fn; }
function notifyChange(tipo) {
  if (typeof voteChangeHook === 'function') {
    try { voteChangeHook({ tipo, ts: new Date().toISOString() }); } catch (_) { }
  }
}

function totals() {
  const store = loadStore();
  let ativos = 0, revogados = 0;
  for (const b of Object.values(store.ballots)) { b.revoked ? revogados++ : ativos++; }
  return { totalVotosAtivos: ativos, totalRevogados: revogados };
}

function checkRateLimit(ip, action) {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT.windowMs };
    rateBuckets.set(ip, bucket);
  }
  bucket.count++;
  if (bucket.count > RATE_LIMIT.max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now, action };
  }
  return { allowed: true };
}

function ensureSalt() {
  if (fs.existsSync(SALT_FILE)) {
    const s = fs.readFileSync(SALT_FILE, 'utf8').trim();
    if (s) return s;
  }
  const salt = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SALT_FILE, salt, { mode: 0o600 });
  return salt;
}
const SALT = ensureSalt();

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code) + SALT).digest('hex');
}

function generateCode() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) code += alphabet[bytes[i] % alphabet.length];
  return code.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

function loadStore() {
  return { ballots: db.readAllBallots() };
}

let deputiesIndex = null;
async function getDeputiesIndex() {
  if (deputiesIndex) return deputiesIndex;
  const map = new Map();
  const { list } = await fetchDeputados();
  (list || []).forEach(d => map.set(d.id, {
    id: d.id, name: d.name, party: d.party, state: d.state, photo: d.photo || null
  }));
  /* Senadores no mesmo índice: hoje o voto neles caía em 404 */
  try {
    const { list: sens } = await fetchSenadores();
    (sens || []).forEach(s => {
      if (!map.has(s.id)) map.set(s.id, {
        id: s.id, name: s.name, party: s.party, state: s.state, photo: s.photo || null
      });
    });
  } catch (_) { }
  deputiesIndex = map;
  return map;
}

const MS_DIA = 86400000;
function voteWeight(anchor, now = Date.now()) {
  const days = Math.max(0, (now - anchor) / MS_DIA);
  const { cheioDias, pisoDias, piso } = DECADENCIA;
  if (days <= cheioDias) return 1.0;
  if (days >= pisoDias) return piso;
  const t = (days - cheioDias) / (pisoDias - cheioDias);
  return 1.0 - (1.0 - piso) * t;
}

async function castVote(input, ip) {
  const rl = checkRateLimit(ip, 'cast');
  if (!rl.allowed) return { ok: false, status: 429, error: 'Muitas ações em pouco tempo. Aguarde um instante.' };

  const politicianId = String(input.politicianId || '').trim();
  if (!politicianId) return { ok: false, status: 400, error: 'politicianId é obrigatório' };

  const index = await getDeputiesIndex();
  const politician = index.get(politicianId);
  if (!politician) return { ok: false, status: 404, error: 'Parlamentar não encontrado' };

  const code = generateCode();
  const now = Date.now();
  const ballotId = hashCode(code);
  const ballot = {
    ballotId,
    politicianId,
    uf: input.uf ? String(input.uf).toUpperCase().slice(0, 2) : null,
    createdAt: now,
    reaffirmedAt: now,
    revoked: false,
    revokedAt: null,
    voterHash: input.voterHash || null
  };
  db.upsertBallot(ballot);
  notifyChange('voto');

  return { ok: true, code, ballotId, politician };
}

function revokeVote(code, ip) {
  const rl = checkRateLimit(ip, 'revoke');
  if (!rl.allowed) return { ok: false, status: 429, error: 'Muitas ações em pouco tempo. Aguarde um instante.' };

  const ballotId = hashCode(code);
  const ballot = db.getBallot(ballotId);
  if (!ballot) return { ok: false, status: 404, error: 'Código inválido ou não encontrado' };
  if (ballot.revoked) return { ok: false, status: 409, error: 'Este voto já foi revogado' };

  ballot.revoked = true;
  ballot.revokedAt = Date.now();
  db.upsertBallot(ballot);
  notifyChange('revogacao');
  return { ok: true, revoked: true, politicianId: ballot.politicianId };
}

function reaffirmVote(code, ip) {
  const rl = checkRateLimit(ip, 'reaffirm');
  if (!rl.allowed) return { ok: false, status: 429, error: 'Muitas ações em pouco tempo. Aguarde um instante.' };

  const ballotId = hashCode(code);
  const ballot = db.getBallot(ballotId);
  if (!ballot) return { ok: false, status: 404, error: 'Código inválido ou não encontrado' };
  if (ballot.revoked) return { ok: false, status: 409, error: 'Este voto já foi revogado e não pode ser reafirmado' };

  ballot.reaffirmedAt = Date.now();
  db.upsertBallot(ballot);
  notifyChange('manutencao');
  return { ok: true, reaffirmedAt: ballot.reaffirmedAt };
}

function viewVote(code) {
  const ballotId = hashCode(code);
  const ballot = db.getBallot(ballotId);
  if (!ballot) return { ok: false, status: 404, error: 'Código inválido ou não encontrado' };

  const anchor = ballot.reaffirmedAt || ballot.createdAt;
  return {
    ok: true,
    ballot: {
      politicianId: ballot.politicianId,
      uf: ballot.uf,
      createdAt: ballot.createdAt,
      reaffirmedAt: ballot.reaffirmedAt,
      revoked: ballot.revoked,
      revokedAt: ballot.revokedAt,
      pesoAtual: round4(voteWeight(anchor)),
      diasDesdeReafirmacao: Math.floor((Date.now() - anchor) / MS_DIA),
      precisaReafirmar: (Date.now() - anchor) > 30 * MS_DIA && !ballot.revoked
    }
  };
}

async function getTermometro({ topN = 10 } = {}) {
  const store = loadStore();
  const now = Date.now();

  const index = await getDeputiesIndex();
  const byPolitician = new Map();
  let totalAtivos = 0, totalRevogados = 0;

  for (const b of Object.values(store.ballots)) {
    let bucket = byPolitician.get(b.politicianId);
    if (!bucket) { bucket = { votos: 0, peso: 0, revogacoes: 0 }; byPolitician.set(b.politicianId, bucket); }
    if (b.revoked) {
      bucket.revogacoes++;
      totalRevogados++;
    } else {
      const anchor = b.reaffirmedAt || b.createdAt;
      bucket.votos++;
      bucket.peso += voteWeight(anchor, now);
      totalAtivos++;
    }
  }

  const top = [];
  for (const [pid, agg] of byPolitician.entries()) {
    const pol = index.get(pid) || { id: pid, name: '(parlamentar)', party: '—', state: '—', photo: null };
    const indice = 100 * (agg.peso / (agg.peso + K_SATURACAO));
    top.push({
      politicianId: pid,
      name: pol.name,
      party: pol.party,
      state: pol.state,
      photo: pol.photo,
      votosAtivos: agg.votos,
      revogacoes: agg.revogacoes,
      pesoEfetivo: round2(agg.peso),
      indice: round1(indice)
    });
  }
  top.sort((a, b) => b.indice - a.indice || b.votosAtivos - a.votosAtivos);

  return {
    mode: 'real',
    ok: true,
    metodo: 'Índice de Confiança MudaBrasil (ICM) — componente de confiança',
    icm: ICM,
    decadencia: DECADENCIA,
    atualizadoEm: new Date(now).toISOString(),
    totalVotosAtivos: totalAtivos,
    totalRevogados: totalRevogados,
    totalRegistros: totalAtivos + totalRevogados,
    topN: top.slice(0, topN),
    porIndice: top,
    tendencia: buildTendency(store, now),
    porUf: buildPorUf(store)
  };
}

function buildTendency(store, now, dias = 30) {
  const ballots = Object.values(store.ballots);
  const out = [];
  for (let d = dias - 1; d >= 0; d--) {
    const t = now - d * MS_DIA;
    const dayStart = new Date(t); dayStart.setHours(0, 0, 0, 0);
    const ts = dayStart.getTime();
    let ativos = 0;
    for (const b of ballots) {
      if (b.createdAt > ts) continue;
      if (b.revoked && b.revokedAt <= ts) continue;
      ativos++;
    }
    out.push({ at: new Date(ts).toISOString().slice(0, 10), ativos });
  }
  return out;
}

function buildPorUf(store) {
  const porUf = {};
  for (const b of Object.values(store.ballots)) {
    if (b.revoked || !b.uf) continue;
    porUf[b.uf] = (porUf[b.uf] || 0) + 1;
  }
  return porUf;
}

/* ===== Acompanhamento (02 — home): preferência REAL por cargo =====
   Agrega os votos ativos da plataforma por cargo (Dep. Federal e
   Senador — os cargos votáveis hoje) no recorte BR ou UF. Sem
   sintéticos: cargo sem votos volta vazio e a UI mostra estado
   honesto ("sem votos ainda"). */
async function getAcompanhamento({ uf = 'BR' } = {}) {
  const store = loadStore();
  const now = Date.now();
  const recorte = String(uf || 'BR').toUpperCase();

  const index = new Map();
  try {
    const { list: deps } = await fetchDeputados();
    (deps || []).forEach(d => index.set(d.id, {
      name: d.name, party: d.party, state: d.state, photo: d.photo || null, cargo: 'dep-federal'
    }));
  } catch (_) { }
  try {
    const { list: sens } = await fetchSenadores();
    (sens || []).forEach(s => index.set(s.id, {
      name: s.name, party: s.party, state: s.state, photo: s.photo || null, cargo: 'senador'
    }));
  } catch (_) { }

  const agg = { 'dep-federal': new Map(), 'senador': new Map() };
  let totalAtivos = 0, totalRevogados = 0;
  for (const b of Object.values(store.ballots)) {
    const pol = index.get(b.politicianId);
    if (!pol) continue;
    const ufVoto = (b.uf || pol.state || '').toUpperCase();
    if (recorte !== 'BR' && ufVoto !== recorte) continue;
    const g = agg[pol.cargo].get(b.politicianId) || { votos: 0, revog: 0, peso: 0 };
    if (b.revoked) { g.revog++; totalRevogados++; }
    else { g.votos++; g.peso += voteWeight(b.reaffirmedAt || b.createdAt, now); totalAtivos++; }
    agg[pol.cargo].set(b.politicianId, g);
  }

  const mkCargo = (map) => {
    const total = [...map.values()].reduce((a, g) => a + g.votos, 0);
    const top = [...map.entries()]
      .sort((a, b) => b[1].votos - a[1].votos || b[1].peso - a[1].peso)
      .slice(0, 4)
      .map(([pid, g]) => {
        const pol = index.get(pid);
        return {
          id: pid, name: pol.name, party: pol.party || '—', state: pol.state || '—', photo: pol.photo,
          votos: g.votos, revogacoes: g.revog,
          pct: total ? Math.round(g.votos / total * 100) : 0
        };
      });
    const fora = total - top.reduce((a, t) => a + t.votos, 0);
    return {
      totalVotos: total,
      candidatos: top,
      outrosPct: total ? Math.round(fora / total * 100) : 0
    };
  };

  return {
    ok: true,
    mode: 'real',
    recorte: recorte,
    atualizadoEm: new Date(now).toISOString(),
    totalVotosAtivos: totalAtivos,
    totalRevogados: totalRevogados,
    cargos: {
      'dep-federal': mkCargo(agg['dep-federal']),
      'senador': mkCargo(agg['senador'])
    }
  };
}

function round1(n) { return Math.round(n * 10) / 10; }
function round2(n) { return Math.round(n * 100) / 100; }
function round4(n) { return Math.round(n * 10000) / 10000; }

async function getRevogados() {
  const store = loadStore();
  const now = Date.now();
  const index = await getDeputiesIndex();
  const byPolitician = new Map();
  for (const b of Object.values(store.ballots)) {
    const bucket = byPolitician.get(b.politicianId) || { revogacoes: 0, votosAtivos: 0 };
    if (b.revoked) bucket.revogacoes++;
    else bucket.votosAtivos++;
    byPolitician.set(b.politicianId, bucket);
  }
  const politicos = [];
  for (const [pid, agg] of byPolitician.entries()) {
    if (!agg.revogacoes) continue;
    const pol = index.get(pid) || { id: pid, name: '(parlamentar)', party: '-', state: '-', photo: null };
    politicos.push({
      politicianId: pid, name: pol.name, party: pol.party, state: pol.state, photo: pol.photo,
      revogacoes: agg.revogacoes, votosAtivos: agg.votosAtivos
    });
  }
  politicos.sort((a, b) => b.revogacoes - a.revogacoes || b.votosAtivos - a.votosAtivos);
  return {
    ok: true, mode: 'real',
    totalRevogados: politicos.reduce((s, p) => s + p.revogacoes, 0),
    politicos,
    atualizadoEm: new Date(now).toISOString()
  };
}

async function getBallotsForVoter(voterHash) {
  const store = loadStore();
  const index = await getDeputiesIndex();
  const out = [];
  for (const b of Object.values(store.ballots)) {
    if (b.voterHash !== voterHash) continue;
    const pol = index.get(b.politicianId) || { id: b.politicianId, name: '(parlamentar)', party: '-', state: '-', photo: null };
    out.push({
      id: b.ballotId,
      revoked: !!b.revoked,
      createdAt: b.createdAt,
      politician: { id: pol.id, name: pol.name, party: pol.party, state: pol.state, photo: pol.photo }
    });
  }
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out;
}

function revokeBallotById(ballotId, ip) {
  const rl = checkRateLimit(ip, 'revoke');
  if (!rl.allowed) return { ok: false, status: 429, error: 'Muitas ações em pouco tempo. Aguarde um instante.' };
  const ballot = db.getBallot(ballotId);
  if (!ballot) return { ok: false, status: 404, error: 'Voto não encontrado' };
  if (ballot.revoked) return { ok: false, status: 409, error: 'Este voto já foi revogado' };
  ballot.revoked = true;
  ballot.revokedAt = Date.now();
  db.upsertBallot(ballot);
  notifyChange('revogacao');
  return { ok: true, revoked: true, politicianId: ballot.politicianId };
}

module.exports = {
  castVote, revokeVote, reaffirmVote, viewVote, getTermometro, getAcompanhamento,
  getRevogados, getBallotsForVoter, revokeBallotById,
  voteWeight, onVoteChange, totals,
  DECADENCIA, ICM, K_SATURACAO, VOTOS_FILE, VOTOS_DB, db
};
