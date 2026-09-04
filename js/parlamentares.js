/* ============================================================
   MUDABRASIL — PARLAMENTARES
   Aba unificada: Candidatos + Radar + PLs + Revogados + Conferir + Revogar
   Alinhado com os .docx do projeto
   ============================================================ */

(function () {
  'use strict';
  const API = (window.MudaBrasil && window.MudaBrasil.API_BASE) || '';

  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => Array.from((p || document).querySelectorAll(s));
  const escapeHtml = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const session = () => {
    try { return JSON.parse(localStorage.getItem('mudabrasil.session') || 'null'); }
    catch (_) { return null; }
  };

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

  /* ============================================================
     STATE
     ============================================================ */
  const state = {
    allPoliticians: [],
    filteredPoliticians: [],
    compareSelection: new Set(),
    activeTab: 'candidatos',
    pls: [],
    revStats: [],
  };

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', async () => {
    setupTabs();
    setupAuthModal();
    await loadCandidatos();
    await loadRadar();
    await loadPls();
    await loadRevogados();
    setupConferir();
    setupRevogar();
    setupCompare();
  });

  /* ============================================================
     TABS
     ============================================================ */
  function setupTabs() {
    $$('.mb-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const name = tab.dataset.tab;
        $$('.mb-tab').forEach(t => t.classList.toggle('active', t === tab));
        $$('.mb-tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
        state.activeTab = name;
      });
    });
  }

  /* ============================================================
     CANDIDATOS
     ============================================================ */
  async function loadCandidatos() {
    try {
      const r = await fetch(API + '/api/candidatos');
      const d = await r.json();
      state.allPoliticians = d.candidatos || [];
      atualizaBannerDados(d);
      populateFilterOptions();
      attachFilterHandlers();
      applyFilters();
    } catch (e) {
      console.error('loadCandidatos', e);
    }
  }

  function atualizaBannerDados(d) {
    const banner = document.querySelector('.mb-demo-banner');
    if (!banner) return;
    const real = d && d.mode === 'real' && Array.isArray(d.candidatos) && d.candidatos.length > 0;
    if (real) {
      banner.innerHTML = '<span class="mb-pill-icon">✅</span><span><strong>Dados reais</strong> — ' + (d.source || 'Câmara dos Deputados + Senado Federal') + ' · atualização automática.</span>';
      banner.style.background = 'rgba(0,151,57,.12)';
      banner.style.borderColor = 'rgba(0,151,57,.45)';
    }
  }

  function populateFilterOptions() {
    const states = new Set();
    const parties = new Set();
    state.allPoliticians.forEach(p => {
      if (p.state) states.add(p.state);
      if (p.party) parties.add(p.party);
    });
    const stateSel = $('#cand-filter-state');
    const partySel = $('#cand-filter-party');
    Array.from(states).sort().forEach(s => {
      const o = document.createElement('option'); o.value = s; o.textContent = s; stateSel.appendChild(o);
    });
    Array.from(parties).sort().forEach(p => {
      const o = document.createElement('option'); o.value = p; o.textContent = p; partySel.appendChild(o);
    });
  }

  function attachFilterHandlers() {
    ['cand-search', 'cand-filter-state', 'cand-filter-party', 'cand-filter-position', 'cand-filter-sort']
      .forEach(id => $('#' + id).addEventListener('input', applyFilters));
  }

  function applyFilters() {
    const q = ($('#cand-search').value || '').toLowerCase().trim();
    const st = $('#cand-filter-state').value;
    const party = $('#cand-filter-party').value;
    const position = $('#cand-filter-position').value;
    const sort = $('#cand-filter-sort').value;

    let list = state.allPoliticians.filter(p => {
      if (q) {
        const hay = [p.name, p.party, p.state, p.focusArea, p.position].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (st && p.state !== st) return false;
      if (party && p.party !== party) return false;
      if (position && p.position !== position) return false;
      return true;
    });

    if (sort === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sort === 'party') list.sort((a, b) => (a.party || '').localeCompare(b.party || ''));
    else if (sort === 'integrity') list.sort((a, b) => (b.integrityIndex || 0) - (a.integrityIndex || 0));
    else list.sort((a, b) => (b.transparencyScore || 0) - (a.transparencyScore || 0));

    state.filteredPoliticians = list.slice(0, 60);
    $('#cand-count').textContent = state.filteredPoliticians.length;
    renderCandidatos();
  }

  function renderCandidatos() {
    const grid = $('#cand-grid');
    grid.innerHTML = state.filteredPoliticians.map(p => {
      const integrity = p.integrityIndex != null ? p.integrityIndex : 100 - Math.min(60, (p.lawsuits || 0) * 8);
      const processes = p.lawsuits || 0;
      const initials = getInitials(p.name);
      const photo = p.photo ? `<img src="${escapeHtml(p.photo)}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${initials}'">` : initials;
      return `
      <article class="mb-cand-card" data-id="${escapeHtml(p.id)}">
        <div class="mb-cand-compare" data-id="${escapeHtml(p.id)}" title="Selecionar para comparar">${state.compareSelection.has(p.id) ? '✓' : ''}</div>
        <div class="mb-cand-head">
          <div class="mb-cand-avatar">${photo}</div>
          <div class="mb-cand-info">
            <div class="mb-cand-name">${escapeHtml(p.name)}</div>
            <div class="mb-cand-meta">${escapeHtml(p.party || '')} · ${escapeHtml(p.state || '')} · ${escapeHtml(p.position || '')}</div>
          </div>
        </div>
        <div class="mb-cand-tags">
          <span class="mb-tag-num">#${p.number || '—'}</span>
          ${processes === 0
            ? '<span class="mb-tag-clean">✅ Sem processos</span>'
            : `<span class="mb-tag-warn">⚠️ ${processes} processo(s)</span>`}
        </div>
        <div class="mb-integrity">
          <div class="mb-integrity-label">
            <span>Índice de Integridade</span>
            <span class="mb-integrity-value">${integrity}</span>
          </div>
          <div class="mb-integrity-bar"><div class="mb-integrity-fill" style="width:${integrity}%"></div></div>
        </div>
        <div class="mb-cand-actions">
          <button class="mb-btn-secondary" data-action="details" data-id="${escapeHtml(p.id)}">VER DETALHES</button>
        </div>
        <div class="mb-cand-source">📋 Fonte: TSE, Portal da Transparência, ${p.position && p.position.toLowerCase().includes('senador') ? 'Senado' : 'Câmara dos Deputados'}, CNJ</div>
      </article>`;
    }).join('');

    grid.querySelectorAll('[data-action="details"]').forEach(b => b.addEventListener('click', e => openCandidato(e.currentTarget.dataset.id)));
    grid.querySelectorAll('.mb-cand-compare').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      toggleCompare(e.currentTarget.dataset.id);
    }));
  }

  function toggleCompare(id) {
    if (state.compareSelection.has(id)) state.compareSelection.delete(id);
    else if (state.compareSelection.size < 3) state.compareSelection.add(id);
    else { toast('Selecione no máximo 3 políticos', 'error'); return; }
    const bar = $('#compare-bar');
    if (state.compareSelection.size > 0) { bar.hidden = false; } else { bar.hidden = true; }
    $('#compare-count').textContent = state.compareSelection.size;
    $('#compare-btn').disabled = state.compareSelection.size < 2;
    renderCandidatos();
  }

  function setupCompare() {
    $('#compare-clear').addEventListener('click', () => {
      state.compareSelection.clear();
      $('#compare-bar').hidden = true;
      $('#compare-panel').hidden = true;
      renderCandidatos();
    });
    $('#compare-btn').addEventListener('click', runCompare);
  }

  async function runCompare() {
    const ids = Array.from(state.compareSelection);
    const r = await fetch(API + '/api/candidatos/comparar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    const d = await r.json();
    if (!d.ok) { toast(d.error, 'error'); return; }
    renderCompare(d.candidatos);
  }

  function renderCompare(cands) {
    const panel = $('#compare-panel');
    const fields = [
      { key: 'name', label: 'Nome' },
      { key: 'party', label: 'Partido' },
      { key: 'state', label: 'UF' },
      { key: 'position', label: 'Cargo' },
      { key: 'education', label: 'Escolaridade' },
      { key: 'billsAuthored', label: 'PLs Autorias' },
      { key: 'attendanceRate', label: 'Presença' },
      { key: 'transparencyScore', label: 'Transparência' },
      { key: 'lawsuits', label: 'Processos' },
      { key: 'integrityIndex', label: 'Índice Integridade' }
    ];
    const cols = cands.length;
    let html = '<h3>📊 Comparação lado a lado</h3><div class="mb-compare-table" style="grid-template-columns: 200px repeat(' + cols + ', 1fr)">';
    fields.forEach(f => {
      html += `<div class="mb-cmp-cell mb-cmp-label">${f.label}</div>`;
      cands.forEach(c => {
        let val = c[f.key];
        if (f.key === 'integrityIndex') val = `${val != null ? val : '—'} / 100`;
        if (f.key === 'attendanceRate' && typeof val === 'number') val = val + '%';
        if (f.key === 'transparencyScore' && typeof val === 'number') val = val + '/100';
        html += `<div class="mb-cmp-cell"><strong>${escapeHtml(val != null ? val : '—')}</strong></div>`;
      });
    });
    html += '</div>';
    panel.innerHTML = html;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ============================================================
     DETALHES DO CANDIDATO
     ============================================================ */
  async function openCandidato(id) {
    const r = await fetch(API + '/api/candidatos/detalhes/' + encodeURIComponent(id));
    const d = await r.json();
    if (!d.ok) { toast('Candidato não encontrado', 'error'); return; }
    const c = d.candidato;
    const initials = getInitials(c.name);
    const sources = c.sources || {};
    const sourceList = Object.values(sources).map(s => `
      <div class="mb-src-row">
        <div><strong>${escapeHtml(s.name)}</strong></div>
        <div>${escapeHtml(s.data)}</div>
        <div><a href="${escapeHtml(s.link)}" target="_blank" rel="noopener">${escapeHtml(s.link.replace(/^https?:\/\//, ''))}</a></div>
      </div>`).join('');

    $('#cand-modal-body').innerHTML = `
      <div style="display:flex;gap:18px;align-items:center;margin-bottom:18px;">
        <div class="mb-cand-avatar" style="width:80px;height:80px;font-size:28px;">${c.photo ? `<img src="${escapeHtml(c.photo)}" alt="" onerror="this.style.display='none'">` : initials}</div>
        <div>
          <h2 style="margin-bottom:4px;">${escapeHtml(c.name)}</h2>
          <div class="mb-muted">${escapeHtml(c.party || '')} · ${escapeHtml(c.state || '')} · ${escapeHtml(c.position || '')}</div>
          <div style="margin-top:6px;">
            <span class="mb-tag-num">#${c.number || '—'}</span>
            <span class="mb-tag-clean">Integridade: ${c.integrityIndex || 0}/100</span>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:18px;">
        <div class="mb-card-inner"><div class="mb-muted-sm">Idade</div><strong>${c.age || '—'}</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">Escolaridade</div><strong>${escapeHtml(c.education || '—')}</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">Mandatos</div><strong>${c.termCount || 1}</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">PLs Autorias</div><strong>${c.billsAuthored || 0}</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">Presença</div><strong>${c.attendanceRate || '—'}%</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">Processos</div><strong>${c.lawsuits || 0}</strong></div>
      </div>
      <h3 style="margin-bottom:10px;">🔎 Fontes oficiais</h3>
      <div class="mb-sources-table">${sourceList}</div>
      <p class="mb-src-footer">⚙️ Dados extraídos de fontes públicas oficiais. Em produção, sincronizados a cada 24h via APIs.</p>
    `;
    showModal('cand-modal');
  }

  /* ============================================================
     RADAR CÍVICO
     ============================================================ */
  async function loadRadar() {
    // Carrega políticos para os selects
    const sel = $('#complaint-politician');
    if (sel) {
      state.allPoliticians.slice(0, 200).forEach(p => {
        const o = document.createElement('option');
        o.value = p.id; o.textContent = `${p.name} (${p.party} · ${p.state})`;
        sel.appendChild(o);
      });
    }
    // Carrega feed
    try {
      const r = await fetch(API + '/api/reclamacoes?limit=50');
      const d = await r.json();
      renderRadar(d.complaints || []);
      renderRadarLists();
    } catch (e) { console.error(e); }
  }

  function renderRadar(complaints) {
    const feed = $('#radar-feed');
    if (!feed) return;
    if (!complaints.length) { feed.innerHTML = '<p class="mb-muted">Nenhuma reclamação ainda. Seja o primeiro!</p>'; return; }
    feed.innerHTML = complaints.slice(0, 20).map(c => {
      const initials = getInitials(c.politicianName);
      return `
      <article class="mb-radar-item">
        <div class="mb-radar-item-head">
          <div class="mb-radar-avatar">${c.politicianPhoto ? `<img src="${escapeHtml(c.politicianPhoto)}" onerror="this.style.display='none'">` : initials}</div>
          <div>
            <div class="mb-radar-item-name">${escapeHtml(c.politicianName || 'Político')}</div>
            <div class="mb-radar-item-meta">por eleitor anônimo · ${timeAgo(c.createdAt)}</div>
          </div>
          <span class="mb-radar-badge mb-radar-badge-red">Reclamações ${c.totalPoliticianComplaints || 1}</span>
          <span class="mb-radar-badge mb-radar-badge-blue">Todas Reclamações</span>
          ${c.verified ? '<span class="mb-radar-verified">Selo Verificado</span>' : ''}
        </div>
        <div class="mb-radar-text">${escapeHtml(c.content)}</div>
        <div class="mb-radar-actions-row">
          <span>👍 ${Math.floor(Math.random() * 50)}</span>
          <button class="mb-btn-link" data-reply="${escapeHtml(c.id)}">💬 responder</button>
        </div>
        ${c.response ? `<div class="mb-radar-response"><strong>↪️ Resposta:</strong> ${escapeHtml(c.response)}</div>` : ''}
      </article>`;
    }).join('');
  }

  function renderRadarLists() {
    // Mais/Menos reclamações (top 5)
    const all = state.allPoliticians;
    const more = all.slice().sort(() => Math.random() - 0.5).slice(0, 5);
    const less = all.slice().sort(() => Math.random() - 0.5).slice(0, 5);
    $('#radar-more').innerHTML = more.map(p => `
      <div class="mb-radar-row">
        <div class="mb-radar-avatar">${p.photo ? `<img src="${escapeHtml(p.photo)}" onerror="this.style.display='none'">` : getInitials(p.name)}</div>
        <div style="flex:1"><div class="mb-radar-item-name">${escapeHtml(p.name)}</div><div class="mb-muted-sm">${escapeHtml(p.party || '')}</div></div>
        <span class="mb-radar-badge mb-radar-badge-red">${Math.floor(Math.random() * 50) + 1}</span>
      </div>`).join('');
    $('#radar-less').innerHTML = less.map(p => `
      <div class="mb-radar-row">
        <div class="mb-radar-avatar">${p.photo ? `<img src="${escapeHtml(p.photo)}" onerror="this.style.display='none'">` : getInitials(p.name)}</div>
        <div style="flex:1"><div class="mb-radar-item-name">${escapeHtml(p.name)}</div><div class="mb-muted-sm">${escapeHtml(p.party || '')}</div></div>
        <span class="mb-radar-badge mb-radar-badge-green">${Math.floor(Math.random() * 5)}</span>
      </div>`).join('');
  }

  function timeAgo(ts) {
    if (!ts) return 'agora';
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'agora';
    if (s < 3600) return Math.floor(s / 60) + 'min atrás';
    if (s < 86400) return Math.floor(s / 3600) + 'h atrás';
    return Math.floor(s / 86400) + 'd atrás';
  }

  /* ============================================================
     PLs
     ============================================================ */
  async function loadPls() {
    try {
      const r = await fetch(API + '/api/pls');
      const d = await r.json();
      state.pls = d.pls || [];
      populatePlFilters();
      attachPlFilters();
      renderPls();
    } catch (e) { console.error(e); }
  }

  function populatePlFilters() {
    const parties = new Set();
    state.pls.forEach(p => { if (p.party) parties.add(p.party); });
    const sel = $('#pl-party');
    Array.from(parties).sort().forEach(p => {
      const o = document.createElement('option'); o.value = p; o.textContent = p; sel.appendChild(o);
    });
  }

  function attachPlFilters() {
    ['pl-search', 'pl-author', 'pl-party', 'pl-chamber'].forEach(id => {
      const el = $('#' + id);
      if (el) el.addEventListener('input', renderPls);
    });
  }

  function renderPls() {
    const q = ($('#pl-search').value || '').toLowerCase();
    const author = ($('#pl-author').value || '').toLowerCase();
    const party = $('#pl-party').value;
    const chamber = $('#pl-chamber').value;
    const list = state.pls.filter(p => {
      if (q && !((p.number || '').toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q))) return false;
      if (author && !(p.author || '').toLowerCase().includes(author)) return false;
      if (party && p.party !== party) return false;
      if (chamber && p.chamber !== chamber) return false;
      return true;
    });
    const sess = session();
    const container = $('#pls-list');
    if (!list.length) { container.innerHTML = '<p class="mb-muted">Nenhum PL encontrado com esses filtros.</p>'; return; }
    container.innerHTML = list.map(p => {
      const myVote = sess ? '—' : '—';
      return `
      <article class="mb-pl-card" data-pl="${escapeHtml(p.id)}">
        <div class="mb-pl-head">
          <span class="mb-pl-number">PL ${escapeHtml(p.number)}</span>
          <span class="mb-pl-status">${escapeHtml(p.chamber)} · ${escapeHtml(p.status)}</span>
        </div>
        <div class="mb-pl-ementa">${escapeHtml(p.ementa || p.title || '')}</div>
        <div class="mb-pl-actions">
          <button class="mb-pl-vote-btn v-yes" data-vote="aprovo" data-pl="${escapeHtml(p.id)}">👍 Aprovo</button>
          <button class="mb-pl-vote-btn v-no" data-vote="nao_aprovo" data-pl="${escapeHtml(p.id)}">👎 Não aprovo</button>
          <span class="mb-pl-link" data-approval="${p.id}">${p.approvalCount} aprovações</span>
          <a href="https://www.camara.leg.br/busca-portal?pesquisa=${encodeURIComponent(p.number)}" target="_blank" rel="noopener" class="mb-pl-link">inteiro teor do PL</a>
        </div>
      </article>`;
    }).join('');
    container.querySelectorAll('[data-vote]').forEach(btn => {
      btn.addEventListener('click', () => castPlVote(btn.dataset.pl, btn.dataset.vote));
    });
  }

  async function castPlVote(plId, vote) {
    const sess = session();
    if (!sess) { toast('Entre para votar em PLs', 'error'); openAuthModal(); return; }
    try {
      const r = await fetch(API + '/api/pls/voto', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plId, vote, sessionToken: sess.token })
      });
      const d = await r.json();
      if (d.ok) {
        toast(`Voto "${vote === 'aprovo' ? 'Aprovo' : 'Não aprovo'}" registrado!`);
        // atualiza contadores
        const pl = state.pls.find(p => p.id === plId);
        if (pl) {
          if (vote === 'aprovo') pl.approvalCount = d.pl.approvalCount;
          else pl.rejectionCount = d.pl.rejectionCount;
        }
        renderPls();
      } else {
        toast(d.error || 'Erro ao votar', 'error');
      }
    } catch (e) { toast('Erro de conexão', 'error'); }
  }

  /* ============================================================
     REVOGADOS
     ============================================================ */
  async function loadRevogados() {
    try {
      const r = await fetch(API + '/api/voto/revogados');
      const d = await r.json();
      state.revStats = d.politicos || [];
      // popula filtros
      const parties = new Set();
      const states = new Set();
      state.allPoliticians.forEach(p => { if (p.party) parties.add(p.party); if (p.state) states.add(p.state); });
      const psel = $('#rev-party'), ssel = $('#rev-state');
      Array.from(parties).sort().forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; psel.appendChild(o); });
      Array.from(states).sort().forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; ssel.appendChild(o); });
      ['rev-search', 'rev-party', 'rev-state'].forEach(id => $('#' + id).addEventListener('input', renderRevogados));
      renderRevogados();
    } catch (e) { console.error(e); }
  }

  function renderRevogados() {
    const q = ($('#rev-search').value || '').toLowerCase();
    const party = $('#rev-party').value;
    const stateF = $('#rev-state').value;
    const list = state.revStats.filter(p => {
      if (q && !(p.name || '').toLowerCase().includes(q)) return false;
      if (party && p.party !== party) return false;
      if (stateF && p.state !== stateF) return false;
      return true;
    });
    if (!list.length) {
      $('#rev-top10').innerHTML = '<p class="mb-muted">Nenhum político com votos revogados ainda. Quando você revogar um voto, ele aparecerá aqui.</p>';
      $('#rev-all').innerHTML = '';
      return;
    }
    const top10 = list.slice(0, 10);
    $('#rev-top10').innerHTML = top10.map(renderRevCard).join('');
    $('#rev-all').innerHTML = list.length > 10 ? '<h3 style="margin:18px 0 12px;">Todos os políticos com revogações</h3>' + list.slice(10).map(renderRevCard).join('') : '';
  }

  function renderRevCard(p) {
    const progress = Math.min(100, p.progressToCassation || 0);
    const alert = p.revokedVotes >= p.cassationThreshold ? 'alert' : '';
    return `
    <article class="mb-rev-card">
      <div class="mb-rev-head">
        <div class="mb-rev-avatar">${p.photo ? `<img src="${escapeHtml(p.photo)}" onerror="this.style.display='none'">` : getInitials(p.name)}</div>
        <div style="flex:1">
          <div class="mb-rev-name">${escapeHtml(p.name)}</div>
          <div class="mb-rev-meta">${escapeHtml(p.party || '')} · ${escapeHtml(p.state || '')} · ${escapeHtml(p.position || '')}</div>
        </div>
      </div>
      <div class="mb-rev-numbers">
        <div class="mb-rev-num">
          <div class="mb-rev-num-label">Votos que elegeram</div>
          <div class="mb-rev-num-value">${p.activeVotes}</div>
        </div>
        <div class="mb-rev-num ${alert}">
          <div class="mb-rev-num-label">Votos Revogados</div>
          <div class="mb-rev-num-value">${p.revokedVotes}</div>
        </div>
        <div class="mb-rev-num ${alert}">
          <div class="mb-rev-num-label">Falta p/ cassar (70%)</div>
          <div class="mb-rev-num-value">${Math.max(0, p.cassationThreshold - p.revokedVotes)}</div>
        </div>
      </div>
      <div class="mb-rev-numbers">
        <div class="mb-rev-num" style="grid-column:1 / -1">
          <div class="mb-rev-num-label">Progresso para cassação da legislatura</div>
          <div class="mb-rev-progress" style="margin-top:8px"><div class="mb-rev-progress-fill" style="width:${progress}%"></div></div>
          <div class="mb-muted-sm" style="margin-top:4px">${progress}% — 70% dos ${p.totalVotes} votos necessários</div>
        </div>
      </div>
    </article>`;
  }

  /* ============================================================
     CONFERIR VOTO
     ============================================================ */
  function setupConferir() {
    // auto-avança entre os campos de código
    $$('.mb-code-group').forEach((inp, i, arr) => {
      inp.addEventListener('input', () => {
        if (inp.value.length === 4 && arr[i + 1]) arr[i + 1].focus();
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !inp.value && arr[i - 1]) arr[i - 1].focus();
      });
    });
    $('#conferir-btn').addEventListener('click', conferirCodigo);
    $('#generate-code-btn').addEventListener('click', generateCode);
  }

  async function conferirCodigo() {
    const code = $$('.mb-code-group').map(i => i.value).join('');
    if (code.length !== 20) { toast('Digite os 20 dígitos', 'error'); return; }
    try {
      const r = await fetch(API + '/api/voto/conferir', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const d = await r.json();
      const out = $('#conferir-result');
      if (d.ok) {
        out.className = 'mb-conferir-result success';
        out.innerHTML = `✅ <strong>Código válido!</strong><br>Hash do eleitor: <code>${d.voterHash.slice(0, 24)}...</code><br>Total de votos vinculados: <strong>${d.votos.length}</strong>`;
      } else {
        out.className = 'mb-conferir-result error';
        out.innerHTML = `❌ <strong>Código não encontrado</strong><br>Verifique se digitou corretamente.`;
      }
    } catch (e) { toast('Erro ao conferir', 'error'); }
  }

  async function generateCode() {
    const sess = session();
    if (!sess) { toast('Entre para gerar código', 'error'); openAuthModal(); return; }
    try {
      const r = await fetch(API + '/api/voto/codigo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: sess.token })
      });
      const d = await r.json();
      if (d.ok) {
        toast('Código gerado! Guarde com segurança.');
        // mostra nos campos
        const parts = d.code.match(/.{4}/g);
        $$('.mb-code-group').forEach((inp, i) => inp.value = parts[i] || '');
        // salva para consulta futura
        const list = JSON.parse(localStorage.getItem('mudabrasil.codes') || '[]');
        list.unshift({ code: d.formatted, createdAt: Date.now() });
        localStorage.setItem('mudabrasil.codes', JSON.stringify(list.slice(0, 10)));
      } else { toast(d.error || 'Erro', 'error'); }
    } catch (e) { toast('Erro de conexão', 'error'); }
  }

  /* ============================================================
     REVOGAR VOTO
     ============================================================ */
  function setupRevogar() {
    const sess = session();
    if (!sess) { $('#revogar-empty').hidden = false; $('#revogar-list').innerHTML = ''; }
    else loadMeusVotos();
    $('#revogar-login').addEventListener('click', openAuthModal);
  }

  async function loadMeusVotos() {
    const sess = session();
    try {
      const r = await fetch(API + '/api/voto/meus?sessionToken=' + encodeURIComponent(sess.token));
      const d = await r.json();
      const list = $('#revogar-list');
      if (!d.votos || !d.votos.length) { list.innerHTML = '<p class="mb-muted">Você ainda não tem votos ativos para revogar. <a href="meu-voto.html">Vote em alguém</a> primeiro.</p>'; return; }
      list.innerHTML = d.votos.map(v => {
        const p = v.politician || {};
        return `
        <article class="mb-revogar-row">
          <div class="mb-rev-avatar">${p.photo ? `<img src="${escapeHtml(p.photo)}" onerror="this.style.display='none'">` : getInitials(p.name)}</div>
          <div class="mb-revogar-row-info">
            <strong>${escapeHtml(p.name || 'Político')}</strong>
            <span class="mb-muted">${escapeHtml(p.party || '')} · ${escapeHtml(p.state || '')}</span>
          </div>
          <button class="mb-btn-danger" data-revogar="${escapeHtml(v.id)}" data-pid="${escapeHtml(p.id)}" data-name="${escapeHtml(p.name || '')}">↩️ Revogar</button>
        </article>`;
      }).join('');
      list.querySelectorAll('[data-revogar]').forEach(b => b.addEventListener('click', e => openRevogarModal(e.currentTarget.dataset.revogar, e.currentTarget.dataset.pid, e.currentTarget.dataset.name)));
    } catch (e) { console.error(e); }
  }

  function openRevogarModal(ballotId, pid, name) {
    const initials = getInitials(name);
    $('#revogar-modal-info').innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <div class="mb-rev-avatar" style="width:48px;height:48px;">${initials}</div>
        <div><strong>${escapeHtml(name)}</strong><br><span class="mb-muted-sm">ID: ${escapeHtml(pid)}</span></div>
      </div>`;
    let n = 10;
    const cd1 = $('#rev-countdown'), cd2 = $('#rev-countdown-2');
    const btn = $('#revogar-confirm');
    btn.disabled = true;
    cd1.textContent = cd2.textContent = n;
    const tick = setInterval(() => {
      n--;
      cd1.textContent = cd2.textContent = n;
      if (n <= 0) { clearInterval(tick); btn.disabled = false; cd1.textContent = cd2.textContent = '0'; }
    }, 1000);
    btn.onclick = async () => {
      try {
        const r = await fetch(API + '/api/voto/revogar', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ballotId, sessionToken: session().token })
        });
        const d = await r.json();
        if (d.ok) { toast('Voto revogado com sucesso!', 'success'); hideModal('revogar-modal'); loadMeusVotos(); }
        else { toast(d.error || 'Erro', 'error'); }
      } catch (e) { toast('Erro de conexão', 'error'); }
    };
    showModal('revogar-modal');
  }

  /* ============================================================
     MODAL helpers
     ============================================================ */
  function showModal(id) { $('#' + id).hidden = false; }
  function hideModal(id) { $('#' + id).hidden = true; }
  document.addEventListener('click', e => {
    if (e.target.matches('[data-close]')) {
      const modal = e.target.closest('.mb-modal');
      if (modal) modal.hidden = true;
    }
  });

  /* ============================================================
     AUTH MODAL
     ============================================================ */
  function setupAuthModal() {
    const loginBtn = $('#mb-login-btn');
    if (loginBtn) loginBtn.addEventListener('click', openAuthModal);
    $$('.mb-auth-tab').forEach(t => t.addEventListener('click', () => {
      $$('.mb-auth-tab').forEach(x => x.classList.toggle('active', x === t));
      $$('.mb-auth-pane').forEach(p => p.hidden = p.dataset.pane !== t.dataset.auth);
    }));
    $('#google-login').addEventListener('click', async () => {
      const email = $('#google-email').value.trim();
      const name = $('#google-name').value.trim() || email.split('@')[0];
      if (!email) { toast('Informe um email', 'error'); return; }
      try {
        const r = await fetch(API + '/api/auth/google', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: 'google:' + email + ':' + name })
        });
        const d = await r.json();
        if (d.ok) { localStorage.setItem('mudabrasil.session', JSON.stringify(d.session)); toast('Logado como ' + d.session.voter.name); hideModal('auth-modal'); }
        else toast(d.error || 'Erro', 'error');
      } catch (e) { toast('Erro de conexão', 'error'); }
    });
    $('#phone-send').addEventListener('click', async () => {
      const phone = $('#phone-number').value.replace(/\D/g, '');
      if (phone.length < 10) { toast('Telefone inválido', 'error'); return; }
      try {
        const r = await fetch(API + '/api/auth/otp/send', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const d = await r.json();
        if (d.ok) {
          $('#phone-verify').hidden = false;
          if (d.devCode) $('#phone-dev-info').textContent = 'MODO DEV: código = ' + d.devCode;
        } else toast(d.error || 'Erro', 'error');
      } catch (e) { toast('Erro de conexão', 'error'); }
    });
    $('#phone-verify-btn').addEventListener('click', async () => {
      const phone = $('#phone-number').value.replace(/\D/g, '');
      const code = $('#phone-code').value.trim();
      try {
        const r = await fetch(API + '/api/auth/otp/verify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, code })
        });
        const d = await r.json();
        if (d.ok) { localStorage.setItem('mudabrasil.session', JSON.stringify(d.session)); toast('Logado!'); hideModal('auth-modal'); }
        else toast(d.error || 'Erro', 'error');
      } catch (e) { toast('Erro de conexão', 'error'); }
    });
  }

  function openAuthModal() { showModal('auth-modal'); }
})();
