const fs=require('fs');
const file='index.html';
let t=fs.readFileSync(file,'utf8');
const lines=t.split(/\r?\n/);
console.log('🔎 Ocorrências atuais de prefeito/vereador no index.html:');
let ach=0;
lines.forEach((l,i)=>{ if(/prefeito|vereador/i.test(l)){ ach++; console.log('  L'+(i+1)+': '+l.trim().slice(0,110)); } });
if(!ach){ console.log('⚠️ Nenhuma ocorrência restante — nada a fazer.'); process.exit(1); }
const before=t;
const pats=[
  [/[ \t]*\{[^{}\n]*\bid\s*:\s*['"]prefeito['"][^{}\n]*\}\s*,?\r?\n/gi,'entrada objeto prefeito'],
  [/[ \t]*\{[^{}\n]*\bid\s*:\s*['"]vereador['"][^{}\n]*\}\s*,?\r?\n/gi,'entrada objeto vereador'],
  [/[ \t]*<option[^>]*\bvalue\s*=\s*["']prefeito["'][^>]*>[\s\S]*?<\/option>[ \t]*\r?\n/gi,'option prefeito'],
  [/[ \t]*<option[^>]*\bvalue\s*=\s*["']vereador["'][^>]*>[\s\S]*?<\/option>[ \t]*\r?\n/gi,'option vereador'],
  [/[ \t]*['"]prefeito['"]\s*,[ \t]*\r?\n/gi,'string prefeito em array'],
  [/[ \t]*['"]vereador['"]\s*,[ \t]*\r?\n/gi,'string vereador em array']
];
let total=0;
for(const [rx,label] of pats){
  const m=t.match(rx);
  if(m && m.length){ total+=m.length; t=t.replace(rx,''); console.log('✅ removido '+m.length+'x: '+label); }
}
if(total===0 || t===before){ console.log('⚠️ Nenhum padrão de lista casou — NADA foi salvo. Me envie a listagem acima.'); process.exit(1); }
const rest=(t.match(/prefeito|vereador/gi)||[]).length;
console.log('\n🧹 Menções restantes (deve ser 0 ou só texto de código morto): '+rest);
fs.writeFileSync(file,t);
console.log('💾 index.html atualizado!');