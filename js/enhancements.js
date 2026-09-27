/* ============================================================
   MEUVOTO - ENHANCEMENTS: Tooltips, Loading States, Empty States
   ============================================================ */

(function () {
  'use strict';

  // 1. CSS Global para Tooltips, Spinners e Empty States
  const css = `
    /* Tooltip */
    .v-tip { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; background: rgba(255,215,0,0.15); color: #FFD700; border-radius: 50%; font-size: 11px; font-weight: 700; cursor: help; margin-left: 6px; vertical-align: middle; }
    .v-tip:hover::after {
      content: attr(data-tip);
      position: absolute; bottom: 125%; left: 50%; transform: translateX(-50%);
      background: #0d2242; color: #fff; padding: 6px 10px; border-radius: 8px;
      font: 12px/1.4 Manrope, sans-serif; white-space: nowrap; z-index: 9999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4); border: 1px solid rgba(127,176,245,0.3);
      pointer-events: none;
    }

    /* Loading Spinner */
    .v-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #FFD700; animation: v-spin 0.6s linear infinite; vertical-align: middle; margin-right: 6px; }
    @keyframes v-spin { to { transform: rotate(360deg); } }
    .btn-loading { opacity: 0.75; pointer-events: none; }

    /* Empty State */
    .v-empty { text-align: center; padding: 32px 16px; color: #94A3B8; background: rgba(13,34,66,0.4); border: 1px dashed rgba(127,176,245,0.2); border-radius: 12px; margin: 12px 0; }
    .v-empty i { font-size: 32px; color: #FFD700; margin-bottom: 8px; display: block; opacity: 0.8; }
    .v-empty p { font-size: 13.5px; margin: 0; }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // Helper para criar tooltip
  window.createTooltip = function(text) {
    const span = document.createElement('span');
    span.className = 'v-tip';
    span.textContent = '?';
    span.setAttribute('data-tip', text);
    return span.outerHTML;
  };

  // Helper para loading em botões
  window.setButtonLoading = function(btnId, isLoading, loadingText = 'Carregando...') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (isLoading) {
      btn.dataset.origHtml = btn.innerHTML;
      btn.classList.add('btn-loading');
      btn.innerHTML = `<span class="v-spinner"></span>${loadingText}`;
      btn.disabled = true;
    } else {
      btn.classList.remove('btn-loading');
      if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
      btn.disabled = false;
    }
  };

  // Helper para empty state HTML
  window.renderEmptyState = function(iconClass, message) {
    return `
      <div class="v-empty">
        <i class="${iconClass || 'fa-solid fa-folder-open'}"></i>
        <p>${message || 'Nenhum registro encontrado.'}</p>
      </div>
    `;
  };

  console.log('✨ MeuVoto UI Enhancements carregados.');
})();
