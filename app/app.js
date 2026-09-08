/* ============================================================
   MudaBrasil App â€” Urna Digital do Povo (protÃ³tipo de viabilidade)
   ============================================================ */
const API=(window.MudaBrasil&&window.MudaBrasil.API_BASE)||'';
const $=(s)=>document.querySelector(s);
const $$=(s)=>[...document.querySelectorAll(s)];
const LS={
  get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v))}
};
const UFS=['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

/* Candidatos de REFERÃŠNCIA (demonstrativos) â€” TSE 2026 pendente */
const DEMO={
  presidente:[{nome:'Ana Fontes',part:'PV',num:51},{nome:'Otto Prado',part:'PL',num:22},{nome:'Cida Moraes',part:'PT',num:13},{nome:'Rui Bacelar',part:'PSD',num:55}],
  governador:[{nome:'Tereza Kahn',part:'NOVO',num:30},{nome:'LÃ©o Sampaio',part:'PT',num:13},{nome:'Marcos Vela',part:'PL',num:22},{nome:'Duda Nunes',part:'MDB',num:15}],
  estadual:[{nome:'Caio Bittar',part:'Cidadania',num:23},{nome:'Rita Campos',part:'PSOL',num:50},{nome:'Ivo Leite',part:'UNIÃƒO',num:44},{nome:'Sofia Prado',part:'PT',num:13}]
};

const CARGOS=[
  {id:'presidente',rot:'Presidente',demo:'presidente'},
  {id:'governador',rot:'Governador',demo:'governador',ufLabel:true},
  {id:'senador',rot:'Senador',real:'Senador Federal'},
  {id:'depfed',rot:'Deputado Federal',real:'Deputado Federal'},
  {id:'estadual',rot:'Deputado Estadual/Distrital',demo:'estadual',ufLabel:true}
];

let LOCAL=LS.get('mb_local',null);
let BALLOTS=LS.get('mb_ballots',[]);
let CAND=[];
'''',hash:''};
let APUR={recorte:'nacional',uf:'',cidade:''};
let RADAR={q:'',filtro:'',fixados:LS.get('mb_fix',[])};
let CIDADES={};
let SESSAO=LS.get('mb_session',null);let scr=SESSAO?'inicio':'login';

/* ------------------ util ------------------ */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function iniciais(n){return String(n||'?').trim().split(/\s+/).map(p=>p[0]).filter(Boolean).join('').slice(0,2).toUpperCase()}
function corAvatar(n){let h=0;for(const c of String(n||''))h=(h*31+c.charCodeAt(0))%360;return 'hsl('+h+',55%,45%)'}
function fmtCode(d){return d.replace(/(.{4})/g,'$1 ').trim()}
async function sha(txt){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(txt));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=5381;for(const c of String(txt))h=((h<<5)+h+c.charCodeAt(0))>>>0;return h.toString(16).padStart(16,'0').repeat(4).slice(0,64)}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.add('hidden'),2400)}

/* ------------------ navegaÃ§Ã£o / shell ------------------ */
const NAV=[['inicio','ðŸ ','InÃ­cio'],['votar','ðŸ—³ï¸','Votar'],['apuracoes','ðŸ“Š','ApuraÃ§Ãµes'],['radar','ðŸ‘¤','Radar'],['conferir','ðŸ”','Conferir']];
function navHTML(){return '<nav class="bot">'+NAV.map(n=>'<button data-scr="'+n[0]+'" class="'+(scr===n[0]?'on':'')+'"><span>'+n[1]+'</span><span>'+n[2]+'</span></button>').join('')+'</nav>'}
function headerHTML(t,back){return '<header><button class="hback" '+(back?'data-back="1"':'style="visibility:hidden"')+'>â†</button><b>'+esc(t)+'</b><span class="badge" id="badge">â€¦</span></header>'}
function renderDiaD(){var a1=new Date('2026-10-04T08:00:00-03:00');var a2=new Date('2026-10-25T08:00:00-03:00');var ag=new Date();function dd(a){var x=Math.ceil((a-ag)/864e5);return x>=0?x:0}var el=document.getElementById('diad-dados');if(!el)return;el.innerHTML='<div class="tile"><b>'+dd(a1)+'</b><span>dias pro 1º turno (04/10)</span></div><div class="tile"><b>'+dd(a2)+'</b><span>dias pro 2º turno (25/10)</span></div>';}
function render(){
  const m=$('#app');let h='';
  if(scr==='inicio')h=headerHTML('MudaBrasil',false)+telaInicio();
  else if(scr==='votar')h=headerHTML('Votar',VOTA.passo>0)+telaVotar();
  else if(scr==='apuracoes')h=headerHTML('ApuraÃ§Ãµes',false)+telaApur();
  else if(scr==='radar')h=headerHTML('Radar PolÃ­tico',false)+telaRadar();
  else if(scr==='login')h=telaLogin();
  else h=headerHTML('Conferir Voto',false)+telaConferir();
  m.innerHTML=h+navHTML();
  bindAll();badge();renderDiaD();
}
async function badge(){
  const b=$('#badge');if(!b||!API)return;
  try{const r=await fetch(API+'/api/health',{cache:'no-store'});if(r.ok){b.textContent='sistema no ar';b.classList.remove('off')}else throw 0}
  catch(e){b.textContent='sem conexão';b.classList.add('off')}
}

/* ------------------ INÃCIO ------------------ */
function telaInicio(){return `
<section class="hero">
  <h1>O PODER EMANA DO POVO<br>NÃƒO ACABA NO DIA DA ELEIÃ‡ÃƒO.</h1>
  <h2>Seu voto coloca. Seu voto tira.</h2>
  <p>EleiÃ§Ã£o pelo celular com comprovante verificÃ¡vel.<br>ProtÃ³tipo de viabilidade, sem valor jurÃ­dico.</p>
</section>
<h3 class="sect">PÃGINAS DO APP</h3>
<div class="grid2">
  <div class="card"><b>ðŸ—³ï¸ VOTAÃ‡ÃƒO</b><small>Teclado estilo urna, 5 cargos</small><button class="btn-gold" data-go="votar">VOTAR AGORA</button></div>
  <div class="card"><b>ðŸ“Š APURAÃ‡Ã•ES</b><small>Veja quem estÃ¡ na frente</small><button class="btn-gold" data-go="apuracoes">VER AGORA</button></div>
  <div class="card"><b>ðŸ‘¤ RADAR POLÃTICO</b><small>Quem Ã©, reclamar e apoiar</small><button class="btn-gold" data-go="radar">ABRIR RADAR</button></div>
  <div class="card"><b>ðŸ” CONFERIR VOTO</b><small>Seu cÃ³digo de 20 dÃ­gitos no site</small><button class="btn-gold" data-go="conferir">CONFERIR</button></div>
</div>
<div class="chips"><span>ðŸ”’ 100% anÃ´nimo</span><span>ðŸ”— trilha de hash</span><span>ðŸ‡§ðŸ‡· fontes oficiais</span><span>âš–ï¸ regra dos 70%</span></div>
`}

/* ------------------ VOTAR ------------------ */
function progHTML(at){let h='<div class="prog5">';for(let i=0;i<5;i++)h+='<i class="'+(i<at?'on':'')+'"></i>';return h+'</div>'}
function telaVotar(){
  if(VOTA.passo===0)return telaLocal();
  if(VOTA.passo>=1&&VOTA.passo<=5)return telaCargo(VOTA.passo-1);
  if(VOTA.passo===6)return telaRevisao();
  if(VOTA.passo===7)return telaAviso();
  return telaRecibo();
}

function telaLocal(){
  const ufSel=LOCAL?LOCAL.uf:(UFS.find(u=>u==='RJ')||UFS[0]);
  return progHTML(0)+`
<div class="card loc">
  <b>ðŸ“ ONDE VOCÃŠ VOTA?</b>
  <small>A eleiÃ§Ã£o usa seu local pra montar os cargos de estado e municÃ­pio.</small>
  <button class="btn-gold wide" id="geo">ðŸ›°ï¸ ATIVAR MINHA LOCALIZAÃ‡ÃƒO</button>
  <div class="row2">
    <label>Estado<select id="uf">${UFS.map(u=>'<option '+(u===ufSel?'selected':'')+'>'+u+'</option>').join('')}</select></label>
    <label>Cidade<select id="cid"><option value="">escolha o estadoâ€¦</option></select></label>
  </div>
  <input id="cidLivre" placeholder="ou digite a cidade se nÃ£o achar">
  <p class="warn">âš ï¸ EstÃ¡ fora do seu domicÃ­lio eleitoral? Vale o local escolhido aqui.</p>
  <button class="btn-gold wide" id="okLocal">CONFIRMAR LOCAL DE VOTAÃ‡ÃƒO</button>
</div>`}

function cargoInfo(i){const c=CARGOS[i];let rot=c.rot;if(c.ufLabel)rot=c.rot+' â€” '+(LOCAL?LOCAL.uf:'BR');return {rot,demo:c.demo,real:c.real}}
function listaCandidatos(i){
  const ci=cargoInfo(i);
  if(ci.demo){return DEMO[ci.demo].map(x=>({nome:x.nome,part:x.part,num:String(x.num),demo:true}))}
  const uf=LOCAL?LOCAL.uf:'';
  const list=CAND.filter(c=>(c.position===ci.real||c.position===ci.real.replace(' Federal',''))&&(!uf||c.state===uf)).slice(0,12);
  if(!list.length){return []}
  return list.map(c=>({nome:c.name,part:c.party,num:String(c.number||''),id:c.id,demo:false}))
}

function telaCargo(i){var ufTag=(LOCAL&&LOCAL.uf)?('<div class="participacao" title="Só contador anônimo de cédulas — suas escolhas nunca saem do aparelho">👥 Participação em '+LOCAL.uf+': <b>'+BALLOTS.filter(function(b){return b.uf===LOCAL.uf}).length+' cédulas</b></div>'):'';
  const ci=cargoInfo(i);
  let lista=listaCandidatos(i);const qq=(VOTA.q||
  const sel=VOTA.selTemp;
  const aviso=(lista.length?'':'<small class="hint">Nenhum candidato real carregado pra este UF ainda (TSE pendente).</small>')+'<small class="hint">Toque no candidato pra selecionar, depois use CORRIGE/BRANCO/NULO/CONFIRMA.</small>';
  return progHTML(i)+`
${ufTag}<div class="cargo-tit"><b>${esc(ci.rot.toUpperCase())}</b><small>Toque no candidato (ou branco / nulo)</small></div><input type="search" class="search-mini" id="cargo-q" placeholder="🔍 filtrar por nome ou partido…" value="${esc(VOTA.q||
${lista.map((x,k)=>{
  const id='c'+i+'-'+k;
  const selCls=(sel&&sel.tipo==='cand'&&sel.k===k)?'sel':'';
  return `<div class="cand ${selCls}" data-sel="${i}:${k}"><span class="av" style="background:${corAvatar(x.nome)}">${iniciais(x.nome)}</span><div class="nm"><b>${esc(x.nome)} ${x.demo?'<span class="chip-demo">TSE pendente</span>':''}</b><small>${esc(x.part)} Â· ${esc(x.num||'â€”')}</small></div><span class="radio"></span></div>`
}).join('')}
<small class="hint">Os botões de voto ficam FIXOS aqui embaixo.</small><div class="urbar">
  <button class="brn" data-ur="branco">BRANCO</button>
  <button class="nul" data-ur="nulo">NULO</button>
</div>
<div class="barAcoes"><button class="btn-ghost" data-acao="voltar">← VOLTAR</button>
  <button class="btn-ghost" data-acao="corrige">CORRIGE</button>
  <button class="btn-gold" data-acao="confirma" ${!sel?'disabled':''}>CONFIRMA</button>
</div>
${aviso}`
}

function telaRevisao(){
  const rows=CARGOS.map((c,i)=>{
    const escolha=VOTA.esc[c.id];
    const texto=escolha?(escolha.tipo==='branco'?'VOTO EM BRANCO':escolha.tipo==='nulo'?'VOTO NULO':escolha.nome+' ('+escolha.part+' Â· '+escolha.num+')'):'(nÃ£o votado)';
    return `<div class="rev-row"><div class="crg"><b>${esc(cargoInfo(i).rot)}</b><small>${esc(texto)}</small></div><button class="trocar" data-trocar="${i}">trocar</button></div>`
  }).join('');
  return progHTML(5)+`
<div class="card"><h3 style="color:var(--gold);font-size:14px;letter-spacing:2px;margin-bottom:10px">REVISE SUA CÃ‰DULA</h3>${rows}
<button class="btn-gold wide" data-acao="r3" style="margin-top:14px">CONFIRMAR</button></div>`
}

function telaAviso(){return progHTML(5)+`
<div class="aviso"><b style="color:var(--gold)">â„¹ï¸ Mandato revogÃ¡vel</b><p style="margin-top:6px">VocÃª poderÃ¡ <b>revogar</b> apÃ³s a posse se o eleito nÃ£o corresponder â€” regra dos ${Math.round(((window.MudaBrasil&&window.MudaBrasil.REGRA_REVOGACAO||{percentual_cassacao:0.7}).percentual_cassacao)*100)}%: se esse percentual dos eleitores que elegeram revogam, cai o mandato.</p></div>
<button class="btn-gold wide" data-acao="gerar">ENTENDI, GERAR MEU CÃ“DIGO</button>`}

async function registrarVoto(){
  const digits=Array.from(crypto.getRandomValues(new Uint8Array(20))).map(x=>x%10).join('');
  const prev=BALLOTS.length?BALLOTS[BALLOTS.length-1].hash:('0'.repeat(64));
  const payload=JSON.stringify({digits,esc:VOTA.esc,uf:LOCAL?LOCAL.uf:'',cidade:LOCAL?LOCAL.cidade:'',ts:Date.now(),prev});
  const hash=await sha(payload);
  BALLOTS.push({code:digits,hash:hash,esc:VOTA.esc,uf:LOCAL?LOCAL.uf:'',cidade:LOCAL?LOCAL.cidade:'',ts:Date.now()});
  LS.set('mb_ballots',BALLOTS);
  VOTA.code=digits;VOTA.hash=hash;
}

function startCountdown(){
  const ov=$('#overlay');ov.classList.remove('hidden');
  let n=8;
  ov.innerHTML='<div class="num">'+n+'</div><small>Registrando sua cÃ©dulaâ€¦<br>Toque pra concluir agora</small>';
  const tick=setInterval(()=>{n--;ov.querySelector('.num').textContent=n;if(n<=0){clearInterval(tick);finalize()}},1000);
  ov.onclick=()=>{clearInterval(tick);finalize()};
  async function finalize(){
    try{await registrarVoto()}catch(e){console.error(e)}
    ov.classList.add('hidden');ov.onclick=null;VOTA.passo=8;render();
  }
}

function telaRecibo(){
  const blocos=(VOTA.code.match(/.{1,4}/g)||[]).join(' ');
  return `
<div class="receipt">
  <p class="ok-check">âœ… VOTO REGISTRADO</p>
  <div class="code-box">
    <div class="label">SEU COMPROVANTE</div>
    <div class="dig" data-acao="copiar" style="cursor:pointer">${esc(blocos)}</div><small class="hint">👆 toque no código para copiar</small>
    <div class="hash">${esc(VOTA.hash.slice(0,32))}â€¦${esc(VOTA.hash.slice(-8))}</div>
  </div>
  <p style="font-size:12px;color:var(--mut);margin-bottom:10px">Guarde este cÃ³digo: Ã© seu Ãºnico comprovante.</p>
  <button class="btn-gold" data-acao="copiar">COPIAR CÃ“DIGO</button>
  <button class="btn-ghost" data-acao="vsite" style="width:100%;margin-top:8px">CONFERIR NO SITE â†’</button>
  <button class="btn-ghost" data-acao="novo" style="width:100%;margin-top:8px">Votar de novo (demonstração)</button>
</div>`}

/* ------------------ APURAÃ‡Ã•ES ------------------ */
function donutHTML(data){
  /* data = [[nome,votos],...] */
  const cores=['#2ECC71','#FFD700','#4A90D9','#E74C3C','#9B59B6'];
  const top=data.slice(0,4);const outros=data.slice(4).reduce((a,x)=>a+x[1],0);
  const total=top.reduce((a,x)=>a+x[1],0)+outros;if(!total)return '<small class="hint">Sem votos ainda.</small>';
  const parts=[];let deg=0;
  top.forEach((x,i)=>{const p=x[1]/total*360;parts.push(`${cores[i]} ${deg}deg ${deg+p}deg`);deg+=p});
  if(outros>0){parts.push(`${cores[4]} ${deg}deg ${360}deg`)}
  const grad=`conic-gradient(${parts.join(',')})`;
  const leg=top.map((x,i)=>`<li><i style="background:${cores[i]}"></i>${esc(x[0])} <small>Â· ${Math.round(x[1]/total*100)}%</small></li>`).join('');
  const legExtra=outros>0?`<li><i style="background:${cores[4]}"></i>Outros <small>Â· ${Math.round(outros/total*100)}%</small></li>`:'';
  return `<div class="donut-row"><div class="donut-plot" style="background:${grad}"></div><ul class="donut-leg">${leg}${legExtra}</ul></div>`
}

function agregaApur(){
  /* seed demo + votos deste aparelho */
  const seed={
    presidente:[['Ana Fontes',34],['Otto Prado',29],['Cida Moraes',21],['Rui Bacelar',16]],
    governador:[['Tereza Kahn',31],['LÃ©o Sampaio',27],['Marcos Vela',24],['Duda Nunes',18]],
    senador:[['Caio Bittar',38],['Rita Campos',26],['Ivo Leite',20],['Sofia Prado',16]],
    depfed:[['Caio Bittar',33],['Rita Campos',28],['Ivo Leite',22],['Sofia Prado',17]],
    estadual:[['Caio Bittar',36],['Rita Campos',25],['Ivo Leite',21],['Sofia Prado',18]]
  };
  const uf=APUR.uf;const cid=APUR.cidade;
  const out={};
  CARGOS.forEach((c)=>{
    const map={};
    (seed[c.id]||[]).forEach(x=>map[x[0]]=(map[x[0]]||0)+x[1]);
    BALLOTS.forEach(b=>{
      if(APUR.recorte==='estado'&&b.uf!==uf)return;
      if(APUR.recorte==='cidade'&&(b.uf!==uf||b.cidade!==cid))return;
      const e=b.esc[c.id];if(!e)return;
      const nome=e.tipo==='cand'?e.nome:(e.tipo==='branco'?'Voto branco':'Voto nulo');
      map[nome]=(map[nome]||0)+1;
    });
    const arr=Object.entries(map).sort((a,b)=>b[1]-a[1]);
    out[c.id]=arr;
  });
  return out;
}

function telaApur(){
  const pills=['nacional','estado','cidade'];
  const rotMap={nacional:'NACIONAL',estado:'ESTADO',cidade:'CIDADE'};
  const selUF=APUR.uf||(UFS.find(u=>u==='RJ')||UFS[0]);
  let selects='';
  if(APUR.recorte==='estado'||APUR.recorte==='cidade'){
    selects+='<div class="row2"><label>Estado<select id="a-uf">'+UFS.map(u=>'<option '+(u===selUF?'selected':'')+'>'+u+'</option>').join('')+'</select></label>';
    if(APUR.recorte==='cidade'){
      const lista=CIDADES[selUF]||[];
      selects+='<label>Cidade<select id="a-cid">'+(lista.length?lista.map(c=>'<option '+(c===APUR.cidade?'selected':'')+'>'+c+'</option>').join(''):'<option value="">carregandoâ€¦</option>')+'</select></label>';
    } else selects+='<label></label>';
    selects+='</div>';
  }
  const dados=agregaApur();
  const cards=CARGOS.map(c=>{
    const arr=dados[c.id]||[];const rot=cargoInfo(CARGOS.indexOf(c)).rot;
    return `<div class="donut"><h4>${esc(rot)} <span class="badge-parc">apuraÃ§Ã£o parcial</span></h4>${donutHTML(arr)}</div>`;
  }).join('');
  const n=BALLOTS.length;
  return `
<div class="pills">${pills.map(p=>'<button class="pill '+(APUR.recorte===p?'on':'')+'" data-apur="'+p+'">'+rotMap[p]+'</button>').join('')}</div>
${selects}
<small class="hint">ApuraÃ§Ã£o parcial: demonstrativa (TSE pendente) + ${n} voto(s) registrado(s) neste aparelho${APUR.recorte!=='nacional'?' Â· filtrado por '+(APUR.recorte==='estado'?uf:'cidade'):''}.</small>
<div class="donut-grid">${cards}</div>`;
}

/* ------------------ RADAR ------------------ */
function telaRadar(){
  const q=RADAR.q;const f=RADAR.filtro;
  const pills=[['','Todos'],['dep','Dep. Federais'],['sen','Senadores'],['ok','Verificados']];
  let list=CAND.slice();
  if(q){const qq=q.toLowerCase();list=list.filter(c=>(c.name||'').toLowerCase().includes(qq)||(c.party||'').toLowerCase().includes(qq)||(c.state||'').toLowerCase().includes(qq))}
  if(f==='dep')list=list.filter(c=>c.position==='Deputado Federal');
  if(f==='sen')list=list.filter(c=>c.position==='Senador Federal');
  if(f==='ok')list=list.filter(c=>c.selo);
  const cards=list.slice(0,40).map(c=>{
    const chip=c.selo?'<span class="chip-ok">âœ“ VERIFICADO</span>':'';
    return `<div class="pol-card"><span class="av" style="background:${corAvatar(c.name)}">${iniciais(c.name)}</span><div class="nm" data-pol="${esc(c.id)}"><b>${esc(c.name)} ${chip}</b><small>${esc(c.party||'')} Â· ${esc(c.state||'')}</small></div><div class="acts"><button class="btn-green" data-apoio="${esc(c.id)}">APOIAR</button><button class="btn-red" data-recl="${esc(c.id)}">RECLAMAR</button><button class="btn-ghost" data-fix="${esc(c.id)}" title="Fixar pra comparar (máx. 2)">${RADAR.fixados.includes(c.id)?'📌':'📍'}</button></div></div>`
  }).join('')||'<small class="hint">Nenhum polÃ­tico encontrado. Tente outra busca.</small>';
  return `
<input type="search" class="search-mini" id="radar-q" placeholder="ðŸ” buscar por nome, partido ou UFâ€¦" value="${esc(q)}">
<div class="pills">${pills.map(p=>'<button class="pill '+(f===p[0]?'on':'')+'" data-rfiltro="'+p[0]+'">'+p[1]+'</button>').join('')}</div>
${!CAND.length?'<small class="hint">Carregando polÃ­ticos reaisâ€¦</small>':''}
${cards}${RADAR.fixados.length>=2?'<button class="btn-gold wide" style="margin-top:10px" data-acao="comparar">🆚 Comparar lado a lado</button>':'}`;
}

/* ------------------ CONFERIR ------------------ */
function telaConferir(){
  const blocos=[0,1,2,3,4].map(i=>'<input class="cf-in" data-cf="'+i+'" maxlength="4" inputmode="numeric" placeholder="0000">').join('');
  const hist=BALLOTS.slice().reverse().map((b,i)=>{
    const d=new Date(b.ts);
    return `<div class="hist-item" data-fill="${esc(b.code)}"><span class="cc">${esc(fmtCode(b.code))}</span><span class="dt">${d.toLocaleDateString('pt-BR')}</span><span class="chip-at">NO APARELHO</span></div>`
  }).join('')||'<small class="hint">Nenhum cÃ³digo registrado neste aparelho.</small>';
  return `
<div class="card">
  <h3 style="color:var(--gold);font-size:14px;letter-spacing:2px;margin-bottom:6px">CONFERIR MEU VOTO</h3>
  <small>Cole seu cÃ³digo de 20 dÃ­gitos e verifique no site oficial.</small>
  <div class="conf-inp">${blocos}</div>
  <button class="btn-gold wide" data-acao="confV">CONFERIR NO SITE</button>
  <button class="btn-ghost wide" data-acao="vSiteV" style="width:100%;margin-top:8px">ABRIR SEM CÃ“DIGO</button>
</div>
<div class="card"><h3 style="color:var(--gold);font-size:14px;letter-spacing:2px;margin-bottom:6px">MEUS CÃ“DIGOS NESTE APARELHO</h3>${hist}</div>
<small class="hint" style="display:block;text-align:center;margin-top:8px">A verificaÃ§Ã£o completa abre no site oficial MudaBrasil.</small>`;
}

/* ------------------ MODAL ------------------ */
function openModal(html){const m=$('#modal');m.innerHTML='<div class="box">'+html+'</div>';m.classList.remove('hidden');m.onclick=(e)=>{if(e.target===m)closeModal()}}
function closeModal(){$('#modal').classList.add('hidden');$('#modal').innerHTML=''}
function modalPolitico(id){
  const c=CAND.find(x=>x.id===id);if(!c)return;
  openModal(`
<h3>${esc(c.name)} ${c.selo?'<span class="chip-ok">âœ“ VERIFICADO</span>':''}</h3>
<small>${esc(c.position||'')} Â· ${esc(c.party||'')} Â· ${esc(c.state||'')}</small>
<div style="margin:12px 0;display:flex;gap:8px">
  <button class="btn-green" data-apoio="${esc(c.id)}" style="flex:1">ðŸ‘ APOIAR</button>
  <button class="btn-red" data-recl="${esc(c.id)}" style="flex:1">ðŸ‘Ž RECLAMAR</button>
</div>
<a class="btn-gold" style="display:block;text-align:center;width:100%" target="_blank" rel="noopener" href="../pages/parlamentares.html?dep=${encodeURIComponent(c.name)}">Ver ficha completa no site â†’</a>
<div class="row"><button class="btn-ghost" data-close="1">Fechar</button></div>`);
}
function modalForm(pid,tipo){
  const titulo=tipo==='apoio'?'APOIAR':'RECLAMAR';
  const cor=tipo==='apoio'?'btn-green-fill':'btn-red-fill';
  openModal(`
<h3>${titulo}</h3>
<small>PolÃ­tico: ${esc(pid)}</small>
<input type="text" id="f-tit" placeholder="TÃ­tulo (curto)" style="margin-top:10px">
<textarea id="f-desc" placeholder="${tipo==='apoio'?'Por que vocÃª apoia?':'Descreva o problema com evidÃªncias (se tiver).'}"></textarea>
<div class="row"><button class="btn-ghost" data-close="1">Cancelar</button><button class="${cor}" data-enviar="${esc(pid)}" data-tipo="${tipo}">Enviar</button></div>`);
}

function modalCedula(b){const d=new Date(b.ts);openModal('<h3>🔍 CÉDULA ENCONTRADA NESTE APARELHO</h3><small>Registrada em '+d.toLocaleString('pt-BR')+' · '+esc(b.uf||'')+(b.cidade?' · '+esc(b.cidade):'')+'</small>'+CARGOS.map((c,i)=>{const e=b.esc[c.id];const t=e?(e.tipo==='cand'?esc(e.nome)+' ('+esc(e.part)+' · '+esc(e.num||'—')+')':(e.tipo==='branco'?'VOTO EM BRANCO':'VOTO NULO')):'(não votado)';return '<div class="rev-row"><div class="crg"><b>'+esc(cargoInfo(i).rot)+'</b><small>'+t+'</small></div></div>'}).join('')+'<p style="margin:10px 0;font-size:12px;color:#c3d0e4">🔒 Exibida somente neste aparelho. Nada foi enviado a servidores.</p><div class="row"><button class="btn-ghost" data-close="1">Fechar</button></div>');}
/* ------------------ binders ------------------ */
function bindAll(){
  bindLogin();
  /* nav */
  $$('nav.bot button').forEach(b=>b.onclick=()=>{scr=b.dataset.scr;if(scr==='radar'&&!CAND.length)carregaCAND();render()});
  /* go/back */
  $$('[data-go]').forEach(b=>b.onclick=()=>{scr=b.dataset.go;if(scr==='radar'&&!CAND.length)carregaCAND();render()});
  $$('[data-back]').forEach(b=>b.onclick=()=>{
    if(scr==='votar'){VOTA.passo=Math.max(0,VOTA.passo-1);VOTA.selTemp=null;render();return}
    scr='inicio';render();
  });
  /* local */
  const geo=$('#geo');if(geo)geo.onclick=pedirGeo;
  const ufSel=$('#uf');if(ufSel){ufSel.onchange=()=>carregarCidades(ufSel.value);carregarCidades(ufSel.value)}
  const okL=$('#okLocal');if(okL)okL.onclick=confirmarLocal;
  /* candidatos */
  $$('[data-sel]').forEach(el=>el.onclick=()=>{const[i,k]=el.dataset.sel.split(':');VOTA.selTemp={tipo:'cand',k:+k};render()});
  $$('[data-ur]').forEach(el=>el.onclick=()=>{VOTA.selTemp={tipo:el.dataset.ur};render()});
  $$('[data-acao]').forEach(b=>b.onclick=acaoClick);
  /* revisÃ£o */
  $$('[data-trocar]').forEach(b=>b.onclick=()=>{const i=+b.dataset.trocar;VOTA.passo=i+1;VOTA.selTemp=null;render()});
  /* apuraÃ§Ãµes */
  $$('[data-apur]').forEach(b=>b.onclick=()=>{APUR.recorte=b.dataset.apur;render();if(APUR.recorte==='estado'||APUR.recorte==='cidade'){setTimeout(()=>{const s=$('#a-uf');if(s){s.onchange=()=>{APUR.uf=s.value;APUR.cidade='';render()};carregarCidades(s.value)}const sc=$('#a-cid');if(sc)sc.onchange=()=>{APUR.cidade=sc.value}},30)}});
  /* radar */
  '#radar-q');if(rq){rq.oninput=()=>{RADAR.q=rq.value;render();const nq=$('#radar-q');if(nq){nq.focus();nq.setSelectionRange(nq.value.length,nq.value.length)}}}
  $$('[data-rfiltro]').forEach(b=>b.onclick=()=>{RADAR.filtro=b.dataset.rfiltro;render()}); $$('[data-fix]').forEach(b=>b.onclick=function(e){e.stopPropagation();var id=b.dataset.fix;var k=RADAR.fixados.indexOf(id);if(k>=0){RADAR.fixados.splice(k,1)}else if(RADAR.fixados.length<2){RADAR.fixados.push(id)}else{toast('Máximo 2 políticos fixados');return}LS.set('mb_fix',RADAR.fixados);render()});
  $$('[data-pol]').forEach(el=>el.onclick=()=>modalPolitico(el.dataset.pol));
  $$('[data-apoio]').forEach(el=>{el.onclick=(e)=>{e.stopPropagation();modalForm(el.dataset.apoio,'apoio')}});
  $$('[data-recl]').forEach(el=>{el.onclick=(e)=>{e.stopPropagation();modalForm(el.dataset.recl,'rec')}});
  $$('[data-close]').forEach(b=>b.onclick=closeModal);
  $$('[data-enviar]').forEach(b=>b.onclick=()=>enviarForm(b.dataset.enviar,b.dataset.tipo));
  /* conferir */
  const cfins=$$('.cf-in');
  cfins.forEach((inp,i)=>{
    inp.oninput=()=>{
      inp.value=inp.value.replace(/\D/g,'').slice(0,4);
      if(inp.value.length===4&&i<4)cfins[i+1].focus();
    };
    inp.onkeydown=(e)=>{if(e.key==='Backspace'&&!inp.value&&i>0){cfins[i-1].focus();cfins[i-1].value=''}}
  });
  $$('[data-fill]').forEach(el=>el.onclick=()=>{const c=el.dataset.fill;cfins.forEach((inp,i)=>inp.value=c.slice(i*4,i*4+4))});
}

function acaoClick(e){
  const a=e.currentTarget.dataset.acao;
  if(a==='voltar'){VOTA.passo=Math.max(0,VOTA.passo-1);VOTA.selTemp=null;render()}
  else if(a==='corrige'){VOTA.selTemp=null;render()}
  else if(a==='confirma'){
    const i=VOTA.passo-1;let lista=listaCandidatos(i);const qq=(VOTA.q||
    if(!VOTA.selTemp){toast('Selecione uma opÃ§Ã£o antes de CONFIRMAR');return}
    if(VOTA.selTemp.tipo==='cand'){const c=lista[VOTA.selTemp.k];VOTA.esc[CARGOS[i].id]={tipo:'cand',nome:c.nome,part:c.part,num:c.num||''}}
    else{VOTA.esc[CARGOS[i].id]={tipo:VOTA.selTemp.tipo}}
    VOTA.selTemp=null;VOTA.passo=Math.min(6,VOTA.passo+1);try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}render();
  }
  else if(a==='r3'){VOTA.passo=7;render()}
  else if(a==='gerar'){startCountdown()}
  else if(a==='copiar'){
    const txt=VOTA.code;
    try{navigator.clipboard.writeText(txt).then(()=>toast('CÃ³digo copiado!'))}catch(e){const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('CÃ³digo copiado!')}
  }
  else if(a==='vsite'){window.open('../index.html#conferir-voto?code='+encodeURIComponent(VOTA.code),'_blank')}
  else if(a==='confV'){
    const v=$$('.cf-in').map(i=>i.value).join('');
    if(v.replace(/\D/g,'').length!==20){toast('CÃ³digo precisa de 20 dÃ­gitos');return}
    const b=BALLOTS.find(x=>x.code===v);if(b){modalCedula(b)}else{window.open('../index.html#conferir-voto?code='+encodeURIComponent(v),'_blank')}
  }
  else if(a==='exemplo'){const b=BALLOTS[BALLOTS.length-1];const c=b?b.code:'16948051304534262993';('.cf-in').forEach((inp,i)=>inp.value=c.slice(i*4,i*4+4));toast('Exemplo preenchido')}
  else if(a==='vSiteV'){window.open('../index.html#conferir-voto','_blank')}
  else if(a==='fonte'){document.body.classList.toggle('fonteg');LS.set('mb_fonteg',document.body.classList.contains('fonteg'));toast(document.body.classList.contains('fonteg')?'Fonte grande ativada':'Fonte padrão')}
  else if(a==='comparar'){var cs=RADAR.fixados.map(function(id){return CAND.find(function(c){return c.id===id})}).filter(Boolean);if(cs.length<2){toast('Fixe 2 políticos primeiro (toque no 📍)');return}openModal('<h3>🆚 Comparação lado a lado</h3><div class="cols2">'+cs.map(function(c){return '<div class="card"><b>'+esc(c.name)+'</b><small>'+esc(c.party||'')+' · '+esc(c.state||'')+'</small><a class="btn-gold" style="display:block;text-align:center;margin-top:8px" target="_blank" href="../pages/parlamentares.html?dep='+encodeURIComponent(c.name)+'">Ver ficha no site →</a></div>'}).join('')+'</div><div class="row"><button class="btn-ghost" data-close="1">Fechar</button></div>')}
  else if(a==='novo'){VOTA={passo:0,esc:{},selTemp:null,code:'',hash:''};render()}
}

function confirmarLocal(){
  const uf=$('#uf').value;
  const cidSel=$('#cid');
  const cidL=$('#cidLivre').value.trim();
  const cid=cidL||(cidSel?cidSel.value:'');
  if(!cid){toast('Escolha uma cidade ou digite');return}
  LOCAL={uf:uf,cidade:cid,fonte:cidL?'manual':(LOCAL&&LOCAL.fonte||'manual')};
  LS.set('mb_local',LOCAL);
  VOTA.passo=1;render();
}

async function pedirGeo(){
  if(!navigator.geolocation){toast('GeolocalizaÃ§Ã£o indisponÃ­vel neste aparelho');return}
  toast('Buscando sua localizaÃ§Ã£oâ€¦');
  navigator.geolocation.getCurrentPosition(async(pos)=>{
    try{
      const r=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=pt`);
      const j=await r.json();
      const ufRaw=(j.principalSubdivisionCode||'').replace(/^BR-/,'');
      const uf=UFS.includes(ufRaw)?ufRaw:(j.principalSubdivision||'').toUpperCase().slice(0,2);
      const cidade=j.city||j.locality||'';
      if(!UFS.includes(uf)){toast('UF nÃ£o identificada â€” escolha manualmente');return}
      LOCAL={uf:uf,cidade:cidade||'',fonte:'gps'};
      LS.set('mb_local',LOCAL);
      toast('Local detectado: '+uf+(cidade?' Â· '+cidade:''));
      VOTA.passo=1;render();
    }'''Falha ao resolver UF â€” escolha manualmente')}
  },(err)=>{toast('PermissÃ£o negada â€” escolha manualmente')},{timeout:12000,enableHighAccuracy:false});
}

