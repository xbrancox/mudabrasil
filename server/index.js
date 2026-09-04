/* ============================================================
   MUDABRASIL — SERVIDOR (frontend + API de dados públicos + VOTO)
   ------------------------------------------------------------
   Um único comando sobe o site inteiro e a API:

       node server/index.js
       → http://localhost:8080

   Rotas de DADOS PÚBLICOS:
     GET /api/candidatos          lista de candidatos (dados reais)
                                  ?busca=&uf=&partido=&ordem=&refresh=1
     GET /api/candidatos/:id      detalhe + enriquecimento sob demanda
     GET /api/status              metadados da fonte (origem, modo)

   Rotas de VOTO (motor de voto contínuo e revogável):
     POST /api/voto               registrar voto de confiança → {code}
     POST /api/voto/revogar       revogar voto (código)
     POST /api/voto/manter        reafirmar ("manter meu voto")
     GET  /api/voto?code=         ver meu voto (mascarado na UI)
     GET  /api/termometro         agregação pública irreversível
     GET  /api/stream             SSE: eventos ao vivo (novos votos, etc.)
     GET  /api/health             saúde do serviço (uptime, storage, totais)

   O frontend continua funcionando 100% estático: se a API não
   responder (ex.: aberto via file://), ele usa o modo DEMO com
   dados sintéticos embutidos. Sem dependências de npm.
   ============================================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { fetchDeputados, enrichBills, DEP_FILE } = require('./ingest');
const { fetchSenadores, SENADO_FILE } = require('./senado');
const votes = require('./votes');
const db = require('./db');
const auth = require('./auth');
const verificacao = require('./verificacao');
const reclamacoes = require('./reclamacoes');
const seedPls = require('./seed_pls');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8080;

const { migrated } = db.init();
const STORAGE_LABEL = db.backend() === 'sqlite'
  ? 'SQLite nativo (votos.db)'
  : 'arquivo JSON (votos.json — Node sem node:sqlite)';

const REFRESH_HOURS = Math.max(1, parseInt(process.env.MB_REFRESH_HOURS, 10) || 24);
setInterval(() => {
  fetchDeputados({ force: true })
    .then(r => console.log('[auto] dados públicos atualizados: ' + r.count + ' deputados'))
    .catch(e => console.error('[auto] falha na atualização agendada: ' + e.message));
  fetchSenadores({ force: true })
    .then(r => console.log('[auto] dados do Senado atualizados: ' + r.count + ' senadores'))
    .catch(e => console.error('[auto] falha na atualização do Senado: ' + e.message));
}, REFRESH_HOURS * 3600 * 1000).unref();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2'
};

const SEC_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};

function sendJson(res, status, obj, methods = 'GET, POST, OPTIONS') {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': SEC_HEADERS['X-Content-Type-Options'],
    'Referrer-Policy': SEC_HEADERS['Referrer-Policy']
  });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) { reject(new Error('Payload muito grande')); req.destroy(); }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (_) { reject(new Error('JSON inválido no body')); }
    });
    req.on('error', reject);
  });
}

function clientIp(req) {
  return (req.socket && req.socket.remoteAddress) || 'desconhecido';
}

const streamClients = new Set();

votes.onVoteChange(info => {
  const payload = Object.assign({}, info, votes.totals());
  const frame = 'event: termometro\ndata: ' + JSON.stringify(payload) + '\n\n';
  for (const client of streamClients) {
    try { client.write(frame); } catch (_) { streamClients.delete(client); }
  }
});

/* SSE: reclamacoes / apoios em tempo real */
reclamacoes.onReclamacaoChange(info => {
  const frame = 'event: ' + info.tipo + '\ndata: ' + JSON.stringify(info) + '\n\n';
  for (const client of streamClients) {
    try { client.write(frame); } catch (_) { streamClients.delete(client); }
  }
});

function applyQuery(list, q) {
  let out = list;
  const busca = (q.busca || '').toLowerCase().trim();
  if (busca) {
    out = out.filter(c =>
      (c.name || '').toLowerCase().includes(busca) ||
      (c.party || '').toLowerCase().includes(busca) ||
      (c.state || '').toLowerCase().includes(busca) ||
      (c.focusArea || '').toLowerCase().includes(busca)
    );
  }
  if (q.uf && q.uf !== 'all') out = out.filter(c => c.state === q.uf);
  if (q.partido && q.partido !== 'all') out = out.filter(c => c.party === q.partido);

  const [field, order] = (q.ordem || 'name:asc').split(':');
  const dir = order === 'desc' ? -1 : 1;
  out = [...out].sort((a, b) => {
    let va = a[field], vb = b[field];
    const aNull = va == null, bNull = vb == null;
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    if (typeof va === 'string' || typeof vb === 'string') {
      return dir * String(va).localeCompare(String(vb), 'pt-BR');
    }
    return dir * (va - vb);
  });
  return out;
}

