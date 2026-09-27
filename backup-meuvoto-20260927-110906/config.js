/* ============================================================
   VotaBrasil - Configuracao Global (autonomo)
   Backend atual: -79eb  [MIGRACAO-PENDENTE: trocar por api.votabrasil.app
   assim que o dominio for registrado, OU pelo slug novo do servico]
   ============================================================ */
(function(){
  var override=null; try{ override=window.__VOTABRASIL_ENV__&&window.__VOTABRASIL_ENV__.API_BASE; }catch(e){}
  var stored=null;   try{ stored=localStorage.getItem('vb_api_base'); }catch(e){}
  var API_BASE=override||stored||'https://mudabrasil-production-79eb.up.railway.app'; /* MIGRACAO-PENDENTE */
  var VB=window.VotaBrasil=window.VotaBrasil||{};
  VB.API_BASE=API_BASE;
  VB.MODO=API_BASE?'producao':'offline';
  VB.URLS={camara:'https://dadosabertos.camara.leg.br/api/v2',senado:'https://legis.senado.leg.br/dadosabertos',tse:'https://divulgacandcontas.tse.jus.br/divulga/app/',transparencia:'https://www.portaltransparencia.gov.br/',cnj:'https://www.cnj.jus.br/'};
  VB.CONTATO={ /* MIGRACAO-PENDENTE: trocar apos MX do dominio proprio testado */
    email_geral:'contato@mudabrasil.app',
    email_anuncie:'anuncie@mudabrasil.app',
    email_imprensa:'imprensa@mudabrasil.app'};
  VB.REGRA_REVOGACAO={percentual_cassacao:0.70,abre_apos_posse:true,descricao:'70% dos votos que elegeram o pol\u00EDtico = cassa\u00E7\u00E3o (validacao server-side)'};
  VB.TERMOMETRO={decaimento_cheio_dias:90,decaimento_piso_dias:180,piso_confianca:0.5};
  window.MudaBrasil=VB; /* ALIAS-RETRO: codigo antigo continua funcionando */
  try{ Object.keys(localStorage).forEach(function(k){ if(k.indexOf('mudabrasil')===0){ var n=k.replace(/^mudabrasil/,'votabrasil'); if(localStorage.getItem(n)===null)localStorage.setItem(n,localStorage.getItem(k)); } }); }catch(e){}
  console.log('%c\ud83d\udfe2 VotaBrasil','font-size:16px;font-weight:bold;color:#2ECC71');
  console.log('%cModo: '+VB.MODO,'color:#94A3B8');
  console.log('%cBackend: '+API_BASE,'color:#2ECC71');
})();