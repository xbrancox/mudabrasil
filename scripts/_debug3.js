const fs=require('fs'),p=require('path');
const c=fs.readFileSync(p.join(__dirname,'..','pages','votacoes.html'),'utf8');
const inputs=c.match(/<input[^>]*>/g)||[];
console.log('Total de inputs encontrados:', inputs.length);
inputs.forEach((inp,i)=>{
  if(inp.includes('nvq-')){
    console.log('\nInput nvq encontrado na posição', i);
    console.log('Conteúdo:', inp);
    console.log('Tem aria-label?', inp.includes('aria-label'));
  }
});
