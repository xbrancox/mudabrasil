/* ============================================================
   COBRANÇAS CÍVICAS VERIFICADAS
   ------------------------------------------------------------
   Sistema de cobrança com token assinado + resposta oficial do
   gabinete + métricas de abertura/resposta.
   ============================================================ */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const COBRANCAS_FILE = path.join(DATA_DIR, 'cobrancas.json');

// Garante diretório
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Carrega ou inicializa
function load() {
  try {
    if (fs.existsSync(COBRANCAS_FILE)) {
      return JSON.parse(fs.readFileSync(COBRANCAS_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('[cobrancas] erro ao ler:', e.message);
  }
  return { cobrancas: [] };
}

function save(data) {
  fs.writeFileSync(COBRANCAS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Gera token único
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Cria cobrança
function criar(params) {
  const data = load();
  const token = generateToken();
  const cobranca = {
    token,
    deputadoId: params.deputadoId,
    deputadoNome: params.deputadoNome,
    promessa: params.promessa,
    votacoes: params.votacoes || [],
    emailGabinete: params.emailGabinete || '',
    criadoEm: new Date().toISOString(),
    status: 'gerada', // gerada → enviada → aberta → respondida
    resposta: null,
    respondidoEm: null,
    abertaEm: null,
    aberta: false
  };
  data.cobrancas.push(cobranca);
  save(data);
  return cobranca;
}

// Busca por token
function buscar(token) {
  const data = load();
  return data.cobrancas.find(c => c.token === token);
}

// Marca como aberta (tracking pixel/link)
function marcarAberta(token) {
  const data = load();
  const c = data.cobrancas.find(c => c.token === token);
  if (c && !c.aberta) {
    c.aberta = true;
    c.abertaEm = new Date().toISOString();
    c.status = 'aberta';
    save(data);
  }
  return c;
}

// Registra resposta oficial
function responder(token, respostaTexto, autor) {
  const data = load();
  const c = data.cobrancas.find(c => c.token === token);
  if (c) {
    c.resposta = respostaTexto;
    c.autorResposta = autor || 'Gabinete';
    c.respondidoEm = new Date().toISOString();
    c.status = 'respondida';
    save(data);
  }
  return c;
}

// Estatísticas agregadas
function stats() {
  const data = load();
  const total = data.cobrancas.length;
  const abertas = data.cobrancas.filter(c => c.aberta).length;
  const respondidas = data.cobrancas.filter(c => c.resposta).length;
  
  // Tempo médio de resposta (apenas das respondidas)
  const respondidasComTempo = data.cobrancas
    .filter(c => c.respondidoEm && c.abertaEm)
    .map(c => {
      const aberta = new Date(c.abertaEm).getTime();
      const respondida = new Date(c.respondidoEm).getTime();
      return (respondida - aberta) / (1000 * 60 * 60); // horas
    });
  
  const tempoMedio = respondidasComTempo.length > 0
    ? respondidasComTempo.reduce((a, b) => a + b, 0) / respondidasComTempo.length
    : null;
  
  return {
    total,
    abertas,
    respondidas,
    taxaAbertura: total > 0 ? (abertas / total) : 0,
    taxaResposta: total > 0 ? (respondidas / total) : 0,
    tempoMedioHoras: tempoMedio,
    ultima: data.cobrancas[data.cobrancas.length - 1] || null
  };
}

// Lista todas (para admin)
function listar() {
  const data = load();
  return data.cobrancas.slice().reverse(); // mais recentes primeiro
}

module.exports = {
  criar,
  buscar,
  marcarAberta,
  responder,
  stats,
  listar
};
