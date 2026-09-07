const API=(window.MudaBrasil&&window.MudaBrasil.API_BASE)||'';
const $=s=>document.querySelector(s);
const LS={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
let PLS=[],VOT=[],VOTOS={},MAPVOT={},POVO={},fila=[],idx=0,pular=[];
const meusVotos=()=>LS.get('mb_votos_pl',{});
const meuUid=()=>{let u=LS.get('mb_uid',null);if(!u){u='u'+Math.random().toString(36).slice(2,10);LS.set('mb_uid',u)}return u};
const corte=(t,n)=>{t=(t||'').toString().trim();return t.length>n?t.slice(0,n).trim()+'…':t};
function infoPL(p){p=p||{};const ps=String(p.number||p.numero||'').split('/');const n=ps[0]||'',ano=ps[1]||'';const sig=(p.chamber||'Câmara')==='Senado'?'PLS':'PL';const desc=p.ementa||p.title||'';const id=p.id||'';return{key:sig+' '+n+'/'+ano,n:n,ano:ano,desc:desc,party:p.party||'',author:p.author||'',chamber:p.chamber||'Câmara',url:p.url||(id?('https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao='+id):('https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?numero='+n+'&ano='+ano+'&sigla='+sig))}}
function infoVot(v){v=v||{};const desc=v.descricao||'';const data=v.data||'';const id=v.id||'';return{id:id,desc:desc,data:data}}
function placar(l){const p={favor:0,contra:0,cinza:0};(l||[]).forEach(x=>p[x.t]++);p.total=(l||[]).length;return p}
function temaDe(t){t=(t||'').toLowerCase();if(/sa[uú]d|sus|hospital|m[eé]dic|vacina/.test(t))return'Saúde';if(/educa|escola|professor/.test(t))return'Educação';if(/ambient|clima|floresta/.test(t))return'Meio Ambiente';if(/econom|impost|tribut|trabalh|sal[aá]rio|icms/.test(t))return'Economia';if(/seguran|crime|penal/.test(t))return'Segurança';if(/rouanet|cultura|arte/.test(t))return'Cultura';return'Geral'}
async function votosDe(id){if(VOTOS[id])return VOTOS[id];try{const r=await fetch(API+'/api/camara/votacoes/'+id+'/votos');const j=await r.json();VOTOS[id]=(Array.isArray(j)?j:(j.dados||[])).map(v=>{const d=v.deputado_||{};const tipo=String(v.tipoVoto||'');return{nome:d.nome||'—',part:d.siglaPartido||'—',uf:d.siglaUf||'',t:/^sim$/i.test(tipo)?'favor':(/^n[ãa]o$/i.test(tipo)?'contra':'cinza')}})}catch(e){VOTOS[id]=[]}return VOTOS[id]}
async function carregaPovo(){try{POVO=await(await fetch(API+'/api/votos-pl')).json()||{}}catch(e){POVO={}}}
function barPovo(key){const p=POVO[key]||{aprovo:0,nao:0};const t=p.aprovo+p.nao;if(!t)return '<div class="mini">Placar do Povo: sem dados ainda — seja o primeiro</div>';const a=Math.round(p.aprovo/t*100);return '<div class="mini">PLACAR DO POVO ('+t+' voto'+(t>1?'s':'')+' real'+(t>1?'is':'')+')</div><div class="bar"><i class="g" style="width:'+a+'%">aprovo '+a+'%</i><i class="g2" style="width:'+(100-a)+'%">'+(100-a)+'%</i></div>'}
function renderUrna(){
  const mv=meusVotos();const pend=fila.filter(f=>!mv[f.key]&&!pular.includes(f.key));
  const tot=fila.length,done=tot-fila.filter(f=>!mv[f.key]).length;
  const f=pend[idx%Math.max(pend.length,1)];
  let h='<div class="card"><h3>🗳️ URNA EXPRESSA DO POVO</h3><div class="prog"><i style="width:'+(tot?done/tot*100:0)+'%"></i></div><div class="mini">'+done+' de '+tot+' matérias votadas</div>';
  if(!f){h+='<div class="mini" style="margin-top:12px">🎉 Você opinou sobre tudo que está pendente!</div></div>';$('#scr-urna').innerHTML=h;return}
  h+='<div style="margin-top:10px"><span class="plkey">'+f.i.key+'</span> <span class="chip blue">'+f.tema+'</span></div>';
  h+='<div class="mini">'+(f.tipo==='pl'?('👤 '+(f.i.author&&!/^(deputado|senador)/i.test(f.i.author)?f.i.author:('Deputado(a) do '+f.i.party))):'✅ JÁ VOTADA NO CONGRESSO')+'</div>';
  h+='<p class="mini" style="margin:8px 0">'+corte(f.desc,150)+'</p><a class="link" target="_blank" href="'+f.url+'">📄 inteiro teor →</a>';
  h+='<div class="rounds"><button id="bSim">👍<span>APROVO</span></button><button id="bNao">👎<span>NÃO APROVO</span></button></div>';
  h+='<button class="ghost" id="bNext">próxima PL →</button></div>';
  h+='<div class="card"><h3>📚 Todas as matérias</h3>'+fila.map(x=>'<div class="item" data-key="'+x.key+'"><b>'+x.i.key+'</b> <span class="chip '+(x.tipo==='vot'?'green':'blue')+'">'+(x.tipo==='vot'?'JÁ VOTADA':x.tema)+'</span></div>').join('')+'</div>';
  $('#scr-urna').innerHTML=h;
  $('#bSim').onclick=()=>vota(f.key,'aprovo');
  $('#bNao').onclick=()=>vota(f.key,'nao');
  $('#bNext').onclick=()=>{idx++;renderUrna()};
  document.querySelectorAll('#scr-urna .item').forEach(el=>el.onclick=()=>abreDetail(el.dataset.key));
}
function vota(key,v){const mv=meusVotos();mv[key]=v;LS.set('mb_votos_pl',mv);idx=0;renderUrna();fetch(API+'/api/votos-pl',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uid:meuUid(),pl:key,voto:v})}).then(carregaPovo).catch(()=>{})}
function abreDetail(key){
  const f=fila.find(x=>x.key===key);if(!f)return;
  const v=f.tipo==='vot'?{id:f.i.id}:MAPVOT[f.i.n+'/'+f.i.ano];
  const pc=v?placar(VOTOS[v.id]||[]):null;
  const p=POVO[key]||{aprovo:0,nao:0};const tp=p.aprovo+p.nao;const povoPct=tp?Math.round(p.aprovo/tp*100):null;
  const cong=pc&&pc.favor+pc.contra?Math.round(pc.favor/(pc.favor+pc.contra)*100):null;
  let h='<div class="card"><span class="plkey">'+f.i.key+'</span> <a class="link" target="_blank" href="'+f.url+'">📄 inteiro teor →</a><p class="mini" style="margin:8px 0">'+corte(f.desc,220)+'</p>';
  h+=barPovo(key);
  if(pc&&pc.total){
    h+='<div class="mini" style="margin-top:10px">TOTAIS CRUZADOS</div><div class="grid"><div class="tile"><b>'+pc.favor+'</b><span>a favor</span></div><div class="tile"><b>'+pc.contra+'</b><span>contra</span></div><div class="tile"><b>'+pc.cinza+'</b><span>não votaram</span></div></div>';
    if(povoPct!=null&&cong!=null){const g=Math.abs(povoPct-cong);const contra=(povoPct>=50)!==(cong>=50);
      h+='<div class="vs"><div class="bx v">Povo<br>'+povoPct+'%</div><div class="gapchip">GAP '+g+' pts<br>'+(contra?'contra o povo':'a favor do povo')+'</div><div class="bx r">Congresso<br>'+cong+'%</div></div>';
      h+='<div class="verd'+(contra?'':' ok')+'">'+(contra?'🔴 Nesta lei, o Congresso foi contra a vontade popular.':'🟢 Nesta lei, o Congresso está sincronizado com o povo.')+'</div>';}
    const partes={};(VOTOS[v.id]||[]).forEach(x=>{(partes[x.part]=partes[x.part]||{favor:0,contra:0,cinza:0})[x.t]++});
    h+='<div class="mini">VOTAÇÃO DOS PARTIDOS</div>';
    Object.entries(partes).sort((a,b)=>(b[1].favor+b[1].contra)-(a[1].favor+a[1].contra)).slice(0,6).forEach(([s,q])=>{const t=q.favor+q.contra+q.cinza;h+='<div class="li"><span class="av">'+s.slice(0,2)+'</span><div class="bar" style="flex:1"><i class="g" style="width:'+(q.favor/t*100)+'%"></i><i class="r" style="width:'+(q.contra/t*100)+'%"></i><i class="c" style="width:'+(q.cinza/t*100)+'%"></i></div></div>'});
    h+='<div class="mini" style="margin-top:8px">VOTAÇÃO DOS PARLAMENTARES</div>';
    (VOTOS[v.id]||[]).slice(0,8).forEach(x=>{h+='<div class="li"><span class="av">'+String(x.nome).slice(0,2).toUpperCase()+'</span><span style="flex:1">'+x.nome+' <span class="mini">'+x.part+'-'+x.uf+'</span></span><span class="chip '+(x.t==='favor'?'green':x.t==='contra'?'red':'grey')+'">'+(x.t==='favor'?'a favor':x.t==='contra'?'contra':'não votou')+'</span></div>'});
  } else { h+='<div class="mini" style="margin-top:10px">⚫ Sem votação nominal registrada ainda.</div>'; }
  h+='</div>';
  $('#scr-detail').innerHTML=h;
  show('detail');
}
function renderAgenda(){
  const agora=Date.now();
  const esq=PLS.filter(p=>!MAPVOT[infoPL(p).n+'/'+infoPL(p).ano]).map(p=>{const i=infoPL(p);const mov=p.updatedAt;const parada=mov&&(agora-mov)/864e5>90;
    return '<div class="item" data-key="'+i.key+'"><span class="chip '+(parada?'grey':'gold')+'">'+(parada?'PARADA HÁ +90 DIAS':'EM ANÁLISE')+'</span> <b>'+i.key+'</b><div class="mini">'+corte(i.desc,80)+'</div></div>'}).join('')||'<div class="mini">Nada pendente.</div>';
  const dir=VOT.slice(0,8).map(v=>{const i=infoVot(v);const pc=placar(VOTOS[i.id]||[]);const t=pc.favor+pc.contra;const cong=t?Math.round(pc.favor/t*100):0;const simb=pc.total===0;
    const res=simb?'<span class="chip grey">SIMBÓLICA</span>':(pc.favor>pc.contra?'<span class="chip green">APROVADA</span>':'<span class="chip red">REJEITADA</span>');
    return '<div class="item">'+res+' <b>'+corte(i.desc,60)+'</b><div class="mini">'+(simb?'sem registro nominal voto a voto':('Congresso: '+cong+'% a favor · 🪑 '+pc.cinza))+(i.data?' · '+new Date(i.data).toLocaleDateString('pt-BR'):'')+'</div></div>'}).join('')||'<div class="mini">Nenhuma votação no período.</div>';
  $('#scr-agenda').innerHTML='<div class="card"><h3>🗓️ AGENDA DO CONGRESSO</h3><div class="cols2"><div><div class="mini">SERÃO VOTADAS</div>'+esq+'</div><div><div class="mini">JÁ VOTADAS</div>'+dir+'</div></div></div>';
  document.querySelectorAll('#scr-agenda .item[data-key]').forEach(el=>el.onclick=()=>abreDetail(el.dataset.key));
}
function renderDna(){
  const mv=meusVotos();const comp=[];
  fila.forEach(f=>{const vid=f.tipo==='vot'?f.i.id:((MAPVOT[f.i.n+'/'+f.i.ano])||{}).id;const my=mv[f.key];if(!my||!vid)return;const l=VOTOS[vid]||[];if(!l.length)return;l.forEach(x=>{if(x.t==='cinza')return;comp.push({nome:x.nome,part:x.part,uf:x.uf,ok:(my==='aprovo')===(x.t==='favor')})})});
  if(!comp.length){$('#scr-dna').innerHTML='<div class="card"><h3>🧬 MEU DNA CÍVICO</h3><div class="mini">Vote em pelo menos 1 matéria <b>JÁ VOTADA</b> na Urna pra calcular sua sincronia com votos reais do plenário.</div></div>';return}
  const por={};comp.forEach(c=>{por[c.nome]=por[c.nome]||{nome:c.nome,part:c.part,uf:c.uf,t:0,ok:0};por[c.nome].t++;por[c.nome].ok+=c.ok?1:0});
  const r=Object.values(por).map(x=>({nome:x.nome,part:x.part,uf:x.uf,pct:Math.round(x.ok/x.t*100)})).sort((a,b)=>b.pct-a.pct);
  const li=x=>'<div class="li"><span class="av">'+String(x.nome).slice(0,2).toUpperCase()+'</span><span style="flex:1">'+x.nome+' <span class="mini">'+x.part+'-'+x.uf+'</span></span><b style="color:'+(x.pct>=50?'var(--green)':'var(--red)')+'">'+x.pct+'%</b></div>';
  $('#scr-dna').innerHTML='<div class="card"><h3>🧬 MEU DNA CÍVICO</h3><div class="mini">Top afinidades</div>'+r.slice(0,5).map(li).join('')+'<div class="mini" style="margin-top:10px">Top divergências</div>'+r.slice(-5).reverse().map(li).join('')+'</div>';
}
function show(s){['urna','detail','agenda','dna'].forEach(x=>{$('#scr-'+x).classList.toggle('hidden',x!==s)});document.querySelectorAll('nav.bot button').forEach(b=>b.classList.toggle('on',b.dataset.scr===s));if(s==='urna')$('#fab').classList.remove('hidden');else $('#fab').classList.add('hidden')}
document.querySelectorAll('nav.bot button').forEach(b=>b.onclick=()=>{const s=b.dataset.scr;if(s==='agenda')renderAgenda();if(s==='dna')renderDna();if(s==='urna')renderUrna();show(s)});
$('#fab').onclick=()=>{show('urna');window.scrollTo({top:0,behavior:'smooth'})};
(async function(){
  try{const h=await fetch(API+'/api/health');$('#badge').textContent=h.ok?'backend ativo':'offline'}catch(e){$('#badge').textContent='offline'}
  try{const j=await(await fetch(API+'/api/pls')).json();PLS=Array.isArray(j)?j:(j.pls||[])}catch(e){}
  try{const j=await(await fetch(API+'/api/camara/votacoes')).json();VOT=Array.isArray(j)?j:(j.dados||[])}catch(e){}
  VOT.forEach(v=>{const i=infoVot(v);const m=i.desc.match(/(?:PLC?|MPV?)[^\d]*(\d+)\/,?(\d{4})/i);if(m)MAPVOT[m[1]+'/'+m[2]]=v});
  await Promise.all([...new Set(VOT.slice(0,10).map(v=>v.id))].filter(Boolean).map(id=>votosDe(id)));
  await carregaPovo();
  fila=[];PLS.forEach(p=>{const i=infoPL(p);fila.push({tipo:'pl',key:i.key,i:i,desc:i.desc,url:i.url,tema:temaDe(i.desc)})});
  VOT.slice(0,10).forEach(v=>{const i=infoVot(v);fila.push({tipo:'vot',key:'VOT:'+i.id,i:i,desc:i.desc,url:'votacoes.html',tema:temaDe(i.desc)})});
  renderUrna();show('urna');
  if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}
})();
