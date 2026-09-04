/* ============================================================
   MUDABRASIL — TEMPO REAL (SSE) COM FALLBACK
   ------------------------------------------------------------
   Conecta o cliente ao /api/stream (Server-Sent Events) e
   chama refreshFn() sempre que o servidor notifica uma
   mudança (voto, revogação, manutenção). Mantém um polling
   de segurança em segundo plano; se o SSE não estiver
   disponível (ou falhar repetidamente), o polling assume.

   Uso:
     MBLive.initLiveUpdate(function refresh() { ... }, {
       enabled: mode === 'real',   // desliga o SSE no modo demo
       intervalMs: 15000           // intervalo do polling de segurança
     });
   ============================================================ */

(function () {
  'use strict';
  const API = (window.MudaBrasil && window.MudaBrasil.API_BASE) || '';

  function initLiveUpdate(refreshFn, opts) {
    opts = opts || {};
    const intervalMs = opts.intervalMs || 15000;
    let es = null;
    let timer = null;
    let sseFails = 0;
    let stopped = false;

    function safeRefresh() {
      if (stopped) return;
      try { refreshFn(); } catch (_) { /* nunca quebra a página */ }
    }

    // Polling de rede de segurança: barato e que nunca para.
    // Após cada evento SSE, o polling é pausado por `intervalMs`
    // para não duplicar um refresh que acabou de acontecer.
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
      try { es = new EventSource(API + '/api/stream'); } catch (_) { es = null; }
      if (!es) return;

      // Bem-vindo: sincroniza o estado assim que a conexão abre.
      es.addEventListener('welcome', safeRefresh);
      // Mudança no motor de voto: atualiza na hora.
      es.addEventListener('termometro', () => { safeRefresh(); pausePolling(); });
      es.onopen = () => { sseFails = 0; };
      es.onerror = () => {
        // EventSource tenta reconectar sozinho (retry: 10000).
        // Se o stream nunca funciona (ex.: servidor estático sem
        // /api/stream), desistimos após 3 falhas: o polling segue.
        sseFails++;
        if (sseFails >= 3) {
          try { es.close(); } catch (_) {}
          es = null;
        }
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
