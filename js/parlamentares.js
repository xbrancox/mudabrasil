/* ============================================================
   MUDABRASIL — PARLAMENTARES
   Aba unificada: Candidatos + Radar + PLs + Revogados + Conferir + Revogar
   Alinhado com os .docx do projeto
   ============================================================ */

(function () {
  'use strict';

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
    radarFeed: [],
    detail: { id: null, tab: 'reclamacoes' },
  };

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', async () => {
    setupTabs();
    setupAuthModal();
    setupComplaint();
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
    // Deep-link: /parlamentares.html#radar abre direto a aba
    const initial = (location.hash || '').replace('#', '');
    if (initial) activateTab(initial, false);
  }

  /* ============================================================
     CANDIDATOS — dados estáticos de fallback (Pages)
     ============================================================ */
  const FALLBACK_POLITICOS = [
    {id:'maria-silva',name:'Maria Silva',position:'Deputada Federal',party:'PT',state:'SP',focusArea:'Meio Ambiente',integrityIndex:87,transparencyScore:92,lawsuits:0,attendanceRate:96,assets:'R$ 1.2M',photo:'',number:1314,age:48,education:'Doutorado',termCount:2,billsAuthored:47,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'},portalTransparencia:{name:'Portal da Transparência',data:'Gastos e patrimônio',link:'https://portaldatransparencia.gov.br/'},camaraSenado:{name:'Câmara dos Deputados',data:'Proposituras e votações',link:'https://www.camara.leg.br/deputados/quem-e-quem/'}}},
    {id:'carlos-souza',name:'Carlos Souza',position:'Deputado Federal',party:'MDB',state:'RJ',focusArea:'Economia',integrityIndex:78,transparencyScore:85,lawsuits:1,attendanceRate:88,assets:'R$ 2.8M',photo:'',number:1515,age:55,education:'Mestrado',termCount:3,billsAuthored:31,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'},camaraSenado:{name:'Câmara dos Deputados',data:'Proposituras e votações',link:'https://www.camara.leg.br/deputados/quem-e-quem/'}}},
    {id:'ana-beatriz',name:'Ana Beatriz',position:'Senadora',party:'PSOL',state:'BA',focusArea:'Educação',integrityIndex:74,transparencyScore:80,lawsuits:0,attendanceRate:92,assets:'R$ 980k',photo:'',number:502,age:41,education:'Doutorado',termCount:1,billsAuthored:18,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'},camaraSenado:{name:'Senado Federal',data:'Proposituras e votações',link:'https://www25.senado.leg.br/web/senadores/'}}},
    {id:'joao-pereira',name:'João Pereira',position:'Deputado Estadual',party:'PL',state:'MG',focusArea:'Segurança',integrityIndex:68,transparencyScore:72,lawsuits:2,attendanceRate:81,assets:'R$ 1.5M',photo:'',number:3333,age:50,education:'Graduação',termCount:2,billsAuthored:22,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'}}},
    {id:'patricia-lima',name:'Patrícia Lima',position:'Governadora',party:'PSD',state:'RS',focusArea:'Saúde',integrityIndex:65,transparencyScore:70,lawsuits:1,attendanceRate:89,assets:'R$ 750k',photo:'',number:55,age:44,education:'Mestrado',termCount:1,billsAuthored:12,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'}}},
    {id:'roberto-alves',name:'Roberto Alves',position:'Vereador',party:'NOVO',state:'PR',focusArea:'Transparência',integrityIndex:61,transparencyScore:78,lawsuits:0,attendanceRate:84,assets:'R$ 420k',photo:'',number:101,age:38,education:'Graduação',termCount:1,billsAuthored:8,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'}}},
    {id:'juliana-costa',name:'Juliana Costa',position:'Deputada Federal',party:'REDE',state:'SP',focusArea:'Sustentabilidade',integrityIndex:58,transparencyScore:75,lawsuits:0,attendanceRate:91,assets:'R$ 1.1M',photo:'',number:1818,age:36,education:'Doutorado',termCount:1,billsAuthored:15,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'},camaraSenado:{name:'Câmara dos Deputados',data:'Proposituras e votações',link:'https://www.camara.leg.br/deputados/quem-e-quem/'}}},
    {id:'felipe-santos',name:'Felipe Santos',position:'Senador',party:'PP',state:'MG',focusArea:'Infraestrutura',integrityIndex:54,transparencyScore:62,lawsuits:3,attendanceRate:79,assets:'R$ 3.2M',photo:'',number:111,age:62,education:'Graduação',termCount:2,billsAuthored:40,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'},camaraSenado:{name:'Senado Federal',data:'Proposituras e votações',link:'https://www25.senado.leg.br/web/senadores/'}}},
    {id:'camila-rocha',name:'Camila Rocha',position:'Deputada Estadual',party:'PSB',state:'RJ',focusArea:'Cultura',integrityIndex:51,transparencyScore:68,lawsuits:0,attendanceRate:86,assets:'R$ 680k',photo:'',number:4411,age:33,education:'Mestrado',termCount:1,billsAuthored:9,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'}}},
    {id:'renato-vieira',name:'Renato Vieira',position:'Deputado Federal',party:'PTB',state:'SP',focusArea:'Trabalho',integrityIndex:42,transparencyScore:55,lawsuits:5,attendanceRate:72,assets:'R$ 2.1M',photo:'',number:1414,age:59,education:'Graduação',termCount:4,billsAuthored:63,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'},camaraSenado:{name:'Câmara dos Deputados',data:'Proposituras e votações',link:'https://www.camara.leg.br/deputados/quem-e-quem/'}}},
    {id:'beatriz-mendes',name:'Beatriz Mendes',position:'Deputada Federal',party:'PDT',state:'RS',focusArea:'Direitos Humanos',integrityIndex:71,transparencyScore:82,lawsuits:0,attendanceRate:90,assets:'R$ 1.4M',photo:'',number:1212,age:45,education:'Doutorado',termCount:2,billsAuthored:28,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'},camaraSenado:{name:'Câmara dos Deputados',data:'Proposituras e votações',link:'https://www.camara.leg.br/deputados/quem-e-quem/'}}},
    {id:'marcos-vieira',name:'Marcos Vieira',position:'Senador',party:'MDB',state:'BA',focusArea:'Agricultura',integrityIndex:66,transparencyScore:74,lawsuits:1,attendanceRate:85,assets:'R$ 2.4M',photo:'',number:333,age:58,education:'Graduação',termCount:3,billsAuthored:55,sources:{tse:{name:'TSE',data:'Divulgacão de candidaturas',link:'https://divulgacand.tse.jus.br/'},camaraSenado:{name:'Senado Federal',data:'Proposituras e votações',link:'https://www25.senado.leg.br/web/senadores/'}}},
  ];

  const FALLBACK_PLS = [
    {id:'pl-1234',number:'1234/2026',chamber:'Câmara',status:'Tramitando',title:'Programa Nacional de Restauração Ambiental',ementa:'Programa Nacional de Restauração Ambiental (amostra offline)',author:'Dep. Carlos Souza',party:'MDB',approvalCount:0,rejectionCount:0},
    {id:'pl-5678',number:'5678/2026',chamber:'Senado',status:'Tramitando',title:'Reforma do Ensino Médio com foco em tecnologia',ementa:'Reforma do Ensino Médio com foco em tecnologia (amostra offline)',author:'Sen. Ana Beatriz',party:'PSOL',approvalCount:0,rejectionCount:0},
    {id:'pl-9101',number:'9101/2026',chamber:'Câmara',status:'Tramitando',title:'Ampliação do programa Saúde da Família',ementa:'Ampliação do programa Saúde da Família (amostra offline)',author:'Dep. Maria Silva',party:'PT',approvalCount:0,rejectionCount:0},
    {id:'pl-8024',number:'8024/2026',chamber:'Câmara',status:'Pronto para pauta',title:'Lei de Proteção de Dados Eleitorais',ementa:'Lei de Proteção de Dados Eleitorais (amostra offline)',author:'Sen. Juliana Costa',party:'REDE',approvalCount:0,rejectionCount:0},
  ];

  async function loadCandidatos() {
    // 1) Servidor Node com dados reais (desenvolvimento/produção com backend)
    try {
      const r = await fetch('/api/candidatos');
      if (r.ok) {
        const d = await r.json();
        if (d.candidatos && d.candidatos.length) {
          state.allPoliticians = d.candidatos;
          state.dataMode = 'real';
          state.dataSource = d.source || 'Câmara dos Deputados + Senado Federal';
        }
      }
    } catch (e) { /* tenta snapshot estático */ }

    // 2) Snapshot estático embutido no deploy (GitHub Pages — dados reais de 24/08/2026)
    if (!state.allPoliticians.length) {
      try {
        const r2 = await fetch('../data/politicos.json');
        if (r2.ok) {
          const d2 = await r2.json();
          if (d2.candidatos && d2.candidatos.length) {
            state.allPoliticians = d2.candidatos;
            state.dataMode = d2.mode === 'real' ? 'real' : 'snapshot';
            state.dataSource = d2.source;
            state.dataUpdatedAt = d2.atualizadoEm;
          }
        }
      } catch (e) { /* último recurso: sintéticos */ }
    }

    // 3) Sintéticos (file:// ou offline)
    if (!state.allPoliticians.length) {
      state.allPoliticians = FALLBACK_POLITICOS;
      state.dataMode = 'demo';
    }

    updateDataBanner();
    populateFilterOptions();
    attachFilterHandlers();
    applyFilters();
  }

  function updateDataBanner() {
    const banner = $('.mb-demo-banner');
    if (!banner) return;
    const sub = $('.mb-hero-sub');
    if (state.dataMode === 'real' || state.dataMode === 'snapshot') {
      const n = state.allPoliticians.length;
      const dep = (state.allPoliticians.filter(p => p.source === 'camara')).length;
      const sen = n - dep;
      const quando = state.dataUpdatedAt
        ? new Date(state.dataUpdatedAt).toLocaleDateString('pt-BR')
        : '';
      banner.innerHTML = `
        <span class="mb-pill-icon">📡</span>
        <span><strong>Dados reais</strong> — ${dep} deputados federais + ${sen} senadores (${n} parlamentares)` +
        (quando ? ` · snapshot de ${quando}` : '') +
        `. Fontes: Câmara dos Deputados e Senado Federal.</span>`;
      banner.style.borderColor = 'rgba(0,151,57,0.45)';
      banner.style.background = 'rgba(0,151,57,0.08)';
      if (sub) sub.innerHTML = 'Transparência total para o eleitor decidir. Lista <strong>real</strong> de parlamentares em exercício, obtida dos dados abertos oficiais.';
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

    if (sort === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
    else if (sort === 'party') list.sort((a, b) => (a.party || '').localeCompare(b.party || '', 'pt-BR') || (a.name || '').localeCompare(b.name || '', 'pt-BR'));
    else if (sort === 'integrity') list.sort(byNumericDesc('integrityIndex', 'lawsuits'));
    else if (sort === 'proposicoes') list.sort(byNumericDesc('billsAuthored'));
    else if (sort === 'presenca') list.sort(byNumericDesc('attendanceRate'));
    else list.sort(byNumericDesc('transparencyScore'));
    // Ambos os sorts numéricos empurram "sem dados" para o fim e desempatam por nome
    function byNumericDesc(primary, secondary) {
      return (a, b) => {
        let va = a[primary] != null ? a[primary] : null;
        let vb = b[primary] != null ? b[primary] : null;
        if (va == null && secondary) va = a[secondary] === 0 ? 100 : null;
        if (vb == null && secondary) vb = b[secondary] === 0 ? 100 : null;
        if (va == null && vb == null) return (a.name || '').localeCompare(b.name || '', 'pt-BR');
        if (va == null) return 1;
        if (vb == null) return -1;
        return vb - va || (a.name || '').localeCompare(b.name || '', 'pt-BR');
      };
    }

    state.filteredPoliticians = list;
    state.visibleCount = 60;
    const total = list.length;
    $('#cand-count').textContent = total;
    const countNote = $('#cand-count-note');
    if (countNote) countNote.textContent = total > state.visibleCount
      ? ` — exibindo ${state.visibleCount}; use os filtros ou clique em "Carregar mais"`
      : '';
    renderCandidatos();
  }

  function loadMoreCandidatos() {
    state.visibleCount += 60;
    renderCandidatos();
  }

  function renderCandidatos() {
    const grid = $('#cand-grid');
    const visible = state.filteredPoliticians.slice(0, state.visibleCount || 60);
    grid.innerHTML = visible.map(p => {
      // Só exibe integridade quando há base de cálculo real (transparência/processos)
      const hasIntegrityData = p.integrityIndex != null || p.lawsuits != null || p.transparencyScore != null;
      const integrity = p.integrityIndex != null ? p.integrityIndex
        : (hasIntegrityData ? 100 - Math.min(60, (p.lawsuits || 0) * 8) : null);
      const processes = p.lawsuits || 0;
      const initials = getInitials(p.name);
      const photo = p.photo ? `<img src="${escapeHtml(p.photo)}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${initials}'">` : initials;
      const integrityBlock = integrity == null ? `
        <div class="mb-integrity">
          <div class="mb-integrity-label"><span>Índice de Integridade</span><span class="mb-integrity-value">—</span></div>
          <div class="mb-integrity-bar"></div>
          <div class="mb-muted-sm" style="margin-top:4px;">Sem dados de processos/transparência nesta fonte</div>
        </div>` : `
        <div class="mb-integrity">
          <div class="mb-integrity-label">
            <span>Índice de Integridade</span>
            <span class="mb-integrity-value">${integrity}</span>
          </div>
          <div class="mb-integrity-bar"><div class="mb-integrity-fill" style="width:${integrity}%"></div></div>
        </div>`;
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
          ${p.number ? `<span class="mb-tag-num">#${p.number}</span>` : ''}
          ${p.billsAuthored != null ? `<span class="mb-tag-num" title="Proposições autorais (histórico; fonte: APIs da Câmara e do Senado)">📜 ${p.billsAuthored} prop.</span>` : ''}
          ${p.attendanceRate != null ? `<span class="mb-tag-clean" title="Presença em sessões deliberativas de 2026 (${p.attendanceContext ? p.attendanceContext.participadas + ' de ' + p.attendanceContext.totalSessoes : '—'}; fonte: API da Câmara)">📅 ${p.attendanceRate}% presença</span>` : ''}
          ${p.votesPlenary2026 != null ? `<span class="mb-tag-clean" title="Votações do plenário com voto registrado em 2026 (fonte: API do Senado)">🗳️ ${p.votesPlenary2026} votos 2026</span>` : ''}
          ${hasIntegrityData
            ? (processes === 0
                ? '<span class="mb-tag-clean">✅ Sem processos</span>'
                : `<span class="mb-tag-warn">⚠️ ${processes} processo(s)</span>`)
            : ''}
          ${p.email ? '<span class="mb-tag-clean">✉️ Contato oficial</span>' : ''}
        </div>
        ${integrityBlock}
        <div class="mb-cand-actions">
          <button class="mb-btn-secondary" data-action="details" data-id="${escapeHtml(p.id)}">VER DETALHES</button>
        </div>
        <div class="mb-cand-source">📋 Fonte: ${p.dataSources && p.dataSources.length ? escapeHtml(p.dataSources.join(', ')) : 'TSE, Portal da Transparência, Câmara/Senado, CNJ'}</div>
      </article>`;
    }).join('');

    grid.querySelectorAll('[data-action="details"]').forEach(b => b.addEventListener('click', e => openCandidato(e.currentTarget.dataset.id)));
    grid.querySelectorAll('.mb-cand-compare').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      toggleCompare(e.currentTarget.dataset.id);
    }));

    // Botão "Carregar mais" quando há mais resultados além dos visíveis
    const holder = $('#cand-load-more-holder');
    if (holder) {
      if (state.filteredPoliticians.length > visible.length) {
        holder.hidden = false;
        const btn = $('#cand-load-more');
        if (btn) {
          btn.onclick = loadMoreCandidatos;
          btn.textContent = `⬇️ Carregar mais (${state.filteredPoliticians.length - visible.length} restantes)`;
        }
      } else {
        holder.hidden = true;
      }
    }
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
    try {
      const r = await fetch('/api/candidatos/comparar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'erro');
      renderCompare(d.candidatos);
    } catch (e) {
      // Sem servidor (GitHub Pages): compara com os dados carregados localmente
      const cands = ids.map(id => state.allPoliticians.find(p => p.id === id)).filter(Boolean);
      if (cands.length >= 2) renderCompare(cands);
      else toast('Não foi possível comparar agora', 'error');
    }
  }

  function renderCompare(cands) {
    const panel = $('#compare-panel');
    const fields = [
      { key: 'name', label: 'Nome' },
      { key: 'party', label: 'Partido' },
      { key: 'state', label: 'UF' },
      { key: 'position', label: 'Cargo' },
      { key: 'education', label: 'Escolaridade' },
      { key: 'billsAuthored', label: 'Proposições autorais' },
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
     DETALHES DO CANDIDATO (com interações: reclamações/respostas/apoios)
     ============================================================ */
  async function openCandidato(id) {
    state.detail.id = id;
    state.detail.tab = 'reclamacoes';
    let c = state.allPoliticians.find(p => p.id === id) || null;

    // Mostra imediatamente com dados locais; enriquece com API em seguida
    if (c) renderCandidatoModal(c);

    try {
      const r = await fetch('/api/candidatos/detalhes/' + encodeURIComponent(id));
      const d = await r.json();
      if (d.ok && d.candidato) { c = d.candidato; renderCandidatoModal(c); }
    } catch (e) { /* já mostrou fallback local */ }

    if (!c) { toast('Candidato não encontrado', 'error'); return; }
    loadDetailInteractions();
  }

  function renderCandidatoModal(c) {
    const initials = getInitials(c.name);
    const sources = c.sources || {};
    const sourceList = Object.values(sources).map(s => `
      <div class="mb-src-row">
        <div><strong>${escapeHtml(s.name)}</strong></div>
        <div>${escapeHtml(s.data)}</div>
        <div><a href="${escapeHtml(s.link)}" target="_blank" rel="noopener">${escapeHtml(s.link.replace(/^https?:\/\//, ''))}</a></div>
      </div>`).join('');
    const integrity = c.integrityIndex != null ? c.integrityIndex : null;

    $('#cand-modal-body').innerHTML = `
      <div style="display:flex;gap:18px;align-items:center;margin-bottom:18px;">
        <div class="mb-cand-avatar" style="width:80px;height:80px;font-size:28px;">${c.photo ? `<img src="${escapeHtml(c.photo)}" alt="" onerror="this.style.display='none'">` : initials}</div>
        <div>
          <h2 style="margin-bottom:4px;">${escapeHtml(c.name)}</h2>
          <div class="mb-muted">${escapeHtml(c.party || '')} · ${escapeHtml(c.state || '')} · ${escapeHtml(c.position || '')}</div>
          <div style="margin-top:6px;">
            ${c.number ? `<span class="mb-tag-num">#${c.number}</span>` : ''}
            ${integrity != null
              ? `<span class="${integrity >= 70 ? 'mb-tag-clean' : 'mb-tag-warn'}">Integridade: ${integrity}/100</span>`
              : ''}
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:18px;" id="cand-ficha">
        <div class="mb-card-inner"><div class="mb-muted-sm">Idade</div><strong>${c.age || '—'}</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">Escolaridade</div><strong>${escapeHtml(c.education || '—')}</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">Mandatos</div><strong>${c.termCount || 1}</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">Proposições autorais</div><strong>${c.billsAuthored != null ? c.billsAuthored : '—'}</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">Presença</div><strong>${c.attendanceRate != null ? c.attendanceRate + '%' : '—'}</strong></div>
        <div class="mb-card-inner"><div class="mb-muted-sm">Processos</div><strong>${c.lawsuits != null ? c.lawsuits : '—'}</strong></div>
        ${c.attendanceContext ? `<div class="mb-card-inner" style="grid-column:1/-1;"><div class="mb-muted-sm">Detalhe da presença (2026)</div><strong>${c.attendanceContext.participadas} de ${c.attendanceContext.totalSessoes} sessões deliberativas</strong></div>` : ''}
        ${c.votesPlenary2026 != null ? `<div class="mb-card-inner" style="grid-column:1/-1;"><div class="mb-muted-sm">Votações do plenário (2026)</div><strong>${c.votesPlenary2026} votações com voto registrado</strong></div>` : ''}
      </div>

      <div class="mb-detail-tabs" id="cand-detail-tabs">
        <button class="mb-dtab active" data-dtab="reclamacoes">📣 Reclamações <span class="mb-dtab-count" id="dt-cnt-reclamacoes">…</span></button>
        <button class="mb-dtab" data-dtab="respostas">↪️ Respostas <span class="mb-dtab-count" id="dt-cnt-respostas">…</span></button>
        <button class="mb-dtab" data-dtab="apoios">👍 Apoios <span class="mb-dtab-count" id="dt-cnt-apoios">…</span></button>
      </div>
      <div id="dtab-reclamacoes" class="mb-dtab-panel"><p class="mb-muted-sm">⏳ Carregando…</p></div>
      <div id="dtab-respostas" class="mb-dtab-panel" hidden><p class="mb-muted-sm">Carregando…</p></div>
      <div id="dtab-apoios" class="mb-dtab-panel" hidden><p class="mb-muted-sm">Carregando…</p></div>
      <div style="text-align:right;margin:6px 0 14px;">
        <button class="mb-btn-link" id="cand-view-all">Ver todas as reclamações →</button>
      </div>

      ${sourceList ? `
      <h3 style="margin-bottom:10px;">🔎 Fontes oficiais</h3>
      <div class="mb-sources-table">${sourceList}</div>
      <p class="mb-src-footer">⚙️ Dados extraídos de fontes públicas oficiais. Em produção, sincronizados a cada 24h via APIs.</p>` : ''}

      <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
        <button class="mb-btn-primary" id="cand-btn-reclamar" style="flex:1;">📝 Fazer reclamação</button>
        <button class="mb-btn-mint" id="cand-btn-apoiar" style="flex:1;">👍 Dar apoio</button>
      </div>
    `;

    // Alternância de abas
    $$('#cand-detail-tabs .mb-dtab').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#cand-detail-tabs .mb-dtab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.detail.tab = btn.dataset.dtab;
        ['reclamacoes', 'respostas', 'apoios'].forEach(t => {
          const el = document.getElementById('dtab-' + t);
          if (el) el.hidden = t !== state.detail.tab;
        });
        loadDetailInteractions();
      });
    });

    $('#cand-btn-reclamar').addEventListener('click', () => openComplaintModal('rec', c.id, c.name));
    $('#cand-btn-apoiar').addEventListener('click', () => openComplaintModal('apoio', c.id, c.name));
    $('#cand-view-all').addEventListener('click', () => {
      // Vai para a aba Radar com o nome pré-filtrado no campo de busca
      const radarTab = document.querySelector('.mb-tab[data-tab="radar"]');
      if (radarTab) radarTab.click();
      const input = $('#radar-search');
      if (input) { input.value = c.name; input.dispatchEvent(new Event('input')); }
      hideModal('cand-modal');
      const feed = $('#radar-feed');
      if (feed) feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    showModal('cand-modal');
  }

  async function loadDetailInteractions() {
    const id = state.detail.id;
    if (!id) return;
    if (state.detail.tab === 'reclamacoes') {
      const el = document.getElementById('dtab-reclamacoes');
      try {
        const r = await fetch('/api/reclamacoes?politicianId=' + encodeURIComponent(id) + '&limit=20');
        const d = await r.json();
        const list = (d.complaints || []);
        const cnt = $('#dt-cnt-reclamacoes'); if (cnt) cnt.textContent = list.length;
        el.innerHTML = list.length ? list.map(comp => detailComplaintHTML(comp)).join('')
          : '<p class="mb-muted-sm">Nenhuma reclamação ainda. Seja o primeiro a cobrar!</p>';
      } catch (e) {
        el.innerHTML = '<p class="mb-muted-sm">Não foi possível carregar reclamações agora.</p>';
      }
    } else if (state.detail.tab === 'apoios') {
      const el = document.getElementById('dtab-apoios');
      try {
        const r = await fetch('/api/apoios?politicianId=' + encodeURIComponent(id) + '&limit=20');
        const d = await r.json();
        const list = (d.supports || []);
        const cnt = $('#dt-cnt-apoios'); if (cnt) cnt.textContent = list.length;
        el.innerHTML = list.length ? list.map(s => detailSupportHTML(s)).join('')
          : '<p class="mb-muted-sm">Nenhum apoio ainda. Mande um elogio!</p>';
      } catch (e) {
        el.innerHTML = '<p class="mb-muted-sm">Não foi possível carregar apoios agora.</p>';
      }
    } else {
      const el = document.getElementById('dtab-respostas');
      try {
        const r = await fetch('/api/estatisticas/politico/' + encodeURIComponent(id));
        const d = await r.json();
        const stats = d.stats || {};
        const cnt = $('#dt-cnt-respostas'); if (cnt) cnt.textContent = stats.responses || 0;
        el.innerHTML = (stats.responses > 0)
          ? `<p class="mb-muted-sm">${stats.responses} resposta(s) registrada(s) pelo político — visíveis junto às reclamações respondidas.</p>
             <div class="mb-card-inner"><div class="mb-muted-sm">Taxa de resposta</div><strong>${Math.round((stats.responseRate || 0) * 100)}%</strong></div>`
          : '<p class="mb-muted-sm">Este político ainda não respondeu a nenhuma reclamação. Só políticos com <strong>selo de verificado</strong> podem responder.</p>';
      } catch (e) {
        el.innerHTML = '<p class="mb-muted-sm">Não foi possível carregar respostas agora.</p>';
      }
    }
  }

  function detailComplaintHTML(comp) {
    const voterLabel = comp.voterHash
      ? 'Eleitor #' + String(comp.voterHash).slice(-6).toUpperCase()
      : 'Eleitor anônimo';
    const resp = comp.response && (typeof comp.response === 'string' ? comp.response : comp.response.content);
    return `
      <div class="mb-card-inner" style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <span class="mb-muted-sm">${escapeHtml(voterLabel)} · ${timeAgo(comp.createdAt)}</span>
          ${comp.status === 'responded' ? '<span class="mb-tag-clean">↪️ Respondida</span>' : ''}
        </div>
        <div style="margin-top:6px;font-size:0.9rem;">${escapeHtml(comp.content)}</div>
        ${resp ? `<div class="mb-radar-response" style="margin-top:8px;"><strong>↪️ Resposta:</strong> ${escapeHtml(resp)}</div>` : ''}
      </div>`;
  }

  function detailSupportHTML(s) {
    const voterLabel = s.voterHash
      ? 'Eleitor #' + String(s.voterHash).slice(-6).toUpperCase()
      : 'Eleitor anônimo';
    return `
      <div class="mb-card-inner" style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <span class="mb-muted-sm">${escapeHtml(voterLabel)} · ${timeAgo(s.createdAt)}</span>
          <span class="mb-tag-clean">👍 Apoio</span>
        </div>
        <div style="margin-top:6px;font-size:0.9rem;">${escapeHtml(s.content)}</div>
      </div>`;
  }

  /* ============================================================
     MODAL DE RECLAMAÇÃO / APOIO
     ============================================================ */
  function setupComplaint() {
    const openBtn = $('#open-complaint-modal');
    if (openBtn) openBtn.addEventListener('click', () => openComplaintModal('rec'));
    const searchBtn = $('#open-radar-search');
    if (searchBtn) searchBtn.addEventListener('click', () => {
      const inp = $('#radar-search');
      if (inp) { inp.focus(); inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });

    const form = $('#complaint-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const pid = $('#complaint-politician').value;
      const titulo = ($('#complaint-title').value || '').trim();
      const descricao = ($('#complaint-content').value || '').trim();
      const tipo = form.dataset.tipo || 'rec';
      if (!pid) { toast('Escolha um político', 'error'); return; }
      if (descricao.length < 10) { toast('Escreva pelo menos 10 caracteres', 'error'); return; }
      try {
        const r = await fetch('/api/reclamacoes/public', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ politicianId: pid, tipo, titulo, descricao })
        });
        const d = await r.json();
        if (d.ok) {
          toast(tipo === 'apoio' ? 'Apoio enviado! Obrigado por participar.' : 'Reclamação enviada! Ela já aparece no Radar.');
          hideModal('complaint-modal');
          form.reset();
          delete form.dataset.tipo;
          loadRadar(); // recarrega feed
        } else {
          toast(d.error || 'Erro ao enviar', 'error');
        }
      } catch (err) { toast('Erro de conexão', 'error'); }
    });
  }

  function openComplaintModal(tipo, politicianId, politicianName) {
    const form = $('#complaint-form');
    if (!form) return;
    form.dataset.tipo = tipo || 'rec';
    const sel = $('#complaint-politician');
    if (politicianId && sel) {
      // Garante que a opção existe (político pode não estar entre os 200 primeiros)
      if (![...sel.options].some(o => o.value === politicianId)) {
        const o = document.createElement('option');
        o.value = politicianId;
        o.textContent = politicianName || politicianId;
        sel.appendChild(o);
      }
      sel.value = politicianId;
    }
    const h2 = document.querySelector('#complaint-modal h2');
    if (h2) h2.textContent = tipo === 'apoio' ? '👍 Dar apoio' : '📝 Abrir reclamação';
    const sendBtn = document.querySelector('#complaint-form button[type="submit"]');
    if (sendBtn) sendBtn.textContent = tipo === 'apoio' ? '✈️ Enviar apoio' : '✈️ Enviar reclamação';
    showModal('complaint-modal');
  }

  /* ============================================================
     RADAR CÍVICO
     ============================================================ */
  async function loadRadar() {
    // Carrega políticos para o select do modal de reclamação
    const sel = $('#complaint-politician');
    if (sel) {
      state.allPoliticians.slice(0, 200).forEach(p => {
        const o = document.createElement('option');
        o.value = p.id; o.textContent = `${p.name} (${p.party || '—'} · ${p.state || '—'})`;
        sel.appendChild(o);
      });
    }
    // Carrega feed real (reclamações + apoios mesclados) e rankings
    let feed = [];
    try {
      const r = await fetch('/api/feed?limit=50');
      if (r.ok) {
        const d = await r.json();
        feed = (d.feed && d.feed.length) ? d.feed : [];
      }
    } catch (e) { /* fallback abaixo */ }
    if (!feed.length) feed = FALLBACK_FEED;
    state.radarFeed = feed;
    renderRadar(feed);
    renderRadarSearch();

    try {
      const rr = await fetch('/api/rankings');
      if (rr.ok) {
        const d = await rr.json();
        renderRadarLists(d.rankings || {});
        return;
      }
    } catch (e) { /* fallback abaixo */ }
    renderRadarLists(null);
  }

  const FALLBACK_FEED = [
    { id:'fb-r1', tipo:'reclamacao', politician:{ id:'maria-silva', name:'Maria Silva', party:'PT', state:'SP' }, content:'Prometeu auditar gastos da Câmara e ainda não apresentou o relatório.', createdAt: Date.now()-86400000, responded:false },
    { id:'fb-s1', tipo:'apoio', politician:{ id:'beatriz-mendes', name:'Beatriz Mendes', party:'PDT', state:'RS' }, content:'Projeto de lei sobre transparência ativa excelente. Continue assim!', createdAt: Date.now()-172800000 },
    { id:'fb-r2', tipo:'reclamacao', politician:{ id:'joao-pereira', name:'João Pereira', party:'PL', state:'MG' }, content:'Faltou a 8 sessões consecutivas sem justificativa.', createdAt: Date.now()-259200000, responded:false },
    { id:'fb-s2', tipo:'apoio', politician:{ id:'ana-beatriz', name:'Ana Beatriz', party:'PSOL', state:'BA' }, content:'Trabalho consistente na área de educação.', createdAt: Date.now()-345600000 },
  ];

  function renderRadarSearch() {
    const input = $('#radar-search');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      if (!q) { renderRadar(state.radarFeed); return; }
      renderRadar(state.radarFeed.filter(c => {
        const hay = [c.content, c.politician && c.politician.name, c.politician && c.politician.party].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      }));
    });
  }

  function renderRadar(items) {
    const feed = $('#radar-feed');
    if (!feed) return;
    if (!items.length) { feed.innerHTML = '<p class="mb-muted">Nenhuma reclamação ainda. Seja o primeiro!</p>'; return; }
    feed.innerHTML = items.slice(0, 20).map(c => {
      const pol = c.politician || {};
      const polName = pol.name || 'Político';
      const initials = getInitials(polName);
      const isApoio = c.tipo === 'apoio';
      const voterLabel = c.voterHash
        ? 'Eleitor #' + String(c.voterHash).slice(-6).toUpperCase()
        : 'Eleitor anônimo';
      const responseText = typeof c.response === 'string' ? c.response : (c.response && c.response.content);
      return `
      <article class="mb-radar-item">
        <div class="mb-radar-item-head">
          <div class="mb-radar-avatar">${pol.photo ? `<img src="${escapeHtml(pol.photo)}" onerror="this.style.display='none'">` : initials}</div>
          <div>
            <div class="mb-radar-item-name">${escapeHtml(polName)}</div>
            <div class="mb-radar-item-meta">${escapeHtml(voterLabel)} · ${timeAgo(c.createdAt)}</div>
          </div>
          <span class="mb-radar-badge ${isApoio ? 'mb-radar-badge-green' : 'mb-radar-badge-red'}">${isApoio ? '👍 Apoio' : '📣 Reclamação'}</span>
          ${c.responded || responseText ? '<span class="mb-radar-badge mb-radar-badge-blue">Respondido</span>' : ''}
          ${String(c.id || '').startsWith('fb-') ? '<span class="mb-radar-badge" title="Registro de exemplo — sem servidor conectado">🧪 amostra</span>' : ''}
        </div>
        <div class="mb-radar-text">${escapeHtml(c.content)}</div>
        ${responseText ? `<div class="mb-radar-response"><strong>↪️ Resposta do político:</strong> ${escapeHtml(responseText)}</div>` : ''}
      </article>`;
    }).join('');
  }

  function radarRow(p, badge, cls) {
    return `
      <div class="mb-radar-row">
        <div class="mb-radar-avatar">${p.photo ? `<img src="${escapeHtml(p.photo)}" onerror="this.style.display='none'">` : getInitials(p.name)}</div>
        <div style="flex:1"><div class="mb-radar-item-name">${escapeHtml(p.name)}</div><div class="mb-muted-sm">${escapeHtml(p.party || '')}</div></div>
        <span class="mb-radar-badge ${cls}">${badge}</span>
      </div>`;
  }

  function renderRadarLists(rankings) {
    const moreEl = $('#radar-more'), lessEl = $('#radar-less');
    if (!moreEl || !lessEl) return;
    if (rankings && (rankings.mostComplaints || []).length) {
      moreEl.innerHTML = rankings.mostComplaints.slice(0, 5)
        .filter(p => p.complaints > 0).map(p => radarRow(p, p.complaints, 'mb-radar-badge-red')).join('')
        || '<p class="mb-muted-sm">Nenhuma reclamação registrada ainda.</p>';
      const least = (rankings.mostComplaints || []).filter(p => p.complaints === 0).slice(0, 5);
      lessEl.innerHTML = least.length
        ? least.map(p => radarRow(p, '✅ Sem reclamações', 'mb-radar-badge-green')).join('')
        : (rankings.mostSupports || []).slice(0, 5).filter(p => p.supports > 0).map(p => radarRow(p, '👍 ' + p.supports, 'mb-radar-badge-green')).join('');
      return;
    }
    // Fallback: usa a própria lista de políticos
    const all = state.allPoliticians;
    const more = all.slice().sort(() => Math.random() - 0.5).slice(0, 5);
    const less = all.slice().sort(() => Math.random() - 0.5).slice(0, 5);
    moreEl.innerHTML = more.map(p => radarRow(p, '—', 'mb-radar-badge-red')).join('');
    lessEl.innerHTML = less.map(p => radarRow(p, '✅', 'mb-radar-badge-green')).join('');
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
    // 1) Servidor: PLs reais da Câmara (cache 24h) + votos da plataforma
    try {
      const r = await fetch('/api/pls');
      if (r.ok) {
        const d = await r.json();
        if (d.pls && d.pls.length) {
          state.pls = d.pls;
          state.plsSource = d.source || null;
        }
      }
    } catch (e) { /* tenta snapshot estático */ }

    // 2) Snapshot estático (GitHub Pages — PLs reais da Câmara)
    if (!state.pls.length) {
      try {
        const r2 = await fetch('../data/pls.json');
        if (r2.ok) {
          const d2 = await r2.json();
          if (d2.pls && d2.pls.length) {
            state.pls = d2.pls;
            state.plsSource = d2.source || 'Câmara dos Deputados (snapshot)';
          }
        }
      } catch (e) { /* último recurso: amostra */ }
    }
    if (!state.pls.length) state.pls = FALLBACK_PLS;

    populatePlFilters();
    attachPlFilters();
    renderPls();
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
    const fonteNota = state.plsSource ? `<p class="mb-muted-sm" style="margin:0 0 14px;">📡 Fonte: ${escapeHtml(state.plsSource)}${state.plsSource.toLowerCase().includes('câmara') ? ' — projetos reais em tramitação' : ''}</p>` : '';
    container.innerHTML = fonteNota + list.map(p => {
      // Link direto para a ficha da proposição quando temos o id da Câmara
      const teorHref = p.url
        ? p.url
        : (p.id && p.id.startsWith('pl-camara-')
            ? 'https://www.camara.leg.br/proposicoesweb/fichadetalhamento?idProposicao=' + p.id.replace('pl-camara-', '')
            : 'https://www.camara.leg.br/busca-portal?pesquisa=' + encodeURIComponent(p.number || ''));
      return `
      <article class="mb-pl-card" data-pl="${escapeHtml(p.id)}">
        <div class="mb-pl-head">
          <span class="mb-pl-number">PL ${escapeHtml(p.number)}</span>
          <span class="mb-pl-status">${escapeHtml(p.chamber || 'Câmara')} · ${escapeHtml(p.status || 'Tramitando')}</span>
        </div>
        <div class="mb-pl-ementa">${escapeHtml(p.ementa || p.title || '')}</div>
        ${p.author ? `<div class="mb-muted-sm" style="margin-top:8px;">✍️ ${escapeHtml(p.author)}${p.party ? ' (' + escapeHtml(p.party) + (p.uf ? '-' + escapeHtml(p.uf) : '') + ')' : ''}</div>` : ''}
        <div class="mb-pl-actions">
          <button class="mb-pl-vote-btn v-yes" data-vote="aprovo" data-pl="${escapeHtml(p.id)}">👍 Aprovo</button>
          <button class="mb-pl-vote-btn v-no" data-vote="nao_aprovo" data-pl="${escapeHtml(p.id)}">👎 Não aprovo</button>
          <span class="mb-pl-link" data-approval="${p.id}">${p.approvalCount || 0} aprovações</span>
          <a href="${escapeHtml(teorHref)}" target="_blank" rel="noopener" class="mb-pl-link">inteiro teor do PL ↗</a>
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
      const r = await fetch('/api/pls/voto', {
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
  const FALLBACK_REVOGADOS = [
    {id:'roberto-alves',name:'Roberto Alves',position:'Vereador',party:'NOVO',state:'PR',photo:'',activeVotes:4820,revokedVotes:342,cassationThreshold:3374,totalVotes:5162,progressToCassation:10,motivo:'Prometeu transparência e votou a favor de aumento do próprio salário.'},
    {id:'felipe-santos',name:'Felipe Santos',position:'Senador',party:'PP',state:'MG',photo:'',activeVotes:6100,revokedVotes:1287,cassationThreshold:4270,totalVotes:7387,progressToCassation:30,motivo:'Mudou de posição sobre reforma após lobby.'},
    {id:'joao-pereira',name:'João Pereira',position:'Dep. Estadual',party:'PL',state:'MG',photo:'',activeVotes:3950,revokedVotes:892,cassationThreshold:2765,totalVotes:4842,progressToCassation:32,motivo:'Abandonou 18 sessões consecutivas.'},
    {id:'patricia-lima',name:'Patrícia Lima',position:'Prefeita',party:'PSD',state:'RS',photo:'',activeVotes:5200,revokedVotes:2154,cassationThreshold:3640,totalVotes:7354,progressToCassation:59,motivo:'Esquema de superfaturamento de obras.'},
    {id:'camila-rocha',name:'Camila Rocha',position:'Dep. Estadual',party:'PSB',state:'RJ',photo:'',activeVotes:2980,revokedVotes:567,cassationThreshold:2086,totalVotes:3547,progressToCassation:27,motivo:'Votou contra proteção ambiental.'},
    {id:'renato-vieira',name:'Renato Vieira',position:'Dep. Federal',party:'PTB',state:'SP',photo:'',activeVotes:7100,revokedVotes:3421,cassationThreshold:4970,totalVotes:10521,progressToCassation:69,motivo:'Flagrado em operação da PF.'},
  ];

  async function loadRevogados() {
    try {
      const r = await fetch('/api/voto/revogados');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      state.revStats = (d.politicos && d.politicos.length) ? d.politicos : FALLBACK_REVOGADOS;
    } catch (e) {
      console.warn('loadRevogados usando fallback:', e.message);
      state.revStats = FALLBACK_REVOGADOS;
    }
    // popula filtros
    const parties = new Set();
    const states = new Set();
    state.allPoliticians.forEach(p => { if (p.party) parties.add(p.party); if (p.state) states.add(p.state); });
    const psel = $('#rev-party'), ssel = $('#rev-state');
    if (psel) Array.from(parties).sort().forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; psel.appendChild(o); });
    if (ssel) Array.from(states).sort().forEach(s => { const o = document.createElement('option'); o.value = s; o.textContent = s; ssel.appendChild(o); });
    ['rev-search', 'rev-party', 'rev-state'].forEach(id => { const el = $('#' + id); if (el) el.addEventListener('input', renderRevogados); });
    renderRevogados();
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
    const cru = $$('.mb-code-group').map(i => i.value).join('').toUpperCase();
    const out = $('#conferir-result');
    if (!cru) { toast('Digite seu código', 'error'); return; }
    const soDigitos = /^\d+$/.test(cru);
    const isSessao = soDigitos && cru.length === 20;
    const isVoto = cru.length === 16 && /^[A-Z0-9]+$/.test(cru);
    if (!isSessao && !isVoto) {
      out.className = 'mb-conferir-result error';
      out.innerHTML = `⚠️ <strong>Formato não reconhecido</strong><br>Use o código do voto (4 grupos de 4 letras/números) ou o código de verificação (5 grupos de 4 dígitos).`;
      return;
    }
    if (isVoto) {
      // Código do voto (16 caracteres, gerado na hora do voto)
      const formatado = cru.match(/.{4}/g).join('-');
      try {
        const r = await fetch('/api/voto?code=' + encodeURIComponent(formatado));
        const d = await r.json();
        if (d.ok) {
          const b = d.ballot || {};
          out.className = 'mb-conferir-result success';
          out.innerHTML = `✅ <strong>Voto encontrado ${b.revoked ? '— porém revogado' : 'e ativo'}</strong><br>Status: <strong>${b.revoked ? '↩ Revogado' : '✓ Ativo'}</strong> · Peso atual: <strong>${b.pesoAtual}</strong> · Dias desde a confirmação: <strong>${b.diasDesdeReafirmacao}</strong>`;
        } else {
          out.className = 'mb-conferir-result error';
          out.innerHTML = `❌ <strong>Voto não encontrado</strong><br>Confira os caracteres e tente novamente.`;
        }
      } catch (e) { erroConferir(); }
      return;
    }
    // Código de verificação de 20 dígitos (conta logada)
    try {
      const r = await fetch('/api/voto/conferir', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cru })
      });
      const d = await r.json();
      if (d.ok) {
        out.className = 'mb-conferir-result success';
        out.innerHTML = `✅ <strong>Código de verificação válido!</strong><br>Hash do eleitor: <code>${d.voterHash.slice(0, 24)}...</code><br>Total de votos vinculados: <strong>${d.votos.length}</strong>`;
      } else {
        out.className = 'mb-conferir-result error';
        out.innerHTML = `❌ <strong>Código não encontrado</strong><br>Verifique se digitou corretamente.`;
      }
    } catch (e) { erroConferir(); }
  }

  function erroConferir() {
    const out = $('#conferir-result');
    out.className = 'mb-conferir-result error';
    out.innerHTML = `ℹ️ <strong>Verificação indisponível no modo site</strong><br>Consultar a base de votos exige o servidor do MudaBrasil em execução (localmente: <code>node server/index.js</code>). Seu código continua válido e guardado por você.`;
  }

  async function generateCode() {
    const sess = session();
    if (!sess) { toast('Entre para gerar código', 'error'); openAuthModal(); return; }
    try {
      const r = await fetch('/api/voto/codigo', {
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
      const r = await fetch('/api/voto/meus?sessionToken=' + encodeURIComponent(sess.token));
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
        const r = await fetch('/api/voto/revogar', {
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
        const r = await fetch('/api/auth/google', {
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
        const r = await fetch('/api/auth/otp/send', {
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
        const r = await fetch('/api/auth/otp/verify', {
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
