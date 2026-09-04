/* ============================================================
   MUDABRASIL — AUTENTICAÇÃO DE ELEITORES (UI)
   Login via Google OAuth ou Telefone (SMS OTP)
   ============================================================ */

(function () {
  'use strict';
  const API = (window.MudaBrasil && window.MudaBrasil.API_BASE) || '';

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
    } catch (e) { /* ignore */ }
    return null;
  }

  function saveSession(s) {
    state.session = s;
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
    document.dispatchEvent(new CustomEvent('mb:auth-changed', { detail: s }));
    updateAuthBtn();
  }

  function updateAuthBtn() {
    const btn = $('#authBtn');
    if (!btn) return;
    if (state.session) {
      const name = (state.session.voter && state.session.voter.name) || 'Conta';
      btn.textContent = name.length > 12 ? name.slice(0, 12) + '…' : name;
      btn.onclick = () => showAccountMenu(btn);
    } else {
      btn.textContent = 'Entrar';
      btn.onclick = () => openAuthModal();
    }
  }

  function openAuthModal() {
    $('#authModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function showAccountMenu(btn) {
    // Confirma logout
    if (confirm('Você está logado como ' + (state.session.voter.name || state.session.voter.email || state.session.voter.phone) + '.\n\nDeseja sair?')) {
      logout();
    }
  }

  async function logout() {
    if (state.session && state.session.sessionToken) {
      try {
        await fetch(API + '/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: state.session.sessionToken })
        });
      } catch (e) { /* ignore */ }
    }
    saveSession(null);
  }

  function setFeedback(msg, type) {
    const fb = $('#authFeedback');
    if (!fb) return;
    fb.textContent = msg;
    fb.className = 'auth__feedback auth__feedback--' + (type || 'info');
  }

  async function loginGoogle() {
    const token = ($('#googleToken').value || '').trim();
    if (!token) {
      setFeedback('Informe um token de teste no formato google:email:nome', 'error');
      return;
    }
    setFeedback('Autenticando...', 'info');
    try {
      const res = await fetch(API + '/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      });
      const data = await res.json();
      if (data.ok && data.sessionToken) {
        saveSession({ sessionToken: data.sessionToken, voter: data.voter });
        setFeedback('✅ Login realizado!', 'ok');
        setTimeout(() => {
          $('#authModal').classList.add('hidden');
          document.body.style.overflow = '';
        }, 700);
      } else {
        setFeedback('❌ ' + (data.error || 'Erro ao autenticar'), 'error');
      }
    } catch (e) {
      setFeedback('❌ Erro: ' + e.message, 'error');
    }
  }

  async function sendOtp() {
    const phone = ($('#phoneInput').value || '').trim();
    if (!phone) {
      setFeedback('Informe seu telefone (com DDD)', 'error');
      return;
    }
    setFeedback('Enviando código...', 'info');
    try {
      const res = await fetch(API + '/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.ok) {
        state.phoneInOtp = phone;
        $('#otpPanel').classList.remove('hidden');
        let msg = '✅ Código enviado!';
        if (data.devCode) {
          msg += ' (DEV: ' + data.devCode + ')';
        }
        setFeedback(msg, 'ok');
      } else {
        setFeedback('❌ ' + (data.error || 'Erro ao enviar código'), 'error');
      }
    } catch (e) {
      setFeedback('❌ Erro: ' + e.message, 'error');
    }
  }

  async function verifyOtp() {
    const code = ($('#otpInput').value || '').trim();
    if (!code || code.length !== 6) {
      setFeedback('Informe o código de 6 dígitos', 'error');
      return;
    }
    if (!state.phoneInOtp) {
      setFeedback('Solicite um código primeiro', 'error');
      return;
    }
    setFeedback('Verificando...', 'info');
    try {
      const res = await fetch(API + '/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.phoneInOtp, code })
      });
      const data = await res.json();
      if (data.ok && data.sessionToken) {
        saveSession({ sessionToken: data.sessionToken, voter: data.voter });
        setFeedback('✅ Login realizado!', 'ok');
        setTimeout(() => {
          $('#authModal').classList.add('hidden');
          document.body.style.overflow = '';
        }, 700);
      } else {
        setFeedback('❌ ' + (data.error || 'Código incorreto'), 'error');
      }
    } catch (e) {
      setFeedback('❌ Erro: ' + e.message, 'error');
    }
  }

  function attachListeners() {
    // Botão principal
    updateAuthBtn();

    // Tabs do auth
    $$('.auth__tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.auth__tab').forEach(t => t.classList.remove('auth__tab--active'));
        tab.classList.add('auth__tab--active');
        const which = tab.dataset.authTab;
        if (which === 'google') {
          $('#authGooglePanel').classList.remove('hidden');
          $('#authPhonePanel').classList.add('hidden');
        } else {
          $('#authGooglePanel').classList.add('hidden');
          $('#authPhonePanel').classList.remove('hidden');
        }
      });
    });

    // Botões de ação
    const googleBtn = $('#googleLoginBtn');
    if (googleBtn) googleBtn.addEventListener('click', loginGoogle);
    const sendBtn = $('#sendOtpBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendOtp);
    const verifyBtn = $('#verifyOtpBtn');
    if (verifyBtn) verifyBtn.addEventListener('click', verifyOtp);

    // Submit com Enter
    const otpInput = $('#otpInput');
    if (otpInput) otpInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') verifyOtp(); });
    const googleInput = $('#googleToken');
    if (googleInput) googleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginGoogle(); });
  }

  document.addEventListener('DOMContentLoaded', attachListeners);

  // Expor para uso global
  window.MBSession = state.session;
  window.MBAuth = {
    getSession: () => state.session,
    setSession: saveSession,
    logout,
    openModal: openAuthModal
  };
})();
