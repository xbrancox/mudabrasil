const fs = require('fs');
const html = fs.readFileSync('C:/Users/euler/MudaBrasil/pages/termometro.html', 'utf8');
['demo-notice', 'source-badge', 'pol-search', 'm-ativos', 'pol-list'].forEach(id => console.log(id + ':', html.includes(id)));
const h = fs.readFileSync('C:/Users/euler/MudaBrasil/js/thermometer.js', 'utf8');
h.split('\n').forEach((l, i) => {
  if (/style\.display|style\.visibility/.test(l)) console.log((i + 1) + ': ' + l.trim().slice(0, 130));
});
