/* Pacote: modal expandido + popup de votos + ficha stats — v2 (âncoras corrigidas) */
const fs = require('fs');
const P = 'C:/Users/euler/MudaBrasil/index.html';
let h = fs.readFileSync(P, 'utf8');
let n = 0;
function rep(from, to, label) {
  if (!h.includes(from)) { console.error('FALHOU: ' + label); process.exit(1); }
  h = h.split(from).join(to);
  n++;
}

/* 1) campos novos + fetches extras (deputados) */
rep(
  "  if(d.ultimoStatus)det.legislatura=d.ultimoStatus.idLegislatura;const gab=(d.ultimoStatus&&d.ultimoStatus.gabinete)?d.ultimoStatus.gabinete:d.gabinete;if(gab)det.gabinete=gab.nome;\n  if(gab)det.contato=[gab.telefone,gab.email].filter(Boolean).join(' · ');}catch(e){}",
  "  const us=d.ultimoStatus||{};if(us.idLegislatura)det.legislatura=us.idLegislatura;\n" +
  "  det.situacao=us.situacao||'';det.descStatus=us.descricaoStatus||'';det.condicao=us.condicaoEleitoral||'';\n" +
  "  det.redes=(us.redesSociais||[]).filter(Boolean);det.emailDep=us.email||'';\n" +
  "  const gab=us.gabinete||d.gabinete;if(gab)det.gabinete=(gab.nome||'')+(gab.predio?' · '+gab.predio:'')+(gab.andar?' '+gab.andar:'')+(gab.sala?' '+gab.sala:'');\n" +
  "  if(gab)det.contato=[gab.telefone,gab.email].filter(Boolean).join(' · ');}catch(e){}\n" +
  " try{const ex=await Promise.all([fetch(CA+'deputados/'+p.num+'/orgaos?itens=20').then(y=>y.json()).catch(()=>({dados:[]})),fetch(CA+'deputados/'+p.num+'/frentes').then(y=>y.json()).catch(()=>({dados:[]})),fetch(CA+'deputados/'+p.num+'/ocupacoes').then(y=>y.json()).catch(()=>({dados:[]})),fetch(CA+'deputados/'+p.num+'/historico?itens=8').then(y=>y.json()).catch(()=>({dados:[]}))]);\n" +
  "  det.orgaos=(ex[0].dados||[]).map(o=>({n:o.nomeOrgao||'',s:o.siglaOrgao||'',c:o.cargo||'',t:o.dataInicio?fmtData(o.dataInicio):''})).filter(o=>o.n);\n" +
  "  det.frentes=(ex[1].dados||[]).map(f=>f.titulo||'').filter(Boolean);\n" +
  "  det.ocup=(ex[2].dados||[]).filter(o=>o.titulo).map(o=>o.titulo+(o.entidade?' — '+o.entidade:'')+(o.anoInicio?' ('+o.anoInicio+')':''));\n" +
  "  det.hist=(ex[3].dados||[]).map(x2=>({d:x2.dataHora?fmtData(x2.dataHora):'',t:x2.descricaoStatus||x2.situacao||x2.texto||''})).filter(x2=>x2.t).slice(0,6);\n" +
  " }catch(e){det.orgaos=det.frentes=[];det.ocup=det.hist=[];}",
  'campos novos + fetches extras');

/* 2) vid nos votos (âncora com indentação real de 4 espaços) */
rep(
  "    det.votos.push({t:pr&&pr.siglaTipo?((pr.siglaTipo||'')+' '+(pr.numero||'')+'/'+(pr.ano||'')):'Votação PLEN',e:(v.descricao||'').slice(0,110),v:mine.tipoVoto||'',d:dfmt});",
  "    det.votos.push({t:pr&&pr.siglaTipo?((pr.siglaTipo||'')+' '+(pr.numero||'')+'/'+(pr.ano||'')):'Votação PLEN',e:(v.descricao||'').slice(0,110),v:mine.tipoVoto||'',d:dfmt,vid:v.id,desc:v.descricao||''});",
  'vid nos votos');

/* 3) realHTML: votações clicáveis */
rep(
  " if(vs.length)h+=vs.map(x=>`<div class=\"quote info\"><span style=\"display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap\"><span style=\"display:flex;gap:6px;align-items:center;flex-wrap:wrap\">${votoBadge(x.v)}<b>${x.t||'Votação'}</b></span>${x.d?`<small class=\"muted\" style=\"flex:none\">${x.d}</small>`:''}</span>${x.e?`<div style=\"margin-top:3px\">${x.e}</div>`:''}</div>`).join('');",
  " if(vs.length)h+=vs.map((x,ix)=>{const click=(p&&p.cargo==='Deputado Federal'&&x.vid)?` onclick=\"abrirVotacao('${x.vid}',${i})\" style=\"cursor:pointer\" title=\"Clique para ver como TODOS votaram\"`:'';\n" +
  "  return `<div class=\"quote info\"${click}><span style=\"display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap\"><span style=\"display:flex;gap:6px;align-items:center;flex-wrap:wrap\">${votoBadge(x.v)}<b>${x.t||'Votação'}</b></span>${x.d?`<small class=\"muted\" style=\"flex:none\">${x.d}</small>`:''}</span>${x.e?`<div style=\"margin-top:3px\">${x.e}</div>`:''}</div>`}).join('');",
  'votações clicáveis');

