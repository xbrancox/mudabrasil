/* ============================================================
   MUDABRASIL - LÓGICA DA PÁGINA DE CANDIDATOS (dual-mode)
   - MODO REAL:  busca /api/candidatos (dados reais da Câmara)
   - MODO DEMO:  fallback para window.CANDIDATE_DATA
   ============================================================ */

(function () {
  const D = window.CANDIDATE_DATA;

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

  function integrityOf(c) {
    if (!c || c.transparencyScore == null || c.lawsuits == null || c.attendanceRate == null) return null;
    return D.computeIntegrityScore(c);
  }

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
      if (aN) return 1;
      if (bN) return -1;
      if (typeof va === 'string' || typeof vb === 'string') return dir * String(va).localeCompare(String(vb), 'pt-BR');
      return dir * (va - vb);
    });
    return list;
  }

  function render() {
    const list = applyLocal();
    if (!grid) return;
    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><h3>Nenhum candidato encontrado</h3><p>Tente ajustar sua busca ou os filtros.</p></div>';
    } else {
      grid.innerHTML = list.map(buildCard).join('');
    }
    if (resultCount) resultCount.textContent = `${list.length} candidato(s)` +
      (dataset.mode === 'real' ? ` de ${dataset.total} no total` : '');
    updateCompareBar();
  }

  function buildCard(c) {
    const integrity = integrityOf(c);
    const inCompare = state.compareIds.includes(c.id);

    const avatar = c.photo
      ? `<img class="candidate-photo" src="${c.photo}" alt="${c.name}" loading="lazy" onerror="this.outerHTML='<div class=&quot;candidate-avatar&quot;>${D.getInitials(c.name)}</div>'">`
      : `<div class="candidate-avatar">${D.getInitials(c.name)}</div>`;

    const scoreBlock = (integrity != null)
      ? `<div class="candidate-score-bar"><div class="candidate-score-label"><span>Integridade</span><span>${integrity}</span></div><div class="score-bar"><div class="score-fill" style="width:${integrity}%"></div></div></div>`
      : '';

    const lawsuitBadge = c.lawsuits != null
      ? (c.lawsuits > 0
          ? `<span class="badge risk">⚖️ ${c.lawsuits} processo(s)</span>`
          : '<span class="badge score">✅ Sem processos</span>')
      : '';

    const realBadge = (c.source === 'camara') ? '<span class="badge real">📡 Real</span>' : '';

    return `<div class="candidate-card" data-id="${c.id}"><label class="compare-checkbox" title="Selecionar para comparar"><input type="checkbox" data-compare="${c.id}" ${inCompare ? 'checked' : ''}></label><div class="candidate-header">${avatar}<div><p class="candidate-name">${c.name}</p><p class="candidate-party">${c.party || '—'} • ${c.state || '—'}${c.position ? ' • ' + c.position : ''}</p></div></div><div class="candidate-meta">${c.number ? `<span class="badge">#${c.number}</span>` : ''}${realBadge}${lawsuitBadge}</div>${scoreBlock}<button class="btn btn-secondary btn-sm" data-detail="${c.id}">Ver Detalhes</button></div>`;
  }

  function updateCompareBar() {
    if (!compareBar) return;
    if (state.compareIds.length === 0) { compareBar.classList.remove('visible'); return; }
    compareBar.classList.add('visible');
    const c = compareBar.querySelector('#compare-count');
    if (c) c.textContent = state.compareIds.length;
  }

  function bindEvents() {
    if (searchInput) searchInput.addEventListener('input', (e) => { state.query = e.target.value; render(); });
    if (stateFilter) stateFilter.addEventListener('change', (e) => { state.filters.state = e.target.value; render(); });
    if (partyFilter) partyFilter.addEventListener('change', (e) => { state.filters.party = e.target.value; render(); });
    if (positionFilter) positionFilter.addEventListener('change', (e) => { state.filters.position = e.target.value; render(); });
    if (sortSelect) sortSelect.addEventListener('change', (e) => {
      const [field, order] = e.target.value.split(':');
      state.sortBy = field; state.sortOrder = order;
      render();
    });

    if (grid) {
      grid.addEventListener('change', (e) => {
        if (e.target.matches('input[data-compare]')) {
          const id = e.target.dataset.compare;
          if (e.target.checked) {
            if (state.compareIds.length >= state.maxCompare) { e.target.checked = false; return; }
            state.compareIds.push(id);
          } else {
            state.compareIds = state.compareIds.filter(x => x !== id);
          }
          render();
        }
      });
    }
  }

  async function loadData() {
    try {
      const res = await fetch('/api/candidatos', { signal: AbortSignal.timeout(5000) });
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
    } catch (_) {}
    render();
  }

  function init() {
    bindEvents();
    render();
    loadData();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
