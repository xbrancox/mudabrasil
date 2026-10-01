#!/usr/bin/env node
/**
 * testar-seo.js - Auditoria de SEO
 * Plan C - Mais testes
 * Verifica: Meta tags, Open Graph, structured data, sitemap, robots.txt
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '..', 'pages');
const ROOT_DIR = path.join(__dirname, '..');

const results = {
  pass: 0,
  fail: 0,
  warn: 0,
  tests: []
};

function test(name, condition, message) {
  if (condition) {
    results.pass++;
    results.tests.push({ name, status: 'PASS', message });
    console.log('✅', name);
  } else {
    results.fail++;
    results.tests.push({ name, status: 'FAIL', message });
    console.log('❌', name, '-', message);
  }
}

function warn(name, message) {
  results.warn++;
  results.tests.push({ name, status: 'WARN', message });
  console.log('⚠️', name, '-', message);
}

console.log('🔍 Iniciando auditoria de SEO...\n');

// Teste 1: Todas as páginas têm title
console.log('[1/10] Verificando meta title...');
const htmlFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
let pagesWithoutTitle = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  if (!content.match(/<title>[^<]+<\/title>/)) {
    pagesWithoutTitle++;
    console.log('  ⚠️', file, '- sem title');
  }
});

test('Meta title em todas as páginas', pagesWithoutTitle === 0,
  `${pagesWithoutTitle}/${htmlFiles.length} páginas sem title`);

// Teste 2: Todas as páginas têm meta description
console.log('[2/10] Verificando meta description...');
let pagesWithoutDescription = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  if (!content.match(/<meta[^>]*name="description"[^>]*>/)) {
    pagesWithoutDescription++;
    console.log('  ⚠️', file, '- sem description');
  }
});

test('Meta description em todas as páginas', pagesWithoutDescription === 0,
  `${pagesWithoutDescription}/${htmlFiles.length} páginas sem description`);

// Teste 3: Open Graph tags
console.log('[3/10] Verificando Open Graph tags...');
const indexContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const hasOgTitle = indexContent.includes('og:title');
const hasOgDescription = indexContent.includes('og:description');
const hasOgImage = indexContent.includes('og:image');
const hasOgUrl = indexContent.includes('og:url');
const hasOgType = indexContent.includes('og:type');

test('og:title', hasOgTitle, 'Página principal sem og:title');
test('og:description', hasOgDescription, 'Página principal sem og:description');
test('og:image', hasOgImage, 'Página principal sem og:image');
test('og:url', hasOgUrl, 'Página principal sem og:url');
test('og:type', hasOgType, 'Página principal sem og:type');

// Teste 4: Twitter Card tags
console.log('[4/10] Verificando Twitter Card tags...');
const hasTwitterCard = indexContent.includes('twitter:card');
const hasTwitterTitle = indexContent.includes('twitter:title');
const hasTwitterDescription = indexContent.includes('twitter:description');

test('twitter:card', hasTwitterCard, 'Página principal sem twitter:card');
test('twitter:title', hasTwitterTitle, 'Página principal sem twitter:title');
test('twitter:description', hasTwitterDescription, 'Página principal sem twitter:description');

// Teste 5: Canonical URL
console.log('[5/10] Verificando canonical URL...');
const hasCanonical = indexContent.match(/<link[^>]*rel="canonical"[^>]*>/);

test('Canonical URL', hasCanonical, 'Página principal sem canonical URL');

// Teste 6: Sitemap.xml
console.log('[6/10] Verificando sitemap.xml...');
const sitemapExists = fs.existsSync(path.join(ROOT_DIR, 'sitemap.xml'));

test('sitemap.xml existe', sitemapExists, 'Arquivo sitemap.xml não encontrado');

if (sitemapExists) {
  const sitemapContent = fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8');
  const urlCount = (sitemapContent.match(/<url>/g) || []).length;
  console.log(`  ℹ️ Sitemap contém ${urlCount} URLs`);
}

// Teste 7: Robots.txt
console.log('[7/10] Verificando robots.txt...');
const robotsExists = fs.existsSync(path.join(ROOT_DIR, 'robots.txt'));

test('robots.txt existe', robotsExists, 'Arquivo robots.txt não encontrado');

// Teste 8: Structured Data (JSON-LD)
console.log('[8/10] Verificando structured data (JSON-LD)...');
const hasJsonLd = indexContent.includes('application/ld+json');

test('Structured Data (JSON-LD)', hasJsonLd, 'Página principal sem JSON-LD');

// Teste 9: Favicon
console.log('[9/10] Verificando favicon...');
const hasFavicon = indexContent.includes('favicon') || indexContent.includes('icon.svg');

test('Favicon configurado', hasFavicon, 'Página principal sem favicon');

// Teste 10: Viewport meta tag
console.log('[10/10] Verificando viewport meta tag...');
let pagesWithoutViewport = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  if (!content.includes('name="viewport"')) {
    pagesWithoutViewport++;
  }
});

test('Viewport meta tag', pagesWithoutViewport === 0,
  `${pagesWithoutViewport}/${htmlFiles.length} páginas sem viewport`);

// Resumo
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA AUDITORIA DE SEO');
console.log('='.repeat(60));
console.log(`✅ Passou: ${results.pass}`);
console.log(`❌ Falhou: ${results.fail}`);
console.log(`⚠️ Avisos: ${results.warn}`);
console.log('='.repeat(60));

if (results.fail > 0) {
  console.log('\n⚠️ Há problemas de SEO que precisam ser corrigidos.');
  process.exit(1);
} else {
  console.log('\n✅ Todas as verificações de SEO passaram!');
  process.exit(0);
}
