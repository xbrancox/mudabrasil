const fs=require('fs');
let js=fs.readFileSync('templates/_wiz-js.txt','utf8');
js = js
  .replace(/const LS=\{[^}]*\};/, '/* LS definido no bloco CONFIG acima */')
  .replace(/const CARGOS=\[[\s\S]*?\];/, '/* CARGOS definido no bloco CONFIG acima */')
  .replace(/const UFS=\[[^\]]*\];/, '/* UFS definido no bloco CONFIG acima */')
  /* remove codigo do Radar Político (nao faz parte do wizard de votacao) */
  .replace(/const pols=\[[\s\S]*?renderPol\(pols\);\n/, '')
  .replace(/function filterPol\(\)\{[^\n]*\}\n/, '')
  .replace(/function opinar\([\s\S]*?\}\n/, '');

const helpers=`
/* ---------- helpers de navegacao/troca de tela ---------- */
function go(id){document.querySelectorAll('.s,.f').forEach(x=>x.classList.remove('on'));const el=document.getElementById(id);if(el)el.classList.add('on');window.scrollTo({top:0,behavior:'smooth'})}
function startVote(){renderCedula();go('f1')}
function flowGo(id){go(id)}
let tt=null;
function showToast(m,bl,fn){const t=document.getElementById('toast'),b=document.getElementById('tb');document.getElementById('tm').textContent=m;if(bl){b.style.display='block';b.textContent=bl;b.onclick=()=>{hideToast();fn&&fn()}}else{b.style.display='none'}t.style.display='flex';clearTimeout(tt);tt=setTimeout(hideToast,5500)}
function hideToast(){document.getElementById('toast').style.display='none'}

/* ---------- LOGICA DO WIZARD (pronta) ---------- */
`;

const config=`
/* ============================================================
   CONFIG — personalize so aqui
   ============================================================ */
/* URL base do backend: mesma origem (vazio) ou https://... . Em producao MeuVoto usamos Railway. */
const API=(window.MeuVoto&&window.MeuVoto.API_BASE)||'';
/* Prefixo das chaves localStorage — mude se usar o template lado a lado com outro app na mesma origem. */
const LS={rascunho:'cv_rascunho',uf:'cv_uf',session:'cv_session',comprov:'cv_comprovante'};
/* Cargos da eleicao: [rotulo, numeroTSE]. No DF a linha "Deputado Estadual" vira
   automaticamente "Deputado Distrital" (cargo TSE 8) quando a UF escolhida for DF. */
const CARGOS=[['Presidente',1],['Governador',3],['Senador',5],['Deputado Federal',6],['Deputado Estadual',7]];
const UFS=['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
`;

const headCss=`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Cédula MeuVoto — template de votação</title>
<style>
/* ============================================================
   CEDULA MEUVOTO v1 — template reutilizavel de votacao
   (extraido do app MeuVoto em producao, set/2026)
   Fluxo: f1 monte a cedula -> f2 revise -> f3 explicacao -> f4 codigo unico
   + sheet bottom de candidatos reais + toast + comprovante no aparelho.
   Personalize apenas o bloco CONFIG no script.
   Backend esperado (contrato documentado no SKILL.md cedula-votabrasil):
     GET  /api/candidatos-tse?cargo=&uf=&busca=&porPagina=
     POST /api/auth/register          -> { ok, sessionToken }
     POST /api/voto/cargo-lote        -> { ok, codigo, formatado, gravados, votos }
     POST /api/voto/conferir          -> { cargos:[...] }
     POST /api/voto/demonstracao      -> { ok, removidos }
   ============================================================ */
:root{
  /* cores da marca — troque aqui */
  --navy:#0A1628;--card:#1E293B;--gold:#FFD700;--gold2:#B8860B;
  --ggrad:linear-gradient(135deg,#FFD700,#B8860B);
  --w:#fff;--g:#94A3B8;--ok:#10B981;--bad:#EF4444;--r:16px;--rb:12px;
}
`;

const chrome=fs.readFileSync('templates/_chrome.css.txt','utf8');
const css=fs.readFileSync('templates/_wiz-css.txt','utf8').replace('</style>','');
const html=fs.readFileSync('templates/_wiz-html.txt','utf8');
const confHtml=fs.readFileSync('templates/_conf-html.txt','utf8');

const out=headCss+chrome+'\n\n/* ===== BLOCO DO WIZARD (visual pronto — nao precisa mexer) ===== */\n'+css+`</style>
</head>
<body>

<!-- ============ TELAS DO WIZARD (f1..f4 + sheet) ============ -->
`+html+`

<!-- ============ TELA CONFERIR (usa os mesmos endpoints) ============ -->
`+confHtml+`

<div id="toast" class="toast"><span id="tm"></span><button id="tb"></button></div>

<script>`+config+helpers+js+`
</script>
</body>
</html>`;

fs.writeFileSync('templates/cedula-votabrasil.html',out);
console.log('OK bytes:',out.length);
