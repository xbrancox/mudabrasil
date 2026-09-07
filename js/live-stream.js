/* ============================================================
   MUDABRASIL — TEMPO REAL (SSE) COM FALLBACK
   Conecta ao /api/stream e chama refreshFn() em cada evento.
   Mantém polling de segurança em segundo plano.
   ============================================================ */
(function () {
  'use strict';

  function initLiveUpdate(refreshFn, opts) {
    opts = opts || {};
    const intervalMs = opts.intervalMs || 15000;
    let es = null;
    let timer = null;
    let sseFails = 0;
    let stopped = false;

    function safeRefresh() {
      if (stopped) return;
      try { refreshFn(); } catch (_) {}
    }

    function startPolling() {
      if (timer || stopped) return;
      timer = setInterval(safeRefresh, intervalMs);
    }
    function stopPolling() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    function pausePolling() {
      stopPolling();
      setTimeout(startPolling, intervalMs);
    }

    function connectSSE() {
      if (!opts.enabled || typeof EventSource === 'undefined' || stopped) return;
      try { es = new EventSource('/api/stream'); } catch (_) { es = null; }
      if (!es) return;
      es.addEventListener('welcome', safeRefresh);
      es.addEventListener('termometro', () => { safeRefresh(); pausePolling(); });
      es.onopen = () => { sseFails = 0; };
      es.onerror = () => {
        sseFails++;
        if (sseFails >= 3) { try { es.close(); } catch (_) {} es = null; }
      };
    }

    connectSSE();
    startPolling();

    return {
      stop: function () {
        stopped = true;
        stopPolling();
        if (es) { try { es.close(); } catch (_) {} es = null; }
      }
    };
  }

  window.MBLive = { initLiveUpdate: initLiveUpdate };
})();
