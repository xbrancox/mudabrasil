const fs=require('fs'),path=require('path');
const dirs=['.','pages','app'];
let changed=[];
for(const d of dirs){
  if(!fs.existsSync(d))continue;
  for(const f of fs.readdirSync(d)){
    if(!f.endsWith('.html'))continue;
    const p=path.join(d,f);
    let t=fs.readFileSync(p,'utf8');
    const o=t;
    t=t.split('xbrancox.github.io/MudaBrZclone280826').join('xbrancox.github.io/votabrasil');
    if(t!==o){fs.writeFileSync(p,t);changed.push(p);}
  }
}
console.log('✅ URLs antigas (MudaBrZclone) corrigidas em: '+(changed.join(', ')||'(nenhuma)'));
const f2='pages/parlamentares.html';
let t=fs.readFileSync(f2,'utf8');
const a='function fixAll(){IDS.forEach(function(id){var ov=document.getElementById(id);if(ov)ensure(ov);});}';
const b='function fixAll(){IDS.forEach(function(id){if(id==="mCmp")return;var ov=document.getElementById(id);if(ov)ensure(ov);});}';
const c='IDS.forEach(function(id){var ov=document.getElementById(id);if(!ov)return;new MutationObserver';
const d2='IDS.forEach(function(id){if(id==="mCmp")return;var ov=document.getElementById(id);if(!ov)return;new MutationObserver';
let n=0;
if(t.includes(a)){t=t.split(a).join(b);n++;}
if(t.includes(c)){t=t.split(c).join(d2);n++;}
if(n){fs.writeFileSync(f2,t);}
console.log('✅ Ajustes mCmp (sem botao duplicado): '+n);