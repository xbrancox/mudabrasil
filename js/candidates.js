/* ============================================================
   MUDABRASIL - LÓGICA DA PÁGINA DE CANDIDATOS (dual-mode)
   ------------------------------------------------------------
   - MODO REAL:  busca /api/candidatos (dados reais da Câmara)
   - MODO DEMO:  fallback para window.CANDIDATE_DATA (sintéticos)
   A escolha é automática: se a API responder com dados reais,
   usa-os; caso contrário (ex.: aberto via file://), usa o demo.
   Campos ausentes (nulos) são tratados com elegância em todo
   o rendering (cards, comparação e detalhes).
   ============================================================ */

(function () {
  const API = (window.MudaBrasil && window.MudaBrasil.API_BASE) || '';
  const D = window.CANDIDATE_DATA;

  // Conjunto de dados ativo (reais ou demo)
  let dataset = {
    mode: 'demo',
    candidates: (D && D.CANDIDATES) || [],
    source: 'Modo demo — dados sintéticos',
    total: (D && D.CANDIDATES) ? D.CANDIDATES.length : 0,
    updatedAt: null
  };

  let state = {
    query: '',
    filters: { state: 'all', party: 'all', position: 'all' },
    sortBy: 'name',
    sortOrder: 'asc',
    compareIds: [],
    maxCompare: 3
  };

  const grid = document.getElementById('candidates-grid');
  const searchInput = document.getElementById('search-input');
  const stateFilter = document.getElementById('filter-state');
  const partyFilter = document.getElementById('filter-party');
  const positionFilter = document.getElementById('filter-position');
  const sortSelect = document.getElementById('sort-select');
  const resultCount = document.getElementById('result-count');
  const sourceBadge = document.getElementById('source-badge');
  const subtitle = document.getElementById('page-subtitle');
  const compareBar = document.getElementById('compare-bar');
  const compareModal = document.getElementById('compare-modal');
  const detailModal = document.getElementById('detail-modal');

  /* ---------- ÍNDICE DE INTEGRIDADE (null-safe) ---------- */
  function integrityOf(c) {
    if (!c || c.transparencyScore == null || c.lawsuits == null || c.attendanceRate == null) return null;
    return D.computeIntegrityScore(c);
  }

  /* ---------- BUSCA / FILTRO / ORDEM LOCAIS ---------- */
  function applyLocal() {
    let list = dataset.candidates;
    const q = state.query.toLowerCase().trim();
    if (q) {
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.party || '').toLowerCase().includes(q) ||
        (c.position || '').toLowerCase().includes(q) ||
        (c.focusArea || '').toLowerCase().includes(q)
      );
    }
    if (state.filters.state !== 'all') list = list.filter(c => c.state === state.filters.state);
    if (state.filters.party !== 'all') list = list.filter(c => c.party === state.filters.party);
    if (state.filters.position !== 'all') list = list.filter(c => c.position === state.filters.position);

    const dir = state.sortOrder === 'desc' ? -1 : 1;
    list = [...list].sort((a, b) => {
      let va = a[state.sortBy], vb = b[state.sortBy];
      const aN = va == null, bN = vb == null;
      if (aN && bN) return 0;
      if (aN) return 1;   // nulos sempre por último
      if (bN) return -1;
      if (typeof va === 'string' || typeof vb === 'string') {
        return dir * String(va).localeCompare(String(vb), 'pt-BR');
      }
      return dir * (va - vb);
    });
    return list;
  }

  /* ---------- RENDER PRINCIPAL ---------- */
  function render() {
    const list = applyLocal();
    if (list.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <h3>Nenhum candidato encontrado</h3>
          <p>Tente ajustar sua busca ou os filtros aplicados.</p>
        </div>`;
    } else {
      grid.innerHTML = list.map(buildCard).join('');
    }
    resultCount.textContent = `${list.length} candidato(s) encontrado(s)` +
      (dataset.mode === 'real' ? ` de ${dataset.total} no total` : '');
    updateCompareBar();
  }

  /* ---------- CARD DE CANDIDATO (null-safe + foto) ---------- */
  function buildCard(c) {
    const integrity = integrityOf(c);
    const inCompare = state.compareIds.includes(c.id);

    const avatar = c.photo
      ? `<img class="candidate-photo" src="${c.photo}" alt="${c.name}" loading="lazy" onerror="this.outerHTML='<div class=&quot;candidate-avatar&quot;>${D.getInitials(c.name)}</div>'">`
      : `<div class="candidate-avatar">${D.getInitials(c.name)}</div>`;

    const scoreBlock = (integrity != null)
      ? `<div class="candidate-score-bar">
           <div class="candidate-score-label">
             <span>Índice de Integridade</span><span>${integrity}</span>
           </div>
           <div class="score-bar"><div class="score-fill" style="width:${integrity}%"></div></div>
         </div>`
      : '';

    const lawsuitBadge = c.lawsuits != null
      ? (c.lawsuits > 0
          ? `<span class="badge risk">⚖️ ${c.lawsuits} processo(s)</span>`
          : '<span class="badge score">✅ Sem processos</span>')
      : '';

    const realBadge = (c.source === 'camara') ? '<span class="badge real">📡 Real</span>' : '';

    return `
      <div class="candidate-card" data-id="${c.id}">
        <label class="compare-checkbox" title="Selecionar para comparar">
          <input type="checkbox" data-compare="${c.id}" ${inCompare ? 'checked' : ''}>
        </label>
        <div class="candidate-header">
          ${avatar}
          <div>
            <p class="candidate-name">${c.name}</p>
            <p class="candidate-party">${c.party || '—'} • ${c.state || '—'}${c.position ? ' • ' + c.position : ''}</p>
          </div>
        </div>
        <div class="candidate-meta">
          ${c.number ? `<span class="badge">#${c.number}</span>` : ''}
          ${realBadge}${lawsuitBadge}
        </div>
        ${scoreBlock}
        <button class="btn btn-secondary btn-sm" data-detail="${c.id}">Ver Detalhes</button>
        <div class="source-badge">Fonte: ${(c.dataSources || []).join(', ') || '—'}</div>
      </div>`;
  }

  /* ---------- BARRA DE COMPARAÇÃO ---------- */
  function updateCompareBar() {
    if (state.compareIds.length === 0) {
      compareBar.classList.remove('visible');
      return;
    }
    compareBar.classList.add('visible');
    compareBar.querySelector('#compare-count').textContent = state.compareIds.length;
  }

  function toggleCompare(id, checked) {
    if (checked) {
      if (state.compareIds.length >= state.maxCompare) {
        showToast(`⚠️ Você pode comparar no máximo ${state.maxCompare} candidatos.`, 'warning');
        return;
      }
      state.compareIds.push(id);
    } else {
      state.compareIds = state.compareIds.filter(x => x !== id);
    }
    render();
  }

  /* ---------- COMPARAÇÃO (null-safe) ---------- */
  function openCompare() {
    if (state.compareIds.length < 2) {
      showToast('Selecione pelo menos 2 candidatos para comparar.', 'warning');
      return;
    }
    const candidates = state.compareIds
      .map(id => dataset.candidates.find(c => c.id === id));

    const rows = [
      { label: 'Partido', get: c => c.party, best: null },
      { label: 'Estado', get: c => c.state, best: null },
      { label: 'Cargo', get: c => c.position, best: null },
      { label: 'Número', get: c => c.number ? '#' + c.number : null, best: null },
      { label: 'Idade', get: c => c.age, best: null },
      { label: 'Votos última eleição', get: c => c.votesLastElection != null ? D.formatNumber(c.votesLastElection) : null, best: 'max' },
      { label: 'Rendimentos anuais', get: c => c.annualIncome != null ? D.formatBRL(c.annualIncome) : null, best: null },
      { label: 'Patrimônio declarado', get: c => c.assets != null ? D.formatBRL(c.assets) : null, best: null },
      { label: 'Proposituras autorais', get: c => c.billsAuthored, best: 'max' },
      { label: 'Proposituras aprovadas', get: c => c.billsApproved, best: 'max' },
      { label: 'Presença em sessões (%)', get: c => c.attendanceRate, best: 'max' },
      { label: 'Processos judiciais', get: c => c.lawsuits, best: 'min' },
      { label: 'Condenações', get: c => c.lawsuitsStatus ? c.lawsuitsStatus.conviction : null, best: 'min' },
      { label: 'Transparência', get: c => c.transparencyScore, best: 'max' },
      { label: 'Integridade (cálculo)', get: c => integrityOf(c), best: 'max' }
    ];

    // Mantém apenas linhas com pelo menos um valor preenchido
    const visibleRows = rows.filter(row => candidates.some(c => row.get(c) != null));

    const tableBody = visibleRows.map(row => {
      const values = candidates.map(c => row.get(c));
      let bestRaw = null;
      if (row.best === 'max') bestRaw = Math.max(...values.filter(v => v != null));
      else if (row.best === 'min') bestRaw = Math.min(...values.filter(v => v != null));

      const cells = values.map(v => {
        const isBest = row.best && v != null && v === bestRaw;
        const display = v == null ? '—' : v;
        return `<td class="${isBest ? 'best' : ''}">${display}${isBest ? ' ★' : ''}</td>`;
      }).join('');
      return `<tr><th>${row.label}</th>${cells}</tr>`;
    }).join('');

    const headers = candidates.map(c =>
      `<th>${c.photo
        ? `<img class="cmp-photo" src="${c.photo}" alt="${c.name}" loading="lazy">`
        : D.getInitials(c.name)}<br><small>${c.name}</small></th>`
    ).join('');

    const allReal = candidates.every(c => c.source === 'camara');
    const note = allReal
      ? '<p class="compare-note">📡 Comparando <strong>dados reais</strong> básicos da Câmara. Em produção, as colunas de transparência, processos e patrimônio são completadas pelo TSE, Portal da Transparência e CNJ.</p>'
      : '';

    const modalBody = document.getElementById('compare-body');
    modalBody.innerHTML = `
      ${note}
      <table class="compare-table">
        <thead><tr><th>Indicador</th>${headers}</tr></thead>
        <tbody>${tableBody}</tbody>
      </table>`;
    compareModal.style.display = 'flex';
  }

  /* ---------- DETALHES (null-safe) ---------- */
  function openDetail(id) {
    const c = dataset.candidates.find(x => x.id === id);
    if (!c) return;
    const integrity = integrityOf(c);

    const rows = [];
    const addRow = (label, val, fonte, cls) => {
      if (val != null && val !== '') rows.push({ label, val, fonte, cls: cls || '' });
    };
    addRow('Partido', c.partyName || c.party, 'Câmara');
    addRow('Estado', c.state, 'Câmara');
    addRow('Cargo', c.position, 'Câmara');
    addRow('Número', c.number ? '#' + c.number : null, 'TSE');
    addRow('Educação', c.education, 'TSE');
    addRow('Idade', c.age ? c.age + ' anos' : null, 'TSE');
    addRow('Mandatos', c.termCount != null ? c.termCount + ' (reeleito: ' + (c.reelected ? 'Sim' : 'Não') + ')' : null, 'TSE');
    addRow('Votos na última eleição', c.votesLastElection != null ? D.formatNumber(c.votesLastElection) : null, 'TSE');
    addRow('Rendimentos anuais', c.annualIncome != null ? D.formatBRL(c.annualIncome) : null, 'Portal da Transparência');
    addRow('Patrimônio declarado', c.assets != null ? D.formatBRL(c.assets) : null, 'Portal da Transparência');
    addRow('Proposituras autorais', c.billsAuthored, 'Câmara');
    addRow('Proposituras aprovadas', (c.billsApproved != null && c.billsAuthored) ? c.billsApproved + ' (' + Math.round(c.billsApproved / c.billsAuthored * 100) + '%)' : (c.billsApproved != null ? c.billsApproved : null), 'Câmara');
    addRow('Presença em sessões', c.attendanceRate != null ? c.attendanceRate + '%' : null, 'Câmara');
    addRow('Processos judiciais', c.lawsuits != null ? c.lawsuits + ' (' + (c.lawsuitsStatus ? c.lawsuitsStatus.active : 0) + ' ativos)' : null, 'CNJ',
      c.lawsuits > 3 ? 'value-negative' : c.lawsuits > 0 ? 'value-neutral' : 'value-positive');
    addRow('Condenações', c.lawsuitsStatus ? c.lawsuitsStatus.conviction : null, 'CNJ',
      (c.lawsuitsStatus && c.lawsuitsStatus.conviction > 0) ? 'value-negative' : 'value-positive');
    addRow('Área de atuação', c.focusArea, '—');
    addRow('E-mail (Câmara)', c.email, 'Câmara');

    const tableHTML = rows.length
      ? `<table class="data-table">
           <thead><tr><th>Indicador</th><th>Valor</th><th>Fonte</th></tr></thead>
           <tbody>${rows.map(r => `<tr><td>${r.label}</td><td class="${r.cls}">${r.val}</td><td>${r.fonte}</td></tr>`).join('')}</tbody>
         </table>`
      : '<p class="compare-note">Dados detalhados ainda não disponíveis para este candidato.</p>';

    const integrityBlock = (integrity != null)
      ? `<div class="candidate-score-bar" style="max-width:400px;margin:var(--space-md) auto var(--space-lg);">
           <div class="candidate-score-label">
             <span>Índice de Integridade (cálculo)</span><span>${integrity}</span>
           </div>
           <div class="score-bar"><div class="score-fill" style="width:${integrity}%"></div></div>
         </div>`
      : '';

    const isReal = c.source === 'camara';
    const footerNote = isReal
      ? `📊 Dados <strong>reais</strong> obtidos da API aberta da Câmara dos Deputados. Em produção, as fontes completas (TSE, Portal da Transparência e CNJ) complementam transparência, patrimônio e histórico judicial.`
      : `📊 Dados estruturados a partir de: ${(c.dataSources || []).join(', ')}. Valores sintéticos para demonstração — em produção, alimentados via APIs oficiais.`;

    const body = document.getElementById('detail-body');
    body.innerHTML = `
      <div class="candidate-header" style="justify-content:center; margin-bottom: var(--space-lg);">
        ${c.photo
          ? `<img class="detail-photo" src="${c.photo}" alt="${c.name}">`
          : `<div class="candidate-avatar" style="width:80px;height:80px;font-size:var(--text-3xl);">${D.getInitials(c.name)}</div>`}
        <div style="text-align:left;">
          <h2 style="margin:0 0 var(--space-xs);">${c.name}</h2>
          <p style="margin:0;color:var(--text-muted);">${c.party || '—'} • ${c.position || '—'} • ${c.state || '—'}${c.number ? ' • #' + c.number : ''}</p>
        </div>
      </div>
      ${integrityBlock}
      ${c.bio ? `<p style="text-align:center;color:var(--text-secondary);margin-bottom:var(--space-lg);">${c.bio}</p>` : ''}
      ${tableHTML}
      <p style="font-size:var(--text-xs);color:var(--text-muted);text-align:center;margin-top:var(--space-md);">${footerNote}</p>`;
    detailModal.style.display = 'flex';
  }

  /* ---------- TOAST ---------- */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'score-notification';
    if (type === 'warning') toast.style.background = 'linear-gradient(135deg, #FFA500, #FF8C00)';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  /* ---------- POPULAR FILTROS + OPÇÕES DE ORDEM (por modo) ---------- */
  function uniqueValues(key) {
    return [...new Set(dataset.candidates.map(c => c[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
  }

  function populateFilters() {
    stateFilter.querySelectorAll('option:not([value="all"])').forEach(o => o.remove());
    partyFilter.querySelectorAll('option:not([value="all"])').forEach(o => o.remove());
    positionFilter.querySelectorAll('option:not([value="all"])').forEach(o => o.remove());

    uniqueValues('state').forEach(s => {
      stateFilter.insertAdjacentHTML('beforeend', `<option value="${s}">📍 ${s}</option>`);
    });
    uniqueValues('party').forEach(p => {
      partyFilter.insertAdjacentHTML('beforeend', `<option value="${p}">🏛️ ${p}</option>`);
    });
    uniqueValues('position').forEach(p => {
      positionFilter.insertAdjacentHTML('beforeend', `<option value="${p}">💼 ${p}</option>`);
    });

    // Opções de ordenação adequadas ao modo
    if (dataset.mode === 'real') {
      sortSelect.innerHTML = `
        <option value="name:asc">🔤 Nome (A–Z)</option>
        <option value="name:desc">🔤 Nome (Z–A)</option>
        <option value="party:asc">🏛️ Partido (A–Z)</option>
        <option value="state:asc">📍 Estado (A–Z)</option>`;
      state.sortBy = 'name'; state.sortOrder = 'asc';
      sortSelect.value = 'name:asc';
      // Em modo real, o filtro "cargo" só tem um valor -> esconde
      positionFilter.style.display = 'none';
    } else {
      sortSelect.innerHTML = `
        <option value="transparencyScore:desc">📊 Transparência (maior)</option>
        <option value="transparencyScore:asc">📊 Transparência (menor)</option>
        <option value="votesLastElection:desc">🗳️ Votos (maior)</option>
        <option value="billsApproved:desc">✅ Proposituras aprovadas</option>
        <option value="attendanceRate:desc">📅 Presença em sessões</option>
        <option value="lawsuits:asc">⚖️ Processos (menor)</option>
        <option value="annualIncome:asc">💰 Rendimentos (menor)</option>`;
      state.sortBy = 'transparencyScore'; state.sortOrder = 'desc';
      sortSelect.value = 'transparencyScore:desc';
      positionFilter.style.display = '';
    }
  }

  /* ---------- SMOOTHE Selo de fonte ---------- */
  function updateSourceBadge() {
    if (!sourceBadge) return;
    if (dataset.mode === 'real') {
      sourceBadge.className = 'source-badge-pill real';
      sourceBadge.innerHTML = `📡 <strong>Dados reais</strong> — ${dataset.source} · ${dataset.total} parlamentares` +
        (dataset.updatedAt ? ` · atualizado em ${new Date(dataset.updatedAt).toLocaleDateString('pt-BR')}` : '');
    } else {
      sourceBadge.className = 'source-badge-pill demo';
      sourceBadge.innerHTML = `🧪 <strong>Modo demo</strong> — dados sintéticos de exemplo (API de dados reais não acessível)`;
    }
    if (subtitle) {
      subtitle.innerHTML = dataset.mode === 'real'
        ? `Transparência total para o eleitor decidir. Exibindo a <strong>lista real de deputados federais</strong> obtida dos dados abertos da Câmara dos Deputados.`
        : `Transparência total para o eleitor decidir. Todos os dados são estruturados a partir de <strong>fontes públicas oficiais</strong>: TSE, Portal da Transparência, Câmara/Senado e CNJ.`;
    }
  }

  /* ---------- CARREGAR DADOS (API -> fallback demo) ---------- */
  function fetchWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  }

  async function loadData() {
    try {
      const res = await fetchWithTimeout(API + '/api/candidatos', 12000);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data && data.mode === 'real' && Array.isArray(data.candidatos) && data.candidatos.length > 0) {
        dataset = {
          mode: 'real',
          candidates: data.candidatos,
          source: 'Câmara dos Deputados',
          total: data.total || data.candidatos.length,
          updatedAt: data.atualizadoEm || null
        };
      }
    } catch (_) {
      // Sem API -> mantém o modo demo (dados sintéticos embutidos)
    }
    updateSourceBadge();
    populateFilters();
    render();
  }

  /* ---------- EVENT LISTENERS ---------- */
  function bindEvents() {
    searchInput.addEventListener('input', (e) => { state.query = e.target.value; render(); });
    stateFilter.addEventListener('change', (e) => { state.filters.state = e.target.value; render(); });
    partyFilter.addEventListener('change', (e) => { state.filters.party = e.target.value; render(); });
    positionFilter.addEventListener('change', (e) => { state.filters.position = e.target.value; render(); });
    sortSelect.addEventListener('change', (e) => {
      const [field, order] = e.target.value.split(':');
      state.sortBy = field; state.sortOrder = order;
      render();
    });

    grid.addEventListener('change', (e) => {
      if (e.target.matches('input[data-compare]')) {
        toggleCompare(e.target.dataset.compare, e.target.checked);
      }
    });
    grid.addEventListener('click', (e) => {
      const detailBtn = e.target.closest('[data-detail]');
      if (detailBtn) openDetail(detailBtn.dataset.detail);
    });

    document.getElementById('compare-open').addEventListener('click', openCompare);
    document.getElementById('compare-clear').addEventListener('click', () => {
      state.compareIds = [];
      render();
    });

    const closeModal = (modal) => {
      modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
      const closeBtn = modal.querySelector('.close');
      if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    };
    closeModal(compareModal);
    closeModal(detailModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        compareModal.style.display = 'none';
        detailModal.style.display = 'none';
      }
    });
  }

  /* ---------- INIT ---------- */
  function init() {
    if (!grid) return; // só inicializa na página de candidatos
    bindEvents();
    render();      // renderiza o demo imediatamente (não fica em branco)
    loadData();    // tenta carregar dados reais; ao chegar, re-renderiza
  }

  document.addEventListener('DOMContentLoaded', init);
})();
