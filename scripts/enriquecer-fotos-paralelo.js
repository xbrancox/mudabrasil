/* ============================================================
   VOTABRASIL — ENRIQUECIMENTO DE FOTOS (paralelo, Wikimedia)
   ------------------------------------------------------------
   Busca fotos oficiais via Wikimedia Commons para candidatos
   de cargos principais (Presidente, Governador, Senador, Dep.
   Federal, Dep. Estadual). Usa requisições concorrentes com
   pool limitado para não sobrecarregar a API.

   Uso:  node scripts/enriquecer-fotos-paralelo.js
   Saída: atualiza data/candidatos-2026.json (backup em
          data/candidatos-2026.json.bak)
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INPUT = path.join(ROOT, 'data', 'candidatos-2026.json');
const OUTPUT = path.join(ROOT, 'data', 'candidatos-2026.json');
const BACKUP = path.join(ROOT, 'data', 'candidatos-2026.json.bak');

const CARGOS_FOTO = new Set(['1', '3', '5', '6', '7']); // Presidente, Governador, Senador, DepFed, DepEst
const CONCURRENCY = 12; // requisições em paralelo
const DELAY_MS = 200;   // respeitoso com a API do Wikidata
const UA = 'VotaBrasil/1.0 (plataforma civica de transparencia; dados abertos)';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (res.ok) return await res.json();
      if (res.status === 429) { await sleep(2000 * (i + 1)); continue; }
      return null;
    } catch (e) {
      if (i < retries) await sleep(1000 * (i + 1));
      else return null;
    }
  }
  return null;
}

async function buscarFotoWikidata(nomeUrna, nomeCivil) {
  const nome = (nomeUrna || nomeCivil || '').trim();
  if (!nome) return '';

  // Busca com as 3 primeiras palavras
  const busca = nome.split(/\s+/).slice(0, 3).join(' ').trim();
  if (!busca) return '';

  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(busca)}&language=pt&format=json&type=item`;
  const json = await fetchJson(searchUrl);
  if (!json || !json.search || !json.search.length) return '';

  const qid = json.search[0].id;
  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const ent = await fetchJson(entityUrl);
  if (!ent || !ent.entities || !ent.entities[qid]) return '';
  const entity = ent.entities[qid];
  if (!entity.claims || !entity.claims.P18 || !entity.claims.P18.length) return '';

  const filename = entity.claims.P18[0].mainsnak && entity.claims.P18[0].mainsnak.datavalue
    ? entity.claims.P18[0].mainsnak.datavalue.value
    : '';
  if (!filename) return '';

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=200`;
}

async function main() {
  console.log('[enriquecer-paralelo] Carregando candidatos…');
  const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  console.log(`[enriquecer-paralelo] ${data.candidatos.length} candidatos carregados.`);

  // Faz backup
  fs.writeFileSync(BACKUP, JSON.stringify(data));

  // Candidatos de cargo principal sem foto
  const alvo = data.candidatos.filter(c =>
    CARGOS_FOTO.has(String(c.cargo)) && (!c.foto || c.foto === '')
  );
  console.log(`[enriquecer-paralelo] ${alvo.length} candidatos sem foto para buscar.`);

  let processados = 0, encontradas = 0, falhas = 0;
  const cache = {};
  const inicio = Date.now();

  // Processa em lotes concorrentes
  for (let i = 0; i < alvo.length; i += CONCURRENCY) {
    const lote = alvo.slice(i, i + CONCURRENCY);
    await Promise.all(lote.map(async (c) => {
      try {
        processados++;
        const foto = await buscarFotoWikidata(c.nomeUrna, c.nomeCivil);
        if (foto) {
          c.foto = foto;
          encontradas++;
        } else {
          falhas++;
        }
        // Atualiza o objeto original no array de candidatos
        const idx = data.candidatos.findIndex(x => x.sq === c.sq);
        if (idx >= 0) data.candidatos[idx].foto = c.foto;
      } catch (e) {
        falhas++;
      }
    }));

    // Pequena pausa entre lotes para respeitar rate limits
    await sleep(DELAY_MS);

    if (processados % 500 === 0 || processados === alvo.length) {
      const elapsed = Math.round((Date.now() - inicio) / 1000);
      console.log(`[enriquecer-paralelo] ${processados}/${alvo.length} (${encontradas} fotos, ${falhas} falhas, ${elapsed}s)`);
    }
  }

  data.enriquecidoEm = new Date().toISOString();
  data.totalFotos = data.candidatos.filter(c => c.foto).length;

  fs.writeFileSync(OUTPUT, JSON.stringify(data));
  console.log(`[enriquecer-paralelo] ✅ Concluído! ${data.totalFotos} fotos no total.`);
}

main().catch(e => { console.error('[enriquecer-paralelo] Erro:', e); process.exit(1); });