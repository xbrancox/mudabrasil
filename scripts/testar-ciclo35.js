const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const VOT=path.join(ROOT,'pages','votacoes.html');
const PKG=path.join(ROOT,'package.json');
const CI=path.join(ROOT,'.github','workflows','ci.yml');

let pass=0,fail=0;
function ok(label,cond,info){
  if(cond){console.log('  \x1b[32m✅\x1b[0m '+label+(info?' ('+info+')':''));pass++}
  else{console.log('  \x1b[31m❌\x1b[0m '+label+(info?' ('+info+')':''));fail++}
}

console.log('\n[A] PACKAGE.JSON - web-push dependency');
const pkg=JSON.parse(fs.readFileSync(PKG,'utf8'));
ok('web-push in dependencies', pkg.dependencies && pkg.dependencies['web-push']);
ok('web-push version pinned', /^\^3\./.test(pkg.dependencies['web-push']||''));
ok('nodemailer still present', pkg.dependencies && pkg.dependencies.nodemailer);

console.log('\n[B] VOTACOES.HTML - ficha() with jsPDF');
const vot=fs.readFileSync(VOT,'utf8');
ok('fichaH variable declared', /var fichaH=['"]/.test(vot));
ok('jsPDF check in ficha', /if\(window\.jspdf&&window\.jspdf\.jsPDF\)/.test(vot));
ok('doc.save for ficha PDF', /doc\.save\(['"]meuvoto-ficha-/.test(vot));
ok('fallback window.print() preserved in ficha', /console\.warn\(\['\[\]ficha\]'?\]/.test(vot) || /\[ficha\] jsPDF falhou/.test(vot));
ok('A4 format', /format:['"]a4['"]/.test(vot));
ok('placar section in PDF', /Sim:.*Nao:.*Abstencao:.*Presentes:/.test(vot));
ok('meus deputados section in PDF', /Seus deputados/.test(vot));
ok('footer with fonte in PDF', /dadosabertos\.camara\.leg\.br/.test(vot));

console.log('\n[C] CI YML - ciclo 35 step');
const ci=fs.readFileSync(CI,'utf8');
ok('ci.yml has testar-ciclo35.js', /testar-ciclo35\.js/.test(ci));
ok('ciclo 35 step name', /ciclo 35.*fichaPdf/i.test(ci));

console.log('\n[D] SYNTAX');
const sc=Array.from(vot.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map(m=>m[1]);
let allOk=true;
sc.forEach((s,i)=>{try{new Function(s)}catch(e){allOk=false;console.log('   SINTAXE #'+i+': '+e.message)}});
ok('all '+sc.length+' scripts compile', allOk);

console.log('\n[E] SERVER PUSH ROUTES');
const srv=fs.readFileSync(path.join(ROOT,'server','index.js'),'utf8');
ok('/api/push/vapid-public route', /\/api\/push\/vapid-public/.test(srv));
ok('/api/digest/subscribe-push route', /\/api\/digest\/subscribe-push/.test(srv));
ok('reads VAPID_PUBLIC_KEY', /process\.env\.VAPID_PUBLIC_KEY/.test(srv));

console.log('\n=== RESULT: '+(fail===0?'\x1b[32m':'\x1b[31m')+pass+'/'+(pass+fail)+' assertions passed\x1b[0m ===\n');
process.exit(fail===0?0:1);
