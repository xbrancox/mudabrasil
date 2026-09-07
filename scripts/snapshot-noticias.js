/* ============================================================
   MUDABRASIL — SNAPSHOT ANTI-VAZIO DE NOTÍCIAS
   ------------------------------------------------------------
   Regenera data/noticias.json a partir do backend (que agrega
   10 feeds nacionais + 27 G1 estaduais). O front usa esse
   snapshot para renderizar as notícias na hora enquanto o
   backend "acorda" (plano gratuito do Railway dorme sem
   tráfego) — o espaço nunca fica em branco.

   Regras de segurança:
   - Não sobrescreve um snapshot bom com um magro: exige no
     mínimo MIN itens (padrão 100).
   - Se todas as tentativas falharem, mantém o anterior e sai
     com código 1 (a CI não commita nada).

   Uso:  node scripts/snapshot-noticias.js
   Env:  API_BASE (padrão: produção Railway)
         MIN_NOTICIAS (padrão: 100)
   ============================================================ */

const fs = require('fs');
const path = require('path');

const API = process.env.API_BASE || 'https://mudabrasil-redesign-production.up.railway.app';
const OUT = path.join(__dirname, '..', 'data', 'noticias.json');
const MIN = parseInt(process.env.MIN_NOTICIAS || '100', 10);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('[noticias-snapshot] backend:', API);

  /* 1) Acorda o backend (cold start do plano gratuito ~11s) */
  console.log('[noticias-snapshot] acordando backend (/api/health)…');
  try {
    const h = await fetch(API + '/api/health', { signal: AbortSignal.timeout(90000) });
    console.log('[noticias-snapshot] health:', h.status);
  } catch (e) {
    console.warn('[noticias-snapshot] health falhou, seguindo mesmo assim:', e.message);
  }

  /* 2) Busca as notícias com refresh forçado dos feeds */
  for (let tent = 1; tent <= 3; tent++) {
    try {
      const r = await fetch(API + '/api/noticias?force=1', { signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const itens = j.noticias || [];
      const ufs = new Set(itens.map(n => n.uf).filter(Boolean));
      console.log('[noticias-snapshot] recebido:', itens.length, 'itens ·', ufs.size, 'UFs ·',
        (j.fontes || []).length, 'fontes nacionais');

      if (itens.length < MIN) {
        throw new Error('poucos itens (' + itens.length + ' < ' + MIN + ') — não vou sobrescrever um snapshot bom');
      }

      const dump = {
        mode: 'real',
        source: (j.fontes || []).length + ' feeds nacionais + 27 G1 estaduais',
        geradoEm: new Date().toISOString(),
        total: itens.length,
        noticias: itens
      };
      fs.writeFileSync(OUT, JSON.stringify(dump));
      console.log('[noticias-snapshot] OK — data/noticias.json gravado com', itens.length, 'itens');
      return;
    } catch (e) {
      console.warn('[noticias-snapshot] tentativa ' + tent + '/3 falhou:', e.message);
      if (tent < 3) await sleep(20000);
    }
  }

  console.error('[noticias-snapshot] FALHA — snapshot anterior mantido');
  process.exit(1);
}

main().catch(e => { console.error('FALHA GERAL:', e); process.exit(1); });
