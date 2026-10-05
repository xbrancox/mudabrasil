#!/usr/bin/env node
/**
 * Script para adicionar meta descriptions e viewports nas páginas que estão faltando
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');

// Descriptions para cada página
const descriptions = {
  'api-publica.html': 'API pública do MeuVoto: endpoints abertos para jornalistas e desenvolvedores acessarem dados de votações, parlamentares e transparência legislativa.',
  'changelog.html': 'Novidades e atualizações do MeuVoto: veja o histórico de melhorias, novas funcionalidades e correções aplicadas na plataforma.',
  'cobranca-responder.html': 'Responda às cobranças dos cidadãos: parlamentares podem esclarecer suas posições e ações diretamente na plataforma MeuVoto.',
  'cobranca.html': 'Cobre promessas dos seus representantes: envie cobranças diretas aos deputados e senadores e acompanhe as respostas na plataforma MeuVoto.',
  'cobrancas-ranking.html': 'Ranking de cobranças: veja quais políticos mais recebem cobranças dos cidadãos e como eles respondem na plataforma MeuVoto.',
  'digest-admin.html': 'Painel administrativo do resumo semanal do MeuVoto: gerencie edições, métricas e envios do digest para os assinantes.',
  'digest-confirm.html': 'Confirmação de assinatura do resumo semanal do MeuVoto: receba as principais votações e notícias do Congresso toda semana.',
  'digest-metrics.html': 'Métricas do resumo semanal do MeuVoto: acompanhe taxa de abertura, cliques e engajamento dos assinantes do digest.',
  'digest.html': 'Resumo semanal do MeuVoto: receba as principais votações do Congresso, análise de projetos e notícias políticas toda semana no seu email.',
  'links.html': 'Hub de links do MeuVoto: acesse todas as ferramentas, páginas e recursos da plataforma de transparência legislativa em um só lugar.',
  'mandato-responsavel.html': 'Guia do mandato responsável: saiba como deputados e senadores podem usar a plataforma MeuVoto para prestar contas aos eleitores.',
  'metodologia.html': 'Metodologia do MeuVoto: entenda como calculamos o termômetro de confiança, analisamos votações e avaliamos o desempenho dos parlamentares.',
  'roadmap.html': 'Roadmap do MeuVoto: conheça as próximas funcionalidades planejadas para a plataforma de transparência legislativa e participação cidadã.',
  'selos.html': 'Selos de verificação do MeuVoto: entenda como funciona o sistema de autenticação de políticos e instituições na plataforma.',
  'stats.html': 'Estatísticas do MeuVoto: acompanhe números de usuários, votações analisadas, cobranças enviadas e o impacto da plataforma na transparência legislativa.'
};

let updated = 0;

Object.keys(descriptions).forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Arquivo não encontrado:', file);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const desc = descriptions[file];
  
  // Verifica se já tem description
  if (content.includes('name="description"')) {
    console.log('✅', file, '- já tem description');
    return;
  }
  
  // Adiciona viewport se não tiver
  if (!content.includes('name="viewport"')) {
    const viewportTag = '  <meta name="viewport" content="width=device-width,initial-scale=1"/>\n';
    content = content.replace(/<meta charset="UTF-8"(?:\/)?>\s*\n/i, '<meta charset="UTF-8"/>\n' + viewportTag);
    console.log('  ➕ Adicionado viewport em', file);
  }
  
  // Adiciona description
  const descTag = '  <meta name="description" content="' + desc + '">\n';
  const titleMatch = content.match(/<title>[^<]+<\/title>/);
  if (titleMatch) {
    content = content.replace(titleMatch[0], titleMatch[0] + '\n' + descTag);
    console.log('  ➕ Adicionado description em', file);
    updated++;
  } else {
    console.log('⚠️  Não encontrei <title> em', file);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('\n✅', updated, 'páginas atualizadas com sucesso!');
