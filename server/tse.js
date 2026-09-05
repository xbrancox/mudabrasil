/* ============================================================
   MUDABRASIL — Módulo TSE (candidatos de eleições)
   ------------------------------------------------------------
   Fonte oficial: DivulgaCandContas (TSE) + Dados Abertos TSE.

   Estratégia:
     • Cache local JSON (tse-2026.json) com TTL de 24h.
     • Ingestão vem de um endpoint HTTP do backend (pode ser
       CSV zipado do Dados Abertos ou JSON do DivulgaCand).
     • Se a ingestão falhar, a rota cai no modo "amostra" e
       retorna um conjunto pequeno de dados sintéticos para
       que a página não quebre.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const CACHE_FILE = path.join(DATA_DIR, 'tse-2026.json');
const TTL_MS = 24 * 3600 * 1000;

const CARGOS = {
  1: 'Presidente',
  2: 'Vice-Presidente',
  3: 'Governador',
  4: 'Vice-Governador',
  5: 'Senador',
  6: 'Deputado Federal',
  7: 'Deputado Estadual',
  8: 'Deputado Distrital',
  9: 'Prefeito',
  10: 'Vice-Prefeito',
  11: 'Vereador'
};

/* ===== Cache de incumbentes (deputados/senadores em mandato) ===== */
let INCUMBENTS = [];
function setIncumbents(list) { INCUMBENTS = Array.isArray(list) ? list : []; }
function getIncumbents() { return INCUMBENTS; }

function ensureDir(){ try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_){} }

function readCache(){
  try{
    if(!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const obj = JSON.parse(raw);
    if(obj.ts && (Date.now() - obj.ts) > TTL_MS) return null;
    return obj;
  }catch(_){ return null; }
}

function writeCache(candidatos){
  ensureDir();
  try{
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ ts: Date.now(), candidatos }, null, 0));
  }catch(e){
    console.warn('[tse] falha ao gravar cache:', e.message);
  }
}

/* ---------- Amostra (fallback quando ingestão falha) ---------- */
/* Estes dados são EXEMPLOS para manter a página viva.
   Substitua ativando a ingestão real (ver bloco TODO abaixo). */
function amostra(){
  const base = [
    { nomeUrna: 'Candidato Exemplo A', nomeCivil: 'Exemplo Alfabético A', numero: '13', partido: 'PT', coligacao: 'Brasil Forte', cargo: 1, uf: 'BR', situacao: 'DEFERIDO', bensTotal: 0, bens: [], tseUrl: 'https://divulgacandcontas.tse.jus.br/divulga/app/' },
    { nomeUrna: 'Candidato Exemplo B', nomeCivil: 'Exemplo Alfabético B', numero: '22', partido: 'PL', coligacao: 'União Pelo Brasil', cargo: 1, uf: 'BR', situacao: 'DEFERIDO', bensTotal: 0, bens: [], tseUrl: 'https://divulgacandcontas.tse.jus.br/divulga/app/' },
    { nomeUrna: 'Candidato Exemplo C', nomeCivil: 'Exemplo Alfabético C', numero: '15', partido: 'MDB', coligacao: 'Movimento Cidadão', cargo: 3, uf: 'SP', situacao: 'DEFERIDO', bensTotal: 1250000, bens: [{descricao:'Apartamento em SP',valor:850000},{descricao:'Veículo',valor:400000}], tseUrl: 'https://divulgacandcontas.tse.jus.br/divulga/app/' },
    { nomeUrna: 'Candidato Exemplo D', nomeCivil: 'Exemplo Alfabético D', numero: '30', partido: 'NOVO', coligacao: '', cargo: 6, uf: 'MG', situacao: 'DEFERIDO', bensTotal: 235000, bens: [], tseUrl: 'https://divulgacandcontas.tse.jus.br/divulga/app/' },
    { nomeUrna: 'Candidato Exemplo E', nomeCivil: 'Exemplo Alfabético E', numero: '12', partido: 'PDT', coligacao: '', cargo: 5, uf: 'RS', situacao: 'PENDENTE', bensTotal: 480000, bens: [], tseUrl: 'https://divulgacandcontas.tse.jus.br/divulga/app/' },
    { nomeUrna: 'Candidato Exemplo F', nomeCivil: 'Exemplo Alfabético F', numero: '55', partido: 'PSD', coligacao: 'Renovação', cargo: 3, uf: 'RJ', situacao: 'DEFERIDO', bensTotal: 9200000, bens: [{descricao:'Participação societária',valor:7500000},{descricao:'Imóvel comercial',valor:1700000}], tseUrl: 'https://divulgacandcontas.tse.jus.br/divulga/app/' },
    { nomeUrna: 'Candidato Exemplo G', nomeCivil: 'Exemplo Alfabético G', numero: '45', partido: 'PSDB', coligacao: '', cargo: 6, uf: 'BA', situacao: 'INAPTO', bensTotal: 150000, bens: [], tseUrl: 'https://divulgacandcontas.tse.jus.br/divulga/app/' },
    { nomeUrna: 'Candidato Exemplo H', nomeCivil: 'Exemplo Alfabético H', numero: '40', partido: 'PSB', coligacao: 'Frente Cidadã', cargo: 3, uf: 'CE', situacao: 'DEFERIDO', bensTotal: 680000, bens: [], tseUrl: 'https://divulgacandcontas.tse.jus.br/divulga/app/' }
  ];
  return {
    mode: 'amostra',
    aviso: 'O TSE bloqueia scraping automatizado. A ingestão real está sendo preparada (CSV de dadosabertos.tse.jus.br). Mostrando amostra de formato para demonstrar a interface.',
    candidatos: base
  };
}

