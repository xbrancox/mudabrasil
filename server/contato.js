/* ============================================================
   MEUVOTO — ENDPOINT DE CONTATO
   ------------------------------------------------------------
   Gerencia mensagens de contato dos usuários.
   Armazena em JSON + envia email via nodemailer.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mailer = require('./mailer');

const DATA_DIR = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, 'data');
const CONTATO_FILE = path.join(DATA_DIR, 'contato_mensagens.json');

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readMessages() {
  try {
    return JSON.parse(fs.readFileSync(CONTATO_FILE, 'utf8'));
  } catch (e) {
    return { mensagens: [] };
  }
}

function writeMessages(data) {
  ensureDir();
  const tmp = CONTATO_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, CONTATO_FILE);
}

function sanitize(str) {
  return String(str || '').replace(/<[^>]*>/g, '').trim();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

/**
 * Cria uma mensagem de contato
 * @param {Object} data - { nome, email, assunto, mensagem, ip, userAgent }
 * @returns {Object} - { ok, id, protocolo }
 */
async function createContato(data) {
  const nome = sanitize(data.nome);
  const email = String(data.email || '').trim().toLowerCase();
  const assunto = sanitize(data.assunto);
  const mensagem = sanitize(data.mensagem);
  const ip = data.ip || null;
  const userAgent = data.userAgent || null;

  // Validações
  if (!nome || nome.length < 2) {
    throw new Error('Nome é obrigatório (mínimo 2 caracteres)');
  }
  if (!validateEmail(email)) {
    throw new Error('E-mail inválido');
  }
  if (!assunto || assunto.length < 3) {
    throw new Error('Assunto é obrigatório (mínimo 3 caracteres)');
  }
  if (!mensagem || mensagem.length < 10) {
    throw new Error('Mensagem é obrigatória (mínimo 10 caracteres)');
  }
  if (mensagem.length > 5000) {
    throw new Error('Mensagem muito longa (máximo 5000 caracteres)');
  }

  const id = 'msg-' + crypto.randomBytes(8).toString('hex');
  const protocolo = 'MV-CONTATO-2026-' + String(Math.floor(100000 + Math.random() * 900000));
  const now = Date.now();

  const msg = {
    id,
    protocolo,
    nome,
    email,
    assunto,
    mensagem,
    ip,
    userAgent,
    lida: false,
    createdAt: now,
    createdAtISO: new Date(now).toISOString()
  };

  // Salvar no arquivo JSON
  const data2 = readMessages();
  data2.mensagens.push(msg);
  writeMessages(data2);

  // Enviar email para o e-mail de contato configurado
  const CONTATO_EMAIL = process.env.CONTATO_EMAIL || 'euler.branco@gmail.com';
  try {
    await mailer.sendEmail({
      to: CONTATO_EMAIL,
      subject: '[MeuVoto Contato] ' + assunto,
      html: `
        <h2>Nova mensagem de contato</h2>
        <p><strong>Protocolo:</strong> ${protocolo}</p>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Assunto:</strong> ${assunto}</p>
        <p><strong>Mensagem:</strong></p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px;">
          ${mensagem.replace(/\n/g, '<br>')}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          IP: ${ip || 'não informado'}<br>
          Data: ${new Date(now).toLocaleString('pt-BR')}
        </p>
      `,
      text: `Nova mensagem de contato\n\nProtocolo: ${protocolo}\nNome: ${nome}\nE-mail: ${email}\nAssunto: ${assunto}\n\nMensagem:\n${mensagem}`
    });
    console.log('[contato] E-mail enviado para', CONTATO_EMAIL);
  } catch (e) {
    console.log('[contato] Falha ao enviar e-mail (SMTP não configurado):', e.message);
  }

  // Enviar autoconfirmação para o usuário
  try {
    await mailer.sendEmail({
      to: email,
      subject: 'Recebemos sua mensagem - MeuVoto',
      html: `
        <h2>Obrigado pelo contato!</h2>
        <p>Olá, ${nome},</p>
        <p>Recebemos sua mensagem e responderemos em breve.</p>
        <p><strong>Protocolo:</strong> ${protocolo}</p>
        <p><strong>Assunto:</strong> ${assunto}</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          Este é um e-mail automático. Por favor, não responda.
        </p>
      `,
      text: `Obrigado pelo contato!\n\nRecebemos sua mensagem e responderemos em breve.\n\nProtocolo: ${protocolo}\nAssunto: ${assunto}`
    });
    console.log('[contato] Autoconfirmação enviada para', email);
  } catch (e) {
    console.log('[contato] Falha ao enviar autoconfirmação (SMTP não configurado):', e.message);
  }

  return {
    ok: true,
    id,
    protocolo,
    message: 'Mensagem enviada com sucesso! Você receberá uma confirmação por e-mail.'
  };
}

/**
 * Lista mensagens de contato (para admin)
 * @param {Object} options - { limit, offset, onlyUnread }
 */
function listContatos(options = {}) {
  const { limit = 50, offset = 0, onlyUnread = false } = options;
  const data = readMessages();
  let list = data.mensagens || [];
  
  if (onlyUnread) {
    list = list.filter(m => !m.lida);
  }
  
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(offset, offset + limit);
}

/**
 * Marca mensagem como lida
 * @param {string} id - ID da mensagem
 */
function markAsRead(id) {
  const data = readMessages();
  const msg = data.mensagens.find(m => m.id === id);
  if (msg) {
    msg.lida = true;
    writeMessages(data);
    return true;
  }
  return false;
}

/**
 * Deleta mensagem
 * @param {string} id - ID da mensagem
 */
function deleteContato(id) {
  const data = readMessages();
  const before = data.mensagens.length;
  data.mensagens = data.mensagens.filter(m => m.id !== id);
  if (data.mensagens.length < before) {
    writeMessages(data);
    return true;
  }
  return false;
}

/**
 * Estatísticas de contato
 */
function getStats() {
  const data = readMessages();
  const mensagens = data.mensagens || [];
  const lidas = mensagens.filter(m => m.lida).length;
  const naoLidas = mensagens.length - lidas;
  
  return {
    total: mensagens.length,
    lidas,
    naoLidas
  };
}

module.exports = {
  createContato,
  listContatos,
  markAsRead,
  deleteContato,
  getStats
};
