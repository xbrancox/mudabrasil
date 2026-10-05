const fs=require('fs'),p=require('path');
const d=p.join(__dirname,'..','pages');
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
      console.log(f,': input sem id nem aria-label ->', inp.substring(0,80));
    }
  });
});
