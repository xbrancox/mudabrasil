/* ============================================================
   MUDABRASIL - CAMADA DE DADOS DE CANDIDATOS
   ------------------------------------------------------------
   Este módulo modela a estrutura de dados de candidatos
   baseando-se em FONTES PÚBLICAS oficiais. Cada candidato
   carrega dados que normalmente seriam obtidos de:

   1. TSE (Tribunal Superior Eleitoral)
      - Registro de candidatura, histórico eleitoral, condenações
      - Portal: https://www.tse.jus.br
      - Consulta: https://www.tse.jus.br/eleicoes/eleicoes-anteriores

   2. Portal da Transparência (Controladoria-Geral da União)
      - Rendimentos, patrimônio, declarações
      - Portal: https://portaldatransparencia.gov.br

   3. Portal da Câmara dos Deputados / Senado
      - Proposituras de autoria (PL, PEC, MPs), votação nominal
      - Portal: https://www.camara.leg.br / https://www.senado.leg.br

   4. CNJ (Conselho Nacional de Justiça)
      - Processos judiciais, status de ações
      - Consulta: https://www.cnj.jus.br

   5. Votação nominal (dados de votação em plenário)
      - Portal da Câmara - votação nominal

   AVISO: Os dados abaixo são ESTRUTURA/EXEMPLO sintéticos
   para demonstrar a arquitetura. Em produção, esses campos
   seriam preenchidos dinamicamente via APIs oficiais (ver
   README.md para endpoints). Nomes são fictícios.
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
    // Portal da Transparência (rendimento anual - R$)
    annualIncome: 1850000,
    // Patrimônio declarado (R$)
    assets: 2450000,
    // Proposituras autorais
    billsAuthored: 47,
    billsApproved: 22,
    // Presença em sessões (%)
    attendanceRate: 92,
    // Processos judiciais (CNJ)
    lawsuits: 3,
    lawsuitsStatus: { active: 1, closed: 2, conviction: 0 },
    // Histórico eleitoral (reordenações)
    reelected: true,
    // Índice de transparência próprio (0-100)
    transparencyScore: 87,
    // Área de atuação principal
    focusArea: 'Segurança Pública',
    bio: 'Deputada federal com foco em segurança pública e combate à corrupção. Autora de 47 proposições, 22 aprovadas.',
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
    bio: 'Deputada federal com atuação em políticas de saúde pública e bem-estar social.',
    dataSources: ['TSE', 'Portal da Transparência', 'Câmara dos Deputados', 'CNJ']
  },
  {
    id: 'cand-004',
    name: 'Ricardo Alves',
    party: 'UNIÃO',
    partyName: 'União Brasil',
    number: 44,
    age: 55,
    education: 'Engenheiro Civil',
    state: 'SP',
    position: 'Senador',
    termCount: 4,
    votesLastElection: 1204500,
    annualIncome: 2100000,
    assets: 5600000,
    billsAuthored: 63,
    billsApproved: 38,
    attendanceRate: 85,
    lawsuits: 7,
    lawsuitsStatus: { active: 3, closed: 3, conviction: 1 },
    reelected: true,
    transparencyScore: 58,
    focusArea: 'Infraestrutura',
    bio: 'Senador com atuação em infraestrutura e obras públicas. Possui histórico judicial relevante.',
    dataSources: ['TSE', 'Portal da Transparência', 'Senado Federal', 'CNJ']
  },
  {
    id: 'cand-005',
    name: 'Fernanda Costa',
    party: 'NOVO',
    partyName: 'Partido Novo',
    number: 50,
    age: 39,
    education: 'Mestre em Administração',
    state: 'DF',
    position: 'Deputada Federal',
    termCount: 1,
    votesLastElection: 198760,
    annualIncome: 875000,
    assets: 980000,
    billsAuthored: 15,
    billsApproved: 6,
    attendanceRate: 97,
    lawsuits: 0,
    lawsuitsStatus: { active: 0, closed: 0, conviction: 0 },
    reelected: false,
    transparencyScore: 96,
    focusArea: 'Educação',
    bio: 'Deputada federal com foco em políticas educacionais e inovação tecnológica.',
    dataSources: ['TSE', 'Portal da Transparência', 'Câmara dos Deputados', 'CNJ']
  },
  {
    id: 'cand-006',
    name: 'Paulo Henrique Santos',
    party: 'REPUBLICANOS',
    partyName: 'Partido Republicano Brasileiro',
    number: 21,
    age: 50,
    education: 'Bacharel em Direito',
    state: 'BA',
    position: 'Deputado Federal',
    termCount: 2,
    votesLastElection: 445210,
    annualIncome: 1290000,
    assets: 2100000,
    billsAuthored: 39,
    billsApproved: 14,
    attendanceRate: 81,
    lawsuits: 5,
    lawsuitsStatus: { active: 2, closed: 2, conviction: 1 },
    reelected: true,
    transparencyScore: 62,
    focusArea: 'Segurança Pública',
    bio: 'Deputado federal com atuação em segurança pública e ordenamento jurídico.',
    dataSources: ['TSE', 'Portal da Transparência', 'Câmara dos Deputados', 'CNJ']
  }
];

/* ------------------------------------------------------------
   HELPERS DE PESQUISA E FILTRO
   ------------------------------------------------------------ */