async function carregarCidades(uf){
  if(!uf)return;
  if(CIDADES[uf]){const s=$('#cid');if(s)preencherSel(s,CIDADES[uf]);return}
  try{
    const r=await fetch(`https://servicosdados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderby=nome`);
    const j=await r.json();
    const arr=(j||[]).map(m=>m.nome);
    CIDADES[uf]=arr;
    const s=$('#cid');if(s)preencherSel(s,arr);
    const sa=$('#a-cid');if(sa)preencherSel(sa,arr);
  }catch(e){
    const s=$('#cid');if(s)s.innerHTML='<option value="">erro ao carregar â€” digite abaixo</option>';
  }
}
function preencherSel(sel,arr){
  sel.innerHTML='<option value="">escolhaâ€¦</option>'+arr.map(c=>'<option>'+c+'</option>').join('');
  if(LOCAL && (sel.id==='cid') && LOCAL.cidade && arr.includes(LOCAL.cidade)){sel.value=LOCAL.cidade}
}

async function carregaCAND(){
  if(CAND.length)return;
  if(!API){CAND=[];return}
  try{
    const r=await fetch(API+'/api/candidatos');
    const j=await r.json();
    CAND=(j.candidatos||[]).map(c=>({id:c.id,name:c.name,party:c.party,state:c.state,position:c.position,selo:!!c.selo}));
    render();
  }catch(e){CAND=[]}
}

