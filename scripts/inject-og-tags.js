#!/usr/bin/env node
/**
 * Ciclo 31 — Injeta Open Graph meta tags estáticas em todas as páginas principais.
 *
 * Estratégia:
 * - Lê cada página HTML
 * - Procura <head> (primeira ocorrência)
 * - Se <!-- og:meuvoto --> já existe, pula (idempotente)
 * - Insere bloco <!-- og:meuvoto --> ... <!-- /og:meuvoto --> com as tags específicas da página
 * - Salva de volta
 *
 * Tags injetadas: og:type, og:site_name, og:title, og:description, og:image, og:url, twitter:card, twitter:title, twitter:description, twitter:image.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE_URL = 'https://meu-voto.app';
const OG_IMAGE = BASE_URL + '/og-image.png';
const SITE_NAME = 'MeuVoto / VotaBrasil';

const PAGES = {
  'index.html': {
    path: 'index.html',
    title: 'MeuVoto / VotaBrasil — transparência legislativa e cobrança cidadã',
    description: 'Acompanhe votações nominais, cobre promessas dos seus deputados e receba o resumo semanal. Dados oficiais da Câmara e Senado, sem valor legal.'
  },
  'pages/votacoes.html': {
    path: 'pages/votacoes.html',
    title: 'Votações do Plenário — MeuVoto',
    description: 'Votações nominais e simbólicas da Câmara com quórum, placar por UF, coerência de bancada e voto a voto. Filtros por deputado, tema e janela de tempo.'
  },
  'pages/parlamentares.html': {
    path: 'pages/parlamentares.html',
    title: 'Radar Político — MeuVoto',
    description: 'Ficha de cada parlamentar: presença, votações, promessas cobradas e dossiê cívico.'
  },
  'pages/congresso.html': {
    path: 'pages/congresso.html',
    title: 'PLs no Congresso — MeuVoto',
    description: 'Projetos de lei em tramitação, com acompanhamento cidadão e votos da comunidade.'
  },
  'pages/digest.html': {
    path: 'pages/digest.html',
    title: 'Digest semanal — MeuVoto',
    description: 'Assine o resumo semanal por e-mail. Filtre pelos seus temas: educação, saúde, economia, segurança, meio ambiente e mais.'
  },
  'pages/digest-admin.html': {
    path: 'pages/digest-admin.html',
    title: 'Admin do digest — MeuVoto',
    description: 'Painel protegido: inscritos, respostas, taxa de abertura, disparo manual.'
  },
  'pages/digest-archive.html': {
    path: 'pages/digest-archive.html',
    title: 'Arquivo de digests — MeuVoto',
    description: 'Todos os resumos semanais já enviados, em texto, para qualquer visitante ler.'
  },
  'pages/digest-metrics.html': {
    path: 'pages/digest-metrics.html',
    title: 'Métricas do digest — MeuVoto',
    description: 'Inscritos confirmados × pendentes e uptime do digest em gráficos SVG puros.'
  },
  'pages/digest-confirm.html': {
    path: 'pages/digest-confirm.html',
    title: 'Confirmação de inscrição — MeuVoto',
    description: 'Confirme seu e-mail para ativar o recebimento do resumo semanal.'
  },
  'pages/cobrancas-ranking.html': {
    path: 'pages/cobrancas-ranking.html',
    title: 'Selos de responsividade — MeuVoto',
    description: 'Ranking público de gabinetes que respondem às cobranças: ouro, prata, bronze.'
  },
  'pages/cobranca.html': {
    path: 'pages/cobranca.html',
    title: 'Cobrança cívica pública — MeuVoto',
    description: 'Cobrança registrada e rastreável com token público.'
  },
  'pages/cobranca-responder.html': {
    path: 'pages/cobranca-responder.html',
    title: 'Responder cobrança — MeuVoto',
    description: 'Formulário oficial do gabinete para responder à cobrança via token.'
  },
  'pages/mandato-responsavel.html': {
    path: 'pages/mandato-responsavel.html',
    title: 'Mandato responsável — educação cívica — MeuVoto',
    description: 'Como funcionam as regras atuais de cassação e caminhos legítimos de mobilização cidadã. Disclaimer: revogação popular direta não existe no ordenamento brasileiro para deputado federal.'
  },
  'pages/metodologia.html': {
    path: 'pages/metodologia.html',
    title: 'Metodologia — MeuVoto',
    description: 'Fórmulas, fontes oficiais, limitações e política de privacidade do projeto. Transparência total.'
  },
  'pages/api-publica.html': {
    path: 'pages/api-publica.html',
    title: 'API pública para jornalistas e devs — MeuVoto',
    description: 'Documentação dos endpoints abertos com teste ao vivo e cópia de URL.'
  },
  'pages/status.html': {
    path: 'pages/status.html',
    title: 'Status do sistema — MeuVoto',
    description: 'Dashboard ao vivo dos 4 serviços: backend Railway, Câmara, Senado e GitHub Pages.'
  },
  'pages/stats.html': {
    path: 'pages/stats.html',
    title: 'Estatísticas públicas — MeuVoto',
    description: 'Métricas agregadas do projeto: votos registrados, parlamentares monitorados, inscritos, uptime.'
  },
  'pages/links.html': {
    path: 'pages/links.html',
    title: 'Hub de páginas — MeuVoto',
    description: 'Todas as páginas do projeto em um só lugar: votações, digest, cobranças, metodologia, status e mais.'
  },
  'pages/comunidade.html': {
    path: 'pages/comunidade.html',
    title: 'Comunidade — MeuVoto',
    description: 'Reclamações, apoios e vozes cidadãs registradas publicamente.'
  },
  'pages/revogar.html': {
    path: 'pages/revogar.html',
    title: 'Revogar voto — MeuVoto',
    description: 'Recolha seu voto registrado — mecanismo conceitual de retratação cívica.'
  },
  'pages/termometro.html': {
    path: 'pages/termometro.html',
    title: 'Termômetro Cívico — MeuVoto',
    description: 'Índice agregado de confiança dos eleitores em cada parlamentar e UF.'
  },
  'pages/fundo-eleitoral.html': {
    path: 'pages/fundo-eleitoral.html',
    title: 'Fundo Eleitoral — MeuVoto',
    description: 'Visualização compacta: donut, barras e custo por cadeira.'
  },
  'pages/eleicoes-2026.html': {
    path: 'pages/eleicoes-2026.html',
    title: 'Eleições 2026 — MeuVoto',
    description: 'Mapa de candidaturas, partidos e cenários para as próximas eleições gerais.'
  },
  'privacidade.html': {
    path: 'privacidade.html',
    title: 'Política de privacidade — MeuVoto',
    description: 'LGPD, retenção de dados, direitos e descadastro.'
  },
  'termos.html': {
    path: 'termos.html',
    title: 'Termos de uso — MeuVoto',
    description: 'Condições de uso da plataforma.'
  }
};

const MARKER_OPEN = '<!-- og:meuvoto -->';
const MARKER_CLOSE = '<!-- /og:meuvoto -->';

function buildOGBlock(pageKey, meta) {
  const url = BASE_URL + '/' + (meta.path === 'index.html' ? '' : meta.path);
  const safeTitle = meta.title.replace(/"/g, '&quot;');
  const safeDesc = meta.description.replace(/"/g, '&quot;');
  return (
    MARKER_OPEN + '\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="' + SITE_NAME + '">\n' +
    '<meta property="og:title" content="' + safeTitle + '">\n' +
    '<meta property="og:description" content="' + safeDesc + '">\n' +
    '<meta property="og:image" content="' + OG_IMAGE + '">\n' +
    '<meta property="og:url" content="' + url + '">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + safeTitle + '">\n' +
    '<meta name="twitter:description" content="' + safeDesc + '">\n' +
    '<meta name="twitter:image" content="' + OG_IMAGE + '">\n' +
    MARKER_CLOSE
  );
}

let patched = 0;
let skipped = 0;
let notFound = 0;
const results = [];

for (const [key, meta] of Object.entries(PAGES)) {
  const file = path.join(ROOT, meta.path);
  if (!fs.existsSync(file)) {
    notFound++;
    results.push({ key, status: 'NOT_FOUND' });
    continue;
  }
  let src = fs.readFileSync(file, 'utf8');
  if (src.indexOf(MARKER_OPEN) !== -1) {
    skipped++;
    results.push({ key, status: 'SKIPPED' });
    continue;
  }
  const headIdx = src.search(/<head[^>]*>/i);
  if (headIdx < 0) {
    results.push({ key, status: 'NO_HEAD' });
    continue;
  }
  const headEnd = src.indexOf('>', headIdx) + 1;
  const before = src.slice(0, headEnd);
  const after = src.slice(headEnd);
  src = before + '\n' + buildOGBlock(key, meta) + after;
  fs.writeFileSync(file, src, 'utf8');
  patched++;
  results.push({ key, status: 'PATCHED' });
}

console.log('=== Injeção de Open Graph tags ===');
console.log('Páginas processadas: ' + Object.keys(PAGES).length);
console.log('  Patched: ' + patched);
console.log('  Skipped (já existiam): ' + skipped);
console.log('  Not found: ' + notFound);
console.log('\nDetalhe:');
results.forEach(r => console.log('  ' + r.key.padEnd(40) + ' ' + r.status));
process.exit(patched >= 0 ? 0 : 1);
