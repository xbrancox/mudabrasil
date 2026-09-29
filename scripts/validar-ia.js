// Validador da camada de IA (layout profissional) de pages/votacoes.html
// Checa: (1) sintaxe de TODOS os <script> inline, inclusive os com atributo id
//         (2) funcoes chamadas sem definicao (ignorando strings/templates/comentarios e CSS)
//         (3) atributos HTML sem aspas (o bug que corrompeu o painel v14)
//         (4) presenca/unicidade dos marcadores da camada IA
const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'pages', 'votacoes.html');
if (!fs.existsSync(FILE)) { console.log('ERRO: ' + FILE + ' nao encontrado'); process.exit(1); }
const src = fs.readFileSync(FILE, 'utf8');

let fails = 0;
const bad = (m) => { fails++; console.log('  ❌ ' + m); };
const ok = (m) => console.log('  ✅ ' + m);

// ---------- 1) sintaxe de todos os scripts inline ----------
const scripts = Array.from(src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map(m => m[1]);
console.log('\n[1] SINTAXE DOS SCRIPTS INLINE (' + scripts.length + ')');
let sintOk = true;
scripts.forEach((s, i) => {
  try { new Function(s); }
  catch (e) { sintOk = false; bad('script#' + i + ': ' + e.message); }
});
if (sintOk) ok('todos os ' + scripts.length + ' scripts compilam sem erro de sintaxe');

// ---------- 2) funcoes orfas ----------
function strip(s) {
  s = s.replace(/\/\*[\s\S]*?\*\//g, ' ');
  s = s.replace(/(^|[^:\\])\/\/[^\n]*/g, '$1 ');
  s = s.replace(/`(?:[^`\\]|\\[\s\S])*`/g, '""');
  s = s.replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
  s = s.replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
  return s;
}
const KW = new Set(['function','if','for','while','catch','return','typeof','new','switch','case','do','else','try','throw','delete','void','in','of','class','extends','super','this','await','async','yield']);
const G = new Set(['fetch','alert','prompt','confirm','encodeURIComponent','decodeURIComponent','setTimeout','setInterval','clearTimeout','clearInterval','JSON','Math','Date','Number','String','Boolean','Array','Object','Set','Map','Promise','RegExp','Error','Blob','URL','URLSearchParams','FormData','navigator','location','document','window','localStorage','sessionStorage','console','Notification','getComputedStyle','requestAnimationFrame','parseInt','parseFloat','isNaN','EventSource','structuredClone','queueMicrotask','MutationObserver','IntersectionObserver','history','screen','innerWidth','innerHeight','scrollTo','print','open','close','focus','blur','addEventListener','removeEventListener','dispatchEvent','CustomEvent','Event','AbortController','TextEncoder','TextDecoder','atob','btoa','performance','crypto','Function','Number','Symbol','WeakMap','Proxy','Reflect']);
const CSSF = new Set(['rgba','rgb','hsl','var','repeat','minmax','calc','url','translate','translateX','translateY','rotate','cubic','scale','blur','brightness','contrast','saturate','opacity','inset','clamp','min','max','abs','sign','round']);
const all = scripts.map(strip).join('\n');
const defined = new Set();
for (const m of all.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)) defined.add(m[1]);
for (const m of all.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) defined.add(m[1]);
for (const m of all.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) defined.add(m[1]);
for (const m of all.matchAll(/function\s*\(([^)]*)\)/g)) m[1].split(',').forEach(p => { p = p.trim().split('=')[0].trim(); if (/^[A-Za-z_$][\w$]*$/.test(p)) defined.add(p); });
for (const m of all.matchAll(/\(?([A-Za-z_$][\w$]*(?:\s*,\s*[A-Za-z_$][\w$]*)*)\)?\s*=>/g)) m[1].split(',').forEach(p => { p = p.trim(); if (/^[A-Za-z_$][\w$]*$/.test(p)) defined.add(p); });
const called = new Set();
for (const m of all.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) called.add(m[1]);
const orfas = Array.from(called).filter(n => !KW.has(n) && !G.has(n) && !CSSF.has(n) && !defined.has(n));
console.log('\n[2] FUNCOES CHAMADAS SEM DEFINICAO');
if (orfas.length) bad('orfas: ' + orfas.join(', ')); else ok('nenhuma funcao orfa (' + called.size + ' nomes chamados verificados)');

// ---------- 3) atributos sem aspas ----------
console.log('\n[3] ATRIBUTOS HTML SEM ASPAS');
const tags = Array.from(src.matchAll(/<[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*)?>/g)).map(m => m[0]);
const semAspas = [];
tags.forEach(t => {
  const m = t.match(/(?:^|\s)([a-zA-Z_:][-a-zA-Z0-9_:.]*)=([^\s"'><][^\s>]*)/);
  if (m) semAspas.push(m[0].trim() + '   <<<   ' + t.slice(0, 90));
});
if (semAspas.length) semAspas.slice(0, 8).forEach(s => bad(s)); else ok(tags.length + ' tags analisadas, todas com aspas');

// ---------- 4) marcadores da camada IA ----------
console.log('\n[4] MARCADORES DA CAMADA IA');
const uniq = [['id="ia-shell"', 1], ['id="ia-css"', 1], ["el('div','ia-tabs')", 1]];
uniq.forEach(([s, n]) => {
  const c = src.split(s).length - 1;
  if (c !== n) bad('esperava ' + n + 'x ' + s + ', achei ' + c); else ok(s);
});
['ia-strip', 'ia-hd', 'ia-body', 'ia-i', 'ia-col', 'iaPop', 'iaOnb', 'ia-rngb', '#tab-'].forEach(s => {
  if (src.indexOf(s) < 0) bad('faltou ' + s); 
});
ok('ganchos de estilo/comportamento presentes');

// ---------- 5) balanceamento grosseiro de divs ----------
console.log('\n[5] BALANCEAMENTO DE DIVS');
const abre = (src.match(/<div\b/gi) || []).length;
const fecha = (src.match(/<\/div>/gi) || []).length;
if (abre !== fecha) bad('<div>=' + abre + ' vs </div>=' + fecha + ' (diff ' + (abre - fecha) + ')');
else ok('divs balanceadas (' + abre + '/' + fecha + ')');

console.log('\n=== RESULTADO: ' + (fails ? ('❌ ' + fails + ' problema(s)') : '✅ TUDO OK') + ' ===');
process.exit(fails ? 1 : 0);