/* 4) fichaHTML: fstats */
rep(
  "  <div style=\"display:flex;gap:6px;margin-top:5px;flex-wrap:wrap\"><span class=\"badge blue\">#${p.num}</span>",
  "  <div id=\"fstats-${i}\" class=\"stats\" style=\"grid-template-columns:repeat(4,1fr);margin:10px 0 0\"><div class=\"stat\"><small>…</small><b>—</b></div></div>\n" +
  "  <div style=\"display:flex;gap:6px;margin-top:5px;flex-wrap:wrap\"><span class=\"badge blue\">#${p.num}</span>",
  'fstats na ficha');

rep(
  "function fichaHTML(p,i){const d=DET[i];",
  "function fstatsHTML(d,p){const rank=TERM_RANK[(p.cargo==='Deputado Federal'?'camara-':'senado-')+p.num];\n" +
  "  const st=[['Idade',d.idade||'…'],['Escolaridade',(d.escolaridade||'…').slice(0,14)],['Projetos',(d.props||[]).length||'…'],['Votações',(d.votos||[]).length],['Comissões',(d.orgaos||[]).length||'…'],['Frentes',(d.frentes||[]).length||'…'],['Ranking',rank?'#'+rank:'—'],['Situação',d.situacao||'—']];\n" +
  "  return st.map(x=>`<div class=\"stat\"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}\n" +
  "function fichaHTML(p,i){const d=DET[i];",
  'fstatsHTML');

/* 5) fstats refresh no fim do preencheDetalhe */
rep(
  "DET[i]=det;const rl=document.getElementById('real-'+i);if(rl)rl.innerHTML=realHTML(i)}\nfunction realHTML(i){const p=POL[i];const d=DET[i]||{props:[],votos:[]};",
  "DET[i]=det;const rl=document.getElementById('real-'+i);if(rl)rl.innerHTML=realHTML(i);const fsEl=document.getElementById('fstats-'+i);if(fsEl)fsEl.innerHTML=fstatsHTML(det,p)}\nfunction realHTML(i){const p=POL[i];const d=DET[i]||{props:[],votos:[]};",
  'fstats refresh');