async function flushFila(){if(!navigator.onLine)return;const fila=LS.get(
  const tit=$('#f-tit').value.trim();const desc=$('#f-desc').value.trim();
  if(!tit||!desc){toast('Preencha tÃ­tulo e descriÃ§Ã£o');return}
  const btn=$('[data-enviar]');btn.disabled=true;btn.textContent='Enviandoâ€¦';
  try{
    const r=await fetch(API+'/api/reclamacoes/public',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({politicianId:pid,tipo:tipo,titulo:tit,descricao:desc})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    toast(tipo==='apoio'?'Apoio registrado!':'ReclamaÃ§Ã£o registrada!');
    closeModal();
  }'''Erro: '+e.message);btn.disabled=false;btn.textContent='Enviar'}
}

/* ------------------ LOGIN + AVISO ------------------ */
function telaLogin(){return `
<section class="hero"><h1>ENTRAR</h1><p>Identifique-se pra votar com segurança.<br>No protótipo, você também pode entrar como convidado (anônimo).</p></section>
<div class="card"><button class="btn-gold wide" id="lg-g">G · ENTRAR COM GOOGLE</button>
<button class="btn-ghost wide" id="lg-tel" style="width:100%;margin-top:8px">📱 ENTRAR COM TELEFONE</button>
<button class="btn-ghost wide" id="lg-mail" style="width:100%;margin-top:8px">✉️ ENTRAR COM E-MAIL</button>
<button class="btn-ghost wide" id="lg-guest" style="width:100%;margin-top:8px">Continuar como convidado (anônimo)</button>
<small class="hint" style="display:block;margin-top:10px">Se implantado oficialmente: entrada via gov.br, blockchain ou outro meio oficial, com total segurança.</small></div>
<div class="card hidden" id="lg-form"><small id="lg-label"></small><input id="lg-id" placeholder="" style="margin-top:8px"><button class="btn-gold wide" id="lg-send" style="margin-top:8px">ENVIAR CÓDIGO</button><input id="lg-code" class="hidden" placeholder="código recebido" style="margin-top:8px"><button class="btn-gold wide hidden" id="lg-ok" style="margin-top:8px">CONFIRMAR</button></div>`}
let LG={modo:''};
function bindLogin(){
 const g=$('#lg-g');if(g)g.onclick=()=>{toast('Google ativa na versão implantada — use convidado ou código no protótipo');abreForm('google')};
 const t=$('#lg-tel');if(t)t.onclick=()=>abreForm('phone');
 const m=$('#lg-mail');if(m)m.onclick=()=>abreForm('email');
 const gu=$('#lg-guest');if(gu)gu.onclick=()=>{SESSAO={nome:'Convidado',tipo:'guest'};LS.set('mb_session',SESSAO);scr='inicio';render()};
 const s=$('#lg-send');if(s)s.onclick=async()=>{
   const id=$('#lg-id').value.trim();if(!id){toast('Preencha');return}
   LG.id=id;
   const rota=LG.modo==='phone'?'/api/auth/otp/send':'/api/auth/email/send';
   try{const r=await fetch(API+rota,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(LG.modo==='phone'?{phone:id}:{email:id})});
     const j=await r.json().catch(()=>({}));
     if(j&&j.code)toast('Código protótipo: '+j.code);else toast('Código simulado no protótipo: 123456');
   }'''Código simulado no protótipo: 123456')}
   $('#lg-code').classList.remove('hidden');$('#lg-ok').classList.remove('hidden');
 };
 const ok=$('#lg-ok');if(ok)ok.onclick=async()=>{
   const code=$('#lg-code').value.trim();
   const rota=LG.modo==='phone'?'/api/auth/otp/verify':'/api/auth/email/verify';
   let nome=LG.id;
   try{const r=await fetch(API+rota,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(LG.modo==='phone'?{phone:LG.id,code}:{email:LG.id,code})});
     const j=await r.json().catch(()=>({}));if(j&&j.name)nome=j.name;if(j&&j.token)LG.token=j.token;
   }catch(e){}
   SESSAO={nome:nome,tipo:LG.modo,token:LG.token||''};LS.set('mb_session',SESSAO);scr='inicio';render();toast('Bem-vindo(a), '+nome);
 };
}
function abreForm(modo){LG.modo=modo;const f=$('#lg-form');if(!f)return;f.classList.remove('hidden');
 $('#lg-label').textContent=modo==='phone'?'Digite seu celular (DDD+número)':'Digite seu e-mail';
 $('#lg-id').placeholder=modo==='phone'?'21 99999-9999':'voce@email.com';
 $('#lg-code').classList.add('hidden');$('#lg-ok').classList.add('hidden');}
function popupSimulacao(){
 if(LS.get('mb_aviso_sim',0))return;
 openModal('<h3>🧪 PROTÓTIPO EM TESTE</h3><p style="margin:8px 0">O MudaBrasil é uma <b>simulação demonstrativa</b> de votação pelo celular — nada aqui tem valor jurídico ou eleitoral.</p><p style="margin:8px 0">Se implantado oficialmente, o login será feito com <b>gov.br, blockchain ou outro meio oficial de identificação</b>, com total segurança, <b>voto secreto</b> e auditabilidade completa.</p><p style="margin:8px 0">No protótipo, suas escolhas <b>nunca saem do aparelho</b>: o código comprova participação, não o conteúdo.</p><div class="row"><button class="btn-gold" id="aviso-ok">ENTENDI, COMEÇAR</button></div>');
 const b=$('#aviso-ok');if(b)b.onclick=()=>{LS.set('mb_aviso_sim',1);closeModal()};
}/* ------------------ boot ------------------ */
(function boot(){
  render();
  carregaCAND().catch(()=>{});
  popupSimulacao();`r`n  if(LS.get(
  if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}
})();






