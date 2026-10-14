const fs = require('fs');

let content = fs.readFileSync('C:/Users/euler/votabrasil/index.html', 'utf8');

// 1. Fix carregaSpotlight to hardcode Lula and Flavio
const oldSpotlight = /async function carregaSpotlight\(\)\{[\s\S]*?grid\.innerHTML=pres\.map\(spotCard\)\.join\(''\);\n\}/;

const newSpotlight = `async function carregaSpotlight(){
  const grid=document.getElementById('spotGrid');if(!grid)return;
  let pres=[
    {nome: "LULA", partido: "PT", uf: "BR", numero: "13", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002542548_div.jpg"},
    {nome: "FLAVIO BOLSONARO", partido: "PL", uf: "BR", numero: "22", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002551544_div.jpg"}
  ];
  pres.sort((a,b)=>(a.nome||"").localeCompare(b.nome||""));
  grid.innerHTML=pres.map(spotCard).join("");
}`;

content = content.replace(oldSpotlight, newSpotlight);

// 2. Fix news function to always render from local JSON
const oldNews = /async function news\(\)\{[\s\S]*?catch\(e\)\{\}/;

const newNews = `async function news(){
 /* 1) Snapshot embutido: renderiza na hora — o espaço nunca fica em branco */
 try{
  const rs=await fetch('data/noticias.json');
  if(rs.ok){
   const d=await rs.json();
   if(d.noticias&&d.noticias.length){
    window._NEWS=d.noticias;
    nufContador();renderNews();
    $('#nstatus').textContent='Última atualização: '+new Date(d.geradoEm).toLocaleString('pt-BR')+' — buscando ao vivo…';
   }
  }
 }catch(e){}`;

content = content.replace(oldNews, newNews);

fs.writeFileSync('C:/Users/euler/votabrasil/index.html', content, 'utf8');
console.log("Fixes applied successfully.");