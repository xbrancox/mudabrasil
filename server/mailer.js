/* ============================================================
   MEUVOTO — SERVIÇO DE E-MAIL
   ------------------------------------------------------------
   Tenta SMTP primeiro, depois Resend se configurado,
   por último modo dev.
   ============================================================ */

const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'nao-responda@meu-voto.app';
const SMTP_TIMEOUT = parseInt(process.env.SMTP_TIMEOUT || '15000', 10);
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'MeuVoto <onboarding@resend.dev>';

const HAS_SMTP = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
const HAS_RESEND = !!RESEND_API_KEY;

let smtpTransporter = null;

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;
  if (!HAS_SMTP) return null;

  const opts = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: SMTP_TIMEOUT,
    greetingTimeout: SMTP_TIMEOUT,
    socketTimeout: SMTP_TIMEOUT
  };
  if (SMTP_PORT === 587) {
    opts.secure = false;
    opts.requireTLS = true;
  } else {
    opts.secure = true;
  }
  smtpTransporter = nodemailer.createTransport(opts);
  return smtpTransporter;
}

async function trySmtp({ to, subject, html, text }) {
  const transport = getSmtpTransporter();
  if (!transport) return null; // signal: no SMTP configured

  try {
    const info = await transport.sendMail({
      from: SMTP_FROM,
      to, subject, text: text || '', html: html || ''
    });
    smtpTransporter = null; // reset for next time
    console.log('[mailer] E-mail enviado via SMTP: ' + info.messageId);
    return { ok: true, messageId: info.messageId, provider: 'smtp' };
  } catch (err) {
    smtpTransporter = null; // reset
    return { error: err.message }; // signal: SMTP failed
  }
}

async function tryResend({ to, subject, html, text }) {
  if (!HAS_RESEND) return null; // signal: no Resend configured

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + RESEND_API_KEY
      },
      body: JSON.stringify({
        from: SMTP_FROM || RESEND_FROM,
        to, subject, text: text || '', html: html || ''
      }),
      signal: AbortSignal.timeout(10000)
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.message || data.error || 'Resend API error' };
    }
    console.log('[mailer] E-mail enviado via Resend: ' + data.id);
    return { ok: true, messageId: data.id, provider: 'resend' };
  } catch (err) {
    return { error: err.message };
  }
}

function devLog({ to, subject, text, html }) {
  console.log('[mailer] === SIMULAÇÃO DE E-MAIL ===');
  console.log('[mailer] Para: ' + to);
  console.log('[mailer] Assunto: ' + subject);
  console.log('[mailer] Conteúdo:');
  console.log(text || html);
  console.log('[mailer] =============================');
  return { ok: true, simulated: true, message: 'E-mail simulado (modo dev)' };
}

async function sendEmail({ to, subject, html, text }) {
  // 1. Try SMTP
  if (HAS_SMTP) {
    const result = await trySmtp({ to, subject, html, text });
    if (result && result.ok) return result;
    if (result && result.error) {
      console.log('[mailer] SMTP falhou: ' + result.error);
    }
  }

  // 2. Try Resend as fallback
  if (HAS_RESEND) {
    const result = await tryResend({ to, subject, html, text });
    if (result && result.ok) return result;
    if (result && result.error) {
      console.log('[mailer] Resend falhou: ' + result.error);
    }
  }

  // 3. Dev mode fallback
  if (!HAS_SMTP && !HAS_RESEND) {
    console.log('[mailer] MODO DEV: SMTP e Resend não configurados');
    return devLog({ to, subject, text, html });
  }

  throw new Error('Falha ao enviar e-mail (SMTP e Resend indisponíveis)');
}

function sendOtpEmail(to, code, expiresInMinutes) {
  const subject = 'Seu código MeuVoto: ' + code;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu código MeuVoto</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 40px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">🗳️</div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a2e;">MeuVoto</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Plataforma Cívica de Transparência</p>
      </div>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #333;">Olá,</p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #333;">Use o código abaixo para fazer login:</p>

        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 36px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin: 24px 0;">
          ${code}
        </div>

        <p style="margin: 24px 0 0 0; font-size: 14px; color: #666; text-align: center;">
          ⏰ Este código expira em <strong>${expiresInMinutes} minutos</strong>
        </p>
      </div>

      <div style="border-top: 1px solid #e0e0e0; padding-top: 24px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #999;">
          Se você não solicitou este código, ignore este e-mail.
        </p>
        <p style="margin: 0; font-size: 12px; color: #999;">
          Este e-mail foi enviado por <a href="https://meu-voto.app" style="color: #667eea; text-decoration: none;">meu-voto.app</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
MeuVoto - Seu código de acesso

Use o código abaixo para fazer login:

${code}

Este código expira em ${expiresInMinutes} minutos.

Se você não solicitou este código, ignore este e-mail.

Este e-mail foi enviado por https://meu-voto.app
  `;

  return sendEmail({ to, subject, html, text });
}

function sendVerificationEmail(to, politicianName, verificationUrl) {
  const subject = 'Confirme seu e-mail - MeuVoto';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de E-mail</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 40px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a2e;">MeuVoto</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Verificação de E-mail Institucional</p>
      </div>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #333;">Olá, ${politicianName},</p>
        <p style="margin: 0 0 24px 0; font-size: 16px; color: #333;">
          Para completar sua verificação no MeuVoto, clique no botão abaixo:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Confirmar E-mail
          </a>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 14px; color: #666; text-align: center;">
          Ou copie e cole este link no seu navegador:<br>
          <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
        </p>
      </div>

      <div style="border-top: 1px solid #e0e0e0; padding-top: 24px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #999;">
          Se você não solicitou esta verificação, ignore este e-mail.
        </p>
        <p style="margin: 0; font-size: 12px; color: #999;">
          Este e-mail foi enviado por <a href="https://meu-voto.app" style="color: #667eea; text-decoration: none;">meu-voto.app</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
MeuVoto - Confirmação de E-mail

Olá, ${politicianName},

Para completar sua verificação no MeuVoto, acesse este link:

${verificationUrl}

Se você não solicitou esta verificação, ignore este e-mail.

Este e-mail foi enviado por https://meu-voto.app
  `;

  return sendEmail({ to, subject, html, text });
}

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendVerificationEmail,
  IS_DEV: !HAS_SMTP && !HAS_RESEND
};
