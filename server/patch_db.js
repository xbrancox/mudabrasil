// Script para adicionar tabelas de auth no db.js
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'db.js');
let content = fs.readFileSync(dbFile, 'utf8');

const insertAfter = 'CREATE INDEX IF NOT EXISTS idx_society_pl_invites_target ON society_pl_invites(target_id);';
const newTables = `

    /* ===== AUTENTICAÇÃO: Sessões e OTP (Email/SMS) ===== */
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token           TEXT PRIMARY KEY,
      voter_id        TEXT NOT NULL,
      expires_at      INTEGER NOT NULL,
      created_at      INTEGER NOT NULL,
      user_agent      TEXT,
      ip_address      TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_voter ON auth_sessions(voter_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);

    CREATE TABLE IF NOT EXISTS auth_otp (
      id              TEXT PRIMARY KEY,
      type            TEXT NOT NULL,
      target          TEXT NOT NULL,
      code            TEXT NOT NULL,
      expires_at      INTEGER NOT NULL,
      attempts        INTEGER NOT NULL DEFAULT 0,
      used            INTEGER NOT NULL DEFAULT 0,
      created_at      INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_auth_otp_target ON auth_otp(target, type);
    CREATE INDEX IF NOT EXISTS idx_auth_otp_expires ON auth_otp(expires_at);`;

if (content.includes(insertAfter) && !content.includes('auth_sessions')) {
  content = content.replace(insertAfter, insertAfter + newTables);
  fs.writeFileSync(dbFile, content);
  console.log('✅ Tabelas auth_sessions e auth_otp adicionadas ao db.js');
} else if (content.includes('auth_sessions')) {
  console.log('ℹ️  Tabelas já existem no db.js');
} else {
  console.error('❌ Marcador não encontrado no db.js');
}
