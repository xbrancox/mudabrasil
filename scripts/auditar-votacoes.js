const fs=require('fs'),path=require('path');
const VOT=path.join(process.cwd(),'pages','votacoes.html');
if(!fs.existsSync(VOT)){console.log('ERRO: votacoes.html ausente');process.exit(1)}
const src=fs.readFileSync(VOT,'utf8');
const sc=Array.from(src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map(m=>m[1]);
let ok=true;
sc.forEach((s,i)=>{try{new Function(s)}catch(e){ok=false;console.log('SINTAXE script#'+i+': '+e.message)}});
const KW=new Set(['function','if','for','while','catch','return','typeof','new','switch','case','do','else','try','throw','delete','void','in','of','class','extends','super','this','await','async','yield']);
const G=new Set(['fetch','alert','prompt','confirm','encodeURIComponent','decodeURIComponent','setTimeout','setInterval','clearTimeout','clearInterval','JSON','Math','Date','Number','String','Boolean','Array','Object','Set','Map','Promise','RegExp','Error','Blob','URL','URLSearchParams','FormData','navigator','location','document','window','localStorage','sessionStorage','console','Notification','getComputedStyle','requestAnimationFrame','parseInt','parseFloat','isNaN','EventSource','structuredClone','queueMicrotask','MutationObserver','IntersectionObserver','history','screen','innerWidth','innerHeight','scrollTo','print','open','close','focus','blur','addEventListener','removeEventListener','dispatchEvent','CustomEvent','Event','AbortController','TextEncoder','TextDecoder','atob','btoa','performance','crypto']);
const all=sc.join('\n');
const defined=new Set();
for(const m of all.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g))defined.add(m[1]);
for(const m of all.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g))defined.add(m[1]);
for(const m of all.matchAll(/function\s*\(([^)]*)\)/g)){m[1].split(',').forEach(p=>{p=p.trim().split('=')[0].trim();if(p)defined.add(p)})}
const top=new Map();
sc.forEach(s=>s.split(/\r?\n/).forEach(ln=>{const m=ln.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);if(m)top.set(m[1],(top.get(m[1])||0)+1)}));
const dup=Array.from(top.entries()).filter(x=>x[1]>1).map(x=>x[0]);
const called=new Set();
for(const m of all.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g))called.add(m[1]);
const orf=Array.from(called).filter(n=>!KW.has(n)&&!G.has(n)&&!defined.has(n));
console.log('scripts: '+sc.length+' | sintaxe: '+(ok?'OK':'FALHOU'));
console.log('duplicadas(topo): '+(dup.length?dup.join(', '):'0'));
console.log('orfas: '+(orf.length?orf.join(', '):'0'));
process.exit(ok&&!dup.length&&!orf.length?0:1);