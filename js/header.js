/* ============================================================
   MUDABRASIL — HEADER COMPARTILHADO (injetado em todas as páginas)
   ============================================================ */
(function () {
  'use strict';

  const NAV_LINKS = [
    { href: 'index.html',               label: 'Início' },
    { href: 'pages/parlamentares.html', label: 'Pesquisar Políticos' },
    { href: 'pages/congresso.html',     label: 'PLs no Congresso' },
    { href: 'pages/meu-voto.html',      label: 'Meu Voto' }
  ];

  function pagePrefix() {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.indexOf('/pages/') !== -1) return '../';
    return '';
  }

  function getCurrentPage() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const file = path.split('/').pop() || 'index.html';
    const inPages = path.indexOf('/pages/') !== -1;
    if (file === 'index.html' && !inPages) return 'index.html';
    if (inPages) return 'pages/' + file;
    return null;
  }

  function mount() {
    if (document.getElementById('mb-shared-header')) return;
    const current = getCurrentPage();
    const prefix = pagePrefix();
    const linksHTML = NAV_LINKS.map(link => {
      const href = prefix + link.href;
      const isActive = link.href === current;
      const cls = isActive ? ' class="mb-active"' : '';
      return `<li><a href="${href}"${cls}>${link.label}</a></li>`;
    }).join('\n');

    const container = document.createElement('div');
    container.id = 'mb-shared-header';
    container.innerHTML = `<header class="mb-header"><nav aria-label="Navegação"><ul>${linksHTML}</ul></nav></header>`;
    document.body.insertBefore(container, document.body.firstChild);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
