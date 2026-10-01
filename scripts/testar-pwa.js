#!/usr/bin/env node
/**
 * testar-pwa.js - Auditoria de Progressive Web App
 * Plan C - Mais testes
 * Verifica: Manifest, icons, service worker, offline capability
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'app');

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

console.log('📱 Iniciando auditoria de PWA...\n');

// Teste 1: Manifest.webmanifest existe
console.log('[1/8] Verificando manifest.webmanifest...');
const manifestPath = path.join(APP_DIR, 'manifest.webmanifest');
const manifestExists = fs.existsSync(manifestPath);

test('manifest.webmanifest existe', manifestExists, 'Arquivo manifest.webmanifest não encontrado');

if (manifestExists) {
  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Teste 2: Manifest tem nome
  console.log('[2/8] Verificando nome do app...');
  test('Manifest tem name', manifestContent.name, 'Manifest sem campo "name"');
  test('Manifest tem short_name', manifestContent.short_name, 'Manifest sem campo "short_name"');
  
  // Teste 3: Manifest tem theme_color
  console.log('[3/8] Verificando theme_color...');
  test('Manifest tem theme_color', manifestContent.theme_color, 'Manifest sem campo "theme_color"');
  
  // Teste 4: Manifest tem background_color
  console.log('[4/8] Verificando background_color...');
  test('Manifest tem background_color', manifestContent.background_color, 'Manifest sem campo "background_color"');
  
  // Teste 5: Manifest tem display
  console.log('[5/8] Verificando display mode...');
  test('Manifest tem display', manifestContent.display, 'Manifest sem campo "display"');
  if (manifestContent.display) {
    test('Display mode é válido', 
      ['fullscreen', 'standalone', 'minimal-ui', 'browser'].includes(manifestContent.display),
      `Display mode inválido: ${manifestContent.display}`);
  }
  
  // Teste 6: Manifest tem icons
  console.log('[6/8] Verificando icons...');
  test('Manifest tem icons', manifestContent.icons && manifestContent.icons.length > 0, 
    'Manifest sem ícones');
  
  if (manifestContent.icons && manifestContent.icons.length > 0) {
    const hasIcon192 = manifestContent.icons.some(i => i.sizes === '192x192');
    const hasIcon512 = manifestContent.icons.some(i => i.sizes === '512x512');
    
    test('Ícone 192x192', hasIcon192, 'Manifest sem ícone 192x192');
    test('Ícone 512x512', hasIcon512, 'Manifest sem ícone 512x512');
  }
}

// Teste 7: Service Worker existe
console.log('[7/8] Verificando service worker...');
const swPath = path.join(ROOT_DIR, 'sw.js');
const swExists = fs.existsSync(swPath);

test('Service Worker existe', swExists, 'Arquivo sw.js não encontrado');

if (swExists) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Verifica eventos essenciais
  const hasInstall = swContent.includes("addEventListener('install'");
  const hasActivate = swContent.includes("addEventListener('activate'");
  const hasFetch = swContent.includes("addEventListener('fetch'");
  
  test('SW tem evento install', hasInstall, 'Service Worker sem evento install');
  test('SW tem evento activate', hasActivate, 'Service Worker sem evento activate');
  test('SW tem evento fetch', hasFetch, 'Service Worker sem evento fetch');
}

// Teste 8: HTML registra service worker
console.log('[8/8] Verificando registro do service worker...');
const indexContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const registersSW = indexContent.includes('serviceWorker.register') || 
                    indexContent.includes('navigator.serviceWorker');

test('HTML registra service worker', registersSW, 'index.html não registra service worker');

// Resumo
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA AUDITORIA DE PWA');
console.log('='.repeat(60));
console.log(`✅ Passou: ${results.pass}`);
console.log(`❌ Falhou: ${results.fail}`);
console.log(`⚠️ Avisos: ${results.warn}`);
console.log('='.repeat(60));

if (results.fail > 0) {
  console.log('\n⚠️ Há problemas de PWA que precisam ser corrigidos.');
  process.exit(1);
} else {
  console.log('\n✅ Todas as verificações de PWA passaram!');
  process.exit(0);
}