async function handleApi(req, res, url) {
  let p = url.pathname;
  if (p.startsWith('/api/candidatos/detalhes/')) {
    p = '/api/candidatos/' + p.slice('/api/candidatos/detalhes/'.length);
  }
  const q = Object.fromEntries(url.searchParams);
  const ip = clientIp(req);

  /* Proxy simples para a API da Câmara (alguns endpoints não enviam CORS e ele é instável) */
  if (p.startsWith('/api/camara/') && req.method === 'GET') {
    const camaraPath = p.replace('/api/camara/', '');
    if (!/^[\w/-]+$/.test(camaraPath)) return sendJson(res, 400, { ok: false, error: 'caminho inválido' });
    try {
      const r = await fetch('https://dadosabertos.camara.leg.br/api/v2/' + camaraPath + (url.search || ''), { headers: { Accept: 'application/json' } });
      if (!r.ok) return sendJson(res, r.status === 404 ? 404 : 502, { ok: false, error: 'Câmara respondeu ' + r.status });
      const j = await r.json();
      res.writeHead(200, Object.assign({}, SEC_HEADERS, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }));
      return res.end(JSON.stringify(j));
    } catch (e) {
      return sendJson(res, 502, { ok: false, error: 'Falha ao consultar a Câmara: ' + e.message });
    }
  }

  if (p === '/api/health') {
    let registros = 0;
    try { registros = db.countBallots(); } catch (_) { }
    return sendJson(res, 200, {
      ok: true,
      uptimeSec: Math.round(process.uptime()),
      storage: db.backend(),
      storageArquivo: db.file(),
      totalRegistros: registros,
      totalVotosAtivos: votes.totals().totalVotosAtivos,
      totalRevogados: votes.totals().totalRevogados,
      atualizacaoDadosPublicos: 'a cada ' + REFRESH_HOURS + 'h (automática)'
    });
  }

  if (p === '/api/status') {
    return sendJson(res, 200, {
      ok: true,
      source: 'camara+senado',
      api: 'https://dadosabertos.camara.leg.br/api/v2',
      senadoApi: 'https://legis.senado.leg.br/dadosabertos',
      aviso: 'Os dados reais vêm das APIs abertas da Câmara dos Deputados e do Senado Federal. ' +
             'TSE, Portal da Transparência e CNJ são as fontes de produção (ver README.md).'
    });
  }

  if (p === '/api/senadores') {
    try {
      const { list, fromCache, count } = await fetchSenadores({ force: q.refresh === '1' });
      const senadores = applyQuery(list, q);
      return sendJson(res, 200, {
        mode: 'real',
        source: 'Senado Federal',
        total: count,
        retornados: senadores.length,
        doCache: fromCache,
        dataFonte: 'Dados Abertos do Senado Federal',
        senadores
      });
    } catch (e) {
      return sendJson(res, 502, {
        mode: 'error',
        source: 'Senado Federal',
        error: 'Falha ao buscar dados reais: ' + e.message,
        senadores: []
      });
    }
  }

  if (p === '/api/candidatos') {
    try {
      const [depResult, senResult] = await Promise.all([
        fetchDeputados({ force: q.refresh === '1' }),
        fetchSenadores({ force: q.refresh === '1' })
      ]);
      const deputados = depResult.list.map(d => ({ ...d, position: 'Deputado Federal' }));
      const senadores = senResult.list.map(s => ({ ...s, position: 'Senador Federal' }));
      const todos = [...deputados, ...senadores];
      const candidatos = applyQuery(todos, q);
      return sendJson(res, 200, {
        mode: 'real',
        source: 'Câmara dos Deputados + Senado Federal',
        total: todos.length,
        retornados: candidatos.length,
        doCache: depResult.fromCache && senResult.fromCache,
        atualizadoEm: new Date().toISOString(),
        candidatos,
        detalhes: {
          deputados: deputados.length,
          senadores: senadores.length
        }
      });
    } catch (e) {
      return sendJson(res, 502, {
        mode: 'error',
        source: 'Câmara dos Deputados + Senado Federal',
        error: 'Falha ao buscar dados reais: ' + e.message,
        candidatos: []
      });
    }
  }

  const m = p.match(/^\/api\/candidatos\/(camara-|senado-)?([\w-]+)$/);
  if (m && m[0] !== '/api/candidatos/comparar' && !p.startsWith('/api/candidatos/detalhes/')) {
    const id = m[0].replace('/api/candidatos/', '');
    try {
      const [depResult, senResult] = await Promise.all([
        fetchDeputados(),
        fetchSenadores()
      ]);
      let cand = depResult.list.find(c => c.id === id);
      let fonte = 'Câmara dos Deputados';
      if (!cand) {
        cand = senResult.list.find(c => c.id === id);
        fonte = 'Senado Federal';
      }
      if (!cand) return sendJson(res, 404, { error: 'Candidato não encontrado' });

      if (id.startsWith('camara-')) {
        const camaraId = id.replace('camara-', '');
        const enrich = await enrichBills(camaraId);
        if (enrich && enrich.billsAuthored != null) {
          cand.billsAuthored = enrich.billsAuthored;
          cand.hasFullData = true;
        }
      }
      return sendJson(res, 200, { ok: true, mode: 'real', source: fonte, candidato: cand });
    } catch (e) {
      return sendJson(res, 502, { error: e.message });
    }
  }

  if (p === '/api/termometro' && req.method === 'GET') {
    try {
      return sendJson(res, 200, await votes.getTermometro({ topN: parseInt(q.top || '10', 10) }));
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: 'Falha ao computar termômetro: ' + e.message });
    }
  }

  if (p === '/api/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': SEC_HEADERS['X-Content-Type-Options'],
      'Referrer-Policy': SEC_HEADERS['Referrer-Policy']
    });
    res.write('retry: 10000\n\n');
    res.write('event: welcome\ndata: ' +
      JSON.stringify(Object.assign({ ok: true, ts: new Date().toISOString() }, votes.totals())) +
      '\n\n');
    streamClients.add(res);
    const heartbeat = setInterval(() => {
      try { res.write(':hb\n\n'); } catch (_) { }
    }, 30000);
    req.on('close', () => { clearInterval(heartbeat); streamClients.delete(res); });
    return;
  }

  if (p === '/api/voto' && req.method === 'GET') {
    const code = q.code || '';
    if (!code) return sendJson(res, 400, { ok: false, error: 'Parâmetro code é obrigatório' });
    const r = votes.viewVote(code.trim());
    if (r.ok) return sendJson(res, 200, r);
    return sendJson(res, r.status || 500, r);
  }

  if (p === '/api/voto' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    try {
      const voter = auth.getVoterFromToken(body.sessionToken || '');
      const r = await votes.castVote({ ...body, voterHash: voter ? voter.voterHash : null }, ip);
      return sendJson(res, r.ok ? 201 : (r.status || 400), r);
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: 'Erro interno ao votar: ' + e.message });
    }
  }

  if (p === '/api/voto/revogar' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const code = String(body.code || '').trim();
    if (code) {
      const r = votes.revokeVote(code, ip);
      return sendJson(res, r.ok ? 200 : (r.status || 400), r);
    }
    const ballotId = String(body.ballotId || '').trim();
    if (ballotId) {
      const r = votes.revokeBallotById(ballotId, ip);
      return sendJson(res, r.ok ? 200 : (r.status || 400), r);
    }
    return sendJson(res, 400, { ok: false, error: 'Código ou ballotId é obrigatório' });
  }

  if (p === '/api/voto/manter' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const code = String(body.code || '').trim();
    if (!code) return sendJson(res, 400, { ok: false, error: 'Código é obrigatório' });
    const r = votes.reaffirmVote(code, ip);
    return sendJson(res, r.ok ? 200 : (r.status || 400), r);
  }

  if (p === '/api/auth/google' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    try {
      const r = await auth.loginWithGoogle(body.idToken || '');
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 401, { ok: false, error: e.message }); }
  }

  if (p === '/api/auth/otp/send' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    try {
      const r = await auth.sendOtp(body.phone || '');
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  if (p === '/api/auth/otp/verify' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    try {
      const r = await auth.verifyOtp(body.phone || '', body.code || '');
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 401, { ok: false, error: e.message }); }
  }

  if (p === '/api/auth/me' && req.method === 'GET') {
    const token = q.sessionToken || (req.headers.authorization || '').replace('Bearer ', '');
    const voter = auth.getVoterFromToken(token);
    if (!voter) return sendJson(res, 401, { ok: false, error: 'Não autenticado' });
    return sendJson(res, 200, { ok: true, voter: { id: voter.id, method: voter.method, name: voter.name, photo: voter.photo, voterHash: voter.voterHash } });
  }

  if (p === '/api/auth/logout' && req.method === 'POST') {
    const token = q.sessionToken || (req.headers.authorization || '').replace('Bearer ', '');
    auth.logout(token);
    return sendJson(res, 200, { ok: true });
  }

  if (p === '/api/auth/email/send' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    try {
      const r = await auth.sendEmailOtp(body.email || '');
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  if (p === '/api/auth/email/verify' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    try {
      const r = await auth.verifyEmailOtp(body.email || '', body.code || '');
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 401, { ok: false, error: e.message }); }
  }

  if (p === '/api/auth/register' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    try {
      const r = await auth.register(body.email || '', body.name || '', body.phone || '');
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  if (p === '/api/verificacao/iniciar' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    try {
      const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
      const r = await verificacao.startVerification(body.politicianId || '', body.email || '', baseUrl);
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  if (p === '/api/verificacao/confirmar' && req.method === 'GET') {
    const token = q.token || '';
    try {
      const r = verificacao.confirmVerification(token);
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  if (p === '/api/verificacao/dominios' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, dominios: verificacao.getAuthorizedDomains() });
  }

  if (p === '/api/verificacao/stats' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, stats: verificacao.getStats() });
  }

  if (p.startsWith('/api/verificacao/politico/') && req.method === 'GET') {
    const pid = decodeURIComponent(p.replace('/api/verificacao/politico/', ''));
    return sendJson(res, 200, { ok: true, details: verificacao.getVerificationDetails(pid), stats: reclamacoes.getPoliticianStats(pid) });
  }

  if (p === '/api/reclamacoes' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const token = body.sessionToken || '';
    const voter = auth.getVoterFromToken(token);
    if (!voter) return sendJson(res, 401, { ok: false, error: 'Faça login para reclamar' });
    try {
      const r = reclamacoes.createComplaint({ politicianId: body.politicianId, voterHash: voter.voterHash, voterIp: ip, content: body.content });
      return sendJson(res, 201, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  if (p === '/api/reclamacoes' && req.method === 'GET') {
    const pid = q.politicianId;
    if (pid) {
      const list = reclamacoes.listComplaints(pid, { limit: parseInt(q.limit || 20), offset: parseInt(q.offset || 0) });
      return sendJson(res, 200, { ok: true, complaints: list });
    }
    const list = reclamacoes.listAllComplaints({ limit: parseInt(q.limit || 50), offset: parseInt(q.offset || 0) });
    return sendJson(res, 200, { ok: true, complaints: list, stats: reclamacoes.getGlobalStats() });
  }

  if (p === '/api/reclamacoes/public' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const pid = body.politicianId || body.politicoId || '';
    const tipo = body.tipo || 'rec';
    const content = (body.titulo || '') + ' — ' + (body.descricao || body.content || '');
    const voterHash = 'anon-' + require('crypto').createHash('sha256').update(ip + ':' + Date.now()).digest('hex').slice(0, 16);
    try {
      if (tipo === 'apoio') {
        const r = reclamacoes.createSupport({ politicianId: pid, voterHash, voterIp: ip, content });
        return sendJson(res, 201, r);
      }
      const r = reclamacoes.createComplaint({ politicianId: pid, voterHash, voterIp: ip, content });
      return sendJson(res, 201, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  if (p === '/api/apoios' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const token = body.sessionToken || '';
    const voter = auth.getVoterFromToken(token);
    if (!voter) return sendJson(res, 401, { ok: false, error: 'Faça login para apoiar' });
    try {
      const r = reclamacoes.createSupport({ politicianId: body.politicianId, voterHash: voter.voterHash, voterIp: ip, content: body.content });
      return sendJson(res, 201, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  if (p === '/api/apoios' && req.method === 'GET') {
    const pid = q.politicianId;
    if (!pid) return sendJson(res, 400, { ok: false, error: 'politicianId é obrigatório' });
    const list = reclamacoes.listSupports(pid, { limit: parseInt(q.limit || 20), offset: parseInt(q.offset || 0) });
    return sendJson(res, 200, { ok: true, supports: list });
  }

  if (p === '/api/feed' && req.method === 'GET') {
    const feed = reclamacoes.listAllFeed({ limit: parseInt(q.limit || 50), offset: parseInt(q.offset || 0) });
    return sendJson(res, 200, { ok: true, feed, stats: reclamacoes.getGlobalStats() });
  }

  if (p === '/api/respostas' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const token = body.sessionToken || '';
    const voter = auth.getVoterFromToken(token);
    if (!voter) return sendJson(res, 401, { ok: false, error: 'Faça login' });
    try {
      const r = reclamacoes.createResponse({ complaintId: body.complaintId, politicianId: body.politicianId, content: body.content, sessionToken: token });
      return sendJson(res, 201, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  if (p === '/api/rankings' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, rankings: reclamacoes.getRankings(), stats: reclamacoes.getGlobalStats() });
  }

  if (p.startsWith('/api/estatisticas/politico/') && req.method === 'GET') {
    const pid = decodeURIComponent(p.replace('/api/estatisticas/politico/', ''));
    return sendJson(res, 200, { ok: true, stats: reclamacoes.getPoliticianStats(pid) });
  }

  /* ================= INTEGRAÇÃO FRONTEND (PLs, conferir, meus votos, comparar) ================= */

  if (p === '/api/pls' && req.method === 'GET') {
    try {
      let all = Object.values(db.readAllPls());
      if (!all.length) { try { seedPls.seed(); all = Object.values(db.readAllPls()); } catch (_) { } }
      return sendJson(res, 200, { ok: true, mode: 'real', total: all.length, pls: all });
    } catch (e) { return sendJson(res, 500, { ok: false, error: e.message }); }
  }

  if (p === '/api/pls/voto' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const voter = auth.getVoterFromToken(body.sessionToken || '');
    if (!voter) return sendJson(res, 401, { ok: false, error: 'Faça login para votar em PLs' });
    const vote = body.vote === 'aprovo' ? 'aprovo' : (body.vote === 'nao_aprovo' ? 'nao_aprovo' : null);
    if (!vote) return sendJson(res, 400, { ok: false, error: 'vote deve ser "aprovo" ou "nao_aprovo"' });
    const plId = String(body.plId || '');
    if (!db.getPl(plId)) return sendJson(res, 404, { ok: false, error: 'PL não encontrado' });
    try {
      db.castPlVote(plId, voter.voterHash, vote);
      const updated = db.getPl(plId);
      return sendJson(res, 200, { ok: true, pl: { id: updated.id, approvalCount: updated.approvalCount, rejectionCount: updated.rejectionCount } });
    } catch (e) { return sendJson(res, 500, { ok: false, error: e.message }); }
  }

  if (p === '/api/voto/revogados' && req.method === 'GET') {
    try {
      const r = await votes.getRevogados();
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 500, { ok: false, error: e.message }); }
  }

  if (p === '/api/voto/conferir' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const code = String(body.code || '').replace(/[\s-]/g, '');
    const rec = code ? db.verifyVoteCode(code) : null;
    if (!rec) return sendJson(res, 404, { ok: false, error: 'Código não encontrado' });
    let vinculados = [];
    try { vinculados = (db.getBallotsByVoter(rec.voterHash) || []).filter(b => !b.revoked); } catch (_) { }
    return sendJson(res, 200, {
      ok: true,
      voterHash: rec.voterHash,
      votos: vinculados.map(b => ({ id: b.ballotId, politicianId: b.politicianId, createdAt: b.createdAt }))
    });
  }

  if (p === '/api/voto/codigo' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const voter = auth.getVoterFromToken(body.sessionToken || '');
    if (!voter) return sendJson(res, 401, { ok: false, error: 'Faça login para gerar o código' });
    try {
      const codes = db.getVoteCodesForVoter(voter.voterHash);
      const code = (codes && codes.length) ? codes[0].code : db.generateVoteCode(voter.voterHash);
      return sendJson(res, 200, { ok: true, code, formatted: code.replace(/(.{4})/g, '$1 ').trim() });
    } catch (e) { return sendJson(res, 500, { ok: false, error: e.message }); }
  }

  if (p === '/api/voto/meus' && req.method === 'GET') {
    const voter = auth.getVoterFromToken(q.sessionToken || (req.headers.authorization || '').replace('Bearer ', ''));
    if (!voter) return sendJson(res, 401, { ok: false, error: 'Faça login para ver seus votos' });
    try {
      const votos = await votes.getBallotsForVoter(voter.voterHash);
      return sendJson(res, 200, { ok: true, votos });
    } catch (e) { return sendJson(res, 500, { ok: false, error: e.message }); }
  }

  if (p === '/api/candidatos/comparar' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    const ids = Array.isArray(body.ids) ? body.ids.map(String).slice(0, 4) : [];
    if (!ids.length) return sendJson(res, 400, { ok: false, error: 'ids é obrigatório' });
    try {
      const [depResult, senResult] = await Promise.all([fetchDeputados(), fetchSenadores()]);
      const todos = [
        ...depResult.list.map(d => ({ ...d, position: 'Deputado Federal' })),
        ...senResult.list.map(s => ({ ...s, position: 'Senador Federal' }))
      ];
      const escolhidos = ids.map(id => todos.find(c => c.id === id)).filter(Boolean);
      if (!escolhidos.length) return sendJson(res, 404, { ok: false, error: 'Nenhum candidato encontrado' });
      return sendJson(res, 200, { ok: true, candidatos: escolhidos });
    } catch (e) { return sendJson(res, 502, { ok: false, error: e.message }); }
  }

  if (p === '/api/verificacao/solicitar' && req.method === 'POST') {
    let body;
    try { body = await readBody(req); } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
    try {
      const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
      const r = await verificacao.startVerification(body.politicianId || '', body.email || '', baseUrl);
      return sendJson(res, 200, r);
    } catch (e) { return sendJson(res, 400, { ok: false, error: e.message }); }
  }

  return sendJson(res, 404, { error: 'Rota de API não encontrada' });
}

function serveStatic(res, url) {
  let u = decodeURIComponent(url.pathname);
  if (u === '/') u = '/index.html';
  const safe = path.normalize(u).replace(/^(\.\.[/\\])+/, '');
  let fp = path.join(ROOT, safe);
  if (!fp.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 - Acesso negado');
  }
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  if (!fs.existsSync(fp)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 - Não encontrado: ' + u);
  }
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'X-Content-Type-Options': SEC_HEADERS['X-Content-Type-Options'],
    'Referrer-Policy': SEC_HEADERS['Referrer-Policy']
  });
  fs.createReadStream(fp).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:' + PORT);
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      return res.end();
    }
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(res, url);
  } catch (e) {
    return sendJson(res, 500, { error: 'Erro interno: ' + e.message });
  }
});

server.listen(PORT, () => {
  console.log('\n  🇧🇷  MudaBrasil rodando em  http://localhost:' + PORT + '\n');
  console.log('    Frontend:       http://localhost:' + PORT + '/');
  console.log('    API (lista):    http://localhost:' + PORT + '/api/candidatos');
  console.log('    API (senadores): http://localhost:' + PORT + '/api/senadores');
  console.log('    API (voto):     POST http://localhost:' + PORT + '/api/voto');
  console.log('    API (termômetro):GET  http://localhost:' + PORT + '/api/termometro');
  console.log('    Tempo real:     GET  http://localhost:' + PORT + '/api/stream (SSE)');
  console.log('    Health:         GET  http://localhost:' + PORT + '/api/health\n');
  console.log('    Auth:           POST /api/auth/{google,otp/send,otp/verify,me,logout}');
  console.log('    Verificação:    /api/verificacao/{iniciar,confirmar,dominios,stats,politico/:id}');
  console.log('    Reclamações:    /api/{reclamacoes,apoios,respostas,rankings}');
  console.log('    Dados reais:    ' + DEP_FILE);
  console.log('    Senadores:      ' + SENADO_FILE);
  console.log('    Votos:          ' + db.file() + '  [' + STORAGE_LABEL + ']');
  if (migrated > 0) console.log('    Migração:       ' + migrated + ' cédulas importadas de votos.json → votos.db');
  console.log('    Atualização:    dados públicos a cada ' + REFRESH_HOURS + 'h (automática)');
  console.log('    Encerramento:   Ctrl+C / SIGTERM fecham o banco com segurança\n');
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n[server] ' + signal + ' recebido — encerrando com segurança…');
  try { db.close(); } catch (_) { }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
