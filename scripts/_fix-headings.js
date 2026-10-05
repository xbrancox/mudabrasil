#!/usr/bin/env node
/**
 * Script para corrigir hierarquia de headings
 * Adiciona h2 intermediários onde há saltos de h1 para h3
 */

const fs = require('fs');
const path = require('path');
const pagesDir = path.join(__dirname, '..', 'pages');

// Mapeamento de arquivos e seus saltos
const fixes = {
  'api-publica.html': [{from: 'h1', to: 'h3'}],
  'cedula-votabrasil.html': [{from: 'h1', to: 'h3'}],
  'comunidade.html': [{from: 'h1', to: 'h3'}, {from: 'h2', to: 'h4'}],
  'congresso.html': [{from: 'h1', to: 'h3'}],
  'digest-admin.html': [{from: 'h1', to: 'h3'}],
  'digest-metrics.html': [{from: 'h1', to: 'h3'}],
  'digest.html': [{from: 'h1', to: 'h3'}],
  'eleicoes-2026.html': [{from: 'h1', to: 'h3'}],
  'fundo-eleitoral.html': [{from: 'h1', to: 'h3'}],
  'iniciativa-cidada.html': [{from: 'h3', to: 'h5'}],
  'mandato-responsavel.html': [{from: 'h1', to: 'h3'}],
  'meu-voto.html': [{from: 'h1', to: 'h3'}, {from: 'h2', to: 'h4'}],
  'parlamentares.html': [{from: 'h1', to: 'h3'}, {from: 'h2', to: 'h4'}],
  'proposta.html': [{from: 'h2', to: 'h4'}],
  'stats.html': [{from: 'h1', to: 'h3'}],
  'status.html': [{from: 'h1', to: 'h3'}],
  'votacoes.html': [{from: 'h1', to: 'h3'}, {from: 'h1', to: 'h3'}, {from: 'h2', to: 'h4'}]
};

let totalFixed = 0;

Object.keys(fixes).forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  Arquivo não encontrado:', file);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  fixes[file].forEach(fix => {
    // Estratégia: converter h3 para h2 onde há salto de h1 para h3
    if (fix.from === 'h1' && fix.to === 'h3') {
      // Converte o primeiro h3 após h1 para h2
      const h1Match = content.match(/<h1[^>]*>.*?<\/h1>/);
      if (h1Match) {
        const afterH1 = content.substring(content.indexOf(h1Match[0]) + h1Match[0].length);
        const h3Match = afterH1.match(/<h3[^>]*>/);
        if (h3Match) {
          const fullH3 = afterH1.match(/<h3[^>]*>.*?<\/h3>/);
          if (fullH3) {
            const h2Version = fullH3[0].replace(/<h3/g, '<h2').replace(/<\/h3>/g, '</h2>');
            content = content.replace(fullH3[0], h2Version);
            modified = true;
            totalFixed++;
            console.log('  ➕ h1→h3 corrigido em', file);
          }
        }
      }
    }
    
    // Converte h4 para h3 onde há salto de h2 para h4
    if (fix.from === 'h2' && fix.to === 'h4') {
      const h4Regex = /<h4[^>]*>.*?<\/h4>/g;
      const matches = content.match(h4Regex);
      if (matches && matches.length > 0) {
        const firstH4 = matches[0];
        const h3Version = firstH4.replace(/<h4/g, '<h3').replace(/<\/h4>/g, '</h3>');
        content = content.replace(firstH4, h3Version);
        modified = true;
        totalFixed++;
        console.log('  ➕ h2→h4 corrigido em', file);
      }
    }
    
    // Converte h5 para h4 onde há salto de h3 para h5
    if (fix.from === 'h3' && fix.to === 'h5') {
      const h5Regex = /<h5[^>]*>.*?<\/h5>/g;
      const matches = content.match(h5Regex);
      if (matches && matches.length > 0) {
        const firstH5 = matches[0];
        const h4Version = firstH5.replace(/<h5/g, '<h4').replace(/<\/h5>/g, '</h4>');
        content = content.replace(firstH5, h4Version);
        modified = true;
        totalFixed++;
        console.log('  ➕ h3→h5 corrigido em', file);
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('\n✅ Total de headings corrigidos:', totalFixed);
