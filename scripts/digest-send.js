const API=process.env.DIGEST_API,SECRET=process.env.DIGEST_SECRET;
if(!API||!SECRET){console.log("sem DIGEST_API/SECRET; nada enviado");process.exit(0)}
async function get(u){const r=await fetch(u);if(!r.ok)throw new Error(u+" HTTP "+r.status);return r.json()}
function fmt(d){try{return new Date(d).toLocaleDateString("pt-BR")}catch(e){return String(d||"")}}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
async function main(){
const s=await get(API+"/api/digest/list?secret="+encodeURIComponent(SECRET));
/* ciclo P0: usa subscribers (com topics) com fallback para emails legados */
const subs = Array.isArray(s.subscribers) && s.subscribers.length
  ? s.subscribers
  : (s.emails || []).map(e => ({ email: e, topics: [] }));
if(!subs.length){console.log("nenhum inscrito");return}

let allItems=[];
try{
const v=await get(API+"/api/camara/votacoes?itens=40&ordem=DESC");
const cut=Date.now()-7*864e5;
allItems=(v.dados||[]).filter(x=>{const d=x.dataHoraRegistro||x.dataHora;return d&&new Date(d).getTime()>=cut}).slice(0,8);
}catch(e){console.log("aviso: falha ao buscar votacoes: "+e.message)}

let tm="";
try{const t=await get(API+"/api/termometro");tm="\n\nTermometro: "+JSON.stringify(t).slice(0,240)}catch(e){}
const baseUrl = API.replace(/\/api\/.*$/, '') || 'https://xbrancox.github.io/votabrasil';

let nextIdx = 0;
try{
  const stats = await get(API+"/api/digest/stats");
  nextIdx = Number(stats.totalSent) || 0;
}catch(e){ console.log("aviso: stats falhou, pixel sem indice: "+e.message) }
const pixelUrl = baseUrl+"/api/digest/open?i="+nextIdx;

function bodyFor(sub){
  const topics=(sub.topics||[]).map(t=>String(t).toLowerCase());
  const items = topics.length
    ? allItems.filter(x => { const t = String(x.descricao||x.tituloVotacao||'').toLowerCase(); return topics.some(k=>t.indexOf(k)>=0) })
    : allItems;
  const it = items.length
    ? items.map(x=>"- "+fmt(x.dataHoraRegistro||x.dataHora)+" - "+String(x.descricao||x.tituloVotacao||"votacao").slice(0,140)).join("\n")
    : (topics.length ? "Nenhuma votacao nos ultimos 7 dias relacionada aos seus temas: "+topics.join(", ")+"." : "Nenhuma votacao nos ultimos 7 dias (recesso).");
  return "Resumo semanal MeuVoto\n\n"+it+tm+"\n\nPara cancelar: "+baseUrl+"/pages/digest.html";
}

if(!process.env.SMTP_HOST||!process.env.SMTP_USER||!process.env.SMTP_PASS){
  console.log("SMTP incompleto; dry-run por inscrito:");
  for(const sub of subs){
    const body=bodyFor(sub);
    console.log("["+sub.email+"] topics=["+(sub.topics||[]).join(",")+"]\n"+body+"\n[pixel: "+pixelUrl+"]\n");
  }
  return;
}

const nm=require("nodemailer");
const tr=nm.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:String(process.env.SMTP_SECURE||"")==="true",auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
const from=process.env.SMTP_FROM||process.env.SMTP_USER;
for(const sub of subs){
  const body=bodyFor(sub);
  const html="<div style='font-family:system-ui,sans-serif;font-size:14px;line-height:1.55;color:#1a1a1a;max-width:640px;margin:0 auto;white-space:pre-wrap'>"+escapeHtml(body)+"</div><img src='"+pixelUrl+"' width='1' height='1' alt='' style='display:block;width:1px;height:1px;opacity:0'>";
  await tr.sendMail({from,to:sub.email,subject:"MeuVoto - Resumo semanal",text:body,html:html});
  console.log("enviado "+sub.email+" (temas: "+((sub.topics||[]).join(",")||"todos")+")");
}
try{
  const logRes=await fetch(API+"/api/digest/log-send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:SECRET,ts:new Date().toISOString(),count:subs.length})});
  const logJ=await logRes.json().catch(()=>({}));
  console.log("log do envio registrado: "+(logJ.ok?("total acumulado "+logJ.total):("falhou "+logRes.status)));
}catch(e){console.log("aviso: log do envio falhou (nao bloqueia proximo ciclo): "+e.message)}
}
main().catch(e=>{console.error("falha digest:",e);process.exit(1)});
