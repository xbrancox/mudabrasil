/* =============================================================
   MEUVOTO — BUSCA GLOBAL (Ctrl+K / ⌘K) · ciclo 20
   -------------------------------------------------------------
   Injeta em qualquer página que carregue site-header.js:
   - botão flutuante 🔍 (alternativa ao atalho)
   - modal acessível de busca cruzando 4 domínios:
     (1) páginas do site
     (2) seções (h1–h3) da página atual
     (3) votações recentes da Câmara (API, cache 30 min)
     (4) parlamentares (API candidatos, cache 30 min)
   - navegação por ↑↓, Enter abre, Esc fecha
   - deep-link de votação fora de /pages/votacoes.html → #v<id>
   ============================================================= */
(function () {
  'use strict';
  if (document.getElementById('bgFab')) return;

  function base() {
    try { if (window.MeuVoto && window.MeuVoto.API_BASE) return window.MeuVoto.API_BASE; } catch (e) {}
    try { if (window.VotaBrasil && window.VotaBrasil.API_BASE) return window.VotaBrasil.API_BASE; } catch (e) {}
    try { if (window.API_BASE) return window.API_BASE; } catch (e) {}
    return '';
  }
  function rootPath() {
    return (location.pathname || '').indexOf('/pages/') >= 0 ? '../' : '';
  }

  var PAGES = [
    ['Início', 'index.html'],
    ['Radar Político', 'pages/parlamentares.html'],
    ['Eleições 2026', 'pages/eleicoes-2026.html'],
    ['PLs no Congresso', 'pages/congresso.html'],
    ['Votações do Plenário', 'pages/votacoes.html'],
    ['Conferir/Revogar Voto', 'pages/meu-voto.html'],
    ['Proposta', 'pages/proposta.html'],
    ['Comunidade', 'pages/comunidade.html'],
    ['Fundo Eleitoral', 'pages/fundo-eleitoral.html'],
    ['Cédula VotaBrasil', 'pages/cedula-votabrasil.html'],
    ['Roadmap', 'pages/roadmap.html'],
    ['Digest semanal', 'pages/digest.html'],
    ['Mandato responsável', 'pages/mandato-responsavel.html'],
    ['API pública', 'pages/api-publica.html'],
    ['Status do sistema', 'pages/status.html'],
    ['Métricas do digest', 'pages/digest-metrics.html'],
    ['Privacidade', 'privacidade.html'],
    ['Termos', 'termos.html']
  ];

  var cache = { vot: null, cand: null, ts: 0 };
  function jget(u) {
    return fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { return null; });
  }
  async function dados() {
    var now = Date.now();
    if (cache.vot && cache.cand && (now - cache.ts) < 30 * 60 * 1000) return cache;
    var b = base();
    var v = await jget(b + '/api/camara/votacoes?itens=40&ordem=DESC');
    var c = await jget(b + '/api/candidatos');
    cache = { vot: (v && v.dados) || [], cand: (c && c.candidatos) || [], ts: now };
    return cache;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // === UI: botão flutuante ===
  var fab = document.createElement('button');
  fab.id = 'bgFab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Abrir busca global (Ctrl+K)');
  fab.innerHTML = '🔍 <span style="margin-left:6px">Buscar</span> <kbd style="margin-left:8px;background:#061a3a;border:1px solid rgba(127,176,245,.3);border-radius:4px;padding:1px 5px;font:600 10px Manrope,sans-serif;color:#94A3B8">Ctrl K</kbd>';
  fab.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:180;border-radius:999px;border:1px solid rgba(255,215,0,.45);background:linear-gradient(135deg,#123059,#0d2242);color:#fff;font:700 12.5px Manrope,sans-serif;padding:10px 16px;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.55);display:flex;align-items:center';

  // === UI: modal ===
  var wrap = document.createElement('div');
  wrap.id = 'bgWrap';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', 'Busca global');
  wrap.style.cssText = 'display:none;position:fixed;inset:0;z-index:300;background:rgba(4,8,20,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:14px;overflow-y:auto';
  wrap.innerHTML =
    '<div style="max-width:680px;margin:6vh auto 0;background:#0d2242;border:1px solid rgba(255,215,0,.5);border-radius:16px;padding:14px;box-shadow:0 20px 60px rgba(0,0,0,.6)">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
    '<h3 style="font:800 15px Montserrat,sans-serif;color:#FFD700;margin:0">🔍 Busca global</h3>' +
    '<button type="button" id="bgClose" aria-label="Fechar" style="background:transparent;border:none;color:#94A3B8;font-size:20px;cursor:pointer;padding:4px 8px">✕</button>' +
    '</div>' +
    '<input id="bgQ" placeholder="Digite página, votação, parlamentar ou seção…" style="width:100%;background:#123059;border:1px solid rgba(127,176,245,.3);border-radius:10px;color:#fff;padding:12px 14px;font:500 15px Manrope,sans-serif" autocomplete="off" inputmode="search"/>' +
    '<div id="bgR" style="margin-top:10px;max-height:55vh;overflow-y:auto"></div>' +
    '<p style="margin-top:8px;color:#94A3B8;font:11.5px Manrope,sans-serif">↑↓ navega · Enter abre · Esc fecha · cache 30 min</p>' +
    '</div>';

  var q = null, res = null, sel = -1, items = [];

  function mount() {
    document.body.appendChild(fab);
    document.body.appendChild(wrap);
    if (document.querySelector('.cmpbar')) fab.style.bottom = '64px';
  }

  function open() {
    wrap.style.display = 'block';
    q = wrap.querySelector('#bgQ');
    res = wrap.querySelector('#bgR');
    wrap.querySelector('#bgClose').onclick = close;
    q.value = '';
    items = [];
    sel = -1;
    res.innerHTML = '<p style="color:#94A3B8;font:12.5px Manrope,sans-serif">Digite ao menos 2 caracteres…</p>';
    setTimeout(function () { q.focus(); q.select(); }, 30);
  }
  function close() { wrap.style.display = 'none'; }

  fab.addEventListener('click', open);
  wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      wrap.style.display === 'block' ? close() : open();
      return;
    }
    if (wrap.style.display !== 'block') return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    else if (e.key === 'Enter') { if (items[sel]) go(items[sel]); }
  });

  function secoes() {
    var out = [];
    var seen = {};
    var ns = document.querySelectorAll('main h1, main h2, main h3, .painel h3, .ecard h3');
    for (var i = 0; i < ns.length; i++) {
      var t = (ns[i].textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || seen[t] || t.length < 3) continue;
      seen[t] = 1;
      out.push({ g: 'Seções desta página', t: t, el: ns[i] });
    }
    return out;
  }

  async function busca() {
    var s = (q.value || '').trim().toLowerCase();
    if (s.length < 2) {
      res.innerHTML = '<p style="color:#94A3B8;font:12.5px Manrope,sans-serif">Digite ao menos 2 caracteres…</p>';
      items = [];
      return;
    }
    items = [];
    var r = rootPath();

    // 1. Páginas
    PAGES.forEach(function (p) {
      if (p[0].toLowerCase().indexOf(s) >= 0) items.push({ g: 'Páginas', t: p[0], href: r + p[1] });
    });

    // 2. Seções
    secoes().forEach(function (x) {
      if (x.t.toLowerCase().indexOf(s) >= 0) items.push({ g: 'Seções desta página', t: x.t, el: x.el });
    });

    // 3 e 4. Votações + Parlamentares
    var d = await dados();
    (d.vot || []).forEach(function (v) {
      var t = v.tituloVotacao || v.descricaoProposicao || (v.proposicao && v.proposicao.titulo) || '';
      var sig = (v.siglaProposicao || '') + (v.numeroProposicao ? (' ' + v.numeroProposicao) : '');
      if ((t + ' ' + sig).toLowerCase().indexOf(s) >= 0) {
        items.push({ g: 'Votações', t: (sig ? sig + ' — ' : '') + String(t).slice(0, 90), vid: v.id });
      }
    });
    (d.cand || []).slice(0, 600).forEach(function (c) {
      var n = c.name || c.nome || '';
      if (n.toLowerCase().indexOf(s) >= 0) {
        items.push({ g: 'Parlamentares', t: n + ' · ' + (c.party || c.partido || '') + '-' + (c.state || c.uf || ''), href: r + 'pages/parlamentares.html?id=' + encodeURIComponent(c.id) });
      }
    });

    sel = items.length ? 0 : -1;
    paint();
  }

  function paint() {
    if (!items.length) {
      res.innerHTML = '<p style="color:#94A3B8;font:12.5px Manrope,sans-serif">Nada encontrado.</p>';
      return;
    }
    var h = '', cur = '';
    items.forEach(function (it, i) {
      if (it.g !== cur) {
        cur = it.g;
        h += '<p style="margin:10px 0 4px;color:#FFD700;font:800 11px Manrope,sans-serif;text-transform:uppercase;letter-spacing:.05em">' + esc(cur) + '</p>';
      }
      h += '<div data-i="' + i + '" style="padding:9px 12px;border-radius:8px;cursor:pointer;font:13px Manrope,sans-serif;color:#fff;background:' + (i === sel ? 'rgba(255,215,0,.16);border:1px solid rgba(255,215,0,.45)' : 'transparent;border:1px solid transparent') + ';margin-bottom:2px">' + esc(it.t) + '</div>';
    });
    res.innerHTML = h;
    res.querySelectorAll('div[data-i]').forEach(function (dEl) {
      dEl.addEventListener('click', function () { go(items[+dEl.dataset.i]); });
      dEl.addEventListener('mouseenter', function () { sel = +dEl.dataset.i; paint(); });
    });
    var curEl = res.querySelector('div[data-i="' + sel + '"]');
    if (curEl && curEl.scrollIntoView) curEl.scrollIntoView({ block: 'nearest' });
  }

  function go(it) {
    close();
    if (it.href) { location.href = it.href; return; }
    if (it.vid) {
      if ((location.pathname || '').indexOf('votacoes') >= 0 && typeof window.expand === 'function') {
        window.expand(it.vid);
        setTimeout(function () {
          var el = document.getElementById('vd-' + it.vid);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
        return;
      }
      location.href = rootPath() + 'pages/votacoes.html#v' + it.vid;
      return;
    }
    if (it.el) it.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var tBusca = null;
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'bgQ') {
      clearTimeout(tBusca);
      tBusca = setTimeout(busca, 220);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
