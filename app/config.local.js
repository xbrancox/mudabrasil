/* ============================================================
   MeuVoto — Configuração Global (App Mobile)
   -----------------------------------------------------------
   Backend: https://api.meu-voto.app (Railway - Projeto VotaBrasil 198baa4d)
   Frontend: https://meu-voto.app/app/
   ============================================================ */

// Detecta ambiente: localhost usa API local, produção usa Railway
let API_BASE = (typeof window !== 'undefined' && window.location && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:8080'
  : 'https://api.meu-voto.app';

// Quando servido pelo próprio backend Railway, usa mesma origem
if (typeof window !== 'undefined' && window.location && 
    window.location.hostname.includes('railway.app')) {
  API_BASE = '';
}

window.MeuVoto = window.MeuVoto || {};

window.MeuVoto.API_BASE = API_BASE;
window.API_BASE = API_BASE;
window.MeuVoto.MODO = API_BASE ? 'producao' : 'offline';

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

// Aviso de protótipo
console.log('%c📱 MeuVoto App', 'font-size:16px;font-weight:bold;color:#FFD700');
console.log('%cModo: ' + window.MeuVoto.MODO, 'color:#94A3B8');
console.log('%cBackend: ' + API_BASE, 'color:#2ECC71');
