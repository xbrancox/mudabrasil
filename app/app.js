'use strict';
/* ============================================================
   MudaBrasil — APP (eleição real, dentro do celular)
   Usa parlamentares REAIS em mandato (incumbentes) como candidatos
   de referência cívica — TSE oficial 2026 ainda não publicado.
   ============================================================ */
const API=(window.MudaBrasil&&window.MudaBrasil.API_BASE)||'';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const LS={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
const UFS=['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const CARGOS=['Presidente','Governador','Senador','Deputado Federal','Deputado Estadual'];
const DIGS={Presidente:2,Governador:2,Senador:3,'Deputado Federal':4,'Deputado Estadual':5};
const CORES=['#FFD700','#2ECC71','#3498db','#E74C3C','#9b59b6','#5b6b82'];

/* ============ NAV ============ */
function show(pg){
  $$('.pg').forEach(s=>s.classList.remove('active'));
  const el=$('#p-'+pg); if(el) el.classList.add('active');
  $$('.botnav button').forEach(b=>b.classList.toggle('on',b.dataset.p===pg));
  window.scrollTo({top:0,behavior:'smooth'});
  if(pg==='votar') iniciarVotacao();
  if(pg==='resultados') renderResultados();
  if(pg==='radar') carregarRadar();
}
$$('.botnav button').forEach(b=>b.onclick=()=>{
  if(b.dataset.p==='site'){ window.open('../index.html#conferir-voto','_blank'); return; }
  show(b.dataset.p);
});
$('#ctaVotar').onclick=()=>show('votar');
$('#ctaRes').onclick=()=>show('resultados');

/* ============ TOAST ============ */
function toast(msg,ms=2200){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._tm); t._tm=setTimeout(()=>t.classList.remove('show'),ms);
}

/* ============ BACKEND HEALTH ============ */
async function checkHealth(){
  const b=$('#badge');
  if(!API){b.textContent='demo';b.classList.add('off');return}
  try{const r=await fetch(API+'/api/health');const j=await r.json();
    if(r.ok&&j.ok){b.textContent='backend ativo';b.classList.remove('off')}
    else{b.textContent='offline';b.classList.add('off')}}catch(e){b.textContent='offline';b.classList.add('off')}
}

/* ============ HASH / NUMERO SINTÉTICO ============ */
async function sha256(s){
  try{const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(x=>x.toString(16).padStart(2,'0')).join('')}
  catch(e){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0}return Math.abs(h).toString(16).padEnd(64,'0')}
}
function hashInt(s){let h=5381;for(let i=0;i<s.length;i++){h=((h<<5)+h)+s.charCodeAt(i);h|=0}return Math.abs(h)}
// número sintético DETERMINÍSTICO: mesmo nome+cargo = mesmo número
function sintNumero(nome,cargo){
  const n=DIGS[cargo]||4;
  const h=hashInt((nome||'').toLowerCase()+'|'+cargo);
  let s=String(h);
  // evita número começando com 0 (mais realista) e garante N dígitos
  while(s.length<n) s=s+String(hashInt(s));
  let num=s.slice(0,n);
  if(num[0]==='0') num='1'+num.slice(1);
  return num;
}

/* ============ MEU UID ============ */
function meuUid(){let u=LS.get('mb_uid','');if(!u){u='u'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);LS.set('mb_uid',u)}return u}

