#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'pages', 'votacoes.html');
let content = fs.readFileSync(filePath, 'utf8');

// Estratégia agressiva: converter todos os h3 para h2 e h4 para h3
// Isso garante que não haja saltos

let count3to2 = 0;
let count4to3 = 0;

// Converte todos os h3 para h2
content = content.replace(/<h3([^>]*)>/g, function(match) {
  count3to2++;
  return '<h2' + match.substring(2);
});
content = content.replace(/<\/h3>/g, '</h2>');

// Converte todos os h4 para h3
content = content.replace(/<h4([^>]*)>/g, function(match) {
  count4to3++;
  return '<h3' + match.substring(2);
});
content = content.replace(/<\/h4>/g, '</h3>');

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Convertidos', count3to2, 'h3→h2');
console.log('✅ Convertidos', count4to3, 'h4→h3');
