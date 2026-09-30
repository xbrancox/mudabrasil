// Testes do Ciclo 29: temas automaticos + "o que muda na pratica" + filtros por tema + modo cidadao
// Abordagem estatica (regex): o codigo do ciclo 29 vive dentro de um IIFE,
// entao as funcoes sao privadas. Validamos estrutura, completude e marcadores.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(ROOT,'pages','votacoes.html'),'utf8');
const m=html.match(/<script id="ciclo29">([\s\S]*?)<\/script>/);
let pass=0,fail=0;
function ok(cond,msg){if(cond){pass++;console.log('  ok '+msg)}else{fail++;console.log('  FAIL '+msg)}}
function section(n){console.log('\n['+n+']')}

section('A. MARCADORES DO CICLO 29 EM votacoes.html');
ok(/id="ciclo29"/.test(html),'script id="ciclo29" presente');
ok(m!==null,'bloco <script id="ciclo29"> extraivel');
if(!m){console.log('  (sem bloco, abortando testes funcionais)');process.exit(1)}
const code=m[1];

section('B. TOPICS_MAP (10 temas cobertos)');
const EXPECT=['educacao','saude','economia','seguranca','meio ambiente','infraestrutura','trabalho','justica','agricultura','tecnologia'];
for(const t of EXPECT){ok(new RegExp("'"+t.replace(/ /g,'\\s+')+"'\\s*:").test(code),'tema "'+t+'" presente em TOPICS_MAP')}
ok((code.match(/'[^']+'\s*:\s*\[/g)||[]).length>=10,'TOPICS_MAP tem pelo menos 10 chaves');
ok(/var TOPICS_KEYS=Object\.keys\(TOPICS_MAP\)/.test(code),'TOPICS_KEYS derivado corretamente');

section('C. FUNCOES PURAS (extracao e pratica)');
ok(/function extractTopics\(\s*txt\s*\)/.test(code),'extractTopics(txt) definida');
ok(/function praticaLine\(\s*txt\s*\)/.test(code),'praticaLine(txt) definida');
ok(/function renderTopicChips\(/.test(code),'renderTopicChips(v) definida');
ok(/function renderPratica\(/.test(code),'renderPratica(v) definida');
// praticaLine cobre 7 tipos identificados no projeto
const PRATICA_TYPES=['plc','pec','mp ','pl ','pdl','requerimento','orcamento'];
for(const p of PRATICA_TYPES){ok(new RegExp('/'+p.replace(/\s/g,'\\s').replace(/\//g,'\\/')+'/').test(code)||new RegExp(p.replace(/\s/g,'\\s'),'i').test(code),'praticaLine trata tipo: '+p)}

section('D. FILTROS POR TEMA');
ok(/function topicFilterBar\(/.test(code),'topicFilterBar() definida');
ok(/function applyTopicFilter29\(/.test(code),'applyTopicFilter29() definida (esconde cards sem match)');
ok(/window\.toggleTopicFilter29=/.test(code),'toggleTopicFilter29 exposto no window (para onclick inline)');
ok(/__c29Topics/.test(code),'estado de selecao de temas (__c29Topics) gerenciado');
ok(/data-topic=/.test(code),'cada chip tem atributo data-topic');

section('E. INJECAO NOS CARDS');
ok(/function injectIntoCards\(/.test(code),'injectIntoCards() definida');
ok(/data-c29/.test(code),'marcador data-c29 impede reprocessamento idempotente');
ok(/class="topic-chip"/.test(code),'chips de tema renderizados com classe identificavel');
ok(/class="pratica"/.test(code),'linha "o que muda na pratica" renderizada com classe identificavel');

section('F. MODO CIDADAO');
ok(/function modoCidadao\(/.test(code),'modoCidadao() definida (toggle)');
ok(/function initModoBtn\(/.test(code),'initModoBtn() cria botao flutuante');
ok(/modo-cidadao/.test(code),'classe CSS body.modo-cidadao presente');
ok(/mb_modo_cidadao/.test(code),'persistencia em localStorage mb_modo_cidadao');
ok(/Modo cidad.+: (ON|OFF)/i.test(code),'label do botao indica ON/OFF');

section('G. OBSERVER DE EXECUCAO');
ok(/new MutationObserver/.test(code),'MutationObserver roda inject a cada mutacao do DOM');
ok(/DOMContentLoaded/.test(code),'escuta DOMContentLoaded');
ok(/addEventListener\(['"]load['"]/.test(code),'escuta window.load');

section('H. PAGINA DE METODOLOGIA PUBLICA');
const metPath=path.join(ROOT,'pages','metodologia.html');
ok(fs.existsSync(metPath),'pages/metodologia.html existe');
if(fs.existsSync(metPath)){
  const met=fs.readFileSync(metPath,'utf8');
  ok(/Coer[eê]ncia/i.test(met),'explica coerencia com a bancada');
  ok(/simb[óo]lica/i.test(met),'explica simbolica x nominal');
  ok(/sem valor legal/i.test(met),'disclaimer de prototipo sem valor legal');
  ok(/dadosabertos\.camara/i.test(met),'cita fonte oficial da Camara');
  ok(/LGPD|lei de prote[eç][aã]o de dados/i.test(met),'menciona LGPD/privacidade');
  ok(/recesso/i.test(met),'menciona comportamento em recesso');
  ok(/id="metPage"|metPage|Metodologia/.test(met),'marcador de pagina');
}

section('I. CI REGISTRA O TESTE');
const ci=fs.readFileSync(path.join(ROOT,'.github','workflows','ci.yml'),'utf8');
ok(/testar-ciclo29\.js/.test(ci),'ci.yml executa scripts/testar-ciclo29.js');

console.log('\n=== RESULTADO: '+(fail===0?'TODOS PASSARAM ('+pass+')':fail+' FALHAS / '+pass+' OK')+' ===');
process.exit(fail===0?0:1);
