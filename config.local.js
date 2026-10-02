/* ============================================================
   MeuVoto — Configuração Global
   -----------------------------------------------------------
   Backend: https://api.meu-voto.app (Railway - Projeto VotaBrasil 198baa4d)
   Frontend: https://meu-voto.app/
   ============================================================ */

let API_BASE = (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? ''
  : 'https://api.meu-voto.app';

/* Para que o localhost use exatamente o mesmo backend e dados da Produção (Railway),
   mantemos API_BASE apontando para o servidor de produção. */
const SERVIDO_PELO_BACKEND = false;

// Backend Railway = modo PRODUÇÃO (votos ao vivo, selo real, reclamações persistentes)
// API_BASE vazio = modo DEMO (só frontend, dados públicos + localStorage)

window.MeuVoto = window.MeuVoto || {};

window.MeuVoto.API_BASE = API_BASE;
/* Global legado usado inline pela home (index.html). Sem ele, um <script> próprio
   com `const API_BASE` lança SyntaxError e derruba TODA a lógica da página —
   era isso que fazia o Radar Político cair no modo demo. */
window.API_BASE = API_BASE;
window.MeuVoto.MODO = 'producao';
window.MeuVoto.SERVIDO_PELO_BACKEND = SERVIDO_PELO_BACKEND;

window.MeuVoto.URLS = {
  camara: 'https://dadosabertos.camara.leg.br/api/v2',
  senado: 'https://legis.senado.leg.br/dadosabertos',
  tse: 'https://divulgacandcontas.tse.jus.br/divulga/app/',
  transparencia: 'https://www.portaltransparencia.gov.br/',
  cnj: 'https://www.cnj.jus.br/'
};

window.MeuVoto.CONTATO = {
  email_geral: 'contato@meu-voto.app',
  email_anuncie: 'anuncie@meu-voto.app',
  email_imprensa: 'imprensa@meu-voto.app'
};

window.MeuVoto.REGRA_REVOGACAO = {
  percentual_cassacao: 0.70,
  abre_apos_posse: true,
  descricao: '70% dos votos que elegeram o político = cassação do mandato'
};

window.MeuVoto.TERMOMETRO = {
  decaimento_cheio_dias: 90,
  decaimento_piso_dias: 180,
  piso_confianca: 0.5
};

// Aviso de protótipo (desabilitado em produção)