/**
 * Busca candidatos por nome, partido ou cargo
 * @param {string} query
 * @returns {Array}
 */
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

/**
 * Filtra candidatos por estado, partido ou cargo
 * @param {Array} [list] - lista base (padrão: todos os candidatos)
 * @param {Object} filters { state, party, position }
 * @returns {Array}
 */
function filterCandidates(list, filters) {
  if (!Array.isArray(list)) {
    // Compatibilidade: permite o uso antigo filterCandidates(filters)
    filters = list;
    list = CANDIDATES;
  }
  filters = filters || {};
  let result = list;
  if (filters.state && filters.state !== 'all') {
    result = result.filter(c => c.state === filters.state);
  }
  if (filters.party && filters.party !== 'all') {
    result = result.filter(c => c.party === filters.party);
  }
  if (filters.position && filters.position !== 'all') {
    result = result.filter(c => c.position === filters.position);
  }
  return result;
}

/**
 * Ordena candidatos por um campo específico
 * @param {Array} candidates
 * @param {string} field - ex: 'transparencyScore', 'annualIncome', 'votesLastElection'
 * @param {string} order - 'asc' | 'desc'
 * @returns {Array}
 */
function sortCandidates(candidates, field, order = 'desc') {
  const sorted = [...candidates].sort((a, b) => {
    const va = a[field];
    const vb = b[field];
    if (typeof va === 'string') {
      return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return order === 'asc' ? va - vb : vb - va;
  });
  return sorted;
}

/**
 * Calcula um índice de integridade composto (0-100)
 * baseado em transparência, processos judiciais e presença.
 * Quanto menor o número de processos e maior a transparência, melhor.
 * @param {Object} candidate
 * @returns {number}
 */
function computeIntegrityScore(candidate) {
  const lawsuitPenalty = candidate.lawsuits * 4;         // até ~28 pontos
  const convictionPenalty = candidate.lawsuitsStatus.conviction * 10;
  const attendanceBonus = (candidate.attendanceRate - 80) * 0.5; // bonus por presença
  let score = candidate.transparencyScore - lawsuitPenalty - convictionPenalty + attendanceBonus;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Formata valor monetário para BRL
 * @param {number} value
 * @returns {string}
 */
function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formata número (com separador de milhar)
 * @param {number} value
 * @returns {string}
 */
function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Gera as iniciais do nome para o avatar
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Retorna lista única de estados presentes
 * @returns {string[]}
 */
function getUniqueStates() {
  return [...new Set(CANDIDATES.map(c => c.state))].sort();
}

/**
 * Retorna lista única de partidos presentes
 * @returns {Array<{code,name}>}
 */
function getUniqueParties() {
  const map = new Map();
  CANDIDATES.forEach(c => {
    if (!map.has(c.party)) map.set(c.party, { code: c.party, name: c.partyName });
  });
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Retorna lista única de cargos presentes
 * @returns {string[]}
 */
function getUniquePositions() {
  return [...new Set(CANDIDATES.map(c => c.position))].sort();
}

/* Expor no escopo global para uso nas páginas */
window.CANDIDATE_DATA = {
  CANDIDATES,
  searchCandidates,
  filterCandidates,
  sortCandidates,
  computeIntegrityScore,
  formatBRL,
  formatNumber,
  getInitials,
  getUniqueStates,
  getUniqueParties,
  getUniquePositions
};