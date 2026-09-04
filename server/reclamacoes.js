/* ============================================================
   MUDABRASIL — SISTEMA DE RECLAMAÇÕES E APOIOS
   ------------------------------------------------------------
   Eleitores autenticados podem registrar:
   - RECLAMAÇÕES: críticas a ações do político
   - APOIOS: elogios e apoios
   - RESPOSTAS: só políticos VERIFICADOS respondem
   - RANKINGS: rankings de reclamações, apoios, melhor avaliação

   Regras:
   - Sem limite de reclamações/apoios por eleitor
   - Eleitor identificado via hash anônimo (seudônimo)
   - Moderação: IA + humana
   - Sem prazo para resposta (vai para estatísticas)
   ============================================================ */

const crypto = require('crypto');
const path = require('path');
const db = require('./db');
const verificacao = require('./verificacao');

/* ---- Callback de eventos (SSE em tempo real) ---- */
let reclamacaoChangeHook = null;
function onReclamacaoChange(fn) { reclamacaoChangeHook = fn; }
function emitReclamacaoEvent(tipo, data) {
  if (typeof reclamacaoChangeHook === 'function') {
    try { reclamacaoChangeHook({ tipo, ts: new Date().toISOString(), data }); } catch (_) { }
  }
}

function generateId(prefix) {
  return prefix + '-' + crypto.randomBytes(8).toString('hex');
}

function sanitize(str, maxLen) {
  if (maxLen === undefined) maxLen = 2000;
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'agora';
  if (diff < hour) return Math.floor(diff / min) + 'min atrás';
  if (diff < day) return Math.floor(diff / hour) + 'h atrás';
  if (diff < 30 * day) return Math.floor(diff / day) + 'd atrás';
  return new Date(timestamp).toLocaleDateString('pt-BR');
}

function ipFromReq(req) {
  return (req && (req.headers['x-forwarded-for'] || req.socket && req.socket.remoteAddress)) || null;
}

function createComplaint({ politicianId, voterHash, voterIp, content }) {
  const politician = db.getPolitician(politicianId);
  if (!politician) throw new Error('Político não encontrado');

  const sanitized = sanitize(content, 2000);
  if (sanitized.length < 10) throw new Error('Reclamação muito curta (mínimo 10 caracteres)');

  const complaint = {
    id: generateId('cmp'),
    politicianId: politicianId,
    voterHash: voterHash,
    voterIp: voterIp || null,
    content: sanitized,
    status: 'open',
    createdAt: Date.now()
  };

  db.createComplaint(complaint);

  emitReclamacaoEvent('reclamacao', {
    id: complaint.id,
    politicianId: complaint.politicianId,
    content: sanitized.slice(0, 120),
    status: complaint.status,
    createdAt: complaint.createdAt
  });

  return { ok: true, complaint: { id: complaint.id, politicianId: complaint.politicianId, content: complaint.content, status: complaint.status, createdAt: complaint.createdAt } };
}

function listComplaints(politicianId, options) {
  if (options === undefined) options = {};
  const complaints = db.getComplaintsByPolitician(politicianId, options);
  return complaints.map(c => ({
    id: c.id, politicianId: c.politicianId, content: c.content, status: c.status, createdAt: c.createdAt
  }));
}

function listAllComplaints(options) {
  if (options === undefined) options = {};
  const complaints = db.getAllComplaints(options);
  return complaints.map(c => {
    const p = db.getPolitician(c.politicianId);
    const resp = db.getResponseByComplaint(c.id);
    return {
      id: c.id,
      politicianId: c.politicianId,
      tipo: 'reclamacao',
      content: c.content,
      status: c.status,
      createdAt: c.createdAt,
      politician: p ? { id: p.id, name: p.name, party: p.party, state: p.state, photo: p.photo } : null,
      responded: !!resp,
      response: resp ? { content: resp.content, createdAt: resp.createdAt } : null
    };
  });
}

function listAllSupports(options) {
  if (options === undefined) options = {};
  const supports = db.getAllSupports(options);
  return supports.map(s => {
    const p = db.getPolitician(s.politicianId);
    return {
      id: s.id,
      politicianId: s.politicianId,
      tipo: 'apoio',
      content: s.content,
      createdAt: s.createdAt,
      politician: p ? { id: p.id, name: p.name, party: p.party, state: p.state, photo: p.photo } : null
    };
  });
}

function listAllFeed(options) {
  if (options === undefined) options = {};
  const limit = options.limit || 50;
  const half = Math.ceil(limit / 2);
  const complaints = listAllComplaints({ limit: half, offset: options.offset || 0 });
  const supports = listAllSupports({ limit: half, offset: options.offset || 0 });
  const feed = [...complaints, ...supports].sort((a, b) => b.createdAt - a.createdAt);
  return feed.slice(0, limit);
}

function createSupport(opts) {
  const { politicianId, voterHash, voterIp, content } = opts;
  const politician = db.getPolitician(politicianId);
  if (!politician) throw new Error('Político não encontrado');

  const sanitized = sanitize(content, 2000);
  if (sanitized.length < 3) throw new Error('Apoio muito curto');

  const support = {
    id: generateId('sup'),
    politicianId,
    voterHash,
    voterIp: voterIp || null,
    content: sanitized,
    createdAt: Date.now()
  };

  db.createSupport(support);

  emitReclamacaoEvent('apoio', {
    id: support.id,
    politicianId: support.politicianId,
    content: sanitized.slice(0, 120),
    createdAt: support.createdAt
  });

  return { ok: true, support: { id: support.id, politicianId: support.politicianId, content: support.content, createdAt: support.createdAt } };
}

