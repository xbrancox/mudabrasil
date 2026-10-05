const fs=require('fs'),p=require('path');
const d=p.join(__dirname,'..','pages');
fs.readdirSync(d).filter(f=>f.endsWith('.html')).forEach(f=>{
  const c=fs.readFileSync(p.join(d,f),'utf8');
  if(!c.includes('name="description"'))console.log('SEM_DESC:',f);
  if(!c.includes('name="viewport"'))console.log('SEM_VIEWPORT:',f);
});