/* ============ P1: INÍCIO ============ */
function donutMini(pct,cor){
  const r=24, c=2*Math.PI*r, len=c*pct/100;
  return `<svg viewBox="0 0 72 72" width="60" height="60">
    <circle cx="36" cy="36" r="${r}" fill="none" stroke="#22406b" stroke-width="8"/>
    <circle cx="36" cy="36" r="${r}" fill="none" stroke="${cor}" stroke-width="8" stroke-linecap="round"
      stroke-dasharray="${len} ${c-len}" transform="rotate(-90 36 36)"/>
    <text x="36" y="40" text-anchor="middle" fill="${cor}" font-size="13" font-weight="900" font-family="Montserrat">${pct}%</text>
  </svg>`;
}
function renderHome(){
  const v=LS.get('mb_eleicao_votos',{}); const nVotos=Object.keys(v).length;
  const completa=nVotos===CARGOS.length;
  const nConf=LS.get('mb_eleicao_codigo','')?1:0;
  const nRev=LS.get('mb_revogacoes',0);
  $('#donut-part').innerHTML=donutMini(completa?100:Math.min(99,nVotos*20+12),'#FFD700');
  $('#donut-conf').innerHTML=donutMini(nConf?100:0,'#2ECC71');
  $('#donut-rev').innerHTML=donutMini(Math.min(100,nRev*25),'#E74C3C');
  $('#n-votos').textContent=nVotos+'/'+CARGOS.length;
  $('#n-conf').textContent=nConf;
  $('#n-rev').textContent=nRev;
}

/* ============ P2: VOTAÇÃO (com fallback de parlamentares reais) ============ */
let estadoVoto={uf:LS.get('mb_uf','SP'),etapa:0,digitado:'',votos:{}};
// cache global: lista única de 594 parlamentares reais + mapas por cargo
let poolReal=[];
let porCargo={}; // { Presidente:[{nome,numero,partido,uf,sintetico:true}], ... }

async function carregarPoolReal(){
  if(poolReal.length) return;
  try{
    const r=await fetch(`${API}/api/candidatos`);
    const j=await r.json();
    poolReal=(j.candidatos||[]).map(c=>({
      nome:c.name||c.nomeUrna||'—',
      partido:c.party||c.partido||'—',
      uf:c.state||c.uf||'—',
      position:c.position||''
    }));
  }catch(e){poolReal=[]}
  // deriva listas por cargo (honestas: parlamentares reais em mandato = referência cívica)
  const senadores=poolReal.filter(c=>/senador/i.test(c.position));
  const depFed=poolReal.filter(c=>/deputado federal/i.test(c.position));
  // pra cargos que não existem no pool (presidente/governador/dep.estadual),
  // reusa os parlamentares como candidatos de referência — número sintético determinístico
  porCargo['Presidente']=poolReal.slice(0,60).map(c=>({nome:c.nome,numero:sintNumero(c.nome,'Presidente'),partido:c.partido,uf:'BR',sintetico:true}));
  // governador: filtra pela UF do eleitor, top 40
  porCargo['Governador']=poolReal.filter(c=>c.uf===estadoVoto.uf).slice(0,40).map(c=>({nome:c.nome,numero:sintNumero(c.nome,'Governador'),partido:c.partido,uf:c.uf,sintetico:true}));
  // senador: reais (position Senador)
  porCargo['Senador']=senadores.map(c=>({nome:c.nome,numero:sintNumero(c.nome,'Senador'),partido:c.partido,uf:c.uf,sintetico:true}));
  // dep federal: reais
  porCargo['Deputado Federal']=depFed.map(c=>({nome:c.nome,numero:sintNumero(c.nome,'Deputado Federal'),partido:c.partido,uf:c.uf,sintetico:true}));
  // dep estadual: filtra pela UF
  porCargo['Deputado Estadual']=poolReal.filter(c=>c.uf===estadoVoto.uf).slice(0,40).map(c=>({nome:c.nome,numero:sintNumero(c.nome,'Deputado Estadual'),partido:c.partido,uf:c.uf,sintetico:true}));
}

