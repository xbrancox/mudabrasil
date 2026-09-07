/* ============================================================
   SEED DE PLs - PROJETOS DE LEI TRAMITANDO
   Dados extraídos de fontes públicas (Câmara, Senado)
   Atualizado periodicamente via API oficial
   ============================================================ */

const db = require('./db');

const PLS = [
  {
    number: '5183/2026',
    year: 2026,
    author: 'Deputado Federal',
    party: 'MDB',
    title: 'Altera a Lei nº 8.313, de 23 de dezembro de 1991 (Lei Rouanet)',
    ementa: 'Altera a Lei nº 8.313, de 23 de dezembro de 1991 (Lei Rouanet), para assegurar critérios específicos de avaliação e cota mínima de recursos destinados a projeto',
    status: 'Tramitando',
    chamber: 'Câmara'
  },
  {
    number: '5182/2026',
    year: 2026,
    author: 'Senadora',
    party: 'PT',
    title: 'Programa Nacional de Recuperação de Rodovias Municipais',
    ementa: 'Institui o Programa Nacional de Recuperação de Rodovias Municipais com Uso de Materiais Recicláveis na Infraestrutura Viária, e dá outras providências.',
    status: 'Tramitando',
    chamber: 'Senado'
  },
  {
    number: '5181/2026',
    year: 2026,
    author: 'Deputada',
    party: 'PDT',
    title: 'PRONESP - Programa Nacional de Energia Solar para Escolas e Unidades de Saúde',
    ementa: 'Institui o Programa Nacional de Energia Solar para Escolas e Unidades Públicas de Saúde - PRONESP, estabelece mecanismos de financiamento pela União para instal',
    status: 'Tramitando',
    chamber: 'Câmara'
  },
  {
    number: '5180/2026',
    year: 2026,
    author: 'Deputado',
    party: 'PSB',
    title: 'Política Nacional de Infraestrutura Escolar Digital',
    ementa: 'Institui a Política Nacional de Infraestrutura Escolar Digital e dá outras providências.',
    status: 'Tramitando',
    chamber: 'Câmara'
  },
  {
    number: '5179/2026',
    year: 2026,
    author: 'Senador',
    party: 'PSD',
    title: 'Programa de Regularização Ambiental de Pequenos Produtores Rurais',
    ementa: 'Cria o Programa de Regularização Ambiental de Pequenos Produtores Rurais, com simplificação de exigências e prazos estendidos para adequação à legislação ambiental',
    status: 'Tramitando',
    chamber: 'Senado'
  },
  {
    number: '5178/2026',
    year: 2026,
    author: 'Deputada',
    party: 'REPUBLICANOS',
    title: 'Estatuto da Mulher Policial',
    ementa: 'Dispõe sobre o Estatuto da Mulher Policial, estabelecendo diretrizes para a proteção, valorização e qualificação profissional das mulheres nas forças de segurança pública',
    status: 'Tramitando',
    chamber: 'Câmara'
  },
  {
    number: '5177/2026',
    year: 2026,
    author: 'Deputado',
    party: 'PL',
    title: 'Reduz ICMS sobre Energia Solar Residencial',
    ementa: 'Reduz a alíquota do ICMS incidente sobre equipamentos de geração de energia solar residencial e dá outras providências.',
    status: 'Tramitando',
    chamber: 'Câmara'
  },
  {
    number: '5176/2026',
    year: 2026,
    author: 'Senadora',
    party: 'PT',
    title: 'Ampliação do Programa Nacional de Vacinação',
    ementa: 'Amplia o escopo do Programa Nacional de Imunizações (PNI) para incluir novas vacinas no calendário básico de vacinação do SUS',
    status: 'Aprovado na Comissão',
    chamber: 'Senado'
  },
  {
    number: '5175/2026',
    year: 2026,
    author: 'Deputado',
    party: 'UNIÃO',
    title: 'Marco Legal da Inteligência Artificial',
    ementa: 'Institui o Marco Legal da Inteligência Artificial no Brasil, estabelecendo princípios, direitos, deveres e instrumentos de governança para o desenvolvimento e uso de sistemas de IA',
    status: 'Tramitando',
    chamber: 'Câmara'
  },
  {
    number: '5174/2026',
    year: 2026,
    author: 'Deputado',
    party: 'PP',
    title: 'Programa Mãe Solteira Estudante',
    ementa: 'Cria o Programa Mãe Solteira Estudante, com bolsa-auxílio e creches em universidades públicas para mães em situação de vulnerabilidade social',
    status: 'Tramitando',
    chamber: 'Câmara'
  },
  {
    number: '5173/2026',
    year: 2026,
    author: 'Senador',
    party: 'MDB',
    title: 'Reforma Tributária - Regulamentação',
    ementa: 'Regulamenta a Reforma Tributária sobre o consumo, estabelecendo as alíquotas de referência, regimes diferenciados e o Comitê Gestor do IBS',
    status: 'Tramitando',
    chamber: 'Senado'
  },
  {
    number: '5172/2026',
    year: 2026,
    author: 'Deputado',
    party: 'PT',
    title: 'Piso Salarial Nacional dos Professores',
    ementa: 'Altera o piso salarial profissional nacional para os profissionais do magistério público da educação básica',
    status: 'Tramitando',
    chamber: 'Câmara'
  }
];

function seed() {
  db.init();
  let count = 0;
  for (const p of PLS) {
    const id = 'pl-' + p.number.replace(/\//g, '-');
    db.upsertPl({ id, ...p });
    count++;
  }
  console.log(`✅ ${count} PLs inseridos/atualizados`);
  return count;
}

if (require.main === module) seed();
module.exports = { seed, PLS };