function listSupports(politicianId, options) {
  if (options === undefined) options = {};
  const supports = db.getSupportsByPolitician(politicianId, options);
  return supports.map(s => ({
    id: s.id, politicianId: s.politicianId, content: s.content, createdAt: s.createdAt
  }));
}

function createResponse(opts) {
  const { complaintId, politicianId, content } = opts;

  if (!verificacao.isVerified(politicianId)) {
    throw new Error('Apenas políticos verificados podem responder');
  }

  const complaint = db.getComplaint(complaintId);
  if (!complaint) throw new Error('Reclamação não encontrada');
  if (complaint.politicianId !== politicianId) {
    throw new Error('Esta reclamação não pertence a este político');
  }

  const existing = db.getResponseByComplaint(complaintId);
  if (existing) throw new Error('Esta reclamação já foi respondida');

  const sanitized = sanitize(content, 5000);
  if (sanitized.length < 5) throw new Error('Resposta muito curta');

  const response = {
    id: generateId('rsp'),
    complaintId,
    politicianId,
    content: sanitized,
    createdAt: Date.now()
  };

  db.createResponse(response);

  return { ok: true, response: { id: response.id, complaintId: response.complaintId, content: response.content, createdAt: response.createdAt } };
}

function listResponses(politicianId, options) {
  if (options === undefined) options = {};
  return db.getResponsesByPolitician(politicianId, options);
}

function getPoliticianStats(politicianId) {
  const complaints = db.countComplaintsByPolitician(politicianId);
  const supports = db.countSupportsByPolitician(politicianId);
  const total = complaints + supports;
  const satisfaction = total > 0 ? (supports - complaints) / total : 0;
  const verified = verificacao.isVerified(politicianId);
  const verifDetail = verificacao.getVerificationDetails(politicianId);

  const allComplaints = db.getComplaintsByPolitician(politicianId, { limit: 1000 });
  const responded = allComplaints.filter(c => c.status === 'responded').length;
  const responseRate = complaints > 0 ? responded / complaints : 0;
  const responses = db.getResponsesByPolitician(politicianId, { limit: 1000 });

  return {
    politicianId,
    verified,
    verification: verifDetail,
    complaints,
    supports,
    satisfaction: Math.round(satisfaction * 100) / 100,
    responseRate: Math.round(responseRate * 100) / 100,
    responses: responses.length,
    lastResponse: responses.length > 0 ? responses[0].createdAt : null
  };
}

function getRankings() {
  const politicians = db.getAllPoliticians();
  const verifications = db.getAllVerifications();

  const withStats = Object.values(politicians).map(p => {
    const complaints = db.countComplaintsByPolitician(p.id);
    const supports = db.countSupportsByPolitician(p.id);
    const total = complaints + supports;
    const satisfaction = total > 0 ? (supports - complaints) / total : 0;
    const verified = verifications[p.id] && verifications[p.id].verified;
    const responses = db.getResponsesByPolitician(p.id, { limit: 1000 }).length;
    const responseRate = complaints > 0 ? responses / complaints : 0;
    return {
      id: p.id, name: p.name, party: p.party, state: p.state, photo: p.photo,
      verified: !!verified, complaints, supports,
      satisfaction, responseRate
    };
  });

  const sortBy = key => (a, b) => b[key] - a[key];

  return {
    mostComplaints: withStats.slice().sort(sortBy('complaints')).slice(0, 20),
    mostSupports: withStats.slice().sort(sortBy('supports')).slice(0, 20),
    bestSatisfaction: withStats
      .filter(p => (p.supports + p.complaints) >= 5)
      .sort(sortBy('satisfaction'))
      .slice(0, 20),
    bestResponseRate: withStats
      .filter(p => p.complaints >= 3)
      .sort(sortBy('responseRate'))
      .slice(0, 20),
    mostVerified: withStats
      .filter(p => p.verified)
      .sort(sortBy('supports'))
      .slice(0, 20)
  };
}

function getGlobalStats() {
  const verifications = db.getAllVerifications();
  const all = db.getAllPoliticians();
  const allComplaints = db.getAllComplaints({ limit: 10000 });
  const allSupports = db.getAllSupports({ limit: 10000 });

  const verifiedCount = Object.values(verifications).filter(v => v.verified).length;
  const totalComplaints = allComplaints.length;
  const totalSupports = allSupports.length;

  return {
    totalPoliticians: Object.keys(all).length,
    verifiedPoliticians: verifiedCount,
    totalComplaints,
    totalSupports,
    totalResponses: 0,
    avgSatisfaction: 0
  };
}

module.exports = {
  createComplaint, listComplaints, listAllComplaints,
  createSupport, listSupports, listAllSupports, listAllFeed,
  createResponse, listResponses,
  getPoliticianStats, getRankings, getGlobalStats,
  sanitize, timeAgo, ipFromReq,
  onReclamacaoChange
};