function renderUfChips(){
  const el=$('#ufChips'); if(!el) return;
  el.innerHTML=UFS.map(u=>`<button class="chip ${u===estadoVoto.uf?'on':''}" data-uf="${u}">${u}</button>`).join('');
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    estadoVoto.uf=b.dataset.uf; LS.set('mb_uf',estadoVoto.uf);
    // re-deriva cargos estaduais
    porCargo['Governador']=poolReal.filter(c=>c.uf===estadoVoto.uf).slice(0,40).map(c=>({nome:c.nome,numero:sintNumero(c.nome,'Governador'),partido:c.partido,uf:c.uf,sintetico:true}));
    porCargo['Deputado Estadual']=poolReal.filter(c=>c.uf===estadoVoto.uf).slice(0,40).map(c=>({nome:c.nome,numero:sintNumero(c.nome,'Deputado Estadual'),partido:c.partido,uf:c.uf,sintetico:true}));
    renderUfChips(); renderEtapa();
  });
}

function renderEtapa(){
  const cargo=CARGOS[estadoVoto.etapa];
  const lista=porCargo[cargo]||[];
  $('#cargoNome').textContent=cargo;
  $('#etapaLabel').textContent=`Cargo ${estadoVoto.etapa+1} de ${CARGOS.length} · ${lista.length} candidatos`;
  $('#progBar').style.width=((estadoVoto.etapa)/CARGOS.length*100)+'%';
  estadoVoto.digitado='';
  renderDig();
  $('#votStat').textContent=`Seu estado: ${estadoVoto.uf} · Lista de referência cívica (parlamentares em mandato)`;
}

function renderDig(){
  const cargo=CARGOS[estadoVoto.etapa];
  const lista=porCargo[cargo]||[];
  const txt=estadoVoto.digitado||'_';
  $('#digTxt').textContent=txt;
  const match=estadoVoto.digitado&&lista.find(c=>String(c.numero)===estadoVoto.digitado);
  const nb=$('#nuloBanner');
  const digLen=DIGS[cargo]||4;
  if(match){
    $('#cNome').textContent=match.nome;
    $('#cPart').textContent=`${match.partido} · Nº ${match.numero}${match.sintetico?' · ref. cívica':''}`;
    $('#candInfo').querySelector('.av').textContent=(match.nome||'?').split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
    nb.classList.add('hidden');
  } else if(estadoVoto.digitado.length>=digLen){
    $('#cNome').textContent='Nenhum candidato com esse número';
    $('#cPart').textContent='Confirmação = voto nulo';
    $('#candInfo').querySelector('.av').textContent='✗';
    nb.classList.remove('hidden');
  } else if(estadoVoto.digitado.length>0){
    // partial: mostra candidatos cujo número começa com o digitado
    const part=lista.filter(c=>String(c.numero).startsWith(estadoVoto.digitado));
    $('#cNome').textContent=part.length?part[0].nome:'Digitando…';
    $('#cPart').textContent=`${part.length} candidato(s) com esse prefixo`;
    $('#candInfo').querySelector('.av').textContent=estadoVoto.digitado;
    nb.classList.add('hidden');
  } else {
    $('#cNome').textContent='Digite o número do candidato';
    $('#cPart').textContent='Use o teclado numérico abaixo';
    $('#candInfo').querySelector('.av').textContent='?';
    nb.classList.add('hidden');
  }
}

function tecla(k){
  if(k==='del'){estadoVoto.digitado=estadoVoto.digitado.slice(0,-1);renderDig();return}
  if(k==='branco'){
    if(!confirm(`Voto em BRANCO para ${CARGOS[estadoVoto.etapa]}?\n\nO voto em branco é contabilizado mas não vai para nenhum candidato.`)) return;
    estadoVoto.votos[CARGOS[estadoVoto.etapa]]={tipo:'branco'};
    proximoCargo(); return;
  }
  const digLen=DIGS[CARGOS[estadoVoto.etapa]]||4;
  if(estadoVoto.digitado.length>=digLen) return;
  estadoVoto.digitado+=k; renderDig();
}

function corrige(){estadoVoto.digitado='';renderDig()}

