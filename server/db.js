/* ============================================================
   MUDABRASIL — CAMADA DE ARMAZENAMENTO (VOTOS + PARLAMENTARES + RECLAMAÇÕES)
   ------------------------------------------------------------
   Backends suportados:
   - SQLITE (padrão, Node 22.5+): banco nativo do Node (`node:sqlite`)
   - JSON (fallback automático, Node 18–22.4): arquivo JSON com escrita atômica
   ============================================================ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const VOTOS_DB = path.join(DATA_DIR, 'votos.db');
const VOTOS_FILE = path.join(DATA_DIR, 'votos.json');

const FORCED = process.env.MB_STORAGE;
let DatabaseSync = null;
if (FORCED !== 'json') {
  try { ({ DatabaseSync } = require('node:sqlite')); } catch (_) { }
}
if (FORCED === 'sqlite' && !DatabaseSync) {
  throw new Error('MB_STORAGE=sqlite foi pedido, mas node:sqlite não existe neste Node (use Node 22.5+)');
}
const BACKEND = DatabaseSync ? 'sqlite' : 'json';

let db = null;
let inited = false;

function ensureDir() { fs.mkdirSync(DATA_DIR, { recursive: true }); }

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  if (raw.name) return raw;
  return {
    id: String(raw.id || raw.idLegislatura || ''),
    name: raw.nome || raw.name || '',
    party: raw.siglaPartido || raw.party || '',
    state: raw.siglaUf || raw.state || '',
    position: raw.position || (String(raw.id || '').startsWith('senado') ? 'Senador Federal' : 'Deputado Federal'),
    photo: raw.urlFoto || raw.urlfoto || raw.photo || '',
    focusArea: raw.focusArea || raw.area || '',
    dataNascimento: raw.dataNascimento || raw.nascimento || '',
    sexo: raw.sexo || raw.gender || '',
    escolaridade: raw.escolaridade || raw.education || ''
  };
}

function loadFromCache() {
  const out = {};
  try {
    const dep = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'deputados.json'), 'utf8'));
    const items = dep.dados || dep.list || dep;
    if (Array.isArray(items)) {
      items.forEach(d => {
        const normalized = normalize(d);
        if (normalized.id) out['camara-' + normalized.id] = { ...normalized, id: 'camara-' + normalized.id };
      });
    }
  } catch (_) { }
  try {
    const sen = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'senadores.json'), 'utf8'));
    const items = sen.dados || sen.list || sen;
    if (Array.isArray(items)) {
      items.forEach(s => {
        const normalized = normalize(s);
        if (normalized.id) out['senado-' + normalized.id] = { ...normalized, id: 'senado-' + normalized.id };
      });
    }
  } catch (_) { }
  return out;
}

const JSON_FILES = {
  ballots: path.join(DATA_DIR, 'votos.json'),
  politicians: path.join(DATA_DIR, 'politicians.json'),
  verifications: path.join(DATA_DIR, 'verifications.json'),
  complaints: path.join(DATA_DIR, 'complaints.json'),
  supports: path.join(DATA_DIR, 'supports.json'),
  responses: path.join(DATA_DIR, 'responses.json'),
  voters: path.join(DATA_DIR, 'voters.json'),
  pls: path.join(DATA_DIR, 'pls.json'),
  pl_votes: path.join(DATA_DIR, 'pl_votes.json'),
  vote_codes: path.join(DATA_DIR, 'vote_codes.json')
};

function jsonReadFile(key) {
  const file = JSON_FILES[key];
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (raw && typeof raw === 'object') return raw;
  } catch (_) { }
  return {};
}

function jsonWriteFile(key, data) {
  ensureDir();
  const file = JSON_FILES[key];
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

function openSqlite() {
  if (db) return;
  ensureDir();
  db = new DatabaseSync(VOTOS_DB);
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ballots (
      id             TEXT PRIMARY KEY,
      politician_id  TEXT NOT NULL,
      uf             TEXT,
      created_at     INTEGER NOT NULL,
      reaffirmed_at  INTEGER,
      revoked        INTEGER NOT NULL DEFAULT 0,
      revoked_at     INTEGER,
      voter_hash     TEXT,
      updated_at     INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_ballots_politician ON ballots(politician_id);

    CREATE TABLE IF NOT EXISTS politicians (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      party           TEXT,
      state           TEXT,
      position        TEXT,
      photo           TEXT,
      data_json       TEXT NOT NULL,
      updated_at      INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_politicians_party ON politicians(party);
    CREATE INDEX IF NOT EXISTS idx_politicians_state ON politicians(state);

    CREATE TABLE IF NOT EXISTS verifications (
      politician_id   TEXT PRIMARY KEY,
      verified        INTEGER NOT NULL DEFAULT 0,
      method          TEXT,
      domain          TEXT,
      email           TEXT,
      verified_at     INTEGER
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id              TEXT PRIMARY KEY,
      politician_id   TEXT NOT NULL,
      voter_hash      TEXT NOT NULL,
      voter_ip        TEXT,
      content         TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'open',
      created_at      INTEGER NOT NULL,
      updated_at      INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_complaints_politician ON complaints(politician_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_voter ON complaints(voter_hash);

    CREATE TABLE IF NOT EXISTS supports (
      id              TEXT PRIMARY KEY,
      politician_id   TEXT NOT NULL,
      voter_hash      TEXT NOT NULL,
      voter_ip        TEXT,
      content         TEXT NOT NULL,
      created_at      INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_supports_politician ON supports(politician_id);
    CREATE INDEX IF NOT EXISTS idx_supports_voter ON supports(voter_hash);

    CREATE TABLE IF NOT EXISTS responses (
      id              TEXT PRIMARY KEY,
      complaint_id    TEXT NOT NULL UNIQUE,
      politician_id   TEXT NOT NULL,
      content         TEXT NOT NULL,
      created_at      INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_responses_politician ON responses(politician_id);

    CREATE TABLE IF NOT EXISTS voters (
      id              TEXT PRIMARY KEY,
      method          TEXT NOT NULL,
      google_id       TEXT,
      phone           TEXT,
      email           TEXT,
      name            TEXT,
      photo           TEXT,
      voter_hash      TEXT UNIQUE,
      verified_at     INTEGER,
      created_at      INTEGER,
      last_login_at   INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_voters_google ON voters(google_id);
    CREATE INDEX IF NOT EXISTS idx_voters_phone ON voters(phone);
    CREATE INDEX IF NOT EXISTS idx_voters_hash ON voters(voter_hash);

    CREATE TABLE IF NOT EXISTS pls (
      id              TEXT PRIMARY KEY,
      number          TEXT NOT NULL,
      year            INTEGER NOT NULL,
      author          TEXT,
      party           TEXT,
      title           TEXT,
      ementa          TEXT,
      status          TEXT DEFAULT 'Tramitando',
      chamber         TEXT,
      approval_count  INTEGER NOT NULL DEFAULT 0,
      rejection_count INTEGER NOT NULL DEFAULT 0,
      data_json       TEXT,
      updated_at      INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_pls_year ON pls(year);
    CREATE INDEX IF NOT EXISTS idx_pls_number ON pls(number);

    CREATE TABLE IF NOT EXISTS pl_votes (
      id              TEXT PRIMARY KEY,
      pl_id           TEXT NOT NULL,
      voter_hash      TEXT NOT NULL,
      vote            TEXT NOT NULL,
      created_at      INTEGER NOT NULL,
      UNIQUE(pl_id, voter_hash)
    );
    CREATE INDEX IF NOT EXISTS idx_pl_votes_pl ON pl_votes(pl_id);

    CREATE TABLE IF NOT EXISTS vote_codes (
      code            TEXT PRIMARY KEY,
      voter_hash      TEXT NOT NULL,
      used            INTEGER NOT NULL DEFAULT 0,
      created_at      INTEGER NOT NULL
    );
  `);
}

const rowToBallot = r => ({
  ballotId: r.id,
  politicianId: r.politician_id,
  uf: r.uf,
  createdAt: r.created_at,
  reaffirmedAt: r.reaffirmed_at,
  revoked: !!r.revoked,
  revokedAt: r.revoked_at,
  voterHash: r.voter_hash || null
});
const ballotParams = b => [
  b.ballotId, b.politicianId, b.uf || null,
  b.createdAt, b.reaffirmedAt || null,
  b.revoked ? 1 : 0, b.revokedAt || null,
  b.voterHash || null, Date.now()
];
const UPSERT_BALLOT_SQL = `
  INSERT INTO ballots (id, politician_id, uf, created_at, reaffirmed_at, revoked, revoked_at, voter_hash, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    politician_id  = excluded.politician_id,
    uf             = excluded.uf,
    created_at     = excluded.created_at,
    reaffirmed_at  = excluded.reaffirmed_at,
    revoked        = excluded.revoked,
    revoked_at     = excluded.revoked_at,
    voter_hash     = COALESCE(excluded.voter_hash, ballots.voter_hash),
    updated_at     = excluded.updated_at`;

function init() {
  if (inited) return { backend: BACKEND, migrated: 0 };
  inited = true;
  let migrated = 0;
  if (BACKEND === 'sqlite') {
    openSqlite();
    try { db.prepare('ALTER TABLE ballots ADD COLUMN voter_hash TEXT').run(); } catch (_) { }
    const n = db.prepare('SELECT COUNT(*) AS n FROM ballots').get().n;
    if (n === 0) {
      const legacy = jsonReadFile('ballots');
      const list = Object.values(legacy);
      if (list.length) { importAllBallots(legacy); migrated = list.length; }
    }
  }
  return { backend: BACKEND, migrated };
}

function getBallot(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM ballots WHERE id = ?').get(id);
    return r ? rowToBallot(r) : null;
  }
  return jsonReadFile('ballots')[id] || null;
}

function upsertBallot(ballot) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(UPSERT_BALLOT_SQL).run(...ballotParams(ballot));
    return;
  }
  const all = jsonReadFile('ballots');
  all[ballot.ballotId] = ballot;
  jsonWriteFile('ballots', all);
}

function readAllBallots() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const out = {};
    for (const r of db.prepare('SELECT * FROM ballots').all()) out[r.id] = rowToBallot(r);
    return out;
  }
  return jsonReadFile('ballots');
}

function getBallotsByVoter(voterHash) {
  if (!voterHash) return [];
  if (BACKEND === 'sqlite') {
    openSqlite();
    let rows = [];
    try { rows = db.prepare('SELECT * FROM ballots WHERE voter_hash = ? ORDER BY created_at DESC').all(voterHash); } catch (_) { }
    return rows.map(rowToBallot);
  }
  const all = jsonReadFile('ballots');
  return Object.values(all).filter(b => b.voterHash === voterHash);
}

function countBallots() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    return db.prepare('SELECT COUNT(*) AS n FROM ballots').get().n;
  }
  return Object.keys(jsonReadFile('ballots')).length;
}

function clearBallots() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.exec('DELETE FROM ballots');
  }
  try { fs.unlinkSync(VOTOS_FILE); } catch (_) { }
}

function importAllBallots(ballotsObj) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.exec('BEGIN');
    try {
      db.exec('DELETE FROM ballots');
      const ins = db.prepare(UPSERT_BALLOT_SQL);
      for (const b of Object.values(ballotsObj || {})) ins.run(...ballotParams(b));
      db.exec('COMMIT');
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch (_) { }
      throw e;
    }
    return;
  }
  jsonWriteFile('ballots', ballotsObj || {});
}

function upsertPolitician(p) {
  const now = Date.now();
  const dataJson = JSON.stringify(p);
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO politicians (id, name, party, state, position, photo, data_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name, party = excluded.party, state = excluded.state,
        position = excluded.position, photo = excluded.photo,
        data_json = excluded.data_json, updated_at = excluded.updated_at
    `).run(p.id, p.name, p.party, p.state, p.position, p.photo || null, dataJson, now);
    return;
  }
  const all = jsonReadFile('politicians');
  all[p.id] = { ...p, data_json: dataJson, updated_at: now };
  jsonWriteFile('politicians', all);
}

function getPolitician(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM politicians WHERE id = ?').get(id);
    if (r) return JSON.parse(r.data_json);
    const cache = loadFromCache();
    return cache[id] || null;
  }
  return jsonReadFile('politicians')[id] || null;
}

function getAllPoliticians() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const out = {};
    for (const r of db.prepare('SELECT * FROM politicians').all()) out[r.id] = JSON.parse(r.data_json);
    if (Object.keys(out).length === 0) {
      Object.assign(out, loadFromCache());
    }
    return out;
  }
  return jsonReadFile('politicians');
}

function getPoliticiansByFilters({ party, state, position, limit = 1000 }) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    let sql = 'SELECT * FROM politicians WHERE 1=1';
    const params = [];
    if (party) { sql += ' AND party = ?'; params.push(party); }
    if (state) { sql += ' AND state = ?'; params.push(state); }
    if (position) { sql += ' AND position = ?'; params.push(position); }
    sql += ' LIMIT ?'; params.push(limit);
    const out = {};
    for (const r of db.prepare(sql).all(...params)) out[r.id] = JSON.parse(r.data_json);
    return out;
  }
  const all = jsonReadFile('politicians');
  return Object.fromEntries(Object.entries(all).filter(([_, p]) => {
    if (party && p.party !== party) return false;
    if (state && p.state !== state) return false;
    if (position && p.position !== position) return false;
    return true;
  }).slice(0, limit));
}

function setVerification(v) {
  const now = Date.now();
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO verifications (politician_id, verified, method, domain, email, verified_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(politician_id) DO UPDATE SET
        verified = excluded.verified, method = excluded.method,
        domain = excluded.domain, email = excluded.email, verified_at = excluded.verified_at
    `).run(v.politicianId, v.verified ? 1 : 0, v.method || 'domain', v.domain || null, v.email || null, now);
    return;
  }
  const all = jsonReadFile('verifications');
  all[v.politicianId] = { ...v, verified_at: now };
  jsonWriteFile('verifications', all);
}

function getVerification(politicianId) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM verifications WHERE politician_id = ?').get(politicianId);
    if (!r) return { verified: false };
    return { politicianId: r.politician_id, verified: !!r.verified, method: r.method, domain: r.domain, email: r.email, verifiedAt: r.verified_at };
  }
  return jsonReadFile('verifications')[politicianId] || { verified: false };
}

function getAllVerifications() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const out = {};
    for (const r of db.prepare('SELECT * FROM verifications').all()) {
      out[r.politician_id] = { politicianId: r.politician_id, verified: !!r.verified, method: r.method, domain: r.domain, email: r.email, verifiedAt: r.verified_at };
    }
    return out;
  }
  return jsonReadFile('verifications');
}

function getVerifiedPoliticians() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const out = {};
    for (const r of db.prepare('SELECT * FROM verifications WHERE verified = 1').all()) {
      const p = db.prepare('SELECT * FROM politicians WHERE id = ?').get(r.politician_id);
      if (p) out[r.politician_id] = JSON.parse(p.data_json);
      else {
        const cache = loadFromCache();
        if (cache[r.politician_id]) out[r.politician_id] = cache[r.politician_id];
      }
    }
    return out;
  }
  const vers = jsonReadFile('verifications');
  const pols = jsonReadFile('politicians');
  const out = {};
  for (const [id, v] of Object.entries(vers)) {
    if (v.verified && pols[id]) out[id] = pols[id];
  }
  return out;
}

function createComplaint(c) {
  const now = Date.now();
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO complaints (id, politician_id, voter_hash, voter_ip, content, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, c.politicianId, c.voterHash, c.voterIp || null, c.content, c.status || 'open', now, now);
    return;
  }
  const all = jsonReadFile('complaints');
  all[c.id] = { ...c, createdAt: now, updatedAt: now };
  jsonWriteFile('complaints', all);
}

function getComplaint(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    if (!r) return null;
    return { id: r.id, politicianId: r.politician_id, voterHash: r.voter_hash, voterIp: r.voter_ip, content: r.content, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at };
  }
  return jsonReadFile('complaints')[id] || null;
}

function getComplaintsByPolitician(politicianId, { limit = 50, offset = 0, status } = {}) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    let sql = 'SELECT * FROM complaints WHERE politician_id = ?';
    const params = [politicianId];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'; params.push(limit, offset);
    return db.prepare(sql).all(...params).map(r => ({ id: r.id, politicianId: r.politician_id, voterHash: r.voter_hash, voterIp: r.voter_ip, content: r.content, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at }));
  }
  let list = Object.values(jsonReadFile('complaints')).filter(c => c.politicianId === politicianId);
  if (status) list = list.filter(c => c.status === status);
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(offset, offset + limit);
}

function countComplaintsByPolitician(politicianId) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    return db.prepare('SELECT COUNT(*) AS n FROM complaints WHERE politician_id = ?').get(politicianId).n;
  }
  return Object.values(jsonReadFile('complaints')).filter(c => c.politicianId === politicianId).length;
}

function getAllComplaints({ limit = 100, offset = 0 } = {}) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    return db.prepare('SELECT * FROM complaints ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset).map(r => ({ id: r.id, politicianId: r.politician_id, voterHash: r.voter_hash, voterIp: r.voter_ip, content: r.content, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at }));
  }
  const list = Object.values(jsonReadFile('complaints')).sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(offset, offset + limit);
}

function createSupport(s) {
  const now = Date.now();
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO supports (id, politician_id, voter_hash, voter_ip, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(s.id, s.politicianId, s.voterHash, s.voterIp || null, s.content, now);
    return;
  }
  const all = jsonReadFile('supports');
  all[s.id] = { ...s, createdAt: now };
  jsonWriteFile('supports', all);
}

function getSupportsByPolitician(politicianId, { limit = 50, offset = 0 } = {}) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    return db.prepare('SELECT * FROM supports WHERE politician_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(politicianId, limit, offset).map(r => ({ id: r.id, politicianId: r.politician_id, voterHash: r.voter_hash, voterIp: r.voter_ip, content: r.content, createdAt: r.created_at }));
  }
  let list = Object.values(jsonReadFile('supports')).filter(s => s.politicianId === politicianId);
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(offset, offset + limit);
}

function countSupportsByPolitician(politicianId) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    return db.prepare('SELECT COUNT(*) AS n FROM supports WHERE politician_id = ?').get(politicianId).n;
  }
  return Object.values(jsonReadFile('supports')).filter(s => s.politicianId === politicianId).length;
}

function getAllSupports({ limit = 100, offset = 0 } = {}) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    return db.prepare('SELECT * FROM supports ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset).map(r => ({ id: r.id, politicianId: r.politician_id, voterHash: r.voter_hash, voterIp: r.voter_ip, content: r.content, createdAt: r.created_at }));
  }
  const list = Object.values(jsonReadFile('supports')).sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(offset, offset + limit);
}

function createResponse(r) {
  const now = Date.now();
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO responses (id, complaint_id, politician_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(r.id, r.complaintId, r.politicianId, r.content, now);
    db.prepare('UPDATE complaints SET status = ?, updated_at = ? WHERE id = ?').run('responded', now, r.complaintId);
    return;
  }
  const all = jsonReadFile('responses');
  all[r.id] = { ...r, createdAt: now };
  jsonWriteFile('responses', all);
  const complaints = jsonReadFile('complaints');
  if (complaints[r.complaintId]) { complaints[r.complaintId].status = 'responded'; complaints[r.complaintId].updatedAt = now; jsonWriteFile('complaints', complaints); }
}

function getResponseByComplaint(complaintId) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM responses WHERE complaint_id = ?').get(complaintId);
    if (!r) return null;
    return { id: r.id, complaintId: r.complaint_id, politicianId: r.politician_id, content: r.content, createdAt: r.created_at };
  }
  return Object.values(jsonReadFile('responses')).find(r => r.complaintId === complaintId) || null;
}

function getResponsesByPolitician(politicianId, { limit = 50, offset = 0 } = {}) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    return db.prepare('SELECT * FROM responses WHERE politician_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(politicianId, limit, offset).map(r => ({ id: r.id, complaintId: r.complaint_id, politicianId: r.politician_id, content: r.content, createdAt: r.created_at }));
  }
  let list = Object.values(jsonReadFile('responses')).filter(r => r.politicianId === politicianId);
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(offset, offset + limit);
}

function hashVoter(method, identifier) {
  return require('crypto').createHash('sha256').update(method + ':' + identifier + ':MUDABRASIL_VOTER_SALT_2026').digest('hex');
}

function upsertVoter(v) {
  const now = Date.now();
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO voters (id, method, google_id, phone, email, name, photo, voter_hash, verified_at, created_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        method = excluded.method, google_id = excluded.google_id, phone = excluded.phone,
        email = excluded.email, name = excluded.name, photo = excluded.photo,
        voter_hash = excluded.voter_hash, verified_at = excluded.verified_at, last_login_at = excluded.last_login_at
    `).run(v.id, v.method, v.googleId || null, v.phone || null, v.email || null, v.name || null, v.photo || null, v.voterHash || null, v.verifiedAt || now, v.createdAt || now, now);
    return;
  }
  const all = jsonReadFile('voters');
  all[v.id] = { ...v, createdAt: v.createdAt || now, lastLoginAt: now };
  jsonWriteFile('voters', all);
}

function getVoterById(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM voters WHERE id = ?').get(id);
    if (!r) return null;
    return { id: r.id, method: r.method, googleId: r.google_id, phone: r.phone, email: r.email, name: r.name, photo: r.photo, voterHash: r.voter_hash, verifiedAt: r.verified_at, createdAt: r.created_at, lastLoginAt: r.last_login_at };
  }
  return jsonReadFile('voters')[id] || null;
}

function getVoterByGoogleId(googleId) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM voters WHERE google_id = ?').get(googleId);
    if (!r) return null;
    return { id: r.id, method: r.method, googleId: r.google_id, phone: r.phone, email: r.email, name: r.name, photo: r.photo, voterHash: r.voter_hash, verifiedAt: r.verified_at, createdAt: r.created_at, lastLoginAt: r.last_login_at };
  }
  return Object.values(jsonReadFile('voters')).find(v => v.googleId === googleId) || null;
}

function getVoterByPhone(phone) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM voters WHERE phone = ?').get(phone);
    if (!r) return null;
    return { id: r.id, method: r.method, googleId: r.google_id, phone: r.phone, email: r.email, name: r.name, photo: r.photo, voterHash: r.voter_hash, verifiedAt: r.verified_at, createdAt: r.created_at, lastLoginAt: r.last_login_at };
  }
  return Object.values(jsonReadFile('voters')).find(v => v.phone === phone) || null;
}

function getVoterByHash(voterHash) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM voters WHERE voter_hash = ?').get(voterHash);
    if (!r) return null;
    return { id: r.id, method: r.method, googleId: r.google_id, phone: r.phone, email: r.email, name: r.name, photo: r.photo, voterHash: r.voter_hash, verifiedAt: r.verified_at, createdAt: r.created_at, lastLoginAt: r.last_login_at };
  }
  return Object.values(jsonReadFile('voters')).find(v => v.voterHash === voterHash) || null;
}

function getVoterByEmail(email) {
  const emailStr = String(email || '').trim().toLowerCase();
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM voters WHERE email = ?').get(emailStr);
    if (!r) return null;
    return { id: r.id, method: r.method, googleId: r.google_id, phone: r.phone, email: r.email, name: r.name, photo: r.photo, voterHash: r.voter_hash, verifiedAt: r.verified_at, createdAt: r.created_at, lastLoginAt: r.last_login_at };
  }
  return Object.values(jsonReadFile('voters')).find(v => v.email === emailStr) || null;
}

function close() {
  if (BACKEND === 'sqlite' && db) { try { db.close(); } catch (_) {} }
  db = null; inited = false;
}

function backend() { return BACKEND; }
function file() { return BACKEND === 'sqlite' ? VOTOS_DB : VOTOS_FILE; }

const rowToPl = r => ({
  id: r.id, number: r.number, year: r.year, author: r.author, party: r.party,
  title: r.title, ementa: r.ementa, status: r.status, chamber: r.chamber,
  approvalCount: r.approval_count, rejectionCount: r.rejection_count,
  updatedAt: r.updated_at
});
const UPSERT_PL_SQL = `
  INSERT INTO pls (id, number, year, author, party, title, ementa, status, chamber, approval_count, rejection_count, data_json, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    number=excluded.number, year=excluded.year, author=excluded.author, party=excluded.party,
    title=excluded.title, ementa=excluded.ementa, status=excluded.status, chamber=excluded.chamber,
    data_json=excluded.data_json, updated_at=excluded.updated_at`;
const plParams = p => [
  p.id, p.number, p.year || new Date().getFullYear(),
  p.author || null, p.party || null, p.title || null, p.ementa || null,
  p.status || 'Tramitando', p.chamber || 'Câmara',
  p.approvalCount || 0, p.rejectionCount || 0,
  p.data ? JSON.stringify(p.data) : null,
  Date.now()
];

function upsertPl(p) {
  if (BACKEND === 'sqlite') { openSqlite(); db.prepare(UPSERT_PL_SQL).run(...plParams(p)); return; }
  const all = jsonReadFile('pls'); all[p.id] = p; jsonWriteFile('pls', all);
}

function getPl(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM pls WHERE id = ?').get(id);
    return r ? rowToPl(r) : null;
  }
  return jsonReadFile('pls')[id] || null;
}

function readAllPls() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const out = {};
    for (const r of db.prepare('SELECT * FROM pls ORDER BY year DESC, number DESC').all()) out[r.id] = rowToPl(r);
    return out;
  }
  return jsonReadFile('pls');
}

function getPlsByFilters({ search, party, chamber, limit = 200 } = {}) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    let sql = 'SELECT * FROM pls WHERE 1=1';
    const params = [];
    if (search) { sql += ' AND (number LIKE ? OR title LIKE ? OR author LIKE ? OR ementa LIKE ?)';
      const q = '%' + search + '%'; params.push(q, q, q, q); }
    if (party) { sql += ' AND party = ?'; params.push(party); }
    if (chamber) { sql += ' AND chamber = ?'; params.push(chamber); }
    sql += ' ORDER BY year DESC, number DESC LIMIT ?'; params.push(limit);
    const out = {};
    for (const r of db.prepare(sql).all(...params)) out[r.id] = rowToPl(r);
    return out;
  }
  const all = jsonReadFile('pls');
  return Object.fromEntries(Object.entries(all).filter(([_, p]) => {
    if (party && p.party !== party) return false;
    if (chamber && p.chamber !== chamber) return false;
    if (search) { const s = search.toLowerCase();
      return (p.number||'').toLowerCase().includes(s) || (p.title||'').toLowerCase().includes(s) ||
        (p.author||'').toLowerCase().includes(s) || (p.ementa||'').toLowerCase().includes(s); }
    return true;
  }).slice(0, limit));
}

function castPlVote(plId, voterHash, vote) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const id = 'plv-' + plId + '-' + voterHash.slice(0, 8);
    const existing = db.prepare('SELECT * FROM pl_votes WHERE pl_id = ? AND voter_hash = ?').get(plId, voterHash);
    const previousVote = existing ? existing.vote : null;
    if (existing) {
      db.prepare('UPDATE pl_votes SET vote = ? WHERE pl_id = ? AND voter_hash = ?').run(vote, plId, voterHash);
    } else {
      db.prepare('INSERT INTO pl_votes (id, pl_id, voter_hash, vote, created_at) VALUES (?, ?, ?, ?, ?)').run(id, plId, voterHash, vote, Date.now());
    }
    if (previousVote !== 'aprovo') {
      if (vote === 'aprovo') db.prepare('UPDATE pls SET approval_count = approval_count + 1 WHERE id = ?').run(plId);
    }
    if (previousVote === 'aprovo' && vote !== 'aprovo') {
      db.prepare('UPDATE pls SET approval_count = MAX(0, approval_count - 1) WHERE id = ?').run(plId);
    }
    if (previousVote !== 'nao_aprovo') {
      if (vote === 'nao_aprovo') db.prepare('UPDATE pls SET rejection_count = rejection_count + 1 WHERE id = ?').run(plId);
    }
    if (previousVote === 'nao_aprovo' && vote !== 'nao_aprovo') {
      db.prepare('UPDATE pls SET rejection_count = MAX(0, rejection_count - 1) WHERE id = ?').run(plId);
    }
    return { ok: true, plId, vote, previousVote };
  }
  const all = jsonReadFile('pl_votes') || {};
  const key = plId + '|' + voterHash;
  const previousVote = all[key] ? all[key].vote : null;
  all[key] = { plId, voterHash, vote, createdAt: Date.now() };
  jsonWriteFile('pl_votes', all);
  const pls = jsonReadFile('pls');
  if (pls[plId]) {
    if (previousVote !== 'aprovo' && vote === 'aprovo') pls[plId].approvalCount = (pls[plId].approvalCount || 0) + 1;
    if (previousVote === 'aprovo' && vote !== 'aprovo') pls[plId].approvalCount = Math.max(0, (pls[plId].approvalCount || 0) - 1);
    if (previousVote !== 'nao_aprovo' && vote === 'nao_aprovo') pls[plId].rejectionCount = (pls[plId].rejectionCount || 0) + 1;
    if (previousVote === 'nao_aprovo' && vote !== 'nao_aprovo') pls[plId].rejectionCount = Math.max(0, (pls[plId].rejectionCount || 0) - 1);
    jsonWriteFile('pls', pls);
  }
  return { ok: true, plId, vote, previousVote };
}

function getPlVoteForVoter(plId, voterHash) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT vote FROM pl_votes WHERE pl_id = ? AND voter_hash = ?').get(plId, voterHash);
    return r ? r.vote : null;
  }
  const all = jsonReadFile('pl_votes') || {};
  const r = all[plId + '|' + voterHash];
  return r ? r.vote : null;
}

function generateVoteCode(voterHash) {
  const code = Array.from({ length: 5 }, () => String(Math.floor(1000 + Math.random() * 9000))).join('');
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('INSERT INTO vote_codes (code, voter_hash, used, created_at) VALUES (?, ?, 0, ?)').run(code, voterHash, Date.now());
  } else {
    const all = jsonReadFile('vote_codes') || {};
    all[code] = { voterHash, used: 0, createdAt: Date.now() };
    jsonWriteFile('vote_codes', all);
  }
  return code;
}

function getVoteCodesForVoter(voterHash) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    return db.prepare('SELECT * FROM vote_codes WHERE voter_hash = ? ORDER BY created_at DESC').all(voterHash)
      .map(r => ({ code: r.code, used: !!r.used, createdAt: r.created_at }));
  }
  const all = jsonReadFile('vote_codes') || {};
  return Object.values(all).filter(c => c.voterHash === voterHash)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function verifyVoteCode(code) {
  if (!/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(code.replace(/\s/g, ''))) return null;
  const clean = code.replace(/\s/g, '');
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM vote_codes WHERE code = ?').get(clean);
    if (!r) return null;
    return { voterHash: r.voter_hash, used: !!r.used, createdAt: r.created_at, ballots: [] };
  }
  const all = jsonReadFile('vote_codes') || {};
  return all[clean] || null;
}

function markCodeUsed(code) {
  const clean = code.replace(/\s/g, '');
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('UPDATE vote_codes SET used = 1 WHERE code = ?').run(clean);
  } else {
    const all = jsonReadFile('vote_codes') || {};
    if (all[clean]) { all[clean].used = 1; jsonWriteFile('vote_codes', all); }
  }
}

function getRevokedStats() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const rows = db.prepare(`
      SELECT
        p.id, p.name, p.party, p.state, p.position, p.photo,
        SUM(CASE WHEN b.revoked = 0 THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN b.revoked = 1 THEN 1 ELSE 0 END) AS revoked,
        COUNT(b.id) AS total
      FROM politicians p
      LEFT JOIN ballots b ON b.politician_id = p.id
      GROUP BY p.id
      HAVING revoked > 0
      ORDER BY revoked DESC, active DESC
      LIMIT 50
    `).all();
    return rows.map(r => ({
      id: r.id, name: r.name, party: r.party, state: r.state,
      position: r.position, photo: r.photo,
      activeVotes: r.active || 0, revokedVotes: r.revoked || 0,
      totalVotes: r.total || 0,
      cassationThreshold: Math.ceil((r.total || 0) * 0.7),
      progressToCassation: r.total > 0 ? Math.min(100, Math.round(((r.revoked || 0) / Math.max(1, Math.ceil(r.total * 0.7))) * 100)) : 0
    }));
  }
  const ballots = jsonReadFile('ballots');
  const politicians = jsonReadFile('politicians');
  const out = {};
  for (const b of Object.values(ballots)) {
    if (!out[b.politicianId]) out[b.politicianId] = { id: b.politicianId, activeVotes: 0, revokedVotes: 0, totalVotes: 0 };
    if (b.revoked) out[b.politicianId].revokedVotes++;
    else out[b.politicianId].activeVotes++;
    out[b.politicianId].totalVotes++;
  }
  return Object.values(out)
    .filter(x => x.revokedVotes > 0)
    .map(x => {
      const p = politicians[x.id] || {};
      return {
        ...x, name: p.name, party: p.party, state: p.state, position: p.position, photo: p.photo,
        cassationThreshold: Math.ceil(x.totalVotes * 0.7),
        progressToCassation: x.totalVotes > 0 ? Math.min(100, Math.round((x.revokedVotes / Math.max(1, Math.ceil(x.totalVotes * 0.7))) * 100)) : 0
      };
    })
    .sort((a, b) => b.revokedVotes - a.revokedVotes || b.activeVotes - a.activeVotes)
    .slice(0, 50);
}

function getPoliticianFullDetails(id) {
  const p = getPolitician(id);
  if (!p) return null;
  return {
    ...p,
    sources: {
      tse: { name: 'TSE', data: 'Registro de candidatura, histórico eleitoral, condenações, votos', link: 'https://www.tse.jus.br/' },
      portalTransparencia: { name: 'Portal da Transparência', data: 'Rendimentos, patrimônio declarado, gastos', link: 'https://portaldatransparencia.gov.br/' },
      camaraSenado: {
        name: p.position && p.position.toLowerCase().includes('senador') ? 'Senado' : 'Câmara',
        data: 'Proposituras autorais, votação nominal, presença em sessões',
        link: p.position && p.position.toLowerCase().includes('senador') ? 'https://www25.senado.leg.br/web/senadores/' : 'https://www.camara.leg.br/deputados/quem-e-quem'
      },
      cnj: { name: 'CNJ', data: 'Processos judiciais, status de ações, condenações', link: 'https://www.cnj.jus.br/' }
    }
  };
}

module.exports = {
  init, close, backend, file,
  getBallot, upsertBallot, readAllBallots, countBallots, clearBallots, importAllBallots,
  upsertPolitician, getPolitician, getAllPoliticians, getPoliticiansByFilters, getPoliticianFullDetails,
  setVerification, getVerification, getAllVerifications, getVerifiedPoliticians,
  createComplaint, getComplaint, getComplaintsByPolitician, countComplaintsByPolitician, getAllComplaints,
  createSupport, getSupportsByPolitician, countSupportsByPolitician, getAllSupports,
  createResponse, getResponseByComplaint, getResponsesByPolitician,
  hashVoter, upsertVoter, getVoterById, getVoterByGoogleId, getVoterByPhone, getVoterByHash, getVoterByEmail,
  upsertPl, getPl, readAllPls, getPlsByFilters, castPlVote, getPlVoteForVoter,
  generateVoteCode, getVoteCodesForVoter, verifyVoteCode, markCodeUsed,
  getRevokedStats,
  VOTOS_DB, VOTOS_FILE
};
