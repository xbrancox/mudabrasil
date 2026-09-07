/* ============================================================
   MUDABRASIL - UI COMPARTILHADA
   Menu mobile, modal de login e revelação ao rolar.
   ============================================================ */
(function () {
  'use strict';

  function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu');
    const sidebar = document.getElementById('sidebar');
    const navLinks = document.getElementById('nav-links');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      if (sidebar) sidebar.classList.toggle('open');
      if (navLinks) navLinks.classList.toggle('open');
    });
  }

  function initLoginModal() {
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

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

  function initEscClose() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(m => {
          if (m.style.display === 'flex') m.style.display = 'none';
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initLoginModal();
    initReveal();
    initEscClose();
  });
})();
