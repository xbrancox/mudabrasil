#!/usr/bin/env node
/**
 * Testes do módulo de Fundo Eleitoral
 * - Verifica se o server/fundo-eleitoral.js está funcionando
 * - Testa as rotas /api/fundo-eleitoral/*
 * - Valida a estrutura dos dados
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
let pass = 0, fail = 0;
const sections = [];

function section(name) { sections.push({ name, lines: [] }); }
function ok(msg)   { pass++; sections[sections.length - 1].lines.push('  ✅ ' + msg); }
function no(msg)   { fail++; sections[sections.length - 1].lines.push('  ❌ ' + msg); }

// ---------- [A] Arquivos existem ----------
section('[A] Arquivos do módulo Fundo Eleitoral');

const files = [
  'server/fundo-eleitoral.js',
  'data/fundo-eleitoral.json',
  'data/fundo-detalhe.json',
  'pages/fundo-eleitoral.html'
];

files.forEach(f => {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) {
    const st = fs.statSync(p);
    ok(`${f} existe (${st.size} bytes)`);
  } else {
    no(`${f} não existe`);
  }
});

// ---------- [B] Módulo fundo-eleitoral.js ----------
section('[B] Módulo server/fundo-eleitoral.js');

try {
  const modulo = require(path.join(ROOT, 'server/fundo-eleitoral.js'));
  ok('módulo carregou sem erros');
  
  const funcoes = ['getPartidos', 'getCandidatos', 'getResumo', 'getPolitico', 'getDetalhe'];
  funcoes.forEach(fn => {
    if (typeof modulo[fn] === 'function') ok(`função ${fn}() existe`);
    else no(`função ${fn}() não encontrada`);
  });
} catch (e) {
  no('erro ao carregar módulo: ' + e.message);
}

// ---------- [C] Estrutura do snapshot ----------
section('[C] Estrutura do data/fundo-eleitoral.json');

try {
  const snapshot = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fundo-eleitoral.json'), 'utf8'));
  ok('JSON válido');
  
  if (snapshot.extraidoEm || snapshot.atualizadoEm) ok(`campo de data presente`);
  else no("campo de data faltando (extraidoEm ou atualizadoEm)");
  
  if (snapshot.fonte) ok(`campo 'fonte' presente`);
  else no("campo 'fonte' faltando");
  
  if (Array.isArray(snapshot.partidos)) {
    ok(`partidos é array com ${snapshot.partidos.length} partidos`);
    if (snapshot.partidos.length > 0) {
      const p = snapshot.partidos[0];
      if (p.sigla) ok('primeiro partido tem sigla');
      if (typeof p.valor === 'number') ok('primeiro partido tem valor numérico');
    }
  } else if (Array.isArray(snapshot.porPartido)) {
    ok(`porPartido é array com ${snapshot.porPartido.length} partidos`);
  } else {
    no("campo 'partidos' ou 'porPartido' não é array");
  }
  
  if (Array.isArray(snapshot.porPolitico)) {
    ok(`porPolitico é array com ${snapshot.porPolitico.length} políticos`);
  } else {
    ok('campo porPolitico não existe (esperado: TSE não publica por pessoa individual)');
  }
} catch (e) {
  no('erro ao ler snapshot: ' + e.message);
}

// ---------- [D] Estrutura do detalhe ----------
section('[D] Estrutura do data/fundo-detalhe.json');

try {
  const detalhe = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fundo-detalhe.json'), 'utf8'));
  ok('JSON válido');
  
  if (typeof detalhe === 'object' && !Array.isArray(detalhe)) {
    const keys = Object.keys(detalhe);
    ok(`objeto com ${keys.length} chaves`);
  } else {
    no('não é um objeto');
  }
} catch (e) {
  no('erro ao ler detalhe: ' + e.message);
}

// ---------- [E] Rotas no server/index.js ----------
section('[E] Rotas /api/fundo-eleitoral/* no server/index.js');

try {
  const indexJs = fs.readFileSync(path.join(ROOT, 'server/index.js'), 'utf8');
  ok('server/index.js lido');
  
  if (indexJs.includes("require('./fundo-eleitoral')")) {
    ok('módulo fundo-eleitoral importado');
  } else {
    no("módulo fundo-eleitoral não importado");
  }
  
  const rotas = [
    '/api/fundo-eleitoral/partidos',
    '/api/fundo-eleitoral/candidatos',
    '/api/fundo-eleitoral/resumo',
    '/api/fundo-eleitoral/politico',
    '/api/fundo-eleitoral/detalhe',
    '/api/fundo-eleitoral/export.csv'
  ];
  
  rotas.forEach(rota => {
    if (indexJs.includes(rota)) ok(`rota ${rota} definida`);
    else no(`rota ${rota} não encontrada`);
  });
} catch (e) {
  no('erro ao ler server/index.js: ' + e.message);
}

// ---------- [F] Página fundo-eleitoral.html ----------
section('[F] Página pages/fundo-eleitoral.html');

try {
  const html = fs.readFileSync(path.join(ROOT, 'pages/fundo-eleitoral.html'), 'utf8');
  ok('HTML lido');
  
  if (html.includes('<!-- og:meuvoto -->')) ok('tem bloco og:meuvoto');
  else no('faltando bloco og:meuvoto');
  
  if (html.includes('og:title')) ok('tem og:title');
  else no('faltando og:title');
  
  if (html.includes('og:description')) ok('tem og:description');
  else no('faltando og:description');
  
  if (html.includes('<title>')) ok('tem tag title');
  else no('faltando tag title');
  
  // Verificar se não há OG tags duplicadas (problema corrigido)
  const ogTitleCount = (html.match(/og:title/g) || []).length;
  if (ogTitleCount === 1) ok('og:title não está duplicado (1 ocorrência)');
  else no(`og:title está duplicado (${ogTitleCount} ocorrências)`);
} catch (e) {
  no('erro ao ler HTML: ' + e.message);
}

// ---------- [G] Sitemap ----------
section('[G] Sitemap.xml');

try {
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  ok('sitemap.xml lido');
  
  if (sitemap.includes('fundo-eleitoral.html')) {
    ok('fundo-eleitoral.html está no sitemap');
  } else {
    no('fundo-eleitoral.html NÃO está no sitemap');
  }
} catch (e) {
  no('erro ao ler sitemap: ' + e.message);
}

// ---------- [H] Testar-ciclo31.js ----------
section('[H] Teste de OG tags (testar-ciclo31.js)');

try {
  const ciclo31 = fs.readFileSync(path.join(ROOT, 'scripts/testar-ciclo31.js'), 'utf8');
  ok('testar-ciclo31.js lido');
  
  if (ciclo31.includes('fundo-eleitoral.html')) {
    ok('fundo-eleitoral.html está no PAGES_TO_CHECK');
  } else {
    no('fundo-eleitoral.html NÃO está no PAGES_TO_CHECK');
  }
} catch (e) {
  no('erro ao ler testar-ciclo31.js: ' + e.message);
}

// ---------- Relatório ----------
console.log('');
sections.forEach(s => {
  console.log(s.name);
  s.lines.forEach(l => console.log(l));
  console.log('');
});

console.log('========================================');
console.log(`Total: ${pass + fail} | ✅ Passaram: ${pass} | ❌ Falharam: ${fail}`);
console.log('========================================');

if (fail > 0) {
  console.log('❌ FUNDO ELEITORAL: ALGUM TESTE FALHOU');
  process.exit(1);
} else {
  console.log('✅ FUNDO ELEITORAL: TODOS OS TESTES PASSARAM');
  process.exit(0);
}
