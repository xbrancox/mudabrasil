/* ============================================================
 MUDABRASIL — HEADER UNIFICADO
 Injeta o mesmo cabeçalho da home em TODAS as páginas de pages/
 para garantir consistência visual total.
 ============================================================ */
(function () {
  'use strict';

  // Links do nav (href, label, página para marcar "ativo")
  var LINKS = [
    ['../index.html',                       'Início',                              'index.html'],
    ['parlamentares.html',                  'Radar Político',                      'parlamentares.html'],
    ['congresso.html',                      'PLs no Congresso',                    'congresso.html'],
    ['votacoes.html',                       'Votações',                            'votacoes.html'],
    ['eleicoes-2026.html',                  'Eleições 2026',                       'eleicoes-2026.html'],
    ['../index.html#conferir-voto',         'Conferir Voto',                       ''],
    ['../index.html#revogar-voto',          'Revogar Voto',                        ''],
    ['../index.html#revogados',             'Políticos com votos revogados',       ''],
    ['../index.html#ajuda',                 'Ajuda',                               ''],
    ['../index.html#quem-somos',            'Quem Somos',                          '']
  ];

  // CSS — idêntico ao design da home; alta especificidade p/ sobrescrever CSSs locais
  var CSS = [
    '.mbh{position:sticky;top:0;z-index:99999;background:rgba(6,26,58,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-bottom:1px solid #1d3a66;font-family:Manrope,system-ui,sans-serif}',
    '.mbh-in{max-width:1250px;margin:0 auto;display:flex;gap:12px;align-items:center;padding:12px 20px;flex-wrap:wrap}',
    '.mbh-lg{display:flex;gap:10px;align-items:center;text-decoration:none;color:#eaf1fb}',
    '.mbh-ic{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#7ed957,#2ECC71);display:flex;align-items:center;justify-content:center;color:#061a3a;font-size:18px;font-weight:800}',
    '.mbh-tx b{font-size:17px;display:block;line-height:1.1;color:#eaf1fb}',
    '.mbh-tx small{color:#9fb0c8;font-size:11px;display:block}',
    '.mbh nav{display:flex;gap:4px;flex-wrap:wrap;margin-left:auto}',
    '.mbh nav a{color:#eaf1fb;text-decoration:none;padding:8px 12px;border-radius:999px;font-size:13px;transition:background .15s}',
    '.mbh nav a:hover{background:#123059}',
    '.mbh nav a.on{background:#FFD700;color:#061a3a;font-weight:800}',
    '.mbh-act{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.mbh-badge{border:1px solid #2ECC71;color:#2ECC71;border-radius:999px;padding:6px 12px;font-size:12px;white-space:nowrap}',
    '.mbh-btn{border-radius:999px;padding:9px 16px;font-size:13px;font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap}',
    '.mbh-az{background:#123059;color:#eaf1fb;border:1px solid #1d3a66}',
    '.mbh-gold{background:#FFD700;color:#061a3a}',
    '.mbh-ham{display:none;background:none;border:none;color:#eaf1fb;font-size:22px;cursor:pointer;padding:8px;border-radius:8px}',
    '.mbh-ham:hover{background:#123059}',
    '.mbh-mnav{display:none;flex-direction:column;padding:8px 16px 14px;width:100%}',
    '.mbh-mnav.open{display:flex}',
    '.mbh-mnav a{color:#eaf1fb;text-decoration:none;padding:10px 4px;border-bottom:1px dashed #1d3a66;font-size:14px}',
    '.mbh-mnav a.on{color:#FFD700;font-weight:800}',
    '@media(max-width:960px){.mbh nav{display:none}.mbh-ham{display:block;margin-left:auto}}'
  ].join('\n');

  // Injeta CSS no <head>
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  // Detecta página atual
  var cur = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  // Monta nav e nav mobile
  var navHtml = '';
  var mobHtml = '';
  LINKS.forEach(function (l) {
    var on = (l[2] && l[2].toLowerCase() === cur) ? ' class="on"' : '';
    navHtml += '<a href="' + l[0] + '"' + on + '>' + l[1] + '</a>';
    mobHtml += '<a href="' + l[0] + '"' + on + '>' + l[1] + '</a>';
  });

  var headerHtml =
    '<header class="mbh">' +
      '<div class="mbh-in">' +
        '<a class="mbh-lg" href="../index.html">' +
          '<span class="mbh-ic">MB</span>' +
          '<span class="mbh-tx"><b>MudaBrasil</b><small>Participação Cívica</small></span>' +
        '</a>' +
        '<button class="mbh-ham" id="mbh-ham" aria-label="Menu">☰</button>' +
        '<nav>' + navHtml + '</nav>' +
        '<span class="mbh-act">' +
          '<span class="mbh-badge" id="mbh-badge">…</span>' +
          '<a class="mbh-btn mbh-az" href="../index.html">Entrar</a>' +
          '<a class="mbh-btn mbh-gold" href="../index.html">Cadastrar</a>' +
        '</span>' +
      '</div>' +
      '<div class="mbh-mnav" id="mbh-mnav">' + mobHtml + '</div>' +
    '</header>';

  // Remove TODOS os headers existentes (pode haver vários em algumas páginas)
  var old = document.querySelectorAll('header');
  old.forEach(function (h) { h.remove(); });

  // Injeta o novo header no topo do body
  document.body.insertAdjacentHTML('afterbegin', headerHtml);

  // Handler do menu mobile (delegado, à prova de re-renders)
  document.addEventListener('click', function (e) {
    if (e.target.id === 'mbh-ham' || e.target.closest('#mbh-ham')) {
      var m = document.getElementById('mbh-mnav');
      if (m) m.classList.toggle('open');
    }
    // Fecha menu ao clicar em link mobile
    if (e.target.closest('#mbh-mnav a')) {
      var m = document.getElementById('mbh-mnav');
      if (m) m.classList.remove('open');
    }
  });

  // Atualiza badge do backend (usa config do site)
  var base = (window.MudaBrasil && window.MudaBrasil.API_BASE) || '';
  if (base) {
    fetch(base + '/api/health').then(function (r) { return r.json(); }).then(function (j) {
      var el = document.getElementById('mbh-badge');
      if (el) el.textContent = j.ok ? 'backend ativo' : 'offline';
    }).catch(function () {
      var el = document.getElementById('mbh-badge');
      if (el) el.textContent = 'offline';
    });
  } else {
    var el = document.getElementById('mbh-badge');
    if (el) el.textContent = 'modo demo';
  }
})();
