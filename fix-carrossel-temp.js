const fs = require('fs');
const P = 'C:/Users/euler/MudaBrasil/index.html';
let h = fs.readFileSync(P, 'utf8');
let n = 0;
function rep(from, to, label) {
  if (!h.includes(from)) { console.error('FALHOU: ' + label); process.exit(1); }
  h = h.split(from).join(to);
  n++;
}

/* 1) remove a seção 02 — ACOMPANHAMENTO (donuts fake) e renomeia 03 → 02 NOTÍCIAS */
rep(
  '<div style="margin-top:50px"><span class="kick">02 — ACOMPANHAMENTO</span><h2 style="margin-top:8px">Acompanhe quem está na frente</h2><p class="muted">Preferência do eleitorado por cargo (recorte UF ',
  '<!-- seção ACOMPANHAMENTO removida em 04/09 (dados sintéticos) -->\n<div style="margin-top:50px"><!-- antigo 02 ACOMPANHAMENTO --></div><div style="margin-top:50px"><span class="kick">02 — ACOMPANHAMENTO</span><h2 style="margin-top:8px">Acompanhe quem está na frente</h2><p class="muted">Preferência do eleitorado por cargo (recorte UF ',
  'marcador secao 02');
/* na real: vamos remover de verdade — recorta da div marcada até o fechamento da seção donuts */
rep(
  '<div style="margin-top:50px"><span class="kick">02 — ACOMPANHAMENTO</span><h2 style="margin-top:8px">Acompanhe quem está na frente</h2><p class="muted">Preferência do eleitorado por cargo (recorte UF ',
  '<!-- seção 02 ACOMPANHAMENTO removida (04/09) -->',
  'remove secao 02 (parte 1)');

/* agora remove o restante da seção 02: da div donuts até o fechamento antes da 03 */
rep(
  '<div class="donuts" id="donuts"></div>\n<div style="margin-top:50px"><span class="kick">03 — ATUALIZAÇÕES</span><h2 style="margin-top:8px">Notícias</h2><p class="muted">Fique por dentro do que acontece na política</p></div>\n<div class="news" id="homeNews" style="margin-top:20px"></div>',
  '  <div style="margin-top:40px"><span class="kick">02 — NOTÍCIAS</span><h2 style="margin-top:8px">Notícias do Congresso e da política</h2>\n  <p class="muted">Direto das fontes oficiais e da grande imprensa — <b>com os devidos créditos</b>. Filtre por recorte: Geral, Brasil ou UF citada na matéria.</p>\n  <div class="nchips" id="nchips"></div>\n  <div class="ncar-wrap">\n    <button class="ncar-btn" onclick="ncarScroll(-1)" aria-label="Anteriores">‹</button>\n    <div class="ncar" id="homeNews"></div>\n    <button class="ncar-btn" onclick="ncarScroll(1)" aria-label="Próximas">›</button>\n  </div>\n  <div id="nstatus" class="muted" style="font-size:12px;margin-top:8px">Carregando notícias…</div>',
  'carrossel no lugar da secao 03');

/* 2) CSS do carrossel */
rep(
  '.news{max-width:420px}',
  '.ncar-wrap{display:flex;align-items:stretch;gap:10px;margin-top:18px}\n' +
  '.ncar{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding:6px 2px 14px;flex:1;scrollbar-width:thin}\n' +
  '.ncar::-webkit-scrollbar{height:6px}.ncar::-webkit-scrollbar-thumb{background:var(--line);border-radius:3px}\n' +
  '.ncar-btn{flex:none;width:42px;border:1px solid var(--line);background:var(--card);color:var(--gold);border-radius:12px;font-size:22px;cursor:pointer;align-self:center}\n' +
  '.ncar-btn:hover{background:#123059}\n' +
  '.ncard-new{flex:0 0 320px;max-width:320px;scroll-snap-align:start;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:8px;transition:transform .18s,border-color .18s}\n' +
  '.ncard-new:hover{transform:translateY(-3px);border-color:var(--gold)}\n' +
  '.nbadge{display:inline-flex;align-items:center;gap:5px;background:rgba(46,204,113,.15);color:var(--green);border:1px solid rgba(46,204,113,.4);font:800 9.5px Manrope;letter-spacing:.08em;padding:4px 9px;border-radius:999px;text-transform:uppercase;width:max-content}\n' +
  '.nbadge.uf{background:rgba(255,215,0,.12);color:var(--gold);border-color:rgba(255,215,0,.4)}\n' +
  '.ncard-new h4{font-size:14.5px;line-height:1.35;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n' +
  '.ncard-new p{color:var(--muted);font-size:12.5px;margin:0;line-height:1.45;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\n' +
  '.nmeta{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:auto;font-size:11px;color:var(--muted);flex-wrap:wrap}\n' +
  '.nmeta a{color:var(--blueL);font-weight:700;text-decoration:none}\n' +
  '.nmeta a:hover{text-decoration:underline}\n' +
  '.nchips{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}\n' +
  '.nchips button{border:1px solid var(--line);background:var(--card);color:var(--muted);border-radius:999px;padding:6px 14px;font:700 12px Manrope;cursor:pointer}\n' +
  '.nchips button.on{background:var(--gold);color:#1a1400;border-color:var(--gold)}\n' +
  '@media(max-width:960px){.ncard-new{flex-basis:280px}}\n' +
  '.news{max-width:420px}',
  'css carrossel');

