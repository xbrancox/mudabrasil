#!/usr/bin/env node
/* ============================================================
   VALIDADOR DE FOTOS DOS CANDIDATOS
   ------------------------------------------------------------
   Verifica periodicamente se as URLs de fotos em
   data/candidatos-2026.json ainda existem.

   Uso:
     node scripts/validar-fotos.js
     node scripts/validar-fotos.js --json > fotos-report.json
     node scripts/validar-fotos.js --strict   # exit 1 se houver falha

   Saída: relatório com estatísticas e lista de URLs quebradas.
   Integração: pode ser chamado via `npm run test:photos` e
   usado em pipelines de CI/deploy para detectar fotos que
   sumiram (GitHub repo deletado, Wikimedia mudou, etc).
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CAND_FILE = path.join(ROOT, 'data', 'candidatos-2026.json');
const CONCURRENCY = 20;      // requisições em paralelo
const TIMEOUT_MS = 8000;     // timeout por requisição
const RETRIES = 2;           // tentativas em caso de falha
const UA = 'VotaBrasil/1.0 (plataforma civica de transparencia)';

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const STRICT = args.includes('--strict');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function headCheck(url) {
  // 1ª tentativa: HEAD (leve)
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': UA, Accept: '*/*' },
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(t);
      if (res.ok) return { ok: true, status: res.status, size: res.headers.get('content-length') };
      // ui-avatars sempre retorna 200; alguns servidores bloqueiam HEAD
      // Fallback para GET em caso de 405/501
      if ([405, 501, 503].includes(res.status)) {
        const g = await headCheckGet(url);
        return g;
      }
      if ([429].includes(res.status) && attempt < RETRIES) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return { ok: false, status: res.status };
    } catch (e) {
      if (attempt < RETRIES) await sleep(800 * (attempt + 1));
      else return { ok: false, error: e.name === 'AbortError' ? 'timeout' : e.message };
    }
  }
  return { ok: false, error: 'exhausted' };
}

async function headCheckGet(url) {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': UA, Accept: 'image/*' },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(t);
    // consome o body para liberar socket
    try { await res.arrayBuffer(); } catch (_) {}
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.name === 'AbortError' ? 'timeout' : e.message };
  }
}

function classify(url) {
  if (!url || url.length < 10) return 'none';
  if (url.includes('ui-avatars.com')) return 'placeholder';
  if (url.includes('raw.githubusercontent.com')) return 'github';
  if (url.includes('wikimedia') || url.includes('wikidata')) return 'wikimedia';
  if (url.startsWith('data/fotos/') || url.startsWith('fotos/')) return 'local';
  return 'other';
}

async function main() {
  const started = Date.now();
  if (!JSON_OUT) console.log('🖼️  Validador de fotos dos candidatos');
  if (!JSON_OUT) console.log('📄 Lendo', CAND_FILE);

  const data = JSON.parse(fs.readFileSync(CAND_FILE, 'utf8'));
  const candidatos = Array.isArray(data) ? data : (data.candidatos || []);
  const total = candidatos.length;

  // Agrupa por categoria
  const groups = { placeholder: [], github: [], wikimedia: [], local: [], other: [], none: [] };
  candidatos.forEach(c => {
    const cat = classify(c.foto);
    groups[cat].push(c);
  });

  // URLs a verificar (tudo exceto placeholder, que é sempre ok)
  const toCheck = [
    ...groups.github.map(c => ({ c, url: c.foto })),
    ...groups.wikimedia.map(c => ({ c, url: c.foto })),
    ...groups.other.map(c => ({ c, url: c.foto })),
    ...groups.local.map(c => ({ c, url: c.foto }))
  ];

  if (!JSON_OUT) {
    console.log(`\n📊 Distribuição atual de fotos:`);
    console.log(`   Total de candidatos: ${total}`);
    console.log(`   Placeholder (ui-avatars): ${groups.placeholder.length}`);
    console.log(`   GitHub (repo oficial):    ${groups.github.length}`);
    console.log(`   Wikimedia Commons:        ${groups.wikimedia.length}`);
    console.log(`   Local (backup):           ${groups.local.length}`);
    console.log(`   Outra URL:                ${groups.other.length}`);
    console.log(`   Sem foto:                 ${groups.none.length}`);
    console.log(`\n🔎 Verificando ${toCheck.length} URLs reais (${CONCURRENCY} em paralelo)…`);
  }

  const broken = [];
  const ok = [];
  const errors = [];
  let processed = 0;

  // Pool de concorrência
  async function worker(queue) {
    while (queue.length) {
      const item = queue.shift();
      if (!item) continue;
      const result = await headCheck(item.url);
      processed++;
      if (result.ok) {
        ok.push({ nome: item.c.nomeUrna, partido: item.c.partido, cargo: item.c.cargo, url: item.url, size: result.size });
      } else {
        broken.push({
          nome: item.c.nomeUrna,
          partido: item.c.partido,
          cargo: item.c.cargo,
          numero: item.c.numero,
          sq: item.c.sq,
          url: item.url,
          status: result.status,
          error: result.error
        });
      }
      if (!JSON_OUT && processed % 10 === 0) {
        process.stdout.write(`   ${processed}/${toCheck.length}\r`);
      }
    }
  }
  const queue = [...toCheck];
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const report = {
    geradoEm: new Date().toISOString(),
    totalCandidatos: total,
    distribuicao: {
      placeholder: groups.placeholder.length,
      github: groups.github.length,
      wikimedia: groups.wikimedia.length,
      local: groups.local.length,
      other: groups.other.length,
      none: groups.none.length
    },
    verificadas: toCheck.length,
    ok: ok.length,
    quebradas: broken.length,
    duracaoSegundos: Number(elapsed),
    quebradasDetalhes: broken
  };

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(report, null, 2));
    process.exit(broken.length > 0 && STRICT ? 1 : 0);
  }

  console.log(`\n✅ Verificação concluída em ${elapsed}s`);
  console.log(`   OK:       ${ok.length}`);
  console.log(`   Quebradas:${broken.length ? ' ⚠️  ' + broken.length : ' 0'}`);

  if (broken.length) {
    console.log(`\n⚠️  Fotos quebradas (precisam de correção):`);
    broken.forEach(b => {
      console.log(`   • ${b.nome} (${b.partido}/${b.numero}) — ${b.status || b.error}`);
      console.log(`     ${b.url}`);
    });
    console.log(`\n💡 Execute: node scripts/backup-fotos.js`);
    console.log(`   Ou corrija manualmente as URLs em ${CAND_FILE}`);
    if (STRICT) process.exit(1);
  } else {
    console.log(`\n🎉 Todas as fotos reais estão acessíveis!`);
  }
}

main().catch(e => {
  console.error('❌ Erro fatal:', e.message);
  process.exit(2);
});
