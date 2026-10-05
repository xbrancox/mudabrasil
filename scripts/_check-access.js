const fs=require('fs'),p=require('path');
const d=p.join(__dirname,'..','pages');
const r=p.join(__dirname,'..');

// 1) Inputs sem label
console.log('=== INPUTS SEM LABEL ===');
fs.readdirSync(d).filter(f=>f.endsWith('.html')).forEach(f=>{
  const c=fs.readFileSync(p.join(d,f),'utf8');
  const inputs=c.match(/<input[^>]*>/g)||[];
  inputs.forEach(inp=>{
    if(inp.includes('type="hidden"'))return;
    const id=inp.match(/id="([^"]+)"/);
    if(id){
      if(!c.includes('for="'+id[1]+'"')){
        console.log(f,':',id[1]);
      }
    }else if(!inp.includes('aria-label')){
      console.log(f,': input sem id nem aria-label');
    }
  });
});

// 2) Botões vazios
console.log('\n=== BOTÕES VAZIOS ===');
fs.readdirSync(d).filter(f=>f.endsWith('.html')).forEach(f=>{
  const c=fs.readFileSync(p.join(d,f),'utf8');
  const btns=c.match(/<button[^>]*>\s*<\/button>/g)||[];
  if(btns.length>0){
    console.log(f,':',btns.length,'botões vazios');
    btns.forEach(b=>console.log('  ',b.trim()));
  }
});

// 3) Saltos de heading
console.log('\n=== SALTOS DE HEADING ===');
fs.readdirSync(d).filter(f=>f.endsWith('.html')).forEach(f=>{
  const c=fs.readFileSync(p.join(d,f),'utf8');
  const hs=c.match(/<h[1-6][^>]*>/g)||[];
  let last=0;
  hs.forEach(h=>{
    const l=parseInt(h.match(/<h([1-6])/)[1]);
    if(last>0&&l>last+1){
      console.log(f,': salto de h'+last+' para h'+l);
    }
    last=l;
  });
});
