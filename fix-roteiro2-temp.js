const fs = require('fs');
const p = 'C:/Users/euler/MudaBrasil/roteiro-testes.html';
let h = fs.readFileSync(p, 'utf8');
const a1 = "  {id:'1.15',t:'Popup: quem votou como'";
const ins = "  {id:'1.16',t:'Carrossel de notícias',s:'Na home, veja o <b>carrossel de notícias</b> (seção 02 — NOTÍCIAS).<br><b>Esperado:</b> cards com badge \"✓ Fonte verificada\" (Agência Brasil/G1/Agência Senado), badge de UF quando citada, chips de filtro (Geral/Brasil/UF), setas ‹ › e \"Ler na fonte →\" abrindo a matéria original.'},\n" + a1;
if (!h.includes(a1)) { console.error('âncora não achada'); process.exit(1); }
h = h.replace(a1, ins);
fs.writeFileSync(p, h);
console.log('roteiro: item 1.16 adicionado');
