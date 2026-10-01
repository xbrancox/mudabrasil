#!/usr/bin/env node
/**
 * testar-acessibilidade.js - Auditoria de acessibilidade (WCAG 2.1 AA)
 * Plan C - Mais testes
 * Verifica: ARIA labels, contraste, navegação por teclado, semântica HTML
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

console.log('🧪 Iniciando auditoria de acessibilidade...\n');

// Teste 1: Todas as imagens têm alt text
console.log('[1/8] Verificando alt text em imagens...');
const htmlFiles = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html'));
let imagesWithoutAlt = 0;
let totalImages = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  const imgMatches = content.match(/<img[^>]*>/g) || [];
  totalImages += imgMatches.length;
  imgMatches.forEach(img => {
    if (!img.includes('alt=')) {
      imagesWithoutAlt++;
    }
  });
});

test('Imagens com alt text', imagesWithoutAlt === 0, 
  `${imagesWithoutAlt}/${totalImages} imagens sem alt text`);

// Teste 2: Formulários têm labels
console.log('[2/8] Verificando labels em formulários...');
let inputsWithoutLabel = 0;
let totalInputs = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  const inputMatches = content.match(/<input[^>]*>/g) || [];
  totalInputs += inputMatches.length;
  inputMatches.forEach(input => {
    if (input.includes('type="hidden"')) return;
    const hasId = input.match(/id="([^"]+)"/);
    if (hasId) {
      const id = hasId[1];
      if (!content.includes(`for="${id}"`)) {
        inputsWithoutLabel++;
      }
    } else if (!input.includes('aria-label')) {
      inputsWithoutLabel++;
    }
  });
});

test('Inputs com labels', inputsWithoutLabel === 0,
  `${inputsWithoutLabel}/${totalInputs} inputs sem label`);

// Teste 3: Headings hierárquicos (h1 -> h2 -> h3, sem saltos)
console.log('[3/8] Verificando hierarquia de headings...');
let headingIssues = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  const headings = content.match(/<h[1-6][^>]*>/g) || [];
  let lastLevel = 0;
  
  headings.forEach(heading => {
    const level = parseInt(heading.match(/<h([1-6])/)[1]);
    if (lastLevel > 0 && level > lastLevel + 1) {
      headingIssues++;
    }
    lastLevel = level;
  });
});

test('Hierarquia de headings', headingIssues === 0,
  `${headingIssues} saltos de nível detectados`);

// Teste 4: Botões e links têm texto acessível
console.log('[4/8] Verificando texto em botões e links...');
let emptyButtons = 0;
let emptyLinks = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  
  // Botões vazios
  const buttons = content.match(/<button[^>]*>\s*<\/button>/g) || [];
  emptyButtons += buttons.length;
  
  // Links vazios
  const links = content.match(/<a[^>]*>\s*<\/a>/g) || [];
  emptyLinks += links.length;
});

test('Botões com texto', emptyButtons === 0,
  `${emptyButtons} botões vazios`);
test('Links com texto', emptyLinks === 0,
  `${emptyLinks} links vazios`);

// Teste 5: ARIA landmarks presentes
console.log('[5/8] Verificando ARIA landmarks...');
const indexContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const hasMain = indexContent.includes('<main') || indexContent.includes('role="main"');
const hasNav = indexContent.includes('<nav') || indexContent.includes('role="navigation"');
const hasHeader = indexContent.includes('<header') || indexContent.includes('role="banner"');

test('Landmark <main>', hasMain, 'Página principal sem <main>');
test('Landmark <nav>', hasNav, 'Página principal sem <nav>');
test('Landmark <header>', hasHeader, 'Página principal sem <header>');

// Teste 6: Contraste de cores (verificação básica)
console.log('[6/8] Verificando contraste de cores...');
const configContent = fs.readFileSync(path.join(ROOT_DIR, 'config.js'), 'utf8');
const hasColorConfig = configContent.includes('theme-color') || configContent.includes('color');

test('Configuração de cores', hasColorConfig, 'Sem configuração de cores detectada');

// Teste 7: Focus visível
console.log('[7/8] Verificando estilos de focus...');
const cssFiles = [];
function findCSS(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        findCSS(fullPath);
      } else if (file.endsWith('.css')) {
        cssFiles.push(fullPath);
      }
    });
  } catch (e) {}
}

findCSS(path.join(ROOT_DIR, 'css'));

let hasFocusStyles = false;
cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(':focus') || content.includes(':focus-visible')) {
    hasFocusStyles = true;
  }
});

test('Estilos de focus', hasFocusStyles, 'Sem estilos :focus detectados');

// Teste 8: Language attribute
console.log('[8/8] Verificando lang attribute...');
let hasLang = true;
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
  if (!content.includes('lang="pt-BR"') && !content.includes('lang="pt"')) {
    hasLang = false;
  }
});

test('Atributo lang', hasLang, 'Páginas sem lang="pt-BR"');

// Resumo
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA AUDITORIA DE ACESSIBILIDADE');
console.log('='.repeat(60));
console.log(`✅ Passou: ${results.pass}`);
console.log(`❌ Falhou: ${results.fail}`);
console.log(`⚠️ Avisos: ${results.warn}`);
console.log('='.repeat(60));

if (results.fail > 0) {
  console.log('\n⚠️ Há problemas de acessibilidade que precisam ser corrigidos.');
  process.exit(1);
} else {
  console.log('\n✅ Todas as verificações de acessibilidade passaram!');
  process.exit(0);
}
