/* ============================================================
   MUDABRASIL — PARLAMENTARES
   Aba unificada: Candidatos + Radar + PLs + Revogados + Conferir + Revogar
   ============================================================ */
(function () {
  'use strict';

  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => Array.from((p || document).querySelectorAll(s));
  const escapeHtml = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg, type = 'success') {
    const t = $('#mb-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'mb-toast ' + type;
    t.hidden = false;
    setTimeout(() => { t.hidden = true; }, 3500);
  }

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const state = {
    allPoliticians: [],
    filteredPoliticians: [],
    compareSelection: new Set(),
    activeTab: 'candidatos',
    pls: [],
    revStats: [],
    radarFeed: [],
    detail: { id: null, tab: 'reclamacoes' }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    setupTabs();
    await loadCandidatos();
  });

  function setupTabs() {
    const TABS = ['candidatos', 'radar', 'pls', 'revogados', 'conferir', 'revogar'];
    function activateTab(name, updateHash) {
      if (!TABS.includes(name)) return;
      const tab = document.querySelector('.mb-tab[data-tab="' + name + '"]');
      if (!tab) return;
      $$('.mb-tab').forEach(t => t.classList.toggle('active', t === tab));
      $$('.mb-tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
      state.activeTab = name;
      if (updateHash && location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    }
    $$('.mb-tab').forEach(tab => {
      tab.addEventListener('click', () => activateTab(tab.dataset.tab, true));
    });
    const initial = (location.hash || '').replace('#', '');
    if (initial) activateTab(initial, false);
  }

  async function loadCandidatos() {
    // 1) Backend real
    try {
      const base = (window.MudaBrasil && window.MudaBrasil.API_BASE) || '';
      const r = await fetch(base + '/api/candidatos');
      if (r.ok) {
        const d = await r.json();
        if (d.candidatos && d.candidatos.length) {
          state.allPoliticians = d.candidatos;
          state.dataMode = 'real';
        }
      }
    } catch (e) {}

    if (!state.allPoliticians.length) {
      state.allPoliticians = [];
      state.dataMode = 'demo';
    }
    renderCandidatos();
  }

  function renderCandidatos() {
    const grid = $('#cand-grid');
    if (!grid) return;
    if (!state.allPoliticians.length) {
      grid.innerHTML = '<p class="mb-muted">Nenhum político carregado. Verifique sua conexão.</p>';
      return;
    }
    grid.innerHTML = state.allPoliticians.slice(0, 60).map(p => {
      const initials = getInitials(p.name);
      const photo = p.photo ? `<img src="${escapeHtml(p.photo)}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${initials}'">` : initials;
      return `<article class="mb-cand-card" data-id="${escapeHtml(p.id)}">
        <div class="mb-cand-head">
          <div class="mb-cand-avatar">${photo}</div>
          <div class="mb-cand-info">
            <div class="mb-cand-name">${escapeHtml(p.name)}</div>
            <div class="mb-cand-meta">${escapeHtml(p.party || '')} · ${escapeHtml(p.state || '')} · ${escapeHtml(p.position || '')}</div>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  function showModal(id) { const el = $('#' + id); if (el) el.hidden = false; }
  function hideModal(id) { const el = $('#' + id); if (el) el.hidden = true; }
  document.addEventListener('click', e => {
    if (e.target.matches('[data-close]')) {
      const modal = e.target.closest('.mb-modal');
      if (modal) modal.hidden = true;
    }
  });
})();