function confirma(){
  const cargo=CARGOS[estadoVoto.etapa];
  const lista=porCargo[cargo]||[];
  const match=estadoVoto.digitado&&lista.find(c=>String(c.numero)===estadoVoto.digitado);
  if(!estadoVoto.digitado){toast('Digite um número primeiro');return}
  if(match){
    estadoVoto.votos[cargo]={tipo:'voto',numero:match.numero,nome:match.nome,partido:match.partido,sintetico:!!match.sintetico};
  } else {
    if(!confirm(`VOTO NULO para ${cargo}?\n\nNúmero ${estadoVoto.digitado} não corresponde a nenhum candidato.`)) return;
    estadoVoto.votos[cargo]={tipo:'nulo',numero:estadoVoto.digitado};
  }
  proximoCargo();
}

function proximoCargo(){
  estadoVoto.etapa++;
  if(estadoVoto.etapa<CARGOS.length){renderEtapa();return}
  finalizarVotacao();
}

async function finalizarVotacao(){
  const payload=JSON.stringify({uid:meuUid(),votos:estadoVoto.votos,uf:estadoVoto.uf,ts:Date.now()});
  const prev=LS.get('mb_eleicao_hash','genesis');
  const hash=await sha256(payload+prev);
  const raw=hash.replace(/\D/g,'').padEnd(20,'0').slice(0,20);
  const codigo=raw.match(/.{4}/g).join('-');
  LS.set('mb_eleicao_votos',estadoVoto.votos);
  LS.set('mb_eleicao_hash',hash);
  LS.set('mb_eleicao_codigo',codigo);
  LS.set('mb_eleicao_data',Date.now());
  renderCodigo();
  show('codigo');
}

async function iniciarVotacao(){
  renderUfChips();
  estadoVoto.etapa=0; estadoVoto.digitado=''; estadoVoto.votos={};
  $('#candInfo').querySelector('.av').textContent='…';
  $('#cNome').textContent='Carregando parlamentares reais…';
  $('#cPart').textContent='Aguarde';
  try{
    await carregarPoolReal();
    if(!poolReal.length){
      $('#cNome').textContent='Sem conexão com backend';
      $('#cPart').textContent='Verifique sua internet';
      return;
    }
    renderEtapa();
  }catch(e){
    $('#cNome').textContent='Erro ao carregar';
    $('#cPart').textContent='Tente novamente';
  }
}

$('#keypad').addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(b) tecla(b.dataset.k)});
$('#btnCorrige').onclick=corrige;
$('#btnConfirma').onclick=confirma;

/* ============ P3: CÓDIGO ============ */
function renderCodigo(){
  const c=LS.get('mb_eleicao_codigo','');
  const h=LS.get('mb_eleicao_hash','');
  const v=LS.get('mb_eleicao_votos',{});
  $('#codNum').textContent=c||'— — — —';
  $('#codHash').textContent=h?h.slice(0,32)+'…':'—';
  const list=$('#codResumoList');
  list.innerHTML=CARGOS.map(cg=>{
    const vv=v[cg]; let txt='';
    if(!vv) txt='<span>não votado</span>';
    else if(vv.tipo==='branco') txt='<span>BRANCO</span>';
    else if(vv.tipo==='nulo') txt='<span style="color:var(--red)">NULO</span>';
    else txt=`<b>${vv.nome}</b> <span>${vv.partido||''}${vv.sintetico?' · ref.':''} · Nº ${vv.numero}</span>`;
    return `<div class="item"><span>${cg}</span>${txt}</div>`;
  }).join('');
}
$('#codCopy').onclick=async()=>{const c=LS.get('mb_eleicao_codigo','');if(!c)return;try{await navigator.clipboard.writeText(c);toast('✓ Código copiado')}catch(e){toast('Não foi possível copiar')}};
$('#codShare').onclick=async()=>{const c=LS.get('mb_eleicao_codigo','');if(!navigator.share){toast('Compartilhamento indisponível');return}try{await navigator.share({title:'MudaBrasil',text:'Meu código de votação: '+c})}catch(e){}};
$('#codVer').onclick=()=>window.open('../index.html#conferir-voto','_blank');
$('#codRes').onclick=()=>show('resultados');
$('#codNov').onclick=()=>{if(confirm('Iniciar nova votação? Os votos atuais continuarão salvos no seu código.')){iniciarVotacao();show('votar')}};

