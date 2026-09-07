/* ============================================================
   MUDABRASIL — INGEST DE CANDIDATOS 2026 (TSE via espelho)
   ------------------------------------------------------------
   O TSE bloqueia automação da nossa rede (403 Akamai em
   dadosabertos/cdn/divulgacand). Fonte usada: o espelho
   comunitário leofn/tse-candidatos-2026 — GitHub Actions do
   próprio repositório baixam os CSVs OFICIAIS do CDN do TSE
   todos os dias às 06:00 UTC e os versionam em texto puro:

     dados/consulta_cand_2026_BRASIL.csv
       (identidade, nº urna, partido, coligação, cargo, UF)
     dados/consulta_cand_complementar_2026_BRASIL.csv
       (DS_SITUACAO_JULGAMENTO — no CSV principal a coluna
        DS_SITUACAO_CANDIDATURA vem "#NE"; a situação REAL
        de julgamento fica no complementar, joined por
        SQ_CANDIDATO)

   Formato: CSV oficial TSE — separador ";", encoding latin-1.

   Saída: data/candidatos-2026.json (snapshot commitado —
   serve o backend no Railway via tse.js e a página estática
   como fallback anti-vazio).

   Uso:  node scripts/baixar-candidatos-tse.js
   Env:  MIRROR_BASE (padrão raw.githubusercontent do espelho)
         CAND_CSV / COMP_CSV (arquivos locais — testes)
   ============================================================ */

const fs = require('fs');
const path = require('path');

const MIRROR = process.env.MIRROR_BASE ||
  'https://raw.githubusercontent.com/leofn/tse-candidatos-2026/main/dados';
const OUT = path.join(__dirname, '..', 'data', 'candidatos-2026.json');
const MIN = 15000; // BRASIL inteiro tem ~20,5 mil linhas úteis

/* CD_CARGO oficiais da eleição geral (suplentes ficam de fora) */
const CARGO_COD = {
  'PRESIDENTE': 1, 'VICE-PRESIDENTE': 2, 'GOVERNADOR': 3, 'VICE-GOVERNADOR': 4,
  'SENADOR': 5, 'DEPUTADO FEDERAL': 6, 'DEPUTADO ESTADUAL': 7, 'DEPUTADO DISTRITAL': 8
};

async function baixar(url, local) {
  if (local && fs.existsSync(local)) {
    console.log('[tse] usando arquivo local:', local);
    return fs.readFileSync(local);
  }
  console.log('[tse] baixando:', url);
  const r = await fetch(url, { signal: AbortSignal.timeout(300000) });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' em ' + url);
  return Buffer.from(await r.arrayBuffer());
}

/* Parser CSV com suporte a aspas (campos TSE vêm entre aspas) */
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
  console.log('[tse] consulta_cand:', Math.round(candBuf.length / 1e6) + 'MB · complementar:', Math.round(compBuf.length / 1e6) + 'MB');

  /* Situação de julgamento por SQ_CANDIDATO */
  const sitPorSq = new Map();
  for (const c of parseCsv(compBuf)) {
    if (c.SQ_CANDIDATO) sitPorSq.set(c.SQ_CANDIDATO, (c.DS_SITUACAO_JULGAMENTO || '').trim());
  }
  console.log('[tse] situações de julgamento carregadas:', sitPorSq.size);

  const candidatos = [];
  for (const c of parseCsv(candBuf)) {
    const cargoNome = (c.DS_CARGO || '').trim().toUpperCase();
    const cargo = CARGO_COD[cargoNome];
    if (!cargo) continue; // fora: 1º/2º SUPLENTE e outros
    candidatos.push({
      nomeUrna: (c.NM_URNA_CANDIDATO || '').trim(),
      nomeCivil: (c.NM_CANDIDATO || '').trim(),
      numero: String(c.NR_CANDIDATO || '').trim(),
      partido: (c.SG_PARTIDO || '').trim(),
      coligacao: (c.NM_COLIGACAO || '').trim(),
      fed: (c.SG_FEDERACAO && c.SG_FEDERACAO !== '#NULO' ? c.SG_FEDERACAO.trim() : '') || undefined,
      cargo,
      uf: (c.SG_UF || '').trim(),
      situacao: sitPorSq.get(c.SQ_CANDIDATO) || 'AGUARDANDO JULGAMENTO',
      sq: c.SQ_CANDIDATO,
      foto: ''
    });
  }
  candidatos.sort((a, b) => a.uf.localeCompare(b.uf) || (a.cargo - b.cargo) || a.nomeUrna.localeCompare(b.nomeUrna));

  const resumo = {};
  for (const c of candidatos) {
    const k = (Object.keys(CARGO_COD).find(n => CARGO_COD[n] === c.cargo) || '?');
    resumo[k] = (resumo[k] || 0) + 1;
  }
  console.log('[tse] candidatos filtrados:', candidatos.length, JSON.stringify(resumo));

  if (candidatos.length < MIN) {
    console.error('[tse] ABORTANDO: ' + candidatos.length + ' < ' + MIN + ' — não sobrescrevo um snapshot bom');
    process.exit(1);
  }

  /* Compara só o CONTEÚDO (ignora extraidoEm — timestamp mudaria toda
     execução e geraria commit vazio todos os dias) */
  let igual = false;
  try {
    const atual = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    igual = !!atual && JSON.stringify(atual.candidatos) === JSON.stringify(candidatos);
  } catch (_) { }
  if (igual) {
    console.log('[tse] snapshot idêntico ao anterior — nada a gravar');
    return;
  }
  fs.writeFileSync(OUT, JSON.stringify({
    mode: 'real',
    fonte: 'TSE · Eleição Geral Federal 2026 (CSVs oficiais via espelho leofn/tse-candidatos-2026)',
    extraidoEm: new Date().toISOString(),
    total: candidatos.length,
    candidatos
  }));
  console.log('[tse] OK — data/candidatos-2026.json gravado (' + candidatos.length + ' candidatos)');
}

main().catch(e => { console.error('FALHA GERAL:', e); process.exit(1); });
