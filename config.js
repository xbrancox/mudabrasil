/* MeuVoto - Configuracao Global (autonomo). Backend -79eb = seu servidor (nao e marca). */
(function(){
  var ov=null; try{ ov=window.__MEUVOTO_ENV__&&window.__MEUVOTO_ENV__.API_BASE; }catch(e){}
  var st=null; try{ st=localStorage.getItem('mv_api_base'); }catch(e){}
  var API_BASE=ov||st||'https://mudabrasil-production-79eb.up.railway.app'; /* Backend: Projeto VotaBrasil Railway (198baa4d). TODO: migrar para api.meuvoto.app.br quando domínio for registrado */
  var MV=window.MeuVoto=window.MeuVoto||{};
  MV.API_BASE=API_BASE; MV.MODO=API_BASE?'producao':'offline';
  MV.URLS={camara:'https://dadosabertos.camara.leg.br/api/v2',senado:'https://legis.senado.leg.br/dadosabertos',tse:'https://divulgacandcontas.tse.jus.br/divulga/app/',transparencia:'https://www.portaltransparencia.gov.br/',cnj:'https://www.cnj.jus.br/'};
  MV.CONTATO={email_geral:'contato@meuvoto.app.br',email_anuncie:'anuncie@meuvoto.app.br',email_imprensa:'imprensa@meuvoto.app.br'}; /* MIGRACAO-PENDENTE: so vale apos MX testado */
  MV.REGRA_REVOGACAO={percentual_cassacao:0.70,abre_apos_posse:true,descricao:'70% dos votos que elegeram o politico = cassacao (validacao server-side)'};
  MV.TERMOMETRO={decaimento_cheio_dias:90,decaimento_piso_dias:180,piso_confianca:0.5};
  MV.MARCA={nome:'MeuVoto',eslogan:'Meu voto coloca, meu voto tira.',logo:'assets/logo-meuvoto.svg'};
  window.VotaBrasil=MV; window.MudaBrasil=MV; /* ALIAS-RETRO: codigo antigo continua vivo */
  try{ Object.keys(localStorage).forEach(function(k){ var n=null;
    if(k.indexOf('mudabrasil')===0) n=k.replace(/^mudabrasil/,'meuvoto');
    else if(k.indexOf('votabrasil')===0) n=k.replace(/^votabrasil/,'meuvoto');
    if(n&&localStorage.getItem(n)===null) localStorage.setItem(n,localStorage.getItem(k)); }); }catch(e){}
  console.log('[MeuVoto] modo='+MV.MODO+' backend='+API_BASE);
})();