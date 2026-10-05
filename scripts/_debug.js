#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const pagesDir = path.join(__dirname, '..', 'pages');

const file = 'congresso.html';
const filePath = path.join(pagesDir, file);
const content = fs.readFileSync(filePath, 'utf8');

console.log('Tem id="busca"?', content.includes('id="busca"'));
console.log('Tem for="busca"?', content.includes('for="busca"'));

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id="busca"')) {
    console.log('Linha', i + 1, ':', lines[i]);
    console.log('Tem <input?', lines[i].includes('<input'));
  }
}
