/* ============================================================
   MUDABRASIL - TERMÔMETRO DE CONFIANÇA (voto contínuo revogável)
   Dual-mode: tenta API real; se o servidor não responde, cai no demo.
   ============================================================ */
(function () {
  'use strict';

  const LS_CODE = 'mb_codigo';
  const REFRESH_MS = 15000;

  let mode = 'demo';
  let politicians = [];
  let selectedId = null;
  let currentVote = null;
  let live = null;

  const $ = id => document.getElementById(id);

  const DEMO = {
    mode: 'demo',
    source: 'Modo demo — dados sintéticos',
    totalVotosAtivos: 132,
    totalRevogados: 27,
    totalRegistros: 159,
    topN: [
      { name: 'Ana Beatriz Souza', party: 'PT', state: 'SP', indice: 87, votosAtivos: 42, revogacoes: 3, photo: null },
      { name: 'Mariana Oliveira', party: 'PSB', state: 'MG', indice: 79, votosAtivos: 31, revogacoes: 1, photo: null },
      { name: 'Fernanda Costa', party: 'NOVO', state: 'DF', indice: 71, votosAtivos: 25, revogacoes: 2, photo: null },
      { name: 'Carlos Eduardo Lima', party: 'PL', state: 'RJ', indice: 58, votosAtivos: 18, revogacoes: 5, photo: null },
      { name: 'Paulo Henrique Santos', party: 'REPUBLICANOS', state: 'BA', indice: 44, votosAtivos: 12, revogacoes: 7, photo: null }
    ]
  };

  function fmt(n) { return new Intl.NumberFormat('pt-BR').format(n || 0); }
  function initials(name) {
    const p = String(name || '?').split(/\s+/);
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  }

  function renderThermometer(data) {
    const mAtivos = $('m-ativos');
    const mRevogados = $('m-revogados');
    const mPart = $('m-participantes');
    if (mAtivos) mAtivos.textContent = fmt(data.totalVotosAtivos);
    if (mRevogados) mRevogados.textContent = fmt(data.totalRevogados);
    if (mPart) mPart.textContent = fmt(data.totalRegistros);
  }

  async function refreshThermometer() {
    try {
      const res = await fetch('/api/termometro', { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      renderThermometer(await res.json());
      return true;
    } catch (_) { return false; }
  }

  async function loadReal() {
    const res = await fetch('/api/termometro', { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    mode = 'real';
    renderThermometer(data);
    return true;
  }

  function renderDemo() {
    mode = 'demo';
    renderThermometer(DEMO);
  }

  function startLiveUpdates() {
    if (live || mode !== 'real' || !window.MBLive) return;
    live = MBLive.initLiveUpdate(refreshThermometer, { enabled: true, intervalMs: REFRESH_MS });
  }

  async function init() {
    renderDemo();
    try { await loadReal(); } catch (_) { renderDemo(); }
    startLiveUpdates();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
