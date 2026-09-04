/* ============================================================
   MUDABRASIL — VERIFICAÇÃO DE POLÍTICOS (SELO)
   ------------------------------------------------------------
   Verificação automática via domínio de e-mail institucional:
   - @camara.leg.br  (deputados federais)
   - @senado.leg.br  (senadores)
   - @senador.leg.br (senadores - alias)
   - @tse.jus.br     (Tribunal Superior Eleitoral)

   SEM GOV.BR (regra do fundador).
   Fluxo:
   1. Político (ou assessor) informa e-mail institucional
   2. Sistema gera token de confirmação
   3. E-mail é enviado com link de confirmação
   4. Ao confirmar, o selo é ativado
   ============================================================ */

const crypto = require('crypto');
const db = require('./db');
const nodemailer = require('nodemailer');

const AUTHORIZED_DOMAINS = [
  'camara.leg.br',
  'senado.leg.br',
  'senador.leg.br',
  'tse.jus.br'
];

const pendingVerifications = new Map();

// Email transporter (configurado via env vars)
let emailTransporter = null;
function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    console.warn('[verificacao] SMTP não configurado - e-mails serão logados apenas');
    return null;
  }
  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
  return emailTransporter;
}

function isAuthorizedDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const lower = email.toLowerCase().trim();
  const atIdx = lower.lastIndexOf('@');
  if (atIdx === -1) return null;
  const domain = lower.slice(atIdx + 1);
  for (const auth of AUTHORIZED_DOMAINS) {
    if (domain === auth) return auth;
  }
  return null;
}

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

async function sendVerificationEmail(email, token, politicianName, baseUrl) {
  const transporter = getEmailTransporter();
  const confirmUrl = `${baseUrl}/api/verificacao/confirmar?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #061a3a 0%, #115FCB 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #FFD700; margin: 0; font-size: 28px;">🇧🇷 MudaBrasil</h1>
        <p style="color: #fff; margin: 10px 0 0; opacity: 0.9;">Verificação de Identidade Política</p>
      </div>
      <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #061a3a; margin-top: 0;">Olá, ${politicianName}</h2>
        <p>Você (ou sua assessoria) solicitou a verificação de identidade no <strong>MudaBrasil</strong> para obter o selo de político verificado.</p>
        <p>Seu e-mail institucional <strong>${email}</strong> foi reconhecido como domínio autorizado.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmUrl}" style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #061a3a; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);">
            ✅ Confirmar e obter selo
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">Ou acesse diretamente: <a href="${confirmUrl}">${confirmUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="font-size: 12px; color: #999;">Este link expira em 24 horas. Se não solicitou esta verificação, ignore este e-mail.</p>
        <p style="font-size: 12px; color: #999;">MudaBrasil — Seu voto coloca. Seu voto tira.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    MudaBrasil - Verificação de Identidade Política
    
    Olá, ${politicianName}
    
    Você (ou sua assessoria) solicitou a verificação de identidade no MudaBrasil para obter o selo de político verificado.
    
    Seu e-mail institucional ${email} foi reconhecido como domínio autorizado.
    
    Para confirmar e obter o selo, acesse: ${confirmUrl}
    
    Este link expira em 24 horas. Se não solicitou esta verificação, ignore este e-mail.
    
    MudaBrasil — Seu voto coloca. Seu voto tira.
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MudaBrasil" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: '🇧🇷 MudaBrasil - Confirme seu e-mail para obter o selo de verificado',
        text,
        html
      });
      console.log('[verificacao] E-mail de verificação enviado para:', email);
      return { sent: true };
    } catch (e) {
      console.error('[verificacao] Falha ao enviar e-mail:', e.message);
      return { sent: false, error: e.message };
    }
  } else {
    // Dev mode: log the confirmation link
    console.log('[verificacao] MODO DEV - Link de confirmação:', confirmUrl);
    return { sent: false, devMode: true, confirmUrl };
  }
}

async function startVerification(politicianId, email, baseUrl) {
  const politician = db.getPolitician(politicianId);
  if (!politician) throw new Error('Político não encontrado: ' + politicianId);

  const normalized = normalizeEmail(email);
  const authDomain = isAuthorizedDomain(normalized);
  if (!authDomain) {
    throw new Error('Domínio não autorizado. Use: ' + AUTHORIZED_DOMAINS.join(', '));
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  pendingVerifications.set(token, {
    politicianId,
    email: normalized,
    domain: authDomain,
    expiresAt,
    politicianName: politician.name
  });

  const emailResult = await sendVerificationEmail(normalized, token, politician.name, baseUrl);

  return {
    ok: true,
    token,
    domain: authDomain,
    email: normalized,
    confirmationLink: `/api/verificacao/confirmar?token=${token}`,
    politicianName: politician.name,
    expiresAt,
    message: emailResult.sent 
      ? 'E-mail de confirmação enviado! Verifique sua caixa de entrada.'
      : (emailResult.devMode 
        ? 'MODO DEV: e-mail não enviado. Use o link de confirmação abaixo.'
        : 'E-mail não enviado (SMTP não configurado). Link de confirmação gerado.'),
    devConfirmUrl: emailResult.devMode ? emailResult.confirmUrl : undefined
  };
}

function confirmVerification(token) {
  const entry = pendingVerifications.get(token);
  if (!entry) throw new Error('Token inválido ou expirado.');
  if (Date.now() > entry.expiresAt) {
    pendingVerifications.delete(token);
    throw new Error('Token expirado. Solicite uma nova verificação.');
  }

  db.setVerification({
    politicianId: entry.politicianId,
    verified: true,
    method: 'domain',
    domain: entry.domain,
    email: entry.email
  });

  pendingVerifications.delete(token);

  return {
    ok: true,
    politicianId: entry.politicianId,
    email: entry.email,
    domain: entry.domain,
    verifiedAt: Date.now(),
    message: '✅ Selo de verificação ativado com sucesso!'
  };
}

function autoVerifyFromPublicData(politician) {
  if (!politician) return null;
  const emailFields = ['email', 'email_institucional', 'emailOficial', 'contact_email'];
  for (const field of emailFields) {
    const email = politician[field];
    if (email) {
      const domain = isAuthorizedDomain(email);
      if (domain) {
        db.setVerification({
          politicianId: politician.id,
          verified: true,
          method: 'public_data',
          domain,
          email
        });
        return { domain, email };
      }
    }
  }
  return null;
}

function getAuthorizedDomains() {
  return [...AUTHORIZED_DOMAINS];
}

function isVerified(politicianId) {
  const v = db.getVerification(politicianId);
  return !!(v && v.verified);
}

function getVerificationDetails(politicianId) {
  return db.getVerification(politicianId);
}

function getAllVerified() {
  return db.getVerifiedPoliticians();
}

function getStats() {
  const all = db.getAllPoliticians();
  const verifications = db.getAllVerifications();
  const total = Object.keys(all).length;
  let verified = 0;
  const byDomain = {};
  for (const v of Object.values(verifications)) {
    if (v.verified) {
      verified++;
      const d = v.domain || 'unknown';
      byDomain[d] = (byDomain[d] || 0) + 1;
    }
  }
  return { total, verified, pending: total - verified, byDomain };
}

module.exports = {
  AUTHORIZED_DOMAINS,
  isAuthorizedDomain,
  startVerification,
  confirmVerification,
  autoVerifyFromPublicData,
  getAuthorizedDomains,
  isVerified,
  getVerificationDetails,
  getAllVerified,
  getStats
};
