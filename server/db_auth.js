/* ============================================================
   MEUVOTO — AUTH STORAGE LAYER (Sessões + OTP)
   ------------------------------------------------------------
   Camada de armazenamento para autenticação persistente
   (Sessões, Email OTP, SMS OTP)
   ============================================================ */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, 'data');
const VOTOS_DB = process.env.DB_PATH || path.join(DATA_DIR, 'votos.db');
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

const JSON_FILES = {
  auth_sessions: path.join(DATA_DIR, 'auth_sessions.json'),
  auth_otp: path.join(DATA_DIR, 'auth_otp.json')
};

function ensureDir() { fs.mkdirSync(DATA_DIR, { recursive: true }); }

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
  inited = true;
}

function createSession(token, voterId, userAgent, ipAddress) {
  const now = Date.now();
  const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 dias
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO auth_sessions (token, voter_id, expires_at, created_at, user_agent, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(token, voterId, expiresAt, now, userAgent || null, ipAddress || null);
    return { token, voterId, expiresAt, createdAt: now };
  }
  const all = jsonReadFile('auth_sessions');
  all[token] = { token, voterId, expiresAt, createdAt: now, userAgent, ipAddress };
  jsonWriteFile('auth_sessions', all);
  return all[token];
}

function getSession(token) {
  if (!token) return null;
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM auth_sessions WHERE token = ?').get(token);
    if (!r) return null;
    if (Date.now() > r.expires_at) {
      db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
      return null;
    }
    return { token: r.token, voterId: r.voter_id, expiresAt: r.expires_at, createdAt: r.created_at, userAgent: r.user_agent, ipAddress: r.ip_address };
  }
  const all = jsonReadFile('auth_sessions');
  const session = all[token];
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    delete all[token];
    jsonWriteFile('auth_sessions', all);
    return null;
  }
  return session;
}

function deleteSession(token) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
    return;
  }
  const all = jsonReadFile('auth_sessions');
  delete all[token];
  jsonWriteFile('auth_sessions', all);
}

function deleteSessionsForVoter(voterId) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('DELETE FROM auth_sessions WHERE voter_id = ?').run(voterId);
    return;
  }
  const all = jsonReadFile('auth_sessions');
  for (const k of Object.keys(all)) {
    if (all[k].voterId === voterId) delete all[k];
  }
  jsonWriteFile('auth_sessions', all);
}

function cleanExpiredSessions() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('DELETE FROM auth_sessions WHERE expires_at < ?').run(Date.now());
    return Number(r.changes) || 0;
  }
  const all = jsonReadFile('auth_sessions');
  let n = 0;
  for (const k of Object.keys(all)) {
    if (Date.now() > all[k].expiresAt) { delete all[k]; n++; }
  }
  if (n) jsonWriteFile('auth_sessions', all);
  return n;
}

function createOtp(type, target, code, expiresAt) {
  const now = Date.now();
  const id = 'otp-' + type + '-' + target + '-' + now;
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO auth_otp (id, type, target, code, expires_at, attempts, used, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?)
    `).run(id, type, target, code, expiresAt, now);
    return { id, type, target, code, expiresAt, attempts: 0, used: 0, createdAt: now };
  }
  const all = jsonReadFile('auth_otp');
  all[id] = { id, type, target, code, expiresAt, attempts: 0, used: 0, createdAt: now };
  jsonWriteFile('auth_otp', all);
  return all[id];
}

function getOtp(type, target) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('SELECT * FROM auth_otp WHERE type = ? AND target = ? AND used = 0 ORDER BY created_at DESC LIMIT 1').get(type, target);
    if (!r) return null;
    if (Date.now() > r.expires_at) {
      db.prepare('DELETE FROM auth_otp WHERE id = ?').run(r.id);
      return null;
    }
    return { id: r.id, type: r.type, target: r.target, code: r.code, expiresAt: r.expires_at, attempts: r.attempts, used: !!r.used, createdAt: r.created_at };
  }
  const all = jsonReadFile('auth_otp');
  const valid = Object.values(all).filter(o => o.type === type && o.target === target && !o.used);
  if (!valid.length) return null;
  valid.sort((a, b) => b.createdAt - a.createdAt);
  const otp = valid[0];
  if (Date.now() > otp.expiresAt) {
    delete all[otp.id];
    jsonWriteFile('auth_otp', all);
    return null;
  }
  return otp;
}

function incrementOtpAttempts(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('UPDATE auth_otp SET attempts = attempts + 1 WHERE id = ?').run(id);
    return;
  }
  const all = jsonReadFile('auth_otp');
  if (all[id]) { all[id].attempts++; jsonWriteFile('auth_otp', all); }
}

function markOtpUsed(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('UPDATE auth_otp SET used = 1 WHERE id = ?').run(id);
    return;
  }
  const all = jsonReadFile('auth_otp');
  if (all[id]) { all[id].used = 1; jsonWriteFile('auth_otp', all); }
}

function deleteOtp(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('DELETE FROM auth_otp WHERE id = ?').run(id);
    return;
  }
  const all = jsonReadFile('auth_otp');
  delete all[id];
  jsonWriteFile('auth_otp', all);
}

function cleanExpiredOtps() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('DELETE FROM auth_otp WHERE expires_at < ?').run(Date.now());
    return Number(r.changes) || 0;
  }
  const all = jsonReadFile('auth_otp');
  let n = 0;
  for (const k of Object.keys(all)) {
    if (Date.now() > all[k].expiresAt) { delete all[k]; n++; }
  }
  if (n) jsonWriteFile('auth_otp', all);
  return n;
}

module.exports = {
  createSession, getSession, deleteSession, deleteSessionsForVoter, cleanExpiredSessions,
  createOtp, getOtp, incrementOtpAttempts, markOtpUsed, deleteOtp, cleanExpiredOtps,
  BACKEND
};
