import re

with open(r'C:\Users\euler\votabrasil\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix carregaSpotlight to hardcode Lula and Flavio
old_spotlight = r'''async function carregaSpotlight\(\)\{
  const grid=document\.getElementById\('spotGrid'\);if\(!grid\)return;
  let pres=\[\];
  try\{
    const r=await fetch\('data/candidatos-2026\.json'\);
    const d=await r\.json\(\);
    const arr=Array\.isArray\(d\)\?d:\(d\.candidatos\|\|d\.dados\|\|\[\]\);
    // Filtra candidatos a presidente \(cargo 1\)
    const candidatosPres = arr\.filter\(x=>String\(x\.cargo\)==='1'\);
    // LULA e FLAVIO BOLSONARO sao os candidatos do 2º turno \(dia 25\)
    const lula = candidatosPres\.find\(x=>\(x\.nomeUrna\|\|x\.nomeCivil\|\|''\)\.toUpperCase\(\)\.includes\('LULA'\)\);
    const bolsonaro = candidatosPres\.find\(x=>\(x\.nomeUrna\|\|x\.nomeCivil\|\|''\)\.toUpperCase\(\)\.includes\('FLAVIO BOLSONARO'\)\);
    // Se tiver Lula e Bolsonaro, exibe estes como os 2 do 2º turno
    if\(lula && bolsonaro\)\{
      pres = \[
        \{nome: lula\.nomeUrna\|\|lula\.nomeCivil\|\|'LULA', partido: lula\.partido\|\|'PT', uf: lula\.uf\|\|'BR', numero: lula\.numero\|\|'13', situacao: lula\.situacao\|\|'', foto: lula\.foto\|\|''\},
        \{nome: bolsonaro\.nomeUrna\|\|bolsonaro\.nomeCivil\|\|'FLAVIO BOLSONARO', partido: bolsonaro\.partido\|\|'PL', uf: bolsonaro\.uf\|\|'BR', numero: bolsonaro\.numero\|\|'22', situacao: bolsonaro\.situacao\|\|'', foto: bolsonaro\.foto\|\|''\}
      \];
    \}else\{
      // Lógica original: prioriza ELEITO/DEFERIDO, limitando a 2
      const prioritarios = candidatosPres\.filter\(x=>
        \['ELEITO','DEFERIDO'\]\.includes\(\(x\.situacao\|\|''\)\.toUpperCase\(\)\)
      \);
      if\(prioritarios\.length > 0\)\{
        pres = prioritarios\.slice\(0, 2\)\.map\(x=>\(\{nome:x\.nomeUrna\|\|x\.nomeCivil\|\|'',partido:x\.partido\|\|'',uf:x\.uf\|\|'BR',numero:x\.numero\|\|'',situacao:x\.situacao\|\|'',foto:x\.foto\|\|''\}\)\);
      \}else if\(candidatosPres\.length > 0\)\{
        pres = candidatosPres\.slice\(0, 2\)\.map\(x=>\(\{nome:x\.nomeUrna\|\|x\.nomeCivil\|\|'',partido:x\.partido\|\|'',uf:x\.uf\|\|'BR',numero:x\.numero\|\|'',situacao:x\.situacao\|\|'',foto:x\.foto\|\|''\}\)\);
      \}
    \}
  \}catch\(e\)\{\}
  if\(!pres\.length&&POL\.length\)\{
    pres=POL\.filter\(p=>/presidente/i\.test\(p\.cargo\|\|''\)\)\.map\(p=>\(\{nome:p\.nome,partido:p\.partido,uf:p\.uf,numero:p\.num,situacao:'',foto:p\.foto\}\)\);
  \}
  if\(!pres\.length\)\{
    grid\.innerHTML='<p class="muted" style="grid-column:1/-1;text-align:center;padding:24px">Não foi possível carregar as candidaturas agora\. <a href="pages/eleicoes-2026\.html">Ver no TSE →</a></p>';
    return;
  \}
  pres\.sort\(\(a,b\)=>\(a\.nome\|\|''\)\.localeCompare\(b\.nome\|\|''\)\);
  grid\.innerHTML=pres\.map\(spotCard\)\.join\(''\);
\}'''

new_spotlight = '''async function carregaSpotlight(){
  const grid=document.getElementById('spotGrid');if(!grid)return;
  let pres=[
    {nome: "LULA", partido: "PT", uf: "BR", numero: "13", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002542548_div.jpg"},
    {nome: "FLAVIO BOLSONARO", partido: "PL", uf: "BR", numero: "22", situacao: "DEFERIDO", foto: "https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002551544_div.jpg"}
  ];
  pres.sort((a,b)=>(a.nome||"").localeCompare(b.nome||""));
  grid.innerHTML=pres.map(spotCard).join("");
}'''

content = re.sub(old_spotlight, new_spotlight, content, flags=re.DOTALL)

# 2. Fix news function to always render from local JSON
old_news = r'''async function news\(\)\{
 /\* 1\) Snapshot embutido: renderiza na hora — o espaço nunca fica em branco \*/
 try\{
  /\* Snapshot local só sob http\(s\): Chromium bloqueia fetch\(\) de file://\. \*/
  if\(location\.protocol!=='file:'\)\{
   const rs=await fetch\('data/noticias\.json'\);
   if\(rs\.ok\)\{
    const d=await rs\.json\(\);
    if\(d\.noticias&&d\.noticias\.length&&!window\._NEWS\.length\)\{
     window\._NEWS=d\.noticias;
     nufContador\(\);renderNews\(\);
     \$\('#nstatus'\)\.textContent='Última atualização: '\+new Date\(d\.geradoEm\)\.toLocaleString\('pt-BR'\)\+' — buscando ao vivo…';
    \}
   \}
  \}
 \}catch\(e\)\{\}'''

new_news = '''async function news(){
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
 }catch(e){}'''

content = re.sub(old_news, new_news, content, flags=re.DOTALL)

with open(r'C:\Users\euler\votabrasil\index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixes applied successfully.")