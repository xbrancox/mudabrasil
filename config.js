/* ============================================================
   MudaBrasil — Configuração Global
   -----------------------------------------------------------
   Backend: https://mudabrasil-production-79eb.up.railway.app
   Frontend: https://xbrancox.github.io/mudabrasil/
   ============================================================ */

let API_BASE = 'https://mudabrasil-production-79eb.up.railway.app';

/* Página servida pelo próprio backend (dev localhost ou Railway) = mesma origem.
   Hosts estáticos (GitHub Pages) e file:// continuam apontando pro Railway. */
const SERVIDO_PELO_BACKEND = location.protocol.startsWith('http') &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || /railway\.app$/.test(location.hostname));
if (SERVIDO_PELO_BACKEND) API_BASE = '';

// Backend Railway = modo PRODUÇÃO (votos ao vivo, selo real, reclamações persistentes)
// API_BASE vazio = modo DEMO (só frontend, dados públicos + localStorage)

window.MudaBrasil = window.MudaBrasil || {};

window.MudaBrasil.API_BASE = API_BASE;
window.MudaBrasil.MODO = 'producao';
window.MudaBrasil.SERVIDO_PELO_BACKEND = SERVIDO_PELO_BACKEND;

window.MudaBrasil.URLS = {
  camara: 'https://dadosabertos.camara.leg.br/api/v2',
  senado: 'https://legis.senado.leg.br/dadosabertos',
  tse: 'https://divulgacandcontas.tse.jus.br/divulga/app/',
  transparencia: 'https://www.portaltransparencia.gov.br/',
  cnj: 'https://www.cnj.jus.br/'
};

window.MudaBrasil.CONTATO = {
  email_geral: 'contato@mudabrasil.app',
  email_anuncie: 'anuncie@mudabrasil.app',
  email_imprensa: 'imprensa@mudabrasil.app'
};

window.MudaBrasil.REGRA_REVOGACAO = {
  percentual_cassacao: 0.70,
  abre_apos_posse: true,
  descricao: '70% dos votos que elegeram o político = cassação do mandato'
};

window.MudaBrasil.TERMOMETRO = {
  decaimento_cheio_dias: 90,
  decaimento_piso_dias: 180,
  piso_confianca: 0.5
};

// Aviso de protótipo
console.log('%c🟡 MudaBrasil', 'font-size:16px;font-weight:bold;color:#FFD700');
console.log('%cModo: ' + window.MudaBrasil.MODO, 'color:#94A3B8');
console.log('%cBackend: ' + API_BASE, 'color:#2ECC71');
