/* ============================================================
   VOTABRASIL — CABEÇALHO ÚNICO (todas as páginas)
   ------------------------------------------------------------
   Injeta o mesmo cabeçalho em qualquer página, com:
   - menu de 11 itens, item ativo detectado pela URL/hash
   - badge "backend ativo" (usa window.VotaBrasil.API_BASE se
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
    '#mbtopo .lg .ic{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#7ed957,#2ECC71);display:flex;align-items:center;justify-content:center;color:#061a3a;font-size:22px;flex:none;box-shadow:0 3px 14px rgba(46,204,113,0.35)}',
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
    { chave: 'congresso', pagina: 'congresso.html',        rotulo: 'PLs no Congresso' },
    { chave: 'votacoes',  pagina: 'votacoes.html',         rotulo: 'Vota\u00e7\u00f5es' },
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
      var mapa = { 'parlamentares.html': 'radar', 'congresso.html': 'congresso', 'votacoes.html': 'votacoes', 'eleicoes-2026.html': 'eleicoes', 'fundo-eleitoral.html': 'eleicoes' };
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
      ' <a class="lg" href="' + R + 'index.html"><span class="ic"><img src="' + R + 'icon.svg" alt="VotaBrasil" width="48" height="48" style="border-radius:14px;display:block"></span><span><b>VotaBrasil</b><span class="mv-slogan">Seu voto coloca, seu voto tira.</span></span></a>' +
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
    var base = (window.VotaBrasil && typeof window.VotaBrasil.API_BASE === 'string')
      ? window.VotaBrasil.API_BASE
      : '';
    var badge = document.getElementById('mbtopo-badge');
    if (badge) {
      fetch(base + '/api/health').then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        badge.hidden = false;
        badge.textContent = 'backend ativo';
      }).catch(function () { badge.hidden = true; });
    }

    // Título da página já está correto como VotaBrasil
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
