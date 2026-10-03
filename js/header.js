/* ============================================================
   MEUVOTO — HEADER COMPARTILHADO
   Injeta navbar oficial em todas as páginas.
   Deve ser incluido no <head> de cada pagina antes de
   qualquer outro script.
   ============================================================ */

(function () {
  'use strict';

  // ---- CSS do navbar (inline para funcionar em todas as paginas) ----
  const CSS = `
    .mb-header {
      position: sticky; top: 0; z-index: 100;
      background: rgba(14,23,38,0.95);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(90,107,126,0.28);
    }
    .mb-nav-inner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px; gap: 16px; max-width: 1480px; margin: 0 auto;
    }
    .mb-logo {
      display: flex; align-items: center; gap: 12px;
      font-family: 'Montserrat', sans-serif; font-weight: 900; font-size: 1.3rem;
      color: #fff; text-decoration: none; white-space: nowrap;
    }
    .mb-logo:hover { opacity: 0.9; }
    .mb-logo .mv-slogan{display:block;color:#D4AF37;font-size:0.65rem;font-weight:700;white-space:nowrap;font-style:italic;letter-spacing:0.02em;margin-top:2px}
    .mb-nav-links {
      display: flex; align-items: center; gap: 2px;
      list-style: none; margin: 0; padding: 0; flex-wrap: wrap;
    }
    .mb-nav-links a {
      padding: 7px 12px; border-radius: 9999px;
      color: #C6D0DD; font-weight: 600; font-size: 0.8rem;
      transition: all 0.25s; white-space: nowrap; text-decoration: none;
    }
    .mb-nav-links a:hover {
      background: rgba(26,115,232,0.22); color: #fff;
    }
    .mb-nav-links a.mb-active {
      background: #1A73E8; color: #fff;
    }
    .mb-nav-cta { display: flex; gap: 8px; align-items: center; }
    .mb-btn-entrar {
      background: transparent; color: #C6D0DD; border: 1px solid rgba(90,107,126,0.5);
      padding: 8px 18px; border-radius: 9999px;
      font-weight: 700; font-size: 0.8rem; cursor: pointer;
      transition: all 0.2s;
    }
    .mb-btn-entrar:hover { border-color: #1A73E8; color: #fff; }
    .mb-btn-cadastrar {
      background: linear-gradient(135deg, #1A73E8 0%, #1557b9 100%); 
      color: #FFFFFF; border: none;
      padding: 8px 18px; border-radius: 9999px;
      font-weight: 800; font-size: 0.8rem; cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
    }
    .mb-btn-cadastrar:hover { 
      filter: brightness(1.1); 
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4);
    }
    .mb-mobile-toggle { display: none; font-size: 1.6rem; color: #fff; cursor: pointer; }
    @media (max-width: 1080px) {
      .mb-nav-links { display: none; }
      .mb-nav-links.mb-open {
        display: flex; flex-direction: column; align-items: flex-start;
        position: absolute; top: 100%; left: 0; right: 0;
        background: #0E1726; padding: 16px;
        border-bottom: 1px solid rgba(90,107,126,0.28);
        z-index: 99;
      }
      .mb-nav-links.mb-open a { padding: 10px 14px; width: 100%; }
      .mb-mobile-toggle { display: block; }
      .mb-nav-cta { display: none; }
    }
    @media (max-width: 560px) {
      .mb-btn-entrar, .mb-btn-cadastrar { padding: 7px 14px; font-size: 0.75rem; }
    }
  `;

  // ---- Menu de 7 itens (spec dos .docx) ----
  const NAV_LINKS = [
    { href: 'index.html',               label: 'Início' },
    { href: 'pages/parlamentares.html', label: 'Pesquisar Políticos' },
    { href: 'pages/conferir.html',      label: 'Conferir Voto' },
    { href: 'pages/congresso.html',     label: 'PLs no Congresso' },
    { href: 'pages/revogados.html',     label: 'Políticos Revogados' },
    { href: 'pages/quem-somos.html',    label: 'Quem Somos' },
    { href: 'pages/meu-voto.html',      label: 'Revogar Voto' },
  ];

  // ---- Prefixo relativo (raiz = '' , pages/ = '../') ----
  function pagePrefix() {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.indexOf('/pages/') !== -1) return '../';
    return '';
  }

  // ---- Detectar pagina ativa ----
  function getCurrentPage() {
    const path = window.location.pathname.replace(/\\/g, '/');
    const file = path.split('/').pop() || 'index.html';
    const inPages = path.indexOf('/pages/') !== -1;
    if (file === 'index.html' && !inPages) return 'index.html';
    if (inPages) return 'pages/' + file;
    return null;
  }

  // ---- Abrir modal de auth ----
  function mbOpenAuth(type) {
    // Tenta via MBAuth (se incluido na pagina)
    if (window.MBAuth && window.MBAuth.openModal) {
      window.MBAuth.openModal();
      return;
    }
    // Tenta via auth-modal no DOM
    const modal = document.getElementById('auth-modal') || document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      return;
    }
    // Hook local exposto pela pagina
    if (typeof window.mbOpenAuthLocal === 'function') {
      window.mbOpenAuthLocal(type);
      return;
    }
    alert('Funcionalidade de login disponível na página principal.');
  }

  // ---- Toggle menu mobile ----
  function mbToggleMenu() {
    const ul = document.getElementById('mb-nav-links');
    if (ul) ul.classList.toggle('mb-open');
  }

  // ---- Injetar CSS ----
  function injectCSS() {
    if (document.getElementById('mb-header-css')) return;
    const style = document.createElement('style');
    style.id = 'mb-header-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ---- Construir HTML do header ----
  function buildHeaderHTML() {
    const current = getCurrentPage();
    const prefix = pagePrefix();
    const linksHTML = NAV_LINKS.map(link => {
      const href = prefix + link.href;
      const isActive = link.href === current;
      const cls = isActive ? ' class="mb-active"' : '';
      return `<li><a href="${href}"${cls}>${link.label}</a></li>`;
    }).join('\n');

    return `
<header class="mb-header">
  <div class="mb-nav-inner">
    <a href="${prefix}index.html" class="mb-logo" aria-label="VotaBrasil">
      <img src="${prefix}icon.svg" alt="VotaBrasil" width="48" height="48" style="border-radius:10px;display:block">
      <span><b style="background:linear-gradient(90deg,#fff 0%,#fff 45%,#D4AF37 45%,#D4AF37 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#fff">VotaBrasil</b><span class="mv-slogan">Meu voto coloca, meu voto tira.</span></span>
    </a>
    <nav aria-label="Navegação principal">
      <ul class="mb-nav-links" id="mb-nav-links">
        ${linksHTML}
      </ul>
    </nav>
    <div class="mb-nav-cta">
      <button class="mb-btn-entrar" id="mb-entrar-btn">Entrar</button>
      <button class="mb-btn-cadastrar" id="mb-cadastrar-btn">Cadastrar</button>
    </div>
    <span class="mb-mobile-toggle" id="mb-mobile-toggle" role="button" aria-label="Menu">☰</span>
  </div>
</header>`;
  }

  // ---- Injetar no DOM ----
  function mount() {
    if (document.getElementById('mb-shared-header')) return;

    injectCSS();

    const container = document.createElement('div');
    container.id = 'mb-shared-header';
    container.innerHTML = buildHeaderHTML();

    const body = document.body;
    body.insertBefore(container, body.firstChild);

    // Eventos dos botoes
    const entrarBtn = document.getElementById('mb-entrar-btn');
    const cadastrarBtn = document.getElementById('mb-cadastrar-btn');
    const mobileToggle = document.getElementById('mb-mobile-toggle');

    if (entrarBtn)  entrarBtn.addEventListener('click', () => mbOpenAuth('login'));
    if (cadastrarBtn) cadastrarBtn.addEventListener('click', () => mbOpenAuth('cadastro'));
    if (mobileToggle) mobileToggle.addEventListener('click', mbToggleMenu);

    // Expor funcao para paginas que precisam abrir o modal de fora
    window.mbAbrirModal = mbOpenAuth;
  }

  // ---- Executar ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.mbAbrirModal = mbOpenAuth;
})();
