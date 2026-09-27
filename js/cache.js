/* MeuVoto - Cache, resiliencia e erros globais */
const CACHE_TTL = 30 * 60 * 1000;
const CACHE_PREFIX = 'meuvoto_cache_';
const CACHE_STALE = {};

function fetchWithCache(url) {
  const chave = CACHE_PREFIX + url;
  try {
    const cached = localStorage.getItem(chave);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return Promise.resolve(data);
      CACHE_STALE[url] = data;
    }
  } catch (e) { console.warn('Cache ilegivel, ignorando:', e); }

  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + url);
      return r.json();
    })
    .then((data) => {
      try { localStorage.setItem(chave, JSON.stringify({ data, timestamp: Date.now() })); }
      catch (e) { console.warn('Falha ao gravar cache:', e); }
      return data;
    })
    .catch((err) => {
      if (CACHE_STALE[url]) { console.warn('Rede falhou; servindo cache antigo:', err.message); return CACHE_STALE[url]; }
      throw err;
    });
}

function limparCache() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(CACHE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}

function showToast(msg) {
  let toast = document.getElementById('mb-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mb-toast';
    toast.style.cssText =
      'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
      'background:#b91c1c;color:#fff;padding:12px 20px;border-radius:10px;' +
      'font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);' +
      'opacity:0;transition:opacity .25s;z-index:9999;pointer-events:none';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.style.opacity = '0'; }, 4000);
}

window.addEventListener('unhandledrejection', (e) => {
  console.error('Promise rejeitada:', e.reason);
  showToast('Algo deu errado ao carregar os dados. Tente novamente.');
});

window.addEventListener('error', (e) => {
  console.error('Erro capturado:', e.error);
  showToast('Erro inesperado. Recarregue a pagina se persistir.');
});