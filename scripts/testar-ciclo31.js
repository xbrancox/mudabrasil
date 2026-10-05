#!/usr/bin/env node
/**
 * Ciclo 31 — teste: hub links.html + Open Graph tags estáticas.
 *
 * 4 grupos:
 * [A] pages/links.html existe, tem marcadores OG, 15+ links internos, layout válido
 * [B] Todas as páginas principais têm <!-- og:meuvoto --> ... <!-- /og:meuvoto -->
 * [C] site-header.js contém item 'links' no ITENS
 * [D] Validação de HTML das páginas patchadas (head/body balanceados, charset UTF-8)
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

// ---------- [A] links.html ----------
section('[A] pages/links.html');
const LINKS = path.join(ROOT, 'pages', 'links.html');
if (fs.existsSync(LINKS)) {
  ok('arquivo existe');
  const src = fs.readFileSync(LINKS, 'utf8');
  if (src.indexOf('<!-- og:meuvoto -->') !== -1) ok('tem marcador og:meuvoto (abertura)'); else no('faltando marcador de abertura');
  if (src.indexOf('<!-- /og:meuvoto -->') !== -1) ok('tem marcador og:meuvoto (fechamento)'); else no('faltando marcador de fechamento');
  const ogTags = (src.match(/<meta (?:property|name)="(og:|twitter:)/g) || []).length;
  if (ogTags >= 9) ok('tem pelo menos 9 tags OG/Twitter (' + ogTags + ' encontradas)'); else no('tags OG insuficientes: ' + ogTags);
  const internalLinks = (src.match(/<a\s+[^>]*href="[^"]+\.html"/g) || []).length;
  if (internalLinks >= 15) ok('tem pelo menos 15 links internos para .html (' + internalLinks + ')'); else no('links internos insuficientes: ' + internalLinks);
  if (src.indexOf('<!DOCTYPE html>') !== -1) ok('tem DOCTYPE'); else no('faltando DOCTYPE');
  if (src.indexOf('lang="pt-BR"') !== -1) ok('tem lang="pt-BR"'); else no('faltando lang="pt-BR"');
  if (src.indexOf('charset="UTF-8"') !== -1 || src.indexOf("charset='UTF-8'") !== -1) ok('tem charset UTF-8'); else no('faltando charset UTF-8');
} else {
  no('arquivo não existe');
}

// ---------- [B] Todas as páginas têm OG ----------
section('[B] Open Graph em páginas principais');
const PAGES_TO_CHECK = [
  'index.html',
  'pages/votacoes.html',
  'pages/digest.html',
  'pages/digest-admin.html',
  'pages/digest-archive.html',
  'pages/metodologia.html',
  'pages/status.html',
  'pages/stats.html',
  'pages/cobrancas-ranking.html',
  'pages/mandato-responsavel.html',
  'pages/api-publica.html',
  'pages/links.html',
  'pages/iniciativa-cidada.html'
];
let ogOk = 0;
PAGES_TO_CHECK.forEach(p => {
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { no(p + ' não existe'); return; }
  const src = fs.readFileSync(f, 'utf8');
  if (src.indexOf('<!-- og:meuvoto -->') !== -1 && src.indexOf('og:title') !== -1) ogOk++;
  else no(p + ' sem OG tags');
});
if (ogOk === PAGES_TO_CHECK.length) ok('todas as ' + PAGES_TO_CHECK.length + ' páginas principais têm tags OG');

// ---------- [C] site-header.js ----------
section('[C] Navegação no cabeçalho (site-header.js)');
const HDR = path.join(ROOT, 'js', 'site-header.js');
if (fs.existsSync(HDR)) {
  const src = fs.readFileSync(HDR, 'utf8');
  if (/chave:\s*'links'/.test(src)) ok("item 'links' presente no ITENS"); else no("item 'links' faltando no ITENS");
  if (/pagina:\s*'links\.html'/.test(src)) ok('aponta para links.html'); else no('não aponta para links.html');
  if (/rotulo:\s*'Hub'/.test(src) || /rotulo:\s*"Hub"/.test(src)) ok("rótulo 'Hub'"); else no("rótulo 'Hub' faltando");
  if (/'links\.html':\s*'links'/.test(src)) ok('mapeamento da página para chave ativa'); else no('falta mapear links.html na chaveAtiva()');
} else {
  no('js/site-header.js não encontrado');
}

// ---------- [D] Validação HTML básica ----------
section('[D] Integridade HTML das páginas patchadas');
let htmlOk = 0;
PAGES_TO_CHECK.forEach(p => {
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) return;
  const src = fs.readFileSync(f, 'utf8');
  const hasHead = /<head[^>]*>[\s\S]*<\/head>/i.test(src);
  const hasBody = /<body[^>]*>[\s\S]*<\/body>/i.test(src);
  const hasDoctype = /<!DOCTYPE html>/i.test(src);
  if (hasHead && hasBody && hasDoctype) htmlOk++;
  else no(p + ': head=' + hasHead + ' body=' + hasBody + ' doctype=' + hasDoctype);
});
if (htmlOk === PAGES_TO_CHECK.length) ok('todas as ' + PAGES_TO_CHECK.length + ' páginas têm head/body/doctype balanceados');

// ---------- Resultado ----------
sections.forEach(s => {
  console.log('\n' + s.name);
  s.lines.forEach(l => console.log(l));
});
console.log('\n========================================');
console.log('Total: ' + (pass + fail) + ' | ✅ Passaram: ' + pass + ' | ❌ Falharam: ' + fail);
console.log('========================================');
if (fail > 0) { console.log('❌ CICLO 31: ALGUM TESTE FALHOU'); process.exit(1); }
else { console.log('✅ CICLO 31: TODOS OS TESTES PASSARAM'); process.exit(0); }