/* 6) abrirDados redesign */
rep(
  "$('#dadosBody').innerHTML=`<h3 style=\"margin-bottom:10px\">🔎 Dados públicos — ${p.nome}</h3>\n<div class=\"stats\" style=\"grid-template-columns:1fr 1fr\">${rows.map(r=>`<div class=\"stat\"><small>${r[0]}</small><b>${r[1]!=null&&r[1]!==''?r[1]:'—'}</b></div>`).join('')}</div>\n<h4 style=\"color:var(--blueL);font-size:12px;margin:12px 0 4px\">🗳️ Últimas votações nominais</h4>\n${votosHTML(d,p,i)}\n<p class=\"muted\" style=\"margin-top:10px\">Fontes oficiais no final da página do Radar.</p>`;",
  "$('#dadosBody').innerHTML=(function(){const esc=v=>(v!=null&&v!=='')?v:null;const row=(l,v)=>esc(v)?`<div class=\"stat\"><small>${l}</small><b style=\"font-size:13px\">${v}</b></div>`:'';\n" +
  "  const grp=(t,rowsHtml)=>rowsHtml?`<h4 style=\"color:var(--gold);font-size:12px;margin:14px 0 4px\">${t}</h4><div class=\"stats\" style=\"grid-template-columns:1fr 1fr\">${rowsHtml}</div>`:'';\n" +
  "  const org=(d.orgaos||[]).map(o=>`<div class=\"quote info\" style=\"margin-top:4px\"><b>${o.n}</b>${o.c?' — <b style=\"color:var(--gold)\">'+o.c+'</b>':''}${o.t?' <small class=\"muted\">desde '+o.t+'</small>':''}</div>`).join('');\n" +
  "  const fre=(d.frentes||[]).length?(d.frentes||[]).slice(0,6).map(f=>`<div class=\"quote ok\" style=\"margin-top:4px\">🤝 ${f}</div>`).join('')+((d.frentes||[]).length>6?`<p class=\"muted\" style=\"margin:4px 0 0\">+ ${d.frentes.length-6} outras frentes</p>`:''):'';\n" +
  "  const oc=(d.ocup||[]).map(o=>`<div class=\"stat\"><small>Ocupação</small><b style=\"font-size:13px\">${o}</b></div>`).join('');\n" +
  "  const hi=(d.hist||[]).map(x=>`<div class=\"quote info\" style=\"margin-top:4px\">${x.d?`<small class=\"muted\">${x.d}</small> — `:''}${x.t}</div>`).join('');\n" +
  "  const redes=(d.redes||[]).map(u=>`<a href=\"${u}\" target=\"_blank\" style=\"color:var(--blueL);word-break:break-all\">${u.replace(/^https?:\\/\\/(www\\.)?/,'')}</a>`).join(' · ');\n" +
  "  return `<h3 style=\"margin-bottom:6px\">🔎 Dados públicos — ${p.nome}</h3>\n" +
  "  <div style=\"display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px\">${d.situacao?`<span class=\"badge ok\">${d.situacao}</span>`:''}${d.condicao?`<span class=\"badge\">${d.condicao}</span>`:''}<span class=\"badge blue\">${p.partido} · ${p.uf}</span></div>\n" +
  "  ${grp('👤 Pessoal',row('Nome civil',d.nomeCivil)+row('Nascimento',d.nasc)+row('Idade',d.idade?d.idade+' anos':null)+row('Município/UF nasc.',d.munic)+row('Escolaridade',d.escolaridade)+oc)}\n" +
  "  ${grp('🏛️ Mandato',row('Partido/UF',p.partido+' · '+p.uf)+row('Cargo',p.cargo)+row('Nº eleitoral',p.num)+row('Legislatura',d.legislatura?d.legislatura+'ª':null)+row('Situação',d.situacao)+row('Gabinete',d.gabinete)+row('Contato',d.contato)+row('Descrição do status',d.descStatus))}\n" +
  "  ${(org||fre||hi)?grp('🧩 Atuação institucional',(org?`<div class=\"stat\"><small>Comissões/Órgãos</small></div>${org}`:'')+(fre?`<div class=\"stat\"><small>Frentes parlamentares (${d.frentes.length})</small></div>${fre}`:'')+(hi?`<div class=\"stat\"><small>Histórico recente</small></div>${hi}`:'')):''}\n" +
  "  ${grp('🌐 Presença digital',redes?`<div class=\"stat\"><small>Redes sociais (Câmara)</small><b style=\"font-size:13px\">${redes}</b></div>`:row('Redes sociais','não informadas à Câmara'))}\n" +
  "  ${grp('📊 Atuação em números',row('Projetos apresentados',(d.props||[]).length)+row('Votações registradas',(d.votosHist||d.votos||[]).length)+row('Despesas de cota','consultar portal da Câmara'))}\n" +
  "  ${grp('⚖️ Transparência externa',row('Patrimônio declarado','ver TSE (fim da pág.)')+row('Processos/condenações','ver CNJ (fim da pág.)'))}\n" +
  "  <h4 style=\"color:var(--blueL);font-size:12px;margin:12px 0 4px\">🗳️ Últimas votações nominais</h4>\n" +
  "  ${votosHTML(d,p,i)}\n" +
  "  <p class=\"muted\" style=\"margin-top:10px\">Fontes oficiais no final da página do Radar.</p>`})();",
  'abrirDados redesign');

/* 7) overlay mVotos */
rep(
  '<div id="toast"></div>',
  '<div class="overlay" id="mVotos"><div class="modal"><div id="votosBody" style="max-height:70vh;overflow-y:auto"></div><button class="btn" style="width:100%;margin-top:12px" onclick="fechar(\'mVotos\')">Fechar</button></div></div>\n<div id="toast"></div>',
  'overlay mVotos');

