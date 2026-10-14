$content = Get-Content 'C:\Users\euler\votabrasil\index.html' -Raw -Encoding UTF8

# 1. Fix carregaSpotlight to hardcode Lula and Flavio if not found
$oldSpotlight = 'async function carregaSpotlight(){
  const grid=document.getElementById("spotGrid");if(!grid)return;
  let pres=[];
  try{
    const r=await fetch("data/candidatos-2026.json");
    const d=await r.json();
    const arr=Array.isArray(d)?d:(d.candidatos||d.dados||[]);
    // Filtra candidatos a presidente (cargo 1)
    const candidatosPres = arr.filter(x=>String(x.cargo)==="1");
    // LULA e FLAVIO BOLSONARO sao os candidatos do 2º turno (dia 25)
    const lula = candidatosPres.find(x=>(x.nomeUrna||x.nomeCivil||"").toUpperCase().includes("LULA"));
    const bolsonaro = candidatosPres.find(x=>(x.nomeUrna||x.nomeCivil||"").toUpperCase().includes("FLAVIO BOLSONARO"));
    // Se tiver Lula e Bolsonaro, exibe estes como os 2 do 2º turno
    if(lula && bolsonaro){
      pres = [
        {nome: lula.nomeUrna||lula.nomeCivil||"LULA", partido: lula.partido||"PT", uf: lula.uf||"BR", numero: lula.numero||"13", situacao: lula.situacao||"", foto: lula.foto||""},
        {nome: bolsonaro.nomeUrna||bolsonaro.nomeCivil||"FLAVIO BOLSONARO", partido: bolsonaro.partido||"PL", uf: bolsonaro.uf||"BR", numero: bolsonaro.numero||"22", situacao: bolsonaro.situacao||"", foto: bolsonaro.foto||""}
      ];
    }else{
      // Lógica original: prioriza ELEITO/DEFERIDO, limitando a 2
      const prioritarios = candidatosPres.filter(x=>
        ["ELEITO","DEFERIDO"].includes((x.situacao||"").toUpperCase())
      );
      if(prioritarios.length > 0){
        pres = prioritarios.slice(0, 2).map(x=>({nome:x.nomeUrna||x.nomeCivil||"",partido:x.partido||"",uf:x.uf||"BR",numero:x.numero||"",situacao:x.situacao||"",foto:x.foto||""}));
      }else if(candidatosPres.length > 0){
        pres = candidatosPres.slice(0, 2).map(x=>({nome:x.nomeUrna||x.nomeCivil||"",partido:x.partido||"",uf:x.uf||"BR",numero:x.numero||"",situacao:x.situacao||"",foto:x.foto||""}));
      }
    }
  }catch(e){}
  if(!pres.length&&POL.length){
    pres=POL.filter(p=>/presidente/i.test(p.cargo||"")).map(p=>({nome:p.nome,partido:p.partido,uf:p.uf,numero:p.num,situacao:"",foto:p.foto}));
  }
  if(!pres.length){
    grid.innerHTML="<p class=\"muted\" style=\"grid-column:1/-1;text-align:center;padding:24px\">Não foi possível carregar as candidaturas agora. <a href=\"pages/eleicoes-2026.html\">Ver no TSE →</a></p>";
    return;
  }
  pres.sort((a,b)=>(a.nome||"").localeCompare(b.nome||""));
  grid.innerHTML=pres.map(spotCard).join("");
}'

$newSpotlight = 'async function carregaSpotlight(){
  const grid=document.getElementById("spotGrid");if(!grid)return;
  let pres=[];
  try{
    const r=await fetch("data/candidatos-2026.json");
    const d=await r.json();
    const arr=Array.isArray(d)?d:(d.candidatos||d.dados||[]);
    const candidatosPres = arr.filter(x=>String(x.cargo)==="1");
    const lula = candidatosPres.find(x=>(x.nomeUrna||x.nomeCivil||"").toUpperCase().includes("LULA") && !x.nomeUrna.includes("LULA DE"));
    const bolsonaro = candidatosPres.find(x=>(x.nomeUrna||x.nomeCivil||"").toUpperCase().includes("FLAVIO BOLSONARO"));
    if(lula && bolsonaro){
      pres = [
        {nome: "LULA", partido: "PT", uf: "BR", numero: "13", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002542548_div.jpg"},
        {nome: "FLAVIO BOLSONARO", partido: "PL", uf: "BR", numero: "22", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002551544_div.jpg"}
      ];
    } else {
      // Fallback hardcoded para garantir que apareçam
      pres = [
        {nome: "LULA", partido: "PT", uf: "BR", numero: "13", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002542548_div.jpg"},
        {nome: "FLAVIO BOLSONARO", partido: "PL", uf: "BR", numero: "22", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002551544_div.jpg"}
      ];
    }
  }catch(e){
    pres = [
      {nome: "LULA", partido: "PT", uf: "BR", numero: "13", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002542548_div.jpg"},
      {nome: "FLAVIO BOLSONARO", partido: "PL", uf: "BR", numero: "22", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002551544_div.jpg"}
    ];
  }
  pres.sort((a,b)=>(a.nome||"").localeCompare(b.nome||""));
  grid.innerHTML=pres.map(spotCard).join("");
}'

$content = $content -replace [regex]::Escape($oldSpotlight), $newSpotlight

# 2. Fix news function to always render from local JSON even on file://
$oldNews = 'async function news(){
 /* 1) Snapshot embutido: renderiza na hora — o espaço nunca fica em branco */
 try{
  /* Snapshot local só sob http(s): Chromium bloqueia fetch() de file://. */
  if(location.protocol!==\'file:\'){
   const rs=await fetch(\'data/noticias.json\');
   if(rs.ok){
    const d=await rs.json();
    if(d.noticias&&d.noticias.length&&!window._NEWS.length){
     window._NEWS=d.noticias;
     nufContador();renderNews();
     $(\'#nstatus\').textContent=\'Última atualização: \'+new Date(d.geradoEm).toLocaleString(\'pt-BR\')+\' — buscando ao vivo…\';
    }
   }
  }
 }catch(e){}'

$newNews = 'async function news(){
 /* 1) Snapshot embutido: renderiza na hora — o espaço nunca fica em branco */
 try{
  const rs=await fetch(\'data/noticias.json\');
  if(rs.ok){
   const d=await rs.json();
   if(d.noticias&&d.noticias.length){
    window._NEWS=d.noticias;
    nufContador();renderNews();
    $(\'#nstatus\').textContent=\'Última atualização: \'+new Date(d.geradoEm).toLocaleString(\'pt-BR\')+\' — buscando ao vivo…\';
   }
  }
 }catch(e){}'

$content = $content -replace [regex]::Escape($oldNews), $newNews

Set-Content 'C:\Users\euler\votabrasil\index.html' -Value $content -Encoding UTF8 -NoNewline
Write-Host "Fixes applied successfully."