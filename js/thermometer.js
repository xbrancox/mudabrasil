/* ============================================================
   MEUVOTO - TERMÔMETRO DE CONFIANÇA (revogação do voto)
   ------------------------------------------------------------
   Regra "tudo real": só dados oficiais. O antigo bloco DEMO com
   nomes sintéticos foi removido — sem backend acessível a tela
   mostra aviso honesto, nunca gente inventada.

   Dual-mode agora significa: tenta a API real (/api/termometro,
   /api/candidatos); se ela não responde, exibe erro claro + retry.

   Regras do fundador respeitadas aqui:
   - R3: mensagem antes de confirmar o voto
   - R4: código único, mostrado UMA única vez
   - R5/R1: revogação no site, com o código
   - R6: "meu voto" mascarado por padrão (anti-print), revelar por toque
   - Anonimato / anti-coerção: a UI nunca expõe "quem votou em quem"
   - Sem pedido de voto: tom neutro, oferece a ferramenta sem pressionar
   - Terminologia: "revogação do voto" / "votos revogáveis"
   ============================================================ */
(function () {
  'use strict';

  const LS_CODE = 'mb_codigo';   // chaves da spec — NÃO renomear
  const LS_LOCAL = 'mb_local';
  const REFRESH_MS = 15000;      // rede de segurança (SSE é o canal principal)

  /* Base da API: absoluta em file:// (config.local.js aponta p/ Railway),
     relativa ('') quando servido por http(s) na mesma origem do backend. */
  const API = (window.MeuVoto && typeof window.MeuVoto.API_BASE === 'string')
    ? window.MeuVoto.API_BASE
    : 'https://mudabrasil-production-79eb.up.railway.app';

  /* ---------- ESTADO ---------- */
  let mode = 'demo';
  let politicians = [];          // lista real p/ o seletor
  let selectedId = null;
  let currentVote = null;        // último voto consultado
  let trendChart = null;
  let live = null;               // controlador de tempo real (MBLive)

  const $ = id => document.getElementById(id);

  /* ---------- HELPERS ---------- */
  function fetchWithTimeout(url, ms = 5000, opts = {}) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const init = Object.assign({ signal: ctrl.signal }, opts);
    if (opts.body) init.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(url, init).finally(() => clearTimeout(t));
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmt(n) { return new Intl.NumberFormat('pt-BR').format(n || 0); }
  function initials(name) {
    const p = String(name || '?').split(/\s+/);
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }
  function maskName(name) {
    // R6 anti-print: mascara o nome por padrão
    return String(name || '').replace(/[A-Za-zÀ-ÿ]/g, '•');
  }
  function codeFromInput() {
    return ($('code-input').value || '').trim();
  }
  function setCode(code) {
    $('code-input').value = code || '';
    if (code) { try { localStorage.setItem(LS_CODE, code); } catch (_) {} }
  }

  /* ---------- MODO (real/erro) ---------- */
  function setMode(m, source) {
    mode = m;
    const badge = $('source-badge');
    const search = $('pol-search');
    if (m === 'real') {
      badge.className = 'source-badge-pill real';
      badge.textContent = '📡 Dados reais · Câmara dos Deputados · voto anônimo ao vivo';
      if ($('demo-notice')) $('demo-notice').style.display = 'none';
      if (search) { search.disabled = false; search.placeholder = 'Nome, partido ou estado…'; }
    } else {
      badge.className = 'source-badge-pill demo';
      badge.textContent = '⚠️ Sem conexão com o servidor de dados';
      if (search) { search.disabled = true; search.placeholder = 'Disponível apenas com o servidor conectado'; }
    }
  }

  /* ---------- RENDER: TERMÔMETRO ---------- */
  function renderThermometer(data) {
    $('m-ativos').textContent = fmt(data.totalVotosAtivos);
    $('m-revogados').textContent = fmt(data.totalRevogados);
    $('m-participantes').textContent = fmt(data.totalRegistros);
    const top = data.topN && data.topN[0];
    $('m-top').textContent = top ? top.indice.toFixed(1) : '—';
    $('m-top').title = top ? top.name : '';

    renderThermoList(data.topN || []);
    renderTrendChart(data.tendencia || []);

    // rodapé (mini score do topo + data)
    const fs = $('footer-score');
    if (fs) fs.style.width = (top ? top.indice : 0) + '%';
    const fu = $('footer-updated');
    if (fu && data.atualizadoEm) {
      fu.textContent = 'Atualizado em ' + new Date(data.atualizadoEm).toLocaleTimeString('pt-BR');
    }
  }

  function renderThermoList(items) {
    const wrap = $('thermo-list');
    if (!items.length) {
      wrap.innerHTML = '<p class="thermo-empty">Ainda não há votos registrados nesta base. ' +
        (mode === 'real' ? 'Seja a primeira pessoa a expressar confiança.' : '') + '</p>';
      return;
    }
    wrap.innerHTML = items.map((p, i) => {
      const img = p.photo
        ? `<img class="thermo-photo" src="${escapeHtml(p.photo)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=thermo-photo thermo-fallback>${escapeHtml(initials(p.name))}</span>'">`
        : `<span class="thermo-photo thermo-fallback">${escapeHtml(initials(p.name))}</span>`;
      return `
        <div class="thermo-row">
          <span class="thermo-pos">${i + 1}</span>
          ${img}
          <div class="thermo-info">
            <div class="thermo-name">${escapeHtml(p.name)}</div>
            <div class="thermo-meta">${escapeHtml(p.party || '—')} · ${escapeHtml(p.state || '—')}</div>
            <div class="thermo-scorebar">
              <div class="score-bar"><div class="score-fill" style="width:${Math.max(2, p.indice)}%"></div></div>
            </div>
          </div>
          <div class="thermo-score">
            <span class="thermo-score-num">${p.indice.toFixed(1)}</span>
            <span class="thermo-score-sub">${fmt(p.votosAtivos)} voto${p.votosAtivos === 1 ? '' : 's'}</span>
          </div>
        </div>`;
    }).join('');
  }

  function renderTrendChart(tendencia) {
    const canvas = $('trendChart');
    if (!canvas) return;
    const labels = tendencia.map(t => t.at.slice(5).split('-').reverse().join('/'));
    const values = tendencia.map(t => t.ativos);
    if (trendChart) {
      trendChart.data.labels = labels;
      trendChart.data.datasets[0].data = values;
      trendChart.update('none');
      return;
    }
    if (typeof Chart === 'undefined') return; // CDN indisponível
    Chart.defaults.color = '#C6D0DD';
    Chart.defaults.font.family = "'Inter', sans-serif";
    trendChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Votos ativos',
          data: values,
          borderColor: '#FFD700',
          backgroundColor: 'rgba(255,215,0,0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(198,208,221,0.1)' } },
          x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } }
        }
      }
    });
  }

  /* ---------- SELETOR DE PARLAMENTAR ---------- */
  function renderDropdown(query) {
    const dd = $('pol-dropdown');
    const q = (query || '').toLowerCase().trim();
    let list = politicians;
    if (q) {
      list = politicians.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.party || '').toLowerCase().includes(q) ||
        (p.state || '').toLowerCase().includes(q));
    }
    list = list.slice(0, 15);
    if (!list.length) {
      dd.innerHTML = '<div class="pol-item pol-empty">Nenhum parlamentar encontrado.</div>';
      dd.classList.add('open');
      return;
    }
    dd.innerHTML = list.map(p => `
      <div class="pol-item" data-id="${escapeHtml(p.id)}">
        ${p.photo ? `<img src="${escapeHtml(p.photo)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
        <span class="pol-item-name">${escapeHtml(p.name)}</span>
        <span class="pol-item-meta">${escapeHtml(p.party || '—')} · ${escapeHtml(p.state || '—')}</span>
      </div>`).join('');
    dd.classList.add('open');
  }

  function selectPolitician(id) {
    const p = politicians.find(x => x.id === id);
    if (!p) return;
    selectedId = id;
    $('pol-dropdown').classList.remove('open');
    $('pol-search').value = '';
    const sel = $('selected-pol');
    sel.style.display = 'flex';
    $('sp-name').textContent = p.name;
    $('sp-meta').textContent = (p.party || '—') + ' · ' + (p.state || '—');
    const ph = $('sp-photo');
    if (p.photo) { ph.style.display = ''; ph.src = p.photo; } else { ph.style.display = 'none'; }
    $('consent-note').style.display = 'block';
    updateButtons();
  }

  function clearSelected() {
    selectedId = null;
    $('selected-pol').style.display = 'none';
    $('consent-note').style.display = 'none';
    updateButtons();
  }

  /* ---------- AÇÕES DE VOTO ---------- */
  async function confirmVote() {
    if (!selectedId || mode !== 'real') return;
    const btn = $('btn-votar');
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = '⏳ Registrando…';
    try {
      let uf = null;
      try { uf = (JSON.parse(localStorage.getItem(LS_LOCAL) || '{}') || {}).uf || null; } catch (_) {}
      const res = await fetchWithTimeout(API + '/api/voto', 6000, {
        method: 'POST',
        body: JSON.stringify({ politicianId: selectedId, uf })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
      setCode(data.code);
      showCodeModal(data.code, data.politician);
      await refreshThermometer();
    } catch (e) {
      alert('Não foi possível registrar seu voto: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
      updateButtons();
    }
  }

  function showCodeModal(code, pol) {
    $('code-display').textContent = code;
    $('code-pol').textContent = 'Voto de confiança em ' + pol.name + ' (' + (pol.party || '—') + ' ' + (pol.state || '') + ').';
    $('code-modal').style.display = 'flex';
  }

  function closeCodeModal() {
    $('code-modal').style.display = 'none';
    updateButtons();
  }

  async function viewMyVote() {
    const code = codeFromInput();
    if (!code) { alert('Informe seu código de verificação.'); return; }
    setCode(code);
    try {
      const res = await fetchWithTimeout(API + '/api/voto?code=' + encodeURIComponent(code), 6000);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
      const pol = politicians.find(p => p.id === data.ballot.politicianId);
      currentVote = { ...data.ballot, politicianName: pol ? pol.name : '(parlamentar)', politicianParty: pol ? pol.party : null, politicianState: pol ? pol.state : null, politicianPhoto: pol ? pol.photo : null };
      renderMyVote(currentVote);
    } catch (e) {
      currentVote = null;
      $('my-vote-box').innerHTML = '<div class="my-vote-box my-vote-error">❌ ' + escapeHtml(e.message) + '</div>';
      updateButtons();
    }
  }

  function renderMyVote(v) {
    const box = $('my-vote-box');
    const status = v.revoked
      ? '<span class="vote-status revoked">↩ Revogado</span>'
      : '<span class="vote-status active">✓ Ativo</span>';
    const photo = v.politicianPhoto
      ? `<img class="myvote-photo" src="${escapeHtml(v.politicianPhoto)}" alt="" onerror="this.outerHTML='<span class=myvote-photo myvote-fallback>${escapeHtml(initials(v.politicianName))}</span>'">`
      : `<span class="myvote-photo myvote-fallback">${escapeHtml(initials(v.politicianName))}</span>`;
    box.innerHTML = `
      <div class="myvote-row">
        ${photo}
        <div class="myvote-info">
          <div class="myvote-name" id="myvote-name" title="Clique para revelar">${escapeHtml(maskName(v.politicianName))}</div>
          <div class="myvote-meta">${escapeHtml(v.politicianParty || '—')} · ${escapeHtml(v.politicianState || '—')}</div>
          <div class="myvote-stats">
            Peso atual: <strong>${v.pesoAtual}</strong> · ${v.diasDesdeReafirmacao} dia(s) desde a reafirmação
          </div>
          ${status}
        </div>
        <button class="btn-link" id="myvote-toggle" type="button">👁 Mostrar</button>
      </div>
      ${v.precisaReafirmar && !v.revoked ? '<div class="reaffirm-banner">⏳ Seu voto tem mais de 30 dias sem reconfirmação. Toque em "Manter meu voto" para restaurar o peso máximo.</div>' : ''}`;
    const toggle = $('myvote-toggle');
    let revealed = false;
    if (toggle) toggle.addEventListener('click', () => {
      revealed = !revealed;
      $('myvote-name').textContent = revealed ? v.politicianName : maskName(v.politicianName);
      toggle.textContent = revealed ? '🙈 Ocultar' : '👁 Mostrar';
    });
    updateButtons();
  }

  async function revokeMyVote() {
    const code = codeFromInput();
    if (!code) { alert('Informe seu código para revogar.'); return; }
    if (!confirm('Tem certeza que deseja REVOGAR seu voto de confiança? Esta ação é irreversível.')) return;
    try {
      const res = await fetchWithTimeout(API + '/api/voto/revogar', 6000, { method: 'POST', body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
      currentVote = null;
      $('my-vote-box').innerHTML = '<div class="my-vote-box my-vote-success">↩ Voto revogado com sucesso. Seu voto foi "tirado" do termômetro.</div>';
      await refreshThermometer();
    } catch (e) {
      alert('Não foi possível revogar: ' + e.message);
    }
  }

  async function reaffirmMyVote() {
    const code = codeFromInput();
    if (!code) { alert('Informe seu código para reafirmar.'); return; }
    try {
      const res = await fetchWithTimeout(API + '/api/voto/manter', 6000, { method: 'POST', body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
      $('my-vote-box').innerHTML = '<div class="my-vote-box my-vote-success">🔄 Voto reafirmado! O decaimento foi reiniciado (peso máximo restaurado).</div>';
      await refreshThermometer();
    } catch (e) {
      alert('Não foi possível reafirmar: ' + e.message);
    }
  }

  /* ---------- BOTÕES ---------- */
  function updateButtons() {
    const canVote = mode === 'real' && !!selectedId;
    $('btn-votar').disabled = !canVote;
    const hasCode = !!codeFromInput();
    $('btn-ver').disabled = mode !== 'real' || !hasCode;
    const active = currentVote && !currentVote.revoked;
    $('btn-manter').disabled = mode !== 'real' || !hasCode || !active;
    $('btn-revogar').disabled = mode !== 'real' || !hasCode || !active;
  }

  /* ---------- CARREGAMENTO ---------- */
  async function refreshThermometer() {
    try {
      const res = await fetchWithTimeout(API + '/api/termometro', 6000);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      renderThermometer(await res.json());
      return true;
    } catch (_) { return false; }
  }

  async function loadReal() {
    // Termômetro (define modo) + lista de parlamentares (p/ o seletor)
    const res = await fetchWithTimeout(API + '/api/termometro', 6000);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    setMode('real', data.source);
    renderThermometer(data);

    const resC = await fetchWithTimeout(API + '/api/candidatos', 8000);
    if (resC.ok) {
      const jc = await resC.json();
      const arr = Array.isArray(jc) ? jc : (jc.candidatos || jc.dados || []);
      if (arr.length) politicians = arr.map(d => ({
        id: d.id, name: d.name || d.nome, party: d.party || d.partido,
        state: d.state || d.uf, photo: d.photo || d.foto
      }));
    }
    return true;
  }

  /* Sem backend acessível: nunca inventar gente. Mostra aviso honesto e
     deixa o resto da página (histórico local via código) utilizável. */
  function renderOfflineError() {
    setMode('demo');
    ['m-ativos', 'm-revogados', 'm-participantes', 'm-top'].forEach(id => { const el = $(id); if (el) el.textContent = '—'; });
    const wrap = $('thermo-list');
    if (wrap) wrap.innerHTML = '<p class="thermo-empty">⚠️ Não foi possível conectar ao servidor de dados públicos.<br>Tente novamente em instantes — nenhum dado é exibido sem fonte oficial.</p>';
    const fu = $('footer-updated');
    if (fu) fu.textContent = 'offline';
  }

  /* ---------- EVENTOS ---------- */
  function bindEvents() {
    const search = $('pol-search');
    let deb;
    search.addEventListener('input', () => {
      clearTimeout(deb);
      deb = setTimeout(() => renderDropdown(search.value), 180);
    });
    search.addEventListener('focus', () => { if (mode === 'real' && politicians.length) renderDropdown(search.value); });
    $('pol-dropdown').addEventListener('click', (e) => {
      const item = e.target.closest('.pol-item[data-id]');
      if (item) selectPolitician(item.getAttribute('data-id'));
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.pol-combo')) $('pol-dropdown').classList.remove('open');
    });

    $('sp-clear').addEventListener('click', clearSelected);
    $('btn-votar').addEventListener('click', confirmVote);
    $('btn-ver').addEventListener('click', viewMyVote);
    $('btn-revogar').addEventListener('click', revokeMyVote);
    $('btn-manter').addEventListener('click', reaffirmMyVote);

    $('code-input').addEventListener('input', () => { setCode(codeFromInput()); updateButtons(); });

    $('btn-close-code').addEventListener('click', closeCodeModal);
    $('btn-copy-code').addEventListener('click', () => {
      const code = $('code-display').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
      $('btn-copy-code').textContent = '✅ Copiado!';
      setTimeout(() => { $('btn-copy-code').textContent = '📋 Copiar'; }, 2000);
    });
    // fecha modais ao clicar fora
    ['code-modal', 'login-modal'].forEach(id => {
      const m = $(id);
      if (m) m.addEventListener('click', (e) => { if (e.target === m) m.style.display = 'none'; });
    });
  }

  /* Tempo real: SSE (/api/stream) atualiza na hora; um polling de
     segurança a cada REFRESH_MS cobre quedas do stream. No modo
     demo nada disso é iniciado (não há servidor). */
  function startLiveUpdates() {
    if (live || mode !== 'real' || !window.MBLive) return;
    live = MBLive.initLiveUpdate(refreshThermometer, {
      enabled: true,
      intervalMs: REFRESH_MS
    });
  }

  /* ---------- INIT ---------- */
  async function init() {
    bindEvents();
    // pré-preenche código salvo
    try { setCode(localStorage.getItem(LS_CODE) || ''); } catch (_) {}
    updateButtons();
    try {
      await loadReal();    // tenta modo real
    } catch (_) {
      renderOfflineError(); // aviso honesto — nunca dados inventados
    }
    startLiveUpdates();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
