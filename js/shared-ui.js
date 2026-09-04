/* ============================================================
   MUDABRASIL - UI COMPARTILHADA
   Funções comuns a todas as páginas: menu mobile, modal de
   login e revelação de elementos ao rolar a tela.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- MENU MOBILE ---------- */
  function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu');
    const sidebar = document.getElementById('sidebar');
    const navLinks = document.getElementById('nav-links');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      if (sidebar) sidebar.classList.toggle('open');
      if (navLinks) navLinks.classList.toggle('open');
    });

    // Fecha o menu ao clicar em um link
    document.querySelectorAll('#sidebar a, #nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('open');
        if (navLinks) navLinks.classList.remove('open');
      });
    });
  }

  /* ---------- MODAL DE LOGIN ---------- */
  function showLoginForm() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'flex';
  }

  function initLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;

    // Fecha ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  /* ---------- REVELAÇÃO AO ROLAR ---------- */
  function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    if (!('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('show'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    reveals.forEach(el => observer.observe(el));
  }

  /* ---------- ESC FECHA QUALQUER MODAL ---------- */
  function initEscClose() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(m => {
          if (m.style.display === 'flex') m.style.display = 'none';
        });
      }
    });
  }

  /* ---------- INIT ---------- */
  function init() {
    initMobileMenu();
    initLoginModal();
    initReveal();
    initEscClose();
  }

  // Expor função global
  window.showLoginForm = showLoginForm;

  document.addEventListener('DOMContentLoaded', init);
})();