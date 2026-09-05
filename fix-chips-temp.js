const fs = require('fs');
const p = 'C:/Users/euler/MudaBrasil/index.html';
let h = fs.readFileSync(p, 'utf8');
const old = "const chips=[['GERAL','Geral'],['BR','Brasil'],...ufs.map(u=>[u,u])];";
const neu = "const chips=[['GERAL','Geral'],['BR','Brasil'],...ufs.filter(u=>u!=='BR').map(u=>[u,u])];";
if (!h.includes(old)) { console.error('âncora chips não achada'); process.exit(1); }
h = h.replace(old, neu);
fs.writeFileSync(p, h);
console.log('chips fix ok');