/* 3) news() reescrito: /api/noticias + filtros UF */
rep(
  "async function news(){try{const r=await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent('https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml'));const j=await r.json();const it=(j.items|",
  "let NUF_FILTRO='GERAL';\n" +
  "async function news(){try{const j=await fetch(API_BASE+'/api/noticias').then(r=>r.json());\n" +
  " const it=(j.noticias||[]);\n" +
  " window._NEWS=it;\n" +
  " renderChipsUF();renderNews();\n" +
  " $('#nstatus').textContent=it.length?('Atualizado em '+new Date(j.geradoEm).toLocaleTimeString('pt-BR')+' · fontes: Agência Brasil, G1 Política, Agência Senado'):'Sem notícias disponíveis agora.';\n" +
  "}catch(e){$('#nstatus').textContent='Não foi possível carregar as notícias agora (backend).';}}\n" +
  "function renderChipsUF(){const ns=window._NEWS||[];const ufs=[...new Set(ns.map(n=>n.uf).filter(Boolean))];\n" +
  " const chips=[['GERAL','Geral'],['BR','Brasil'],...ufs.map(u=>[u,u])];\n" +
  " $('#nchips').innerHTML=chips.map(c=>`<button class=\"${NUF_FILTRO===c[0]?'on':''}\" onclick=\"NUF_FILTRO='${c[0]}';renderNews();renderChipsUF()\">${c[1]}</button>`).join('');}\n" +
  "function renderNews(){const ns=window._NEWS||[];const lista=ns.filter(n=>NUF_FILTRO==='GERAL'||NUF_FILTRO==='BR'?true:(n.uf===NUF_FILTRO)).filter(n=>NUF_FILTRO!=='BR'||n.uf==='BR');\n" +
  " const dtRel=iso=>{if(!iso)return'';const d=(Date.now()-new Date(iso))/1000;if(d<3600)return Math.max(1,Math.floor(d/60))+' min atrás';if(d<86400)return Math.floor(d/3600)+' h atrás';return Math.floor(d/86400)+' d atrás'};\n" +
  " $('#homeNews').innerHTML=lista.length?lista.map(n=>`<article class=\"ncard-new\">\n" +
  "  <div style=\"display:flex;gap:6px;flex-wrap:wrap\"><span class=\"nbadge\">✓ Fonte verificada · ${n.fonte}</span>${n.uf&&n.uf!=='BR'?`<span class=\"nbadge uf\">📍 ${n.uf}</span>`:''}${n.uf==='BR'?`<span class=\"nbadge uf\">🇧🇷 Brasil</span>`:''}</div>\n" +
  "  <h4>${n.t}</h4>${n.res?`<p>${n.res}</p>`:''}\n" +
  "  <div class=\"nmeta\"><span>${n.dt?dtRel(n.dt):''}</span><a href=\"${n.l}\" target=\"_blank\" rel=\"noopener\">Ler na fonte →</a></div>\n" +
  " </article>`).join(''):`<p class=\"muted\" style=\"padding:20px 4px\">Nenhuma notícia neste recorte agora — tente \"Geral\".</p>`;\n" +
  "}\n" +
  "function ncarScroll(dir){const c=document.getElementById('homeNews');if(c)c.scrollBy({left:dir*360,behavior:'smooth'})}\n" +
  "function newsOLD(){try{const r=await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent('https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml'));const j=await r.json();const it=(j.items|",
  'news() reescrito');

fs.writeFileSync(P, h);
console.log('index.html OK —', n, 'substituições');
