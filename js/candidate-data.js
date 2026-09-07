/* ============================================================
   MUDABRASIL - CAMADA DE DADOS DE CANDIDATOS
   ------------------------------------------------------------
   Este módulo modela a estrutura de dados de candidatos
   baseando-se em FONTES PÚBLICAS oficiais. Em produção, os
   campos são preenchidos dinamicamente via APIs oficiais.
   ============================================================ */

const CANDIDATES = [
  {
    id: 'cand-001',
    name: 'Ana Beatriz Souza',
    party: 'PT',
    partyName: 'Partido dos Trabalhadores',
    number: 13,
    age: 52,
    education: 'Doutorado em Direito Constitucional',
    state: 'SP',
    position: 'Deputada Federal',
    termCount: 3,
    votesLastElection: 854230,
    annualIncome: 1850000,
    assets: 2450000,
    billsAuthored: 47,
    billsApproved: 22,
    attendanceRate: 92,
    lawsuits: 3,
    lawsuitsStatus: { active: 1, closed: 2, conviction: 0 },
    reelected: true,
    transparencyScore: 87,
    focusArea: 'Segurança Pública',
    bio: 'Deputada federal com foco em segurança pública e combate à corrupção.',
    dataSources: ['TSE', 'Portal da Transparência', 'Câmara dos Deputados', 'CNJ']
  },
  {
    id: 'cand-002',
    name: 'Carlos Eduardo Lima',
    party: 'PL',
    partyName: 'Partido Liberal',
    number: 22,
    age: 48,
    education: 'Mestre em Economia',
    state: 'RJ',
    position: 'Deputado Federal',
    termCount: 2,
    votesLastElection: 621340,
    annualIncome: 1420000,
    assets: 3800000,
    billsAuthored: 31,
    billsApproved: 15,
    attendanceRate: 88,
    lawsuits: 2,
    lawsuitsStatus: { active: 0, closed: 2, conviction: 0 },
    reelected: true,
    transparencyScore: 79,
    focusArea: 'Economia e Finanças',
    bio: 'Deputado federal com atuação em políticas econômicas e tributárias.',
    dataSources: ['TSE', 'Portal da Transparência', 'Câmara dos Deputados', 'CNJ']
  },
  {
    id: 'cand-003',
    name: 'Mariana Oliveira',
    party: 'PSB',
    partyName: 'Partido Socialista Brasileiro',
    number: 40,
    age: 45,
    education: 'Doutora em Saúde Pública',
    state: 'MG',
    position: 'Deputada Federal',
    termCount: 1,
    votesLastElection: 312890,
    annualIncome: 980000,
    assets: 1250000,
    billsAuthored: 28,
    billsApproved: 19,
    attendanceRate: 95,
    lawsuits: 0,
    lawsuitsStatus: { active: 0, closed: 0, conviction: 0 },
    reelected: false,
    transparencyScore: 94,
    focusArea: 'Saúde',
    bio: 'Deputada federal com atuação em políticas de saúde pública.',
    dataSources: ['TSE', 'Portal da Transparência', 'Câmara dos Deputados', 'CNJ']
  }
];

function searchCandidates(query) {
  if (!query || query.trim() === '') return CANDIDATES;
  const q = query.toLowerCase().trim();
  return CANDIDATES.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.party.toLowerCase().includes(q) ||
    c.partyName.toLowerCase().includes(q) ||
    c.position.toLowerCase().includes(q) ||
    c.focusArea.toLowerCase().includes(q)
  );
}

function filterCandidates(list, filters) {
  if (!Array.isArray(list)) {
    filters = list;
    list = CANDIDATES;
  }
  filters = filters || {};
  let result = list;
  if (filters.state && filters.state !== 'all') result = result.filter(c => c.state === filters.state);
  if (filters.party && filters.party !== 'all') result = result.filter(c => c.party === filters.party);
  if (filters.position && filters.position !== 'all') result = result.filter(c => c.position === filters.position);
  return result;
}

function sortCandidates(candidates, field, order = 'desc') {
  const sorted = [...candidates].sort((a, b) => {
    const va = a[field], vb = b[field];
    if (typeof va === 'string') return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return order === 'asc' ? va - vb : vb - va;
  });
  return sorted;
}

function computeIntegrityScore(candidate) {
  const lawsuitPenalty = candidate.lawsuits * 4;
  const convictionPenalty = candidate.lawsuitsStatus.conviction * 10;
  const attendanceBonus = (candidate.attendanceRate - 80) * 0.5;
  let score = candidate.transparencyScore - lawsuitPenalty - convictionPenalty + attendanceBonus;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function getInitials(name) {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

window.CANDIDATE_DATA = {
  CANDIDATES, searchCandidates, filterCandidates, sortCandidates,
  computeIntegrityScore, formatBRL, formatNumber, getInitials
};