/* ============ P4: RESULTADOS ============ */
function donutGrande(segs,size=140){
  const r=48,c=2*Math.PI*r;let off=0,s='';
  segs.forEach(g=>{const len=c*g.pct/100;if(len<=0)return;
    s+=`<circle r="${r}" cx="70" cy="70" fill="none" stroke="${g.color}" stroke-width="16" stroke-dasharray="${len} ${c-len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
    off+=len;
  });
  return `<svg viewBox="0 0 140 140" width="${size}" height="${size}">${s}<circle r="30" cx="70" cy="70" fill="#0d2242"/></svg>`;
}
function simShares(lista,cargo){
  if(!lista||!lista.length) return [{label:'Sem candidatos',pct:100,color:'#5b6b82'}];
  const top=lista.slice(0,5);
  const raw=top.map(c=>18+(hashInt(c.nome||c.numero||'')%22));
  const tot=raw.reduce((a,b)=>a+b,0);
  let segs=top.map((c,i)=>({label:(c.nome||'Nº '+c.numero)+' ('+(c.partido||'?')+')',pct:Math.round(raw[i]/tot*92),color:CORES[i%CORES.length]}));
  const resto=100-segs.reduce((a,b)=>a+b.pct,0);
  segs.push({label:'Brancos/Nulos',pct:Math.max(resto,1),color:'#5b6b82'});
  return segs;
}

async function renderResultados(){
  const v=LS.get('mb_eleicao_votos',{});
  if(!poolReal.length) await carregarPoolReal();
  const el=$('#resList');
  el.innerHTML=CARGOS.map(cargo=>{
    const lista=porCargo[cargo]||[];
    const segs=simShares(lista,cargo);
    const meuV=v[cargo];
    let meuTxt='';
    if(meuV){
      if(meuV.tipo==='branco') meuTxt='você votou em BRANCO';
      else if(meuV.tipo==='nulo') meuTxt='você deu voto NULO';
      else meuTxt=`seu voto: ${meuV.nome} (${meuV.partido||''})`;
    } else meuTxt='você ainda não votou neste cargo';
    const leg=segs.map(s=>`<div class="lg-item"><span class="lg-dot" style="background:${s.color}"></span><b>${s.pct}%</b> <span>${s.label}</span></div>`).join('');
    return `<div class="res-cargo">
      <h3><i class="fa-solid fa-landmark"></i> ${cargo}</h3>
      <div class="row">
        ${donutGrande(segs)}
        <div class="leg">${leg}</div>
      </div>
      ${meuTxt?`<div class="res-me"><i class="fa-solid fa-user-check"></i> ${meuTxt}</div>`:''}
    </div>`;
  }).join('');
}
$('#resRef').onclick=()=>{toast('Atualizando…');renderResultados()};

/* ============ P5: RADAR ============ */
let radarCache={all:[],loaded:false,filtro:'all',busca:''};
async function carregarRadar(){
  if(radarCache.loaded){renderRadar();return}
  $('#radList').innerHTML='<div class="pol-empty"><i class="fa-solid fa-spinner fa-spin"></i> Carregando 594 políticos…</div>';
  try{
    const r=await fetch(API+'/api/candidatos'); const j=await r.json();
    radarCache.all=(j.candidatos||[]).map(c=>({...c,position:c.position||'Deputado Federal'}));
    radarCache.loaded=true;
    renderRadar();
  }catch(e){$('#radList').innerHTML='<div class="pol-empty">❌ Não foi possível carregar políticos.</div>'}
}
function filtrarRadar(){
  const q=(radarCache.busca||'').toLowerCase().trim();
  return radarCache.all.filter(p=>{
    const pos=(p.position||'').toLowerCase();
    if(radarCache.filtro==='Deputado Federal'&&!pos.includes('deputado federal')) return false;
    if(radarCache.filtro==='Senador'&&!pos.includes('senador')) return false;
    if(radarCache.filtro==='ver'&&!p.verificado) return false;
    if(!q) return true;
    return (p.name||'').toLowerCase().includes(q)||(p.party||'').toLowerCase().includes(q)||(p.state||'').toLowerCase().includes(q);
  }).slice(0,40);
}
function renderRadar(){
  const list=filtrarRadar();
  const el=$('#radList');
  if(!list.length){el.innerHTML='<div class="pol-empty">Nenhum político encontrado.</div>';return}
  el.innerHTML=list.map(p=>{
    const ini=((p.name||'?').match(/\b\w/g)||['?']).slice(0,2).join('').toUpperCase();
    const seal=p.verificado?`<span class="pol-seal">✓ VERIFICADO</span>`:'';
    return `<div class="pol-card" data-id="${p.id}">
      <div class="pol-top">
        <div class="av">${ini}</div>
        <div class="info">
          <b>${p.name||'—'} ${seal}</b>
          <span class="mini">${p.party||'—'} · ${p.state||'—'} · ${p.position||'—'}</span>
        </div>
      </div>
      <div class="pol-acts">
        <button class="btn-rec" data-a="rec" data-id="${p.id}"><i class="fa-solid fa-thumbs-down"></i> Reclamar <span class="cnt" id="cnt-rec-${CSS.escape(p.id)}">—</span></button>
        <button class="btn-apo" data-a="apo" data-id="${p.id}"><i class="fa-solid fa-thumbs-up"></i> Apoiar <span class="cnt" id="cnt-apo-${CSS.escape(p.id)}">—</span></button>
      </div>
    </div>`;
  }).join('');
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>radarAct(b));
  list.slice(0,15).forEach(p=>radarCounts(p.id));
}
async function radarCounts(id){
  try{
    const [r1,r2]=await Promise.all([
      fetch(`${API}/api/reclamacoes?politicianId=${encodeURIComponent(id)}&limit=100`),
      fetch(`${API}/api/apoios?politicianId=${encodeURIComponent(id)}&limit=100`)
    ]);
    const j1=await r1.json().catch(()=>({}));
    const j2=await r2.json().catch(()=>({}));
    const nr=(j1.complaints||[]).length, na=(j2.supports||[]).length;
    const eR=$('#cnt-rec-'+CSS.escape(id)), eA=$('#cnt-apo-'+CSS.escape(id));
    if(eR) eR.textContent=nr; if(eA) eA.textContent=na;
  }catch(e){}
}
async function radarAct(btn){
  const id=btn.dataset.id, tipo=btn.dataset.a==='rec'?'rec':'apoio';
  const txt=prompt(tipo==='rec'?'Descreva sua reclamação (máx 200):':'Escreva seu apoio (máx 200):');
  if(!txt) return;
  try{
    const r=await fetch(`${API}/api/reclamacoes/public`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({politicianId:id,tipo,titulo:tipo==='rec'?'Reclamação':'Apoio',descricao:txt.slice(0,200)})});
    if(r.ok){toast('✓ '+((tipo==='rec')?'Reclamação registrada':'Apoio registrado'));radarCounts(id)}
    else toast('❌ Erro ao registrar');
  }catch(e){toast('❌ Falha de rede')}
}
$('#radInput').addEventListener('input',e=>{radarCache.busca=e.target.value;renderRadar()});
$$('.rad-filters .chip').forEach(c=>c.onclick=()=>{
  $$('.rad-filters .chip').forEach(x=>x.classList.remove('on')); c.classList.add('on');
  radarCache.filtro=c.dataset.f; renderRadar();
});

/* ============ BOOT ============ */
(function(){
  checkHealth();
  renderHome();
  setInterval(()=>{if($('#p-inicio').classList.contains('active')) renderHome()},2000);
})();