/* ---------- Ingestão real (TODO: ativar quando CSV estiver pronto) ---------- */
/*
async function ingestReal(){
  // Endpoint esperado (ajustar URL conforme catálogo Dados Abertos TSE):
  // https://dadosabertos.tse.jus.br/dataset/consulta-cand-2026/resource/<id>
  // O arquivo é um ZIP com CSVs por UF. O parser deve:
  //   1) baixar o ZIP;
  //   2) extrair cada CSV;
  //   3) mapear colunas: NR_CANDIDATO, NM_URNA, NM_PARTIDO, SG_UF,
  //      DS_CARGO, DS_SIT_TOT_TURNO, VR_BEM_CANDIDATO (agrupar por candidato).
  //   4) gravar no cache via writeCache(candidatos).
  //
  // Ative este fluxo substituindo a chamada em `getCandidatos` de:
  //   return amostra();
  // para:
  //   const real = await ingestReal();
  //   if(real.candidatos.length) return real;
  //   return amostra();
}
*/

function getCandidatos(){
  const cached = readCache();
  if(cached && cached.candidatos && cached.candidatos.length){
    return { mode: 'real', aviso: null, candidatos: cached.candidatos };
  }
  // Fallback: incumbentes (deputados/senadores em mandato) rotulados como "MANDATO ATIVO"
  const inc = getIncumbents();
  if(inc && inc.length){
    const candidatos = inc.map(d => ({
      nomeUrna: d.name || d.nome || '',
      nomeCivil: d.name || d.nome || '',
      numero: d.number || String(d.id || '').replace(/\D/g,'') || '',
      partido: d.party || d.partido || '',
      coligacao: '',
      cargo: (d.position === 'Senador Federal' || /senador/i.test(d.position || '')) ? 5 : 6,
      uf: d.state || d.uf || '',
      situacao: 'MANDATO ATIVO',
      bensTotal: 0,
      bens: [],
      tseUrl: 'https://divulgacandcontas.tse.jus.br/divulga/app/',
      foto: d.photo || d.urlFoto || '',
      fonte: 'incumbente'
    }));
    return {
      mode: 'incumbentes',
      aviso: 'Os dados oficiais de candidatura 2026 ainda não foram publicados pelo TSE. Mostrando parlamentares em mandato ativo (possíveis recandidaturas) como referência cívica.',
      candidatos
    };
  }
  return amostra();
}

function refresh(force){
  if(!force){
    const cached = readCache();
    if(cached && cached.candidatos && cached.candidatos.length) return;
  }
  // ingestReal(); // <- ativar quando parser CSV pronto
  return;
}

module.exports = {
  getCandidatos,
  refresh,
  CARGOS,
  setIncumbents,
  getIncumbents
};
