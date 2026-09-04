const fs = require('fs');
const h = fs.readFileSync('C:/Users/euler/MudaBrasil/index.html', 'utf8');
const i = h.indexOf('function atualizaContadoresSSE');
console.log(h.slice(i, i + 700));
const s = fs.readFileSync('C:/Users/euler/MudaBrasil/pages/status.html', 'utf8');
const ids = [];
s.replace(/id="([^"]+)"/g, (m, g) => { ids.push(g); return m; });
console.log('status.html ids:', ids.slice(0, 40).join(', '));
