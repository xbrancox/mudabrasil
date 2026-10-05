#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const pagesDir = path.join(__dirname, '..', 'pages');

const fixes = {
  'meu-voto.html': [{from: 'h2', to: 'h4'}],
  'parlamentares.html': [{from: 'h2', to: 'h4'}],
  'votacoes.html': [{from: 'h1', to: 'h3'}, {from: 'h2', to: 'h4'}]
};

let totalFixed = 0;

Object.keys(fixes).forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  fixes[file].forEach(fix => {
    if (fix.from === 'h1' && fix.to === 'h3') {
      const h1Matches = [...content.matchAll(/<h1[^>]*>.*?<\/h1>/g)];
      if (h1Matches.length > 0) {
        const lastH1 = h1Matches[h1Matches.length - 1];
        const afterH1 = content.substring(lastH1.index + lastH1[0].length);
        const h3Matches = afterH1.match(/<h3[^>]*>.*?<\/h3>/g);
        if (h3Matches && h3Matches.length > 0) {
          const firstH3 = h3Matches[0];
          const h2Version = firstH3.replace(/<h3/g, '<h2').replace(/<\/h3>/g, '</h2>');
          content = content.replace(firstH3, h2Version);
          modified = true;
          totalFixed++;
          console.log('  ➕ h1→h3 corrigido em', file);
        }
      }
    }
    
    if (fix.from === 'h2' && fix.to === 'h4') {
      const h2Matches = [...content.matchAll(/<h2[^>]*>.*?<\/h2>/g)];
      if (h2Matches.length > 0) {
        const lastH2 = h2Matches[h2Matches.length - 1];
        const afterH2 = content.substring(lastH2.index + lastH2[0].length);
        const h4Matches = afterH2.match(/<h4[^>]*>.*?<\/h4>/g);
        if (h4Matches && h4Matches.length > 0) {
          const firstH4 = h4Matches[0];
          const h3Version = firstH4.replace(/<h4/g, '<h3').replace(/<\/h4>/g, '</h3>');
          content = content.replace(firstH4, h3Version);
          modified = true;
          totalFixed++;
          console.log('  ➕ h2→h4 corrigido em', file);
        }
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('\n✅ Total de headings corrigidos:', totalFixed);
