const fs=require('fs');
const file='index.html';
let t=fs.readFileSync(file,'utf8');
const before=t;
let n=0;
function rm(rx,label){
  const m=t.match(rx);
  if(m && m.length){ n+=m.length; t=t.replace(rx,''); console.log('✅ removido '+m.length+'x: '+label); }
}
rm(/,\s*'Prefeito'/g, ",'Prefeito' (array linha unica)");
rm(/,\s*'Vereador'/g, ",'Vereador' (array linha unica)");
rm(/,\s*"Prefeito"/g, ',"Prefeito" (aspas duplas)');
rm(/,\s*"Vereador"/g, ',"Vereador" (aspas duplas)');
if(n===0 || t===before){ console.log('⚠️ Nada casou — NADA foi salvo.'); process.exit(1); }
const rest=(t.match(/prefeito|vereador/gi)||[]).length;
const linha=(t.split(/\r?\n/).find(l=>l.includes('CARGOS_'))||'(linha CARGOS_ não encontrada)').trim();
console.log('🧹 Menções restantes de prefeito/vereador: '+rest);
console.log('📄 Linha CARGOS_ agora: '+linha.slice(0,140));
if(rest>0){ console.log('⚠️ Ainda há menções — NADA foi salvo. Envie a saída.'); process.exit(1); }
fs.writeFileSync(file,t);
console.log('💾 index.html atualizado!');