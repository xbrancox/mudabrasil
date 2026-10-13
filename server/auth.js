/* ============================================================
   MEUVOTO - AUTENTICACAO DE ELEITORES
   ------------------------------------------------------------
   Login via Google OAuth 2.0, Telefone (SMS OTP) ou E-mail (OTP).
   Sem Gov.br - apenas identificacao basica.
   Modo dev aceita tokens "google:email:nome" e OTP retornado.
   
   PERSISTÊNCIA: Sessões e OTPs agora são armazenados no SQLite
   (ou JSON como fallback), sobrevivendo a restarts do servidor.
   
   E-MAIL: Integração real com nodemailer (SMTP) em produção.
   ============================================================ */

const crypto = require('crypto');
const db = require('./db');
const dbAuth = require('./db_auth');
const mailer = require('./mailer');

const AUTH_MODE = process.env.NODE_ENV === 'production' ? 'prod' : (process.env.MB_AUTH_MODE || 'dev');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE = process.env.TWILIO_PHONE || '';

// Limpeza periódica de sessões e OTPs expirados (a cada 1 hora)
setInterval(() => {
  try {
    dbAuth.cleanExpiredSessions();
    dbAuth.cleanExpiredOtps();
  } catch (e) {
    console.error('[auth] Falha na limpeza periódica:', e.message);
  }
}, 60 * 60 * 1000);

async function verifyGoogleToken(idToken) {
  const isDev = (AUTH_MODE === 'dev' && process.env.NODE_ENV !== 'production');
  if (isDev || !GOOGLE_CLIENT_ID) {
    if (typeof idToken === 'string' && idToken.startsWith('google:')) {
      const rest = idToken.slice(7);
      const parts = rest.split(':');
      const email = parts[0] || 'dev@local';
      const name = parts[1] || email.split('@')[0];
      return {
        sub: 'dev-' + crypto.createHash('md5').update(email).digest('hex').slice(0, 12),
        email: email,
        name: name,
        picture: null
      };
    }
    throw new Error('Token invalido (modo dev: use "google:email:nome")');
  }
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken: idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return { sub: payload.sub, email: payload.email, name: payload.name, picture: payload.picture };
}

async function loginWithGoogle(idToken, userAgent, ipAddress) {
  const profile = await verifyGoogleToken(idToken);
  let voter = db.getVoterByGoogleId(profile.sub);
  if (!voter) {
    const id = 'voter-' + crypto.randomBytes(8).toString('hex');
    const voterHash = db.hashVoter('google', profile.sub);
    voter = {
      id: id, method: 'google', googleId: profile.sub, phone: null,
      email: profile.email, name: profile.name || null, photo: profile.picture || null,
      voterHash: voterHash, verifiedAt: Date.now(), createdAt: Date.now()
    };
    db.upsertVoter(voter);
  } else {
    db.upsertVoter(voter);
  }
  const sessionToken = generateSessionToken(voter, userAgent, ipAddress);
  return {
    ok: true,
    voter: { id: voter.id, method: voter.method, name: voter.name, email: voter.email, photo: voter.photo, voterHash: voter.voterHash },
    sessionToken: sessionToken
  };
}

async function sendOtp(phone) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 13) {
    throw new Error('Telefone invalido. Use: 11999999999 ou 5511999999999');
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos
  
  // Persistir OTP no banco
  const otpRecord = dbAuth.createOtp('sms', cleanPhone, code, expiresAt);
  
  if (AUTH_MODE === 'prod' && TWILIO_ACCOUNT_SID) {
    try {
      const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await twilio.messages.create({
        body: '[MeuVoto] Seu codigo: ' + code + '. Valido por 5 min.',
        from: TWILIO_PHONE, to: '+' + cleanPhone
      });
    } catch (e) {
      throw new Error('Falha ao enviar SMS. Tente novamente.');
    }
  }
  return {
    ok: true, phone: cleanPhone, expiresIn: 300,
    devCode: AUTH_MODE === 'dev' ? code : undefined,
    message: AUTH_MODE === 'dev' ? 'MODO DEV: codigo = ' + code : 'Codigo enviado por SMS'
  };
}

async function verifyOtp(phone, code) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const entry = dbAuth.getOtp('sms', cleanPhone);
  if (!entry) throw new Error('Codigo nao encontrado. Solicite um novo.');
  if (Date.now() > entry.expiresAt) { dbAuth.deleteOtp(entry.id); throw new Error('Codigo expirado. Solicite um novo.'); }
  if (entry.attempts >= 5) { dbAuth.deleteOtp(entry.id); throw new Error('Muitas tentativas. Solicite um novo codigo.'); }
  if (entry.code !== String(code).trim()) { dbAuth.incrementOtpAttempts(entry.id); throw new Error('Codigo incorreto.'); }
  
  // OTP válido, marcar como usado
  dbAuth.markOtpUsed(entry.id);
  
  let voter = db.getVoterByPhone(cleanPhone);
  if (!voter) {
    const id = 'voter-' + crypto.randomBytes(8).toString('hex');
    const voterHash = db.hashVoter('phone', cleanPhone);
    voter = {
      id: id, method: 'phone', googleId: null, phone: cleanPhone, email: null, name: null, photo: null,
      voterHash: voterHash, verifiedAt: Date.now(), createdAt: Date.now()
    };
    db.upsertVoter(voter);
  } else {
    db.upsertVoter(voter);
  }
  const sessionToken = generateSessionToken(voter);
  return {
    ok: true,
    voter: { id: voter.id, method: voter.method, name: voter.name, phone: voter.phone, photo: voter.photo, voterHash: voter.voterHash },
    sessionToken: sessionToken
  };
}

async function sendEmailOtp(email, userAgent, ipAddress) {
  const emailStr = String(email).trim().toLowerCase();
  if (!emailStr.includes('@') || !emailStr.includes('.')) {
    throw new Error('E-mail inválido.');
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos
  
  // Persistir OTP no banco
  const otpRecord = dbAuth.createOtp('email', emailStr, code, expiresAt);
  
  // Enviar email real via nodemailer (fire-and-forget para não bloquear HTTP)
  mailer.sendOtpEmail(emailStr, code, 10)
    .then(() => console.log('[auth] E-mail OTP enviado para ' + emailStr))
    .catch(e => {
      console.error('[auth] Falha ao enviar e-mail OTP:', e.message);
      if (AUTH_MODE === 'dev') {
        console.log('[auth] MODO DEV - E-mail OTP não enviado (SMTP não configurado): ' + code);
      }
    });
  
  return {
    ok: true,
    email: emailStr,
    expiresIn: 600,
    devCode: AUTH_MODE === 'dev' ? code : undefined,
    message: AUTH_MODE === 'dev' ? 'MODO DEV: código = ' + code : 'Código enviado para seu e-mail'
  };
}

async function verifyEmailOtp(email, code, userAgent, ipAddress) {
  const emailStr = String(email).trim().toLowerCase();
  const entry = dbAuth.getOtp('email', emailStr);
  if (!entry) throw new Error('Código não encontrado. Solicite um novo.');
  if (Date.now() > entry.expiresAt) { dbAuth.deleteOtp(entry.id); throw new Error('Código expirado. Solicite um novo.'); }
  if (entry.attempts >= 5) { dbAuth.deleteOtp(entry.id); throw new Error('Muitas tentativas. Solicite um novo código.'); }
  if (entry.code !== String(code).trim()) { dbAuth.incrementOtpAttempts(entry.id); throw new Error('Código incorreto.'); }
  
  // OTP válido, marcar como usado
  dbAuth.markOtpUsed(entry.id);
  
  let voter = db.getVoterByEmail(emailStr);
  if (!voter) {
    const id = 'voter-' + crypto.randomBytes(8).toString('hex');
    const voterHash = db.hashVoter('email', emailStr);
    voter = { id: id, method: 'email', googleId: null, phone: null, email: emailStr, name: null, photo: null, voterHash: voterHash, verifiedAt: Date.now(), createdAt: Date.now() };
    db.upsertVoter(voter);
  } else { db.upsertVoter(voter); }
  const sessionToken = generateSessionToken(voter, userAgent, ipAddress);
  return { ok: true, voter: { id: voter.id, method: voter.method, name: voter.name, email: voter.email, voterHash: voter.voterHash }, sessionToken: sessionToken };
}

async function register(email, name, phone, userAgent, ipAddress) {
  const emailStr = email ? String(email).trim().toLowerCase() : null;
  if (emailStr && (!emailStr.includes('@') || !emailStr.includes('.'))) throw new Error('E-mail inválido.');
  const id = 'voter-' + crypto.randomBytes(8).toString('hex');
  const voterHash = db.hashVoter('email', emailStr || 'anon-' + id);
  const voter = { id: id, method: emailStr ? 'email' : 'anon', googleId: null, phone: phone ? String(phone).replace(/\D/g, '') : null, email: emailStr, name: name || null, photo: null, voterHash: voterHash, verifiedAt: Date.now(), createdAt: Date.now() };
  db.upsertVoter(voter);
  const sessionToken = generateSessionToken(voter, userAgent, ipAddress);
  return { ok: true, voter: { id: voter.id, method: voter.method, name: voter.name, email: voter.email, phone: voter.phone, voterHash: voter.voterHash }, sessionToken: sessionToken };
}

function generateSessionToken(voter, userAgent, ipAddress) {
  const token = crypto.randomBytes(32).toString('hex');
  // Persistir sessão no banco
  dbAuth.createSession(token, voter.id, userAgent, ipAddress);
  return token;
}

function getVoterFromToken(token) {
  if (!token) return null;
  const session = dbAuth.getSession(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) { dbAuth.deleteSession(token); return null; }
  return db.getVoterById(session.voterId);
}

function logout(token) { dbAuth.deleteSession(token); }

module.exports = {
  verifyGoogleToken, loginWithGoogle,
  sendOtp, verifyOtp,
  sendEmailOtp, verifyEmailOtp,
  register,
  generateSessionToken, getVoterFromToken, logout,
  AUTH_MODE
};
