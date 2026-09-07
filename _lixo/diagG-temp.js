const fs = require('fs');
const h = fs.readFileSync('C:/Users/euler/MudaBrasil/index.html', 'utf8');
const lines = h.split('\n');
const idx = [];
lines.forEach((l, i) => { if (l.includes('homeNews') || l.includes('carregaHomeNews') || l.includes('ncard')) idx.push(i + 1); });
console.log('linhas:', idx.join(', '));
const first = idx[0] - 2;
console.log(lines.slice(first, first + 14).map((x, j) => (first + 1 + j) + ': ' + x.slice(0, 200)).join('\n'));
