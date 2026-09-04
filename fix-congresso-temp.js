const fs = require('fs');
const P = 'C:/Users/euler/MudaBrasil/index.html';
let h = fs.readFileSync(P, 'utf8');
let n = 0;
function rep(from, to, label) {
  if (!h.includes(from)) { console.error('FALHOU: ' + label); process.exit(1); }
  h = h.split(from).join(to);
  n++;
}

/* ranking global do termômetro */
rep("let PLS=[];", "let PLS=[];let TERM_RANK={};", 'TERM_RANK global');

/* carregaStats: busca ranking amplo (indentação real: try com 2 espaços) */
rep(
  "  try{const r=await fetch(API_BASE+'/api/termometro');const j=await r.json();\n    if(j&&j.ok){",
  "  try{const r=await fetch(API_BASE+'/api/termometro');const j=await r.json();\n    try{const jr=await fetch(API_BASE+'/api/termometro?top=600');const jj=await jr.json();TERM_RANK={};(jj.topN||[]).slice().sort((a,b)=>b.indice-a.indice).forEach((rr,idx)=>{TERM_RANK[rr.politicianId]=idx+1;});}catch(e){}\n    if(j&&j.ok){",
  'ranking fetch');

/* renderPLS: botão votações por PL */
rep(
  "<button class=\"btn red sm\" onclick=\"toast('Não aprovo registrado.')\">Não aprovo</button><a class=\"btn sm\" href=\"https://www.camara.leg.br/proposicoes/WebFichTramitacao?idProposicao=${p.id}\" target=\"_blank\">Inteiro teor</a>",
  "<button class=\"btn red sm\" onclick=\"toast('Não aprovo registrado.')\">Não aprovo</button><button class=\"btn sm\" onclick=\"abrirVotacoesPL('${p.id}','${(p.num||'').replace(/'/g,'')}')\">🗳️ Votações</button><a class=\"btn sm\" href=\"https://www.camara.leg.br/proposicoes/WebFichTramitacao?idProposicao=${p.id}\" target=\"_blank\">Inteiro teor</a>",
  'botão votações no PL');

fs.writeFileSync(P, h);
console.log('index.html OK —', n, 'substituições');
