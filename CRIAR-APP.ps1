cd C:\Users\euler\MudaBrasil
New-Item -ItemType Directory -Force -Path app | Out-Null

@'
{
  "name": "MudaBrasil - Voto Continuo",
  "short_name": "MudaBrasil",
  "description": "Seu voto coloca. Seu voto tira.",
  "start_url": "/mudabrasil/app/",
  "scope": "/mudabrasil/app/",
  "display": "standalone",
  "background_color": "#061a3a",
  "theme_color": "#061a3a",
  "icons": [
    { "src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" },
    { "src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "maskable" }
  ]
}
'@ | Set-Content -Path app\manifest.webmanifest -Encoding UTF8

@'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#061a3a"/><rect x="56" y="56" width="396" height="396" rx="90" fill="url(#g)"/><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ed957"/><stop offset="1" stop-color="#2ECC71"/></linearGradient></defs><text x="256" y="330" font-family="Arial Black,Arial" font-size="190" font-weight="900" fill="#061a3a" text-anchor="middle">MB</text></svg>
'@ | Set-Content -Path app\icon.svg -Encoding UTF8

@'
const CACHE='mb-app-v1';
const SHELL=['./','./index.html','./app.css','./app.js','./manifest.webmanifest','./icon.svg','../config.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.pathname.includes('/api/'))return;
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match('./index.html'))));
});
'@ | Set-Content -Path app\sw.js -Encoding UTF8

@'
:root{--bg:#061a3a;--c1:#0d2242;--c2:#123059;--gold:#FFD700;--green:#2ECC71;--red:#E74C3C;--txt:#eaf1fb;--line:#1d3a66;--mut:#9fb0c8}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{background:var(--bg);color:var(--txt);font-family:Manrope,system-ui,sans-serif;padding-bottom:76px}
h1,h2,h3{font-family:Montserrat,sans-serif}
header{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(6,26,58,.95);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
header b{font-size:18px}
.badge{margin-left:auto;border:1px solid var(--green);color:var(--green);border-radius:999px;padding:5px 10px;font-size:11px}
.btn-gold{background:var(--gold);color:#061a3a;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:800;text-decoration:none}
main{max-width:560px;margin:0 auto;padding:16px}
.card{background:var(--c1);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:14px}
.card h3{font-size:15px;margin-bottom:8px}
.mini{font-size:11px;color:var(--mut)}
.prog{height:8px;background:#22406b;border-radius:99px;margin:8px 0}.prog i{display:block;height:8px;background:var(--gold);border-radius:99px}
.plkey{color:var(--gold);font-family:Montserrat;font-size:22px;font-weight:800}
.chip{border-radius:999px;padding:4px 10px;font-size:10px;font-weight:800;display:inline-block}
.chip.blue{background:#115FCB;color:#fff}.chip.green{background:var(--green);color:#04122b}.chip.red{background:var(--red);color:#fff}.chip.grey{background:#5b6b82;color:#fff}.chip.gold{background:var(--gold);color:#061a3a}
.rounds{display:flex;gap:26px;justify-content:center;margin:18px 0}
.rounds button{width:104px;height:104px;border-radius:50%;border:none;font-size:15px;font-weight:900;cursor:pointer;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;box-shadow:0 6px 16px rgba(0,0,0,.4)}
#bSim{background:var(--green);color:#04122b}#bNao{background:var(--red)}
.ghost{background:transparent;border:1px solid var(--line);color:var(--mut);border-radius:999px;padding:8px 16px;font-size:12px;cursor:pointer;display:block;margin:0 auto}
.bar{height:22px;border-radius:99px;background:#22406b;overflow:hidden;display:flex;font-size:10px;font-weight:800;margin:4px 0}
.bar i{display:flex;align-items:center;justify-content:center}
.bar .g{background:var(--green);color:#04122b}.bar .g2{background:#9BE29B;color:#04122b}.bar .r{background:var(--red)}.bar .c{background:#5b6b82}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:10px 0}
.tile{background:var(--c2);border-radius:10px;padding:10px;text-align:center}
.tile b{display:block;font-size:20px;font-family:Montserrat}
.tile span{font-size:9px;color:var(--mut);text-transform:uppercase}
.vs{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin:10px 0}
.vs .bx{border-radius:12px;padding:12px;text-align:center;font-weight:800}
.vs .bx.v{background:var(--green);color:#04122b}.vs .bx.r{background:var(--red)}
.gapchip{background:#22406b;border-radius:8px;padding:6px 8px;font-size:10px;font-weight:800;text-align:center}
.verd{border:2px solid var(--red);border-radius:12px;padding:10px;font-weight:700;font-size:13px;margin:10px 0}
.verd.ok{border-color:var(--green)}
.cols2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.item{background:var(--c2);border-radius:12px;padding:12px;margin-bottom:10px;cursor:pointer}
.li{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px dashed var(--line);font-size:13px}
.av{width:28px;height:28px;border-radius:50%;background:var(--c2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex:none}
.pills{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.pill{border:1px solid var(--line);background:var(--c1);border-radius:999px;padding:8px 14px;font-size:12px;cursor:pointer;color:var(--txt)}
.pill.on{background:var(--gold);color:#061a3a;font-weight:800;border-color:var(--gold)}
nav.bot{position:fixed;bottom:0;left:0;right:0;background:rgba(6,26,58,.97);border-top:1px solid var(--line);display:flex;z-index:60}
nav.bot button{flex:1;background:none;border:none;color:var(--mut);padding:12px 0;font-size:11px;font-weight:700;cursor:pointer}
nav.bot button.on{color:var(--gold)}
.fab{position:fixed;right:16px;bottom:86px;width:64px;height:64px;border-radius:50%;background:var(--gold);border:none;font-size:24px;cursor:pointer;box-shadow:0 0 24px rgba(255,215,0,.5);z-index:60}
.link{color:var(--gold);font-size:12px;text-decoration:none}
.hidden{display:none}
'@ | Set-Content -Path app\app.css -Encoding UTF8

@'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#061a3a">
<title>MudaBrasil · App</title>
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Montserrat:wght@700;800&display=swap" rel="stylesheet">
<script src="../config.js"></script>
<link rel="stylesheet" href="app.css">
</head>
<body>
<header><b>MudaBrasil</b><span class="badge" id="badge">…</span><a class="btn-gold" href="../index.html">Cadastrar</a></header>
<main>
  <section id="scr-urna"></section>
  <section id="scr-detail" class="hidden"></section>
  <section id="scr-agenda" class="hidden"></section>
  <section id="scr-dna" class="hidden"></section>
</main>
<button class="fab" id="fab" title="Votar nas PLs">🗳️</button>
<nav class="bot">
  <button data-scr="urna" class="on">🗳️ Urna</button>
  <button data-scr="agenda">🗓️ Agenda</button>
  <button data-scr="dna">🧬 DNA</button>
</nav>
<script src="app.js"></script>
</body>
</html>
'@ | Set-Content -Path app\index.html -Encoding UTF8

@'
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
'@ | Set-Content -Path app\app.js -Encoding UTF8

git add -A
git commit -m "feat: APP CELULAR PWA (urna/agenda/dna) seguindo mockups"
git push origin master

Write-Host "`n=== TESTE EXAUSTIVO (aguarde o Pages) ===" -ForegroundColor Yellow
Start-Sleep -Seconds 50
$base='https://xbrancox.github.io/mudabrasil/'
$urls=@('app/','app/index.html','app/app.js','app/app.css','app/manifest.webmanifest','app/sw.js','app/icon.svg','index.html','pages/congresso.html','pages/parlamentares.html','pages/votacoes.html','pages/eleicoes-2026.html','js/header-unificado.js','config.js')
foreach($u in $urls){ try{ $r=Invoke-WebRequest ($base+$u) -UseBasicParsing -TimeoutSec 20; Write-Host ($r.StatusCode+'  OK   '+$u) -ForegroundColor Green }catch{ Write-Host ('FAIL      '+$u) -ForegroundColor Red } }
foreach($e in @('api/health','api/pls','api/votos-pl','api/camara/votacoes','api/termometro')){ try{ $r=Invoke-WebRequest ('https://mudabrasil-production-79eb.up.railway.app/'+$e) -UseBasicParsing -TimeoutSec 20; Write-Host ($r.StatusCode+'  OK   '+$e) -ForegroundColor Green }catch{ Write-Host ('FAIL      '+$e) -ForegroundColor Red } }
$h=(Invoke-WebRequest ($base+'app/app.js') -UseBasicParsing).Content
foreach($s in @('URNA EXPRESSA','PLACAR DO POVO','TOTAIS CRUZADOS','GAP','DNA','serviceWorker')){ if($h -match [regex]::Escape($s)){Write-Host ('CHECK OK  '+$s) -ForegroundColor Green}else{Write-Host ('CHECK FAIL '+$s) -ForegroundColor Red} }
Write-Host "`n=== FIM. Cole o resultado aqui se houver algum FAIL ===" -ForegroundColor Cyan
Read-Host "Enter pra fechar"