/* ============================================================
   MEUVOTO — CABEÇALHO ÚNICO (todas as páginas)
   ------------------------------------------------------------
   Injeta o mesmo cabeçalho em qualquer página, com:
   - menu de 11 itens, item ativo detectado pela URL/hash
   - badge "backend ativo" (usa window.MeuVoto.API_BASE se
     config.js estiver carregado antes deste script)
   - Entrar/Cadastrar: na home chama abrirLogin(), fora aponta
     para a home
   - menu mobile (hambúrguer)
   Requisito: config.js carregado ANTES deste script (para o badge).
   ============================================================ */
(function () {
  'use strict';

  var CSS = [
    '#mbtopo{position:sticky;top:0;z-index:9000;display:flex;gap:8px;align-items:center;padding:10px 18px!important;flex-wrap:nowrap;background:rgba(6,26,58,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(127,176,245,0.25);flex-wrap:wrap;font-family:Manrope,system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.3)}',
    '#mbtopo *{box-sizing:border-box}',
    '#mbtopo header{display:flex!important;gap:10px!important;align-items:center!important;padding:0!important;margin:0!important;background:none!important;border:none!important;box-shadow:none!important;backdrop-filter:none!important;flex-wrap:nowrap!important;width:100%;position:static!important;top:auto!important}',
    '#mbtopo .lg{display:flex;gap:12px;align-items:center;text-decoration:none;transition:transform 0.2s ease}',
    '#mbtopo .lg:hover{transform:translateY(-1px)}',
    '#mbtopo .lg .ic{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#7ed957,#2ECC71);display:flex;align-items:center;justify-content:center;color:#061a3a;font-size:24px;flex:none;box-shadow:0 4px 16px rgba(46,204,113,0.4)}',
    '#mbtopo .lg b{font-family:Montserrat,sans-serif;font-size:20px;font-weight:900;color:#fff;display:block;white-space:nowrap;letter-spacing:-0.02em}',
    '#mbtopo .lg .mv-slogan{display:block;color:#FFD700;font-size:10.5px;font-weight:700;white-space:nowrap;font-style:italic;letter-spacing:0.01em}',
    '#mbtopo nav{display:flex;gap:4px;flex-wrap:nowrap;margin-left:auto;min-width:0}',
    '#mbtopo nav a{color:#eaf1fb;text-decoration:none;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap;transition:all 0.2s ease}',
    '#mbtopo nav a:hover{background:rgba(18,48,89,0.8);transform:translateY(-1px);color:#FFD700}',
    '#mbtopo nav a.on{background:linear-gradient(135deg,#FFD700,#FFA500);color:#061a3a;font-weight:800;box-shadow:0 2px 10px rgba(255,215,0,0.3)}',
    '#mbtopo .hact{display:flex;gap:8px;align-items:center;flex:none}',
    '#mbtopo .hbadge{border:1px solid rgba(46,204,113,0.5);color:#2ECC71;background:rgba(46,204,113,0.1);border-radius:999px;padding:5px 10px;font-size:10.5px;white-space:nowrap;font-weight:700;animation:pulseBadge 2s infinite}',
    '@keyframes pulseBadge{0%{box-shadow:0 0 0 0 rgba(46,204,113,0.4)}70%{box-shadow:0 0 0 6px rgba(46,204,113,0)}100%{box-shadow:0 0 0 0 rgba(46,204,113,0)}}',
    '#mbtopo .hbtn{border-radius:999px;padding:8px 14px;font-size:12px;white-space:nowrap;font-weight:700;text-decoration:none;cursor:pointer;border:1px solid rgba(127,176,245,0.3);background:#123059;color:#eaf1fb;font-family:inherit;transition:all 0.2s ease}',
    '#mbtopo .hbtn:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:0 4px 12px rgba(18,48,89,0.5)}',
    '#mbtopo .hbtn.gold{background:linear-gradient(135deg,#FFD700,#FFA500);color:#061a3a;border-color:transparent;font-weight:800;box-shadow:0 2px 10px rgba(255,215,0,0.25)}',
    '#mbtopo .hbtn.mint{background:linear-gradient(135deg,#7ed957,#2ECC71);color:#061a3a;border-color:transparent;font-weight:800;box-shadow:0 2px 10px rgba(46,204,113,0.25)}',
    '#mbtopo .ham{display:none;background:rgba(18,48,89,0.6);border:1px solid rgba(127,176,245,0.3);border-radius:10px;color:#eaf1fb;font-size:18px;cursor:pointer;padding:7px 12px;transition:all 0.2s ease}',
    '#mbtopo .ham:hover{background:#123059}',
    '#mbtopo .mnav{display:none;flex-direction:column;background:rgba(13,34,66,0.95);backdrop-filter:blur(16px);border-top:1px solid rgba(127,176,245,0.25);padding:14px 18px;flex-basis:100%;box-shadow:0 10px 30px rgba(0,0,0,0.4);border-radius:0 0 16px 16px}',
    '#mbtopo .mnav.open{display:flex;animation:slideDown 0.25s ease}',
    '@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}',
    '#mbtopo .mnav a{color:#eaf1fb;text-decoration:none;padding:11px 8px;border-bottom:1px dashed rgba(127,176,245,0.15);font-size:14px;font-weight:600;display:flex;align-items:center;gap:10px;transition:color 0.2s ease}',
    '#mbtopo .mnav a:hover{color:#FFD700;padding-left:12px}',
    '@media(max-width:1180px){#mbtopo nav{display:none}#mbtopo .ham{display:block}}'
  ].join('\n');

  var ITENS = [
    { chave: 'inicio',    pagina: 'index.html',            rotulo: 'In\u00edcio' },
    { chave: 'radar',     pagina: 'parlamentares.html',    rotulo: 'Radar Pol\u00edtico' },
    { chave: 'eleicoes',  pagina: 'eleicoes-2026.html',    rotulo: 'Elei\u00e7\u00f5es 2026' },
    { chave: 'iniciativa',pagina: 'iniciativa-cidada.html', rotulo: 'Iniciativa Cidad\u00e3' },
    { chave: 'congresso', pagina: 'congresso.html',        rotulo: 'PLs no Congresso' },
    { chave: 'votacoes',  pagina: 'votacoes.html',         rotulo: 'Vota\u00e7\u00f5es' },
    { chave: 'links',     pagina: 'links.html',            rotulo: 'Hub' },
    { chave: 'conferir',  pagina: 'index.html#conferir-voto', rotulo: 'Conferir Voto' },
    { chave: 'revogar',   pagina: 'index.html#revogar-voto',  rotulo: 'Revogar Voto' },
    { chave: 'ajuda',     pagina: 'index.html#ajuda',         rotulo: 'Ajuda' },
    { chave: 'quem',      pagina: 'index.html#quem-somos',    rotulo: 'Quem Somos' }
  ];

  var naPaginaDeArquivo = /\/pages\//.test(location.pathname);
  var arquivoAtual = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  var naHome = !naPaginaDeArquivo && (arquivoAtual === 'index.html' || arquivoAtual === '');
  var R = naPaginaDeArquivo ? '../' : '';
  var hashAtual = (location.hash || '').replace('#', '').split('?')[0];

  function hrefDe(item) {
    if (naHome && item.pagina.indexOf('index.html#') === 0) return '#' + item.pagina.split('#')[1];
    if (naHome && item.pagina === 'index.html' && arquivoAtual === 'index.html') return '#';
    if (item.pagina.indexOf('index.html') === 0) return R + item.pagina;
    return R + 'pages/' + item.pagina;
  }

  function chaveAtiva() {
    if (!naHome) {
      var mapa = { 'parlamentares.html': 'radar', 'congresso.html': 'congresso', 'votacoes.html': 'votacoes', 'eleicoes-2026.html': 'eleicoes', 'fundo-eleitoral.html': 'eleicoes', 'links.html': 'links', 'iniciativa-cidada.html': 'iniciativa' };
      return mapa[arquivoAtual] || null;
    }
    var mapaHash = { 'radar': 'radar', 'conferir-voto': 'conferir', 'revogar-voto': 'revogar', 'ajuda': 'ajuda', 'quem-somos': 'quem' };
    if (hashAtual && mapaHash[hashAtual]) return mapaHash[hashAtual];
    return 'inicio';
  }

  function montar() {
    if (document.getElementById('mbtopo')) return;
    var ativo = chaveAtiva();
    var naHomeAgora = naHome && arquivoAtual === 'index.html';

    var nav = ITENS.map(function (it) {
      var cls = it.chave === ativo ? ' class="on"' : '';
      return '<a href="' + hrefDe(it) + '"' + cls + '>' + it.rotulo + '</a>';
    }).join('');
    var mnav = ITENS.map(function (it) {
      return '<a href="' + hrefDe(it) + '">' + it.rotulo + '</a>';
    }).join('');

    var acao = naHomeAgora
      ? ' onclick="if(window.abrirLogin)window.abrirLogin();else this.href=\'#conferir-voto\';return false" href="#conferir-voto"'
      : ' href="' + R + 'index.html"';

    var topo = document.createElement('div');
    topo.id = 'mbtopo';
    topo.innerHTML =
      '<header>' +
      ' <a class="lg" href="' + R + 'index.html"><span class="ic"><img src="' + R + 'logo-hd.png" alt="MeuVoto" width="56" height="56" style="border-radius:16px;object-fit:cover;display:block"></span><span><b>MeuVoto</b><span class="mv-slogan">Meu voto coloca, meu voto tira.</span></span></a>' +
      ' <button class="ham" aria-label="Menu" onclick="document.getElementById(\'mbtopo-mnav\').classList.toggle(\'open\')"><i class="fa-solid fa-bars"></i></button>' +
      ' <nav>' + nav + '</nav>' +
      ' <div class="hact"><span class="hbadge" id="mbtopo-badge" hidden>conectando\u2026</span>' +
      ' <a class="hbtn mint" href="' + R + 'app/" title="Aplicativo de votação (funciona offline no celular)">📱 App</a>' +
      ' <a class="hbtn" href="' + R + 'index.html#conferir-voto">Conferir</a>' +
      ' <a class="hbtn"' + (naHomeAgora ? ' onclick="if(window.abrirLogin)window.abrirLogin();return false" href="#conferir-voto"' : ' href="' + R + 'index.html"') + '>Entrar</a>' +
      ' <a class="hbtn gold"' + (naHomeAgora ? ' onclick="if(window.abrirLogin)window.abrirLogin();return false" href="#conferir-voto"' : ' href="' + R + 'index.html"') + '>Cadastrar</a></div>' +
      '</header>' +
      '<div class="mnav" id="mbtopo-mnav">' + mnav + '<a href="' + R + 'app/">📱 Abrir o App de Votação</a><a href="' + R + 'index.html#conferir-voto">🔍 Conferir Voto</a></div>';

    var alvo = document.body;
    alvo.insertBefore(topo, alvo.firstChild);

    // estilo
    var st = document.createElement('style');
    st.id = 'mbtopo-css';
    st.textContent = CSS;
    document.head.appendChild(st);

    // ícones Font Awesome (caso a página não tenha)
    if (!document.querySelector('link[href*="font-awesome"],link[href*="fontawesome"]')) {
      var fa = document.createElement('link');
      fa.rel = 'stylesheet';
      fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
      document.head.appendChild(fa);
    }

    // badge do backend (API_BASE '' é válida — mesma origem; nunca usar || aqui)
    var base = (window.MeuVoto && typeof window.MeuVoto.API_BASE === 'string')
      ? window.MeuVoto.API_BASE
      : '';
    var badge = document.getElementById('mbtopo-badge');
    if (badge) {
      fetch(base + '/api/health').then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        badge.hidden = false;
        badge.textContent = 'backend ativo';
      }).catch(function () { badge.hidden = true; });
    }

    // Título da página já está correto como MeuVoto
    // (não precisa substituir)

    // na home, acompanha troca de hash para atualizar o item ativo
    if (naHomeAgora) {
      window.addEventListener('hashchange', function () {
        hashAtual = (location.hash || '').replace('#', '').split('?')[0];
        var novo = chaveAtiva();
        var as = topo.querySelectorAll('nav a');
        ITENS.forEach(function (it, idx) {
          if (as[idx]) as[idx].classList.toggle('on', it.chave === novo);
        });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();

/* ciclo20: busca global Ctrl+K (carregamento automático do módulo) */
(function () {
  var sc = document.querySelectorAll('script[src]');
  var u = '';
  for (var i = 0; i < sc.length; i++) {
    var s = sc[i].src || '';
    if (/site-header\.js(\?|$)/.test(s)) { u = s.replace(/[^/]*$/, '') + 'busca-global.js'; break; }
  }
  if (!u) return;
  var t = document.createElement('script');
  t.src = u;
  t.async = false;
  document.head.appendChild(t);
})();

/* ============================================================
   CICLO 23 — TEMA CLARO/ESCURO GLOBAL
   - Bootstrap síncrono no <head>: define data-theme antes do
     primeiro paint (evita flash do tema errado).
   - Persiste em localStorage('mb_tema'); respeita preferência
     do sistema (prefers-color-scheme) como fallback; padrão
     do projeto = escuro.
   - Injeta CSS de overrides via <style> (zero rede, zero FOUC).
   - Cria botão flutuante de alternância em todas as páginas.
   ============================================================ */
(function () {
  if (window.__MB_TEMA__) return;
  window.__MB_TEMA__ = 1;

  var CSS = [
    'html{color-scheme:dark}',
    'html[data-theme="claro"]{color-scheme:light;--bg:#f2f6fb;--card:#ffffff;--card2:#e6edf6;--line:rgba(11,28,51,.18);--ink:#0b1c33;--muted:#54657d;--gold:#9a6b00;--blue:#115FCB;--blueL:#0d4ea8;--green:#177245;--red:#b3372a}',
    'html[data-theme="claro"] body{background:linear-gradient(180deg,#e8f0fa 0%,var(--bg) 45%)!important;color:var(--ink)!important}',
    'html[data-theme="claro"] .fbar,html[data-theme="claro"] .cmpbar{background:rgba(255,255,255,.94)!important;border-color:rgba(11,28,51,.12)!important}',
    'html[data-theme="claro"] #mbtopo{background:rgba(255,255,255,.92)!important;border-bottom-color:rgba(11,28,51,.15)!important;box-shadow:0 2px 10px rgba(11,28,51,.08)!important}',
    'html[data-theme="claro"] #mbtopo nav a{color:#0b1c33}',
    'html[data-theme="claro"] #mbtopo nav a:hover{background:rgba(11,28,51,.06)}',
    'html[data-theme="claro"] #mbtopo nav a.on{background:linear-gradient(135deg,#ffd75e,#f5a623);color:#3a2b00;box-shadow:0 2px 10px rgba(154,107,0,.25)}',
    'html[data-theme="claro"] #mbtopo .lg b{color:#0b1c33}',
    'html[data-theme="claro"] #mbtopo .lg .mv-slogan{color:#8a5f00}',
    'html[data-theme="claro"] #mbtopo .hbtn{background:#fff;color:#0b1c33;border-color:rgba(11,28,51,.2)}',
    'html[data-theme="claro"] #mbtopo .hbtn.mint{background:linear-gradient(135deg,#7ed957,#2ECC71);color:#061a3a;border-color:transparent}',
    'html[data-theme="claro"] #mbtopo .hbtn.gold{background:linear-gradient(135deg,#ffd75e,#f5a623);color:#3a2b00;border-color:transparent}',
    'html[data-theme="claro"] #mbtopo .ham{background:rgba(11,28,51,.06);border-color:rgba(11,28,51,.2);color:#0b1c33}',
    'html[data-theme="claro"] #mbtopo .mnav{background:rgba(255,255,255,.98);border-top-color:rgba(11,28,51,.12)}',
    'html[data-theme="claro"] #mbtopo .mnav a{color:#0b1c33;border-bottom-color:rgba(11,28,51,.1)}',
    'html[data-theme="claro"] #mbtopo .hbadge{border-color:rgba(23,114,69,.5);color:#177245;background:rgba(23,114,69,.1)}',
    'html[data-theme="claro"] input,html[data-theme="claro"] select,html[data-theme="claro"] textarea{background:#fff!important;color:var(--ink)!important;border-color:rgba(11,28,51,.2)!important}',
    'html[data-theme="claro"] .btn{background:#fff!important;color:var(--ink)!important;border-color:rgba(11,28,51,.2)!important}',
    'html[data-theme="claro"] .btn.gold{background:linear-gradient(135deg,#ffd75e,#f5a623)!important;color:#3a2b00!important;border:none!important}',
    'html[data-theme="claro"] .btn.green{background:var(--green)!important;color:#fff!important;border-color:transparent!important}',
    'html[data-theme="claro"] .btn.red{background:transparent!important;color:var(--red)!important;border-color:var(--red)!important}',
    'html[data-theme="claro"] a{color:#8a5f00}',
    'html[data-theme="claro"] .lei{color:#8a5f00;border-color:rgba(138,95,0,.5)}',
    'html[data-theme="claro"] .fonte{color:var(--blueL);border-color:rgba(13,78,168,.4)}',
    'html[data-theme="claro"] .vb.sim{background:rgba(23,114,69,.12);color:var(--green)}',
    'html[data-theme="claro"] .vb.nao{background:rgba(179,55,42,.12);color:var(--red)}',
    'html[data-theme="claro"] .vb.abs{background:rgba(84,101,125,.14);color:var(--muted)}',
    'html[data-theme="claro"] .vb.out{background:rgba(154,107,0,.14);color:#8a5f00}',
    'html[data-theme="claro"] .sbox{background:rgba(154,107,0,.07);border-color:rgba(154,107,0,.4)}',
    'html[data-theme="claro"] .quorum{background:rgba(17,95,203,.06);border-color:rgba(13,78,168,.4)}',
    'html[data-theme="claro"] .skel{background:linear-gradient(90deg,#dfe7f2 25%,#cfd9e8 50%,#dfe7f2 75%)}',
    'html[data-theme="claro"] svg text{fill:#54657d}',
    'html[data-theme="claro"] svg polyline[stroke="#FFD700"]{stroke:#9a6b00}',
    'html[data-theme="claro"] svg line{stroke:rgba(11,28,51,.2)}',
    'html[data-theme="claro"] #toast,html[data-theme="claro"] #tip,html[data-theme="claro"] #btip,html[data-theme="claro"] .ac{background:#fff!important;color:var(--ink)!important;border-color:rgba(11,28,51,.25)!important;box-shadow:0 8px 30px rgba(11,28,51,.18)!important}',
    'html[data-theme="claro"] .ac div:hover,html[data-theme="claro"] .ac div.sel{background:rgba(154,107,0,.12)}',
    'html[data-theme="claro"] .ecard,html[data-theme="claro"] .painel,html[data-theme="claro"] .vcard,html[data-theme="claro"] .card,html[data-theme="claro"] .hero,html[data-theme="claro"] .ranking-card,html[data-theme="claro"] .supporters-list{background:var(--card)!important;border-color:var(--line)!important}',
    'html[data-theme="claro"] pre{background:#eef3fa!important;color:var(--ink)!important;border-color:rgba(11,28,51,.2)!important}',
    'html[data-theme="claro"] code{background:#e6edf6;color:#8a5f00}',
    'html[data-theme="claro"] .vtable tr:hover td{background:rgba(13,78,168,.06)}',
    'html[data-theme="claro"] .vtable tr.meu{background:rgba(154,107,0,.08);outline-color:rgba(154,107,0,.4)}',
    'html[data-theme="claro"] .vtable td,html[data-theme="claro"] .vtable th,html[data-theme="claro"] .tabela td,html[data-theme="claro"] .tabela th,html[data-theme="claro"] .comptable td,html[data-theme="claro"] .comptable th{border-bottom-color:rgba(11,28,51,.12)!important}',
    'html[data-theme="claro"] img.av,html[data-theme="claro"] .vtable img{background:#dfe7f2}',
    'html[data-theme="claro"] .databanner{background:rgba(23,114,69,.08);border-color:rgba(23,114,69,.4)}',
    'html[data-theme="claro"] .cbar{background:#dfe7f2}',
    'html[data-theme="claro"] .stat,html[data-theme="claro"] .fontes .fcard{background:var(--card2)}',
    'html[data-theme="claro"] .ecard.simb{border-color:rgba(154,107,0,.45)}',
    'html[data-theme="claro"] .ecard.nom{border-color:rgba(23,114,69,.45)}',
    'html[data-theme="claro"] .chip.on{border-color:#9a6b00;color:#8a5f00}',
    'html[data-theme="claro"] .pin.on{background:#ffd75e;color:#3a2b00}',
    'html[data-theme="claro"] .mx{background:#fff;color:var(--ink)}',
    'html[data-theme="claro"] .ftabs button.on{color:#8a5f00;border-color:#9a6b00}',
    'html[data-theme="claro"] .quote{background:rgba(179,55,42,.07)}',
    'html[data-theme="claro"] .quote.ok{background:rgba(23,114,69,.08)}',
    'html[data-theme="claro"] .quote.info{background:rgba(13,78,168,.08)}',
    'html[data-theme="claro"] .promx{background:rgba(154,107,0,.08);border-color:rgba(154,107,0,.4)}',
    'html[data-theme="claro"] .msg.ok{background:rgba(23,114,69,.1);border-color:rgba(23,114,69,.45);color:#14532d}',
    'html[data-theme="claro"] .msg.err{background:rgba(179,55,42,.1);border-color:rgba(179,55,42,.45);color:#7f1d1d}',
    'html[data-theme="claro"] .msg.warn{background:rgba(154,107,0,.1);border-color:rgba(154,107,0,.45);color:#713f12}',
    'html[data-theme="claro"] .avIni{color:#3a2b00}',
    'html[data-theme="claro"] .plrow{color:#0d4ea8}',
    'html[data-theme="claro"] .mbFecharFim{background:#0d4ea8!important;border-color:#0d4ea8!important;color:#fff!important}',
    'html[data-theme="claro"] .tabs button{background:#fff;color:var(--muted)}',
    'html[data-theme="claro"] .tabs button.on{background:#ffd75e;color:#3a2b00;border-color:#ffd75e}',
    'html[data-theme="claro"] #fichaPrint{background:#fff;color:#000}',
    '.mbTemaBtn{position:fixed;left:16px;bottom:16px;z-index:360;border-radius:999px;border:1px solid var(--line,rgba(127,176,245,.22));background:var(--card2,#123059);color:var(--ink,#fff);font:700 13px Manrope,system-ui,sans-serif;padding:10px 14px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);transition:all .2s ease}',
    '.mbTemaBtn:hover{transform:translateY(-1px);filter:brightness(1.08)}',
    'html[data-theme="claro"] .mbTemaBtn{background:#fff;color:#0b1c33;border-color:rgba(11,28,51,.25);box-shadow:0 4px 14px rgba(11,28,51,.12)}'
  ].join('\n');

  function cur() {
    return document.documentElement.getAttribute('data-theme') === 'claro' ? 'claro' : 'escuro';
  }
  function set(t) {
    var v = t === 'claro' ? 'claro' : 'escuro';
    document.documentElement.setAttribute('data-theme', v);
    try { localStorage.setItem('mb_tema', v); } catch (e) {}
    atualizaBtn();
    try { document.dispatchEvent(new CustomEvent('mb:tema', { detail: { tema: v } })); } catch (e) {}
  }
  function atualizaBtn() {
    var b = document.getElementById('mbTemaBtn');
    if (!b) return;
    var t = cur();
    b.textContent = t === 'claro' ? '\uD83C\uDF19 Escuro' : '\u2600\uFE0F Claro';
    var lb = t === 'claro' ? 'Mudar para tema escuro' : 'Mudar para tema claro';
    b.setAttribute('aria-label', lb);
    b.setAttribute('title', lb);
  }
  function criaBtn() {
    if (document.getElementById('mbTemaBtn')) return atualizaBtn();
    var b = document.createElement('button');
    b.id = 'mbTemaBtn';
    b.type = 'button';
    b.className = 'mbTemaBtn';
    b.addEventListener('click', function () { set(cur() === 'claro' ? 'escuro' : 'claro'); });
    document.body.appendChild(b);
    atualizaBtn();
    var c = document.querySelector('.cmpbar');
    if (c && window.MutationObserver) {
      new MutationObserver(function () {
        b.style.bottom = c.classList.contains('on') ? '70px' : '16px';
      }).observe(c, { attributes: true, attributeFilter: ['class'] });
      b.style.bottom = c.classList.contains('on') ? '70px' : '16px';
    }
  }

  // 1) aplica tema ANTES do primeiro paint (roda no <head>)
  var saved = null;
  try { saved = localStorage.getItem('mb_tema'); } catch (e) {}
  var sys = null;
  try {
    if (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) sys = 'claro';
  } catch (e) {}
  document.documentElement.setAttribute('data-theme', saved || sys || 'escuro');

  // 2) injeta CSS de overrides (síncrono, no <head>)
  var st = document.createElement('style');
  st.id = 'mb-tema-css';
  st.textContent = CSS;
  (document.head || document.documentElement).appendChild(st);

  // 3) expõe API pública
  window.mbGetTema = cur;
  window.mbSetTema = set;

  // 4) cria o botão flutuante após o DOM
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', criaBtn);
  else criaBtn();
})();

/* ciclo23b: modo ALTO CONTRASTE — terceiro modo do botão de tema
   - injeta CSS extra para html[data-theme="alto"] (fundo preto, texto branco,
     bordas/foco em dourado alto visível, contraste WCAG AAA)
   - sobrepõe mbSetTema para aceitar 'alto' como valor válido
   - sobrepõe o clique do botão para ciclar escuro → claro → alto → escuro
   - atualiza label/aria-label conforme modo ativo */
(function () {
  var CSS = [
    'html[data-theme="alto"]{color-scheme:dark;--bg:#000000;--card:#0a0a0a;--card2:#111111;--line:#ffd700;--ink:#ffffff;--muted:#f2f2f2;--gold:#ffd700;--blue:#4da3ff;--blueL:#8ec9ff;--green:#00e676;--red:#ff5252}',
    'html[data-theme="alto"] body,html[data-theme="alto"] .fbar,html[data-theme="alto"] .cmpbar,html[data-theme="alto"] #mbtopo,html[data-theme="alto"] .ecard,html[data-theme="alto"] .painel,html[data-theme="alto"] .vcard,html[data-theme="alto"] .card,html[data-theme="alto"] .hero,html[data-theme="alto"] .ranking-card,html[data-theme="alto"] .supporters-list,html[data-theme="alto"] .mnav,html[data-theme="alto"] input,html[data-theme="alto"] select,html[data-theme="alto"] textarea,html[data-theme="alto"] .btn,html[data-theme="alto"] .tabs button,html[data-theme="alto"] .tabs button.on{background:#000000!important;color:#ffffff!important;border-color:#ffd700!important}',
    'html[data-theme="alto"] a,html[data-theme="alto"] .fonte,html[data-theme="alto"] .lei{color:#ffd700!important;border-color:#ffd700!important}',
    'html[data-theme="alto"] .btn.gold{background:#ffd700!important;color:#000000!important;border:none!important}',
    'html[data-theme="alto"] :focus,html[data-theme="alto"] :focus-visible{outline:3px solid #ffd700!important;outline-offset:2px!important}',
    'html[data-theme="alto"] .vb.sim{background:#003d1f!important;color:#00e676}',
    'html[data-theme="alto"] .vb.nao{background:#3d0000!important;color:#ff5252}',
    'html[data-theme="alto"] .mbTemaBtn{background:#000000!important;color:#ffd700!important;border-color:#ffd700!important;box-shadow:0 0 0 2px #ffd700!important}'
  ].join('\n');
  var st = document.createElement('style');
  st.id = 'mb-tema-alto-css';
  st.textContent = CSS;
  (document.head || document.documentElement).appendChild(st);

  var MODOS = ['escuro', 'claro', 'alto'];
  var LABELS = { escuro: '☀️ Mudar para Claro', claro: '◐ Mudar para Alto Contraste', alto: '🌙 Mudar para Escuro' };
  var LBLAR  = { escuro: 'Mudar para tema claro', claro: 'Mudar para modo alto contraste', alto: 'Mudar para tema escuro' };

  function cur() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'claro') return 'claro';
    if (t === 'alto') return 'alto';
    return 'escuro';
  }
  function up() {
    var b = document.getElementById('mbTemaBtn');
    if (!b) return;
    var t = cur();
    b.textContent = LABELS[t];
    b.setAttribute('aria-label', LBLAR[t]);
    b.setAttribute('title', LBLAR[t]);
  }

  // Sobrepõe mbSetTema para aceitar 'alto'
  window.mbSetTema = function (t) {
    var v = (t === 'claro' || t === 'alto') ? t : 'escuro';
    document.documentElement.setAttribute('data-theme', v);
    try { localStorage.setItem('mb_tema', v); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent('mb:tema', { detail: { tema: v } })); } catch (e) {}
    up();
  };

  function patch() {
    var b = document.getElementById('mbTemaBtn');
    if (!b) return;
    if (b.getAttribute('data-c23b') === '1') return up();
    b.setAttribute('data-c23b', '1');
    var nb = b.cloneNode(true);
    b.parentNode.replaceChild(nb, b);
    nb.addEventListener('click', function () {
      var i = MODOS.indexOf(cur());
      window.mbSetTema(MODOS[(i + 1) % 3]);
    });
    up();
    document.addEventListener('mb:tema', up);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();
})();
