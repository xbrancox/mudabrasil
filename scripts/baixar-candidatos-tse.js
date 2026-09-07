/* ============================================================
   MUDABRASIL — INGEST DE CANDIDATOS 2026 (TSE via espelho)
   ------------------------------------------------------------
   Usa o espelho comunitário leofn/tse-candidatos-2026 que baixa
   os CSVs OFICIAIS do CDN do TSE todos os dias às 06:00 UTC.
   Saída: data/candidatos-2026.json (snapshot commitado).
   Uso:  node scripts/baixar-candidatos-tse.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const MIRROR = process.env.MIRROR_BASE ||
  'https://raw.githubusercontent.com/leofn/tse-candidatos-2026/main/dados';
const OUT = path.join(__dirname, '..', 'data', 'candidatos-2026.json');
const MIN = 15000;

const CARGO_COD = {
  'PRESIDENTE': 1, 'VICE-PRESIDENTE': 2, 'GOVERNADOR': 3, 'VICE-GOVERNADOR': 4,
  'SENADOR': 5, 'DEPUTADO FEDERAL': 6, 'DEPUTADO ESTADUAL': 7, 'DEPUTADO DISTRITAL': 8
};

async function baixar(url, local) {
  if (local && fs.existsSync(local)) return fs.readFileSync(local);
  const r = await fetch(url, { signal: AbortSignal.timeout(300000) });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + url);
  return Buffer.from(await r.arrayBuffer());
}

function parseCsv(buf) {
  const txt = buf.toString('latin1');
  const rows = [];
  let row = [], cell = '', inQ = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (inQ) {
      if (ch === '"') { if (txt[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ';') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows[0];
  return rows.slice(1).map(r => {
    const o = {};
    head.forEach((h, i) => { o[h] = r[i] !== undefined ? r[i] : ''; });
    return o;
  });
}

async function main() {
  const [candBuf, compBuf] = await Promise.all([
    baixar(MIRROR + '/consulta_cand_2026_BRASIL.csv', process.env.CAND_CSV),
    baixar(MIRROR + '/consulta_cand_complementar_2026_BRASIL.csv', process.env.COMP_CSV)
  ]);

  const sitPorSq = new Map();
  for (const c of parseCsv(compBuf)) {
    if (c.SQ_CANDIDATO) sitPorSq.set(c.SQ_CANDIDATO, (c.DS_SITUACAO_JULGAMENTO || '').trim());
  }

  const candidatos = [];
  for (const c of parseCsv(candBuf)) {
    const cargo = CARGO_COD[(c.DS_CARGO || '').trim().toUpperCase()];
    if (!cargo) continue;
    candidatos.push({
      nomeUrna: (c.NM_URNA_CANDIDATO || '').trim(),
      nomeCivil: (c.NM_CANDIDATO || '').trim(),
      numero: String(c.NR_CANDIDATO || '').trim(),
      partido: (c.SG_PARTIDO || '').trim(),
      coligacao: (c.NM_COLIGACAO || '').trim(),
      cargo,
      uf: (c.SG_UF || '').trim(),
      situacao: sitPorSq.get(c.SQ_CANDIDATO) || 'AGUARDANDO JULGAMENTO'
    });
  }
  candidatos.sort((a, b) => a.uf.localeCompare(b.uf) || (a.cargo - b.cargo) || a.nomeUrna.localeCompare(b.nomeUrna));

  if (candidatos.length < MIN) {
    console.error('[tse] ABORTANDO: ' + candidatos.length + ' < ' + MIN);
    process.exit(1);
  }

  fs.writeFileSync(OUT, JSON.stringify({
    mode: 'real',
    fonte: 'TSE · Eleição Geral Federal 2026',
    extraidoEm: new Date().toISOString(),
    total: candidatos.length,
    candidatos
  }));
  console.log('[tse] OK — ' + candidatos.length + ' candidatos gravados');
}

main().catch(e => { console.error('FALHA GERAL:', e); process.exit(1); });
