/**
 * MeuVoto Analytics - Sistema unificado de tracking
 * Suporta: Google Analytics 4, Plausible, Microsoft Clarity
 * Privacidade-first: respeita Do Not Track e LGPD
 */

(function() {
  'use strict';

  // Configurações - substitua pelos seus IDs reais
  const CONFIG = {
    GA4_ID: 'G-XXXXXXXXXX',           // Substitua pelo seu GA4 Measurement ID
    PLAUSIBLE_DOMAIN: 'meu-voto.app',  // Seu domínio no Plausible
    CLARITY_ID: 'xxxxxxxxxx',          // Substitua pelo seu Clarity Project ID
    ENABLE_GA4: false,                 // Ativar após configurar GA4
    ENABLE_PLAUSIBLE: false,           // Ativar após configurar Plausible
    ENABLE_CLARITY: false              // Ativar após configurar Clarity
  };

  // Respeitar Do Not Track
  const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  
  if (dnt) {
    console.log('[Analytics] Do Not Track ativado - tracking desabilitado');
    return;
  }

  // ========================================
  // Google Analytics 4 (GA4)
  // ========================================
  if (CONFIG.ENABLE_GA4 && CONFIG.GA4_ID !== 'G-XXXXXXXXXX') {
    // Carregar script do GA4
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA4_ID}`;
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', CONFIG.GA4_ID, {
      page_title: document.title,
      page_location: window.location.href,
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });

    // Expor função global para eventos customizados
    window.trackEvent = function(eventName, params) {
      gtag('event', eventName, params);
    };

    console.log('[Analytics] GA4 carregado:', CONFIG.GA4_ID);
  }

  // ========================================
  // Plausible Analytics (Privacy-first)
  // ========================================
  if (CONFIG.ENABLE_PLAUSIBLE) {
    const plausibleScript = document.createElement('script');
    plausibleScript.defer = true;
    plausibleScript.src = `https://plausible.io/js/script.js`;
    plausibleScript.setAttribute('data-domain', CONFIG.PLAUSIBLE_DOMAIN);
    document.head.appendChild(plausibleScript);

    // Expor função global para eventos customizados
    window.trackEvent = function(eventName, params) {
      if (window.plausible) {
        window.plausible(eventName, {props: params});
      }
    };

    console.log('[Analytics] Plausible carregado:', CONFIG.PLAUSIBLE_DOMAIN);
  }

  // ========================================
  // Microsoft Clarity (Heatmaps & Session Recording)
  // ========================================
  if (CONFIG.ENABLE_CLARITY && CONFIG.CLARITY_ID !== 'xxxxxxxxxx') {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", CONFIG.CLARITY_ID);

    console.log('[Analytics] Clarity carregado:', CONFIG.CLARITY_ID);
  }

  // ========================================
  // Eventos Customizados da Plataforma
  // ========================================
  
  // Track de cliques em CTAs importantes
  document.addEventListener('DOMContentLoaded', function() {
    // Track de votos
    const voteButtons = document.querySelectorAll('[data-track-vote]');
    voteButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (window.trackEvent) {
          window.trackEvent('vote_cast', {
            politician_id: btn.getAttribute('data-politician-id'),
            vote_type: btn.getAttribute('data-track-vote'),
            page: window.location.pathname
          });
        }
      });
    });

    // Track de buscas
    const searchInputs = document.querySelectorAll('input[type="search"], input[name="q"]');
    searchInputs.forEach(function(input) {
      let debounceTimer;
      input.addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          if (e.target.value.length > 2 && window.trackEvent) {
            window.trackEvent('search_performed', {
              query: e.target.value,
              results_count: document.querySelectorAll('.search-result').length
            });
          }
        }, 1000);
      });
    });

    // Track de downloads de comprovantes
    const downloadButtons = document.querySelectorAll('[data-track-download]');
    downloadButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (window.trackEvent) {
          window.trackEvent('receipt_downloaded', {
            politician_id: btn.getAttribute('data-politician-id'),
            vote_code: btn.getAttribute('data-vote-code')
          });
        }
      });
    });

    // Track de compartilhamentos
    const shareButtons = document.querySelectorAll('[data-track-share]');
    shareButtons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (window.trackEvent) {
          window.trackEvent('content_shared', {
            platform: btn.getAttribute('data-track-share'),
            content_type: btn.getAttribute('data-content-type') || 'page',
            url: window.location.href
          });
        }
      });
    });

    // Track de navegação entre seções
    const navLinks = document.querySelectorAll('nav a, .nav-link');
    navLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        if (window.trackEvent) {
          window.trackEvent('navigation', {
            from: window.location.pathname,
            to: link.getAttribute('href'),
            link_text: link.textContent.trim()
          });
        }
      });
    });
  });

  // ========================================
  // Performance Monitoring
  // ========================================
  if ('performance' in window && 'getEntriesByType' in window.performance) {
    window.addEventListener('load', function() {
      setTimeout(function() {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData && window.trackEvent) {
          window.trackEvent('page_performance', {
            load_time: Math.round(perfData.loadEventEnd - perfData.startTime),
            dom_ready: Math.round(perfData.domContentLoadedEventEnd - perfData.startTime),
            ttfb: Math.round(perfData.responseStart - perfData.requestStart),
            page: window.location.pathname
          });
        }
      }, 5000);
    });
  }

  // ========================================
  // Error Tracking
  // ========================================
  window.addEventListener('error', function(e) {
    if (window.trackEvent) {
      window.trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        page: window.location.href
      });
    }
  });

  // Fallback para trackEvent se nenhum analytics estiver ativo
  if (!window.trackEvent) {
    window.trackEvent = function() {
      console.log('[Analytics] Event tracked (no provider active):', arguments);
    };
  }

})();
