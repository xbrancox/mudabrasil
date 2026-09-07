/* ============================================================
   MUDABRASIL — SNAPSHOT ANTI-VAZIO DE NOTÍCIAS
   ------------------------------------------------------------
   Regenera data/noticias.json a partir do backend (10 feeds
   nacionais + 27 G1 estaduais). Front usa esse snapshot como
   cache enquanto o backend "acorda".
   Uso:  node scripts/snapshot-noticias.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const API = process.env.API_BASE || 'https://mudabrasil-production-79eb.up.railway.app';
const OUT = path.join(__dirname, '..', 'data', 'noticias.json');
const MIN = parseInt(process.env.MIN_NOTICIAS || '100', 10);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('[snapshot] backend:', API);

  // Acorda o backend
  try { await fetch(API + '/api/health', { signal: AbortSignal.timeout(90000) }); } catch (e) {}

  for (let tent = 1; tent <= 3; tent++) {
    try {
      const r = await fetch(API + '/api/noticias?force=1', { signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const itens = j.noticias || [];
      if (itens.length < MIN) throw new Error('poucos itens (' + itens.length + ')');
      fs.writeFileSync(OUT, JSON.stringify({
        mode: 'real',
        source: (j.fontes || []).length + ' feeds nacionais',
        geradoEm: new Date().toISOString(),
        total: itens.length,
        noticias: itens
      }));
      console.log('[snapshot] OK — ' + itens.length + ' itens');
      return;
    } catch (e) {
      console.warn('[snapshot] tentativa ' + tent + '/3 falhou:', e.message);
      if (tent < 3) await sleep(20000);
    }
  }
  console.error('[snapshot] FALHA — snapshot anterior mantido');
  process.exit(1);
}

main().catch(e => { console.error('FALHA:', e); process.exit(1); });
