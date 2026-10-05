#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pages', 'votacoes.html');
let content = fs.readFileSync(filePath, 'utf8');
let modified = false;

// Corrige todos os h3 que vêm depois de h1
let h1Count = (content.match(/<h1[^>]*>/g) || []).length;
let h3Count = (content.match(/<h3[^>]*>/g) || []).length;

console.log('h1 count:', h1Count);
console.log('h3 count:', h3Count);

// Estratégia: converter todos os h3 restantes para h2
// Mas apenas se vierem depois de h1
const h1Regex = /<h1[^>]*>.*?<\/h1>/g;
const h1Matches = [...content.matchAll(h1Regex)];

if (h1Matches.length > 0) {
  const lastH1 = h1Matches[h1Matches.length - 1];
  const afterLastH1 = content.substring(lastH1.index + lastH1[0].length);
  
  // Converte todos os h3 restantes em afterLastH1 para h2
  const h3Regex = /<h3([^>]*)>(.*?)<\/h3>/g;
  let match;
  let count = 0;
  let newAfterLastH1 = afterLastH1;
  
  while ((match = h3Regex.exec(afterLastH1)) !== null) {
    const oldH3 = match[0];
    const newH2 = oldH3.replace(/<h3/g, '<h2').replace(/<\/h3>/g, '</h2>');
    newAfterLastH1 = newAfterLastH1.replace(oldH3, newH2);
    count++;
    console.log('  ➕ h3→h2 convertido');
  }
  
  if (count > 0) {
    content = content.substring(0, lastH1.index + lastH1[0].length) + newAfterLastH1;
    modified = true;
  }
}

// Converte todos os h4 restantes para h3
const h2Regex = /<h2[^>]*>.*?<\/h2>/g;
const h2Matches = [...content.matchAll(h2Regex)];

if (h2Matches.length > 0) {
  const lastH2 = h2Matches[h2Matches.length - 1];
  const afterLastH2 = content.substring(lastH2.index + lastH2[0].length);
  
  const h4Regex = /<h4([^>]*)>(.*?)<\/h4>/g;
  let match;
  let count = 0;
  let newAfterLastH2 = afterLastH2;
  
  while ((match = h4Regex.exec(afterLastH2)) !== null) {
    const oldH4 = match[0];
    const newH3 = oldH4.replace(/<h4/g, '<h3').replace(/<\/h4>/g, '</h3>');
    newAfterLastH2 = newAfterLastH2.replace(oldH4, newH3);
    count++;
    console.log('  ➕ h4→h3 convertido');
  }
  
  if (count > 0) {
    content = content.substring(0, lastH2.index + lastH2[0].length) + newAfterLastH2;
    modified = true;
  }
}

if (modified) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\n✅ Arquivo atualizado!');
} else {
  console.log('\n⚠️  Nenhuma alteração feita');
}
