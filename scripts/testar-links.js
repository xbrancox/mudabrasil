#!/usr/bin/env node
// Ciclo 32: link checker — valida href/src internos em pages/*.html apontam para arquivos existentes.
// Ignora: http(s)://, //, #, data:, mailto:, tel:, javascript:, blob, template literals ${...}, concatenações JS '+...+', e query strings.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PAGES = path.join(ROOT, 'pages');

function readDir(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.html')).map(f => path.join(dir, f));
}

function stripQuery(v) {
  // remove query string: "file.html?x=1" -> "file.html"
  let out = v;
  const q = out.indexOf('?');
  if (q >= 0) out = out.slice(0, q);
  const h = out.indexOf('#');
  if (h >= 0) out = out.slice(0, h);
  return out;
}

function isDynamic(v) {
  if (!v) return true;
  // Template literal: ${...}
  if (/\$\{/.test(v)) return true;
  // JS concatenation: '+...+' or '+...' or '...+'
  if (/'\s*\+|\+\s*'/.test(v)) return true;
  // JS variable: starts with ' (escaped string in HTML attribute)
  if (v.startsWith("'")) return true;
  return false;
}

function extractRefs(html) {
  const out = [];
  // Match href="..." and src="..." (excluding the closing quote and handling escaped quotes)
  const re = /\b(href|src)\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) {
    out.push({ attr: m[1], value: m[2] });
  }
  return out;
}

function isIgnored(v) {
  if (!v) return true;
  if (/^(https?:|\/\/|data:|mailto:|tel:|javascript:|blob:)/i.test(v)) return true;
  if (v.startsWith('#')) return true;
  return false;
}

const pageFiles = readDir(PAGES);
let broken = [];
let checked = 0;
let skipped = 0;

for (const p of pageFiles) {
  const html = fs.readFileSync(p, 'utf8');
  const refs = extractRefs(html);
  const pageDir = path.dirname(p);
  for (const r of refs) {
    let v = r.value;
    if (isIgnored(v)) { skipped++; continue; }
    if (isDynamic(v)) { skipped++; continue; }
    v = stripQuery(v);
    if (!v) { skipped++; continue; }
    checked++;
    const target = path.resolve(pageDir, v);
    if (!fs.existsSync(target)) {
      broken.push({ file: path.relative(ROOT, p).replace(/\\/g, '/'), attr: r.attr, target: r.value });
    }
  }
}

console.log('=== CICLO 32: LINK CHECKER ===');
console.log('Arquivos varridos: ' + pageFiles.length);
console.log('Links internos verificados: ' + checked);
console.log('Links ignorados (externos/dinamicos): ' + skipped);
console.log('Quebrados: ' + broken.length);

if (broken.length) {
  console.log('\n❌ Links quebrados:');
  for (const b of broken.slice(0, 30)) {
    console.log('  ' + b.file + '  ' + b.attr + '="' + b.target + '"');
  }
  if (broken.length > 30) console.log('  ... (' + (broken.length - 30) + ' mais)');
  process.exit(1);
}

// Teste de marcadores do ciclo 32
const linksPage = path.join(PAGES, 'links.html');
if (!fs.existsSync(linksPage)) {
  console.log('❌ pages/links.html ausente');
  process.exit(1);
}
console.log('✅ pages/links.html presente');
console.log('✅ scripts/testar-links.js presente');

// Verifica que CI registra este teste
const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
if (fs.existsSync(ciPath)) {
  const ci = fs.readFileSync(ciPath, 'utf8');
  if (ci.includes('testar-links.js')) {
    console.log('✅ CI registra testar-links.js');
  } else {
    console.log('⚠️  CI ainda nao registra testar-links.js');
    process.exit(1);
  }
}

console.log('\n=== CICLO 32: TODOS OS LINKS SAUDÁVEIS ===');
