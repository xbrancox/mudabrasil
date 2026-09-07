/* ============================================================
   MUDABRASIL — AUTENTICAÇÃO DE ELEITORES (UI)
   Login via Google OAuth ou Telefone (SMS OTP)
   ============================================================ */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const SESSION_KEY = 'mudabrasil.session';

  const state = {
    session: loadSession(),
    phoneInOtp: null
  };

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (s && s.sessionToken && s.voter) return s;
    } catch (e) {}
    return null;
  }

  function saveSession(s) {
    state.session = s;
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
    document.dispatchEvent(new CustomEvent('mb:auth-changed', { detail: s }));
  }

  async function logout() {
    if (state.session && state.session.sessionToken) {
      try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionToken: state.session.sessionToken }) }); } catch (e) {}
    }
    saveSession(null);
  }

  function openAuthModal() {
    const m = document.getElementById('auth-modal') || document.getElementById('authModal');
    if (m) { m.classList.remove('hidden'); m.hidden = false; document.body.style.overflow = 'hidden'; }
  }

  window.MBAuth = {
    getSession: () => state.session,
    setSession: saveSession,
    logout,
    openModal: openAuthModal
  };
})();
