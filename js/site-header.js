/* ============================================================
   MUDABRASIL — CABEÇALHO ÚNICO (todas as páginas)
   ------------------------------------------------------------
   Injeta o mesmo cabeçalho em qualquer página, com:
   - menu de 10 itens, item ativo detectado pela URL/hash
   - badge "backend ativo" (usa window.MudaBrasil.API_BASE se
     config.js estiver carregado antes deste script)
   - Entrar/Cadastrar: na home chama abrirLogin(), fora aponta
     para a home
   - menu mobile (hambúrguer)
   Requisito: config.js carregado ANTES deste script (para o badge).
   ============================================================ */
(function () {
  'use strict';

  var CSS = [
    '#mbtopo{position:sticky;top:0;z-index:9000;display:flex;gap:8px;align-items:center;padding:8px 14px!important;flex-wrap:nowrap;background:#061a3add;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-bottom:1px solid #1d3a66;flex-wrap:wrap;font-family:Manrope,system-ui,sans-serif}',
    '#mbtopo *{box-sizing:border-box}',
    '#mbtopo header{display:flex!important;gap:8px!important;align-items:center!important;padding:0!important;margin:0!important;background:none!important;border:none!important;box-shadow:none!important;backdrop-filter:none!important;flex-wrap:nowrap!important;width:100%;position:static!important;top:auto!important}',
    '#mbtopo .lg{display:flex;gap:10px;align-items:center;text-decoration:none}',
    '#mbtopo .lg .ic{width:34px;height:34px;border-radius:12px;background:linear-gradient(135deg,#7ed957,#2ECC71);display:flex;align-items:center;justify-content:center;color:#061a3a;font-size:18px;flex:none}',
    '#mbtopo .lg b{font-family:Montserrat,sans-serif;font-size:15px;color:#fff;display:block;white-space:nowrap}',
    '#mbtopo .lg small{display:block;color:#9fb0c8;font-size:10px;white-space:nowrap}',
    '#mbtopo nav{display:flex;gap:1px;flex-wrap:nowrap;margin-left:auto;min-width:0}',
    '#mbtopo nav a{color:#eaf1fb;text-decoration:none;padding:6px 8px;border-radius:999px;font-size:11.5px;font-weight:600;white-space:nowrap}',
    '#mbtopo nav a:hover{background:#123059}',
    '#mbtopo nav a.on{background:#FFD700;color:#061a3a;font-weight:800}',
    '#mbtopo .hact{display:flex;gap:6px;align-items:center;flex:none}',
    '#mbtopo .hbadge{border:1px solid #2ECC71;color:#2ECC71;border-radius:999px;padding:5px 9px;font-size:10.5px;white-space:nowrap}',
    '#mbtopo .hbtn{border-radius:999px;padding:7px 13px;font-size:12px;white-space:nowrap;font-weight:700;text-decoration:none;cursor:pointer;border:1px solid #1d3a66;background:#123059;color:#eaf1fb;font-family:inherit}',
    '#mbtopo .hbtn.gold{background:#FFD700;color:#061a3a;border-color:#FFD700}',
    '#mbtopo .ham{display:none;background:none;border:1px solid #1d3a66;border-radius:10px;color:#eaf1fb;font-size:18px;cursor:pointer;padding:6px 12px}',
    '#mbtopo .mnav{display:none;flex-direction:column;background:#0d2242;border-top:1px solid #1d3a66;padding:10px 16px;flex-basis:100%}',
    '#mbtopo .mnav.open{display:flex}',
    '#mbtopo .mnav a{color:#eaf1fb;text-decoration:none;padding:10px 4px;border-bottom:1px dashed #1d3a66;font-size:14px}',
    '@media(max-width:1180px){#mbtopo nav{display:none}#mbtopo .ham{display:block}}'
  ].join('\n');

  var ITENS = [
    { chave: 'inicio',    pagina: 'index.html',            rotulo: 'In\u00edcio' },
    { chave: 'radar',     pagina: 'parlamentares.html',    rotulo: 'Radar Pol\u00edtico' },
    { chave: 'congresso', pagina: 'congresso.html',        rotulo: 'PLs no Congresso' },
    { chave: 'votacoes',  pagina: 'votacoes.html',         rotulo: 'Vota\u00e7\u00f5es' },
    { chave: 'eleicoes',  pagina: 'eleicoes-2026.html',    rotulo: 'Elei\u00e7\u00f5es 2026' },
    { chave: 'conferir',  pagina: 'index.html#conferir-voto', rotulo: 'Conferir Voto' },
    { chave: 'revogar',   pagina: 'index.html#revogar-voto',  rotulo: 'Revogar Voto' },
    { chave: 'revogados', pagina: 'index.html#revogados',     rotulo: 'Votos Revogados' },
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
    return R + item.pagina;
  }

  function chaveAtiva() {
    if (!naHome) {
      var mapa = { 'parlamentares.html': 'radar', 'congresso.html': 'congresso', 'votacoes.html': 'votacoes', 'eleicoes-2026.html': 'eleicoes' };
      return mapa[arquivoAtual] || null;
    }
    var mapaHash = { 'radar': 'radar', 'conferir-voto': 'conferir', 'revogar-voto': 'revogar', 'revogados': 'revogados', 'ajuda': 'ajuda', 'quem-somos': 'quem' };
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
      ' <a class="lg" href="' + R + 'index.html"><span class="ic"><i class="fa-solid fa-layer-group"></i></span><span><b>MudaBrasil</b><small>Participa\u00e7\u00e3o C\u00edvica</small></span></a>' +
      ' <button class="ham" aria-label="Menu" onclick="document.getElementById(\'mbtopo-mnav\').classList.toggle(\'open\')"><i class="fa-solid fa-bars"></i></button>' +
      ' <nav>' + nav + '</nav>' +
      ' <div class="hact"><span class="hbadge" id="mbtopo-badge" hidden>conectando\u2026</span>' +
      ' <a class="hbtn"' + (naHomeAgora ? ' onclick="if(window.abrirLogin)window.abrirLogin();return false" href="#conferir-voto"' : ' href="' + R + 'index.html"') + '>Entrar</a>' +
      ' <a class="hbtn gold"' + (naHomeAgora ? ' onclick="if(window.abrirLogin)window.abrirLogin();return false" href="#conferir-voto"' : ' href="' + R + 'index.html"') + '>Cadastrar</a></div>' +
      '</header>' +
      '<div class="mnav" id="mbtopo-mnav">' + mnav + '</div>';

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

    // badge do backend
    var base = (window.MudaBrasil && window.MudaBrasil.API_BASE) || '';
    var badge = document.getElementById('mbtopo-badge');
    if (badge) {
      fetch(base + '/api/health').then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        badge.hidden = false;
        badge.textContent = 'backend ativo';
      }).catch(function () { badge.hidden = true; });
    }

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