/* 8) popups de votos */
rep(
  'function verTodas(i){',
  "function abreModalVotos(html){document.getElementById('votosBody').innerHTML=html;document.getElementById('mVotos').classList.add('open')}\n" +
  "function camaraBase(){if(BACKEND_OK&&(location.hostname==='localhost'||location.hostname==='127.0.0.1'||/railway\\.app$/.test(location.hostname)))return '';return API_BASE||'';}\n" +
  "async function abrirVotacao(vid,tituloPol){\n" +
  "  abreModalVotos('<p class=\"muted\">Carregando votação…</p>');\n" +
  "  let votos=VOTOS_BY_ID[vid];\n" +
  "  if(!votos){try{const r=await fetch(camaraBase()+'/api/camara/votacoes/'+vid+'/votos');votos=(await r.json()).dados||[];VOTOS_BY_ID[vid]=votos;}catch(e){votos=null;}}\n" +
  "  if(!votos)return abreModalVotos('<p class=\"muted\">Não foi possível carregar os votos desta votação.</p>');\n" +
  "  const placar={};votos.forEach(v=>{const t=v.tipoVoto||'Sem registro';placar[t]=(placar[t]||0)+1;});\n" +
  "  const ord=['Sim','Não','Abstenção','Obstrução'];const chips=ord.filter(t=>placar[t]).map(t=>`<span class=\"badge ${t==='Sim'?'ok':''}\" style=\"${t==='Não'?'color:var(--red);border-color:rgba(231,76,60,.45)':''}\">${t}: ${placar[t]}</span>`).join(' ');\n" +
  "  const outros=Object.keys(placar).filter(t=>ord.indexOf(t)<0&&t!=='Sem registro');\n" +
  "  const partidos=[...new Set(votos.map(v=>(v.deputado_&&v.deputado_.siglaPartido)||'—'))].sort();\n" +
  "  window._VOT={vid:vid,votos:votos};\n" +
  "  abreModalVotos(`<h3 style=\"margin-bottom:6px\">🗳️ Quem votou como</h3>\n" +
  "    <p class=\"muted\" style=\"margin-bottom:8px\">Votação <b>${vid}</b> — Plenário da Câmara${tituloPol?' · '+tituloPol:''}</p>\n" +
  "    <div style=\"display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px\">${chips}${outros.map(t=>`<span class=\"badge\">${t}: ${placar[t]}</span>`).join(' ')}<span class=\"badge\">Registrados: ${votos.length}</span></div>\n" +
  "    <div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px\">\n" +
  "      <input id=\"vot-busca\" placeholder=\"🔎 buscar nome…\" oninput=\"renderListaVotos()\" style=\"flex:1;min-width:140px\"/>\n" +
  "      <select id=\"vot-part\" onchange=\"renderListaVotos()\" style=\"min-width:120px\"><option value=\"\">Todos os partidos</option>${partidos.map(p2=>`<option>${p2}</option>`).join('')}</select>\n" +
  "    </div>\n" +
  "    <div id=\"vot-lista\"></div>`);\n" +
  "  renderListaVotos();\n" +
  "}\n" +
  "function renderListaVotos(){const w=window._VOT;if(!w)return;const q=(($('#vot-busca')&&$('#vot-busca').value)||'').toLowerCase();const pt=$('#vot-part')?$('#vot-part').value:'';\n" +
  "  const rows=w.votos.filter(v=>{const d=v.deputado_||{};const nm=(d.nome||'').toLowerCase();const sp=d.siglaPartido||'—';return (!q||nm.includes(q))&&(!pt||sp===pt);}).sort((a,b)=>(a.deputado_.nome||'').localeCompare(b.deputado_.nome||''));\n" +
  "  $('#vot-lista').innerHTML=(rows.length?rows.map(v=>{const d=v.deputado_||{};\n" +
  "    return `<div class=\"quote info\"><span style=\"display:flex;justify-content:space-between;gap:8px;align-items:center\"><span>${votoBadge(v.tipoVoto)}<b>${d.nome||'—'}</b> <small class=\"muted\">${d.siglaPartido||''}·${d.siglaUf||''}</small></span></span></div>`;}).join(''):'<p class=\"muted\">Nenhum parlamentar encontrado com esse filtro.</p>');\n" +
  "}\n" +
  "async function abrirVotacoesPL(pid,sigla){\n" +
  "  abreModalVotos('<p class=\"muted\">Carregando votações do projeto…</p>');\n" +
  "  try{const r=await fetch(camaraBase()+'/api/camara/proposicoes/'+pid+'/votacoes');const j=await r.json();const vs=j.dados||[];\n" +
  "    if(!vs.length)return abreModalVotos(`<h3>🗳️ ${sigla||'Projeto'}</h3><p class=\"muted\">Nenhuma votação nominal registrada para este projeto.</p>`);\n" +
  "    abreModalVotos(`<h3 style=\"margin-bottom:6px\">🗳️ Votações — ${sigla||'Projeto'}</h3>\n" +
  "      <p class=\"muted\" style=\"margin-bottom:8px\">${vs.length} votação(ões) registrada(s). Clique para ver como TODOS votaram:</p>\n" +
  "      ${vs.map(v=>`<div class=\"quote info\" onclick=\"abrirVotacao('${v.id}','${(sigla||'').replace(/'/g,'')}')\" style=\"cursor:pointer\"><b>${fmtData(v.data)}</b> — ${(v.descricao||'').slice(0,120)}…<br><small class=\"muted\">votação ${v.id}</small></div>`).join('')}`);\n" +
  "  }catch(e){abreModalVotos('<p class=\"muted\">Falha ao carregar votações.</p>')}\n" +
  "}\n" +
  "function verTodas(i){",
  'popups de votos');

fs.writeFileSync(P, h);
console.log('index.html OK —', n, 'substituições');
