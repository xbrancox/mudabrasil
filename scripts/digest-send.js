const API=process.env.DIGEST_API,SECRET=process.env.DIGEST_SECRET;
if(!API||!SECRET){console.log("sem DIGEST_API/SECRET; nada enviado");process.exit(0)}
async function get(u){const r=await fetch(u);if(!r.ok)throw new Error(u+" HTTP "+r.status);return r.json()}
function fmt(d){try{return new Date(d).toLocaleDateString("pt-BR")}catch(e){return String(d||"")}}
async function main(){
const s=await get(API+"/api/digest/list?secret="+encodeURIComponent(SECRET));
const em=s.emails||[];
if(!em.length){console.log("nenhum inscrito");return}
let it="Nenhuma votacao nos ultimos 7 dias (recesso).";
try{
const v=await get(API+"/api/camara/votacoes?itens=40&ordem=DESC");
const cut=Date.now()-7*864e5;
const a=(v.dados||[]).filter(x=>{const d=x.dataHoraRegistro||x.dataHora;return d&&new Date(d).getTime()>=cut}).slice(0,8);
if(a.length)it=a.map(x=>"- "+fmt(x.dataHoraRegistro||x.dataHora)+" - "+String(x.descricao||x.tituloVotacao||"votacao").slice(0,140)).join("\n");
}catch(e){it="falha votacoes: "+e.message}
let tm="";
try{const t=await get(API+"/api/termometro");tm="\n\nTermometro: "+JSON.stringify(t).slice(0,240)}catch(e){}
const baseUrl = API.replace(/\/api\/.*$/, '') || 'https://xbrancox.github.io/votabrasil';
const body="Resumo semanal MeuVoto\n\n"+it+tm+"\n\nPara cancelar sua inscrição, acesse: "+baseUrl+"/pages/digest.html";
if(!process.env.SMTP_HOST||!process.env.SMTP_USER||!process.env.SMTP_PASS){console.log("SMTP incompleto; dry-run:\n"+body);return}
const nm=require("nodemailer");
const tr=nm.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:String(process.env.SMTP_SECURE||"")==="true",auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
const from=process.env.SMTP_FROM||process.env.SMTP_USER;
for(const to of em){await tr.sendMail({from,to,subject:"MeuVoto - Resumo semanal",text:body});console.log("enviado "+to)}
try{
  const logRes=await fetch(API+"/api/digest/log-send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:SECRET,ts:new Date().toISOString(),count:em.length,body:body})});
  const logJ=await logRes.json().catch(()=>({}));
  console.log("log do envio registrado: "+(logJ.ok?("total acumulado "+logJ.total):("falhou "+logRes.status)));
}catch(e){console.log("aviso: log do envio falhou (nao bloqueia proximo ciclo): "+e.message)}
}
main().catch(e=>{console.error("falha digest:",e);process.exit(1)});
