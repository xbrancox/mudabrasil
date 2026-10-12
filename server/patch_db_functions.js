// Script para adicionar funções CRUD de auth no db.js
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'db.js');
let content = fs.readFileSync(dbFile, 'utf8');

// Inserir antes do "module.exports"
const insertBefore = 'module.exports = {';
const newFunctions = `
/* ===== AUTENTICAÇÃO: Sessões e OTP (Email/SMS) ===== */

function createSession(session) {
  const now = Date.now();
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO auth_sessions (token, voter_id, expires_at, created_at, user_agent, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(session.token, session.voterId, session.expiresAt, now, session.userAgent || null, session.ipAddress || null);
    return;
  }
  // Fallback JSON não implementado para auth (requer SQLite)
  throw new Error('Autenticação requer SQLite');
}

function getSession(token) {
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
  return null;
}

function deleteSession(token) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
  }
}

function deleteSessionsByVoter(voterId) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('DELETE FROM auth_sessions WHERE voter_id = ?').run(voterId);
  }
}

function cleanupExpiredSessions() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('DELETE FROM auth_sessions WHERE expires_at < ?').run(Date.now());
    return r.changes || 0;
  }
  return 0;
}

function createOtp(otp) {
  const now = Date.now();
  const id = 'otp-' + crypto.randomBytes(8).toString('hex');
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare(`
      INSERT INTO auth_otp (id, type, target, code, expires_at, attempts, used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, otp.type, otp.target, otp.code, otp.expiresAt, otp.attempts || 0, otp.used || 0, now);
    return id;
  }
  throw new Error('OTP requer SQLite');
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
  return null;
}

function incrementOtpAttempts(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('UPDATE auth_otp SET attempts = attempts + 1 WHERE id = ?').run(id);
  }
}

function markOtpUsed(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('UPDATE auth_otp SET used = 1 WHERE id = ?').run(id);
  }
}

function deleteOtp(id) {
  if (BACKEND === 'sqlite') {
    openSqlite();
    db.prepare('DELETE FROM auth_otp WHERE id = ?').run(id);
  }
}

function cleanupExpiredOtps() {
  if (BACKEND === 'sqlite') {
    openSqlite();
    const r = db.prepare('DELETE FROM auth_otp WHERE expires_at < ?').run(Date.now());
    return r.changes || 0;
  }
  return 0;
}

`;

if (content.includes(insertBefore) && !content.includes('createSession')) {
  content = content.replace(insertBefore, newFunctions + insertBefore);
  fs.writeFileSync(dbFile, content);
  console.log('✅ Funções CRUD de auth adicionadas ao db.js');
} else if (content.includes('createSession')) {
  console.log('ℹ️  Funções já existem no db.js');
} else {
  console.error('❌ Marcador não encontrado no db.js');
}
