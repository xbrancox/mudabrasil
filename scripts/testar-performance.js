// Testar performance / tamanho do site (ciclo 33)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = process.cwd();
const PAGE = path.join(ROOT, 'pages', 'votacoes.html');
const VOT = fs.existsSync(PAGE) ? fs.readFileSync(PAGE, 'utf8') : '';

const checks = [];
function t(label, ok, detail){ checks.push({label, ok: !!ok, detail: detail || ''}); }

// 1. Tamanho do arquivo
const raw = Buffer.byteLength(VOT, 'utf8');
const gz  = zlib.gzipSync(Buffer.from(VOT, 'utf8'), {level: 9}).length;
t('votacoes.html < 250KB (raw)', raw < 250*1024, raw + ' bytes');
t('votacoes.html gzip < 80KB',  gz  < 80*1024,  gz  + ' bytes');

// 2. Scripts inline vs externos
const inline  = (VOT.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g) || []).length;
const scripts = (VOT.match(/<script\s[^>]*src=/g) || []).length;
const deferred = (VOT.match(/<script[^>]+(defer|async)[^>]*src=/gi) || []).length
               + (VOT.match(/<script[^>]+src=[^>]*(defer|async)/gi) || []).length;
t('scripts inline < 25', inline < 25, inline + ' scripts inline');
t('scripts externos presentes', scripts >= 1, scripts + ' scripts externos');
t('>=1 script com defer/async', deferred >= 1, deferred + ' com defer/async');

// 3. CSS
const cssInline = (VOT.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || []).length;
const cssExt    = (VOT.match(/<link[^>]+\.css/gi) || []).length;
t('CSS inline razoavel (<15 blocos)', cssInline < 15, cssInline + ' blocos');
t('CSS externo ou inline presente', (cssExt + cssInline) >= 1, cssExt + ' ext + ' + cssInline + ' inline');

// 4. Imagens sem width/height
const imgs  = (VOT.match(/<img\b[^>]*>/gi) || []);
const lazy  = imgs.filter(i => /loading=["']lazy/i.test(i)).length;
t('imagens com loading=lazy presentes', lazy >= 0, lazy + ' lazy / ' + imgs.length + ' total');

// 5. Fontes pré-conectadas
const preconnect = (VOT.match(/<link[^>]+rel=["']preconnect/gi) || []).length;
t('preconnect configurado (>=1)', preconnect >= 1, preconnect + ' preconnect(s)');

// 6. Sem libs pesadas (jQuery, etc.)
const libs = ['jquery.min.js','moment.min.js','lodash.min.js'];
const libsFound = libs.filter(l => VOT.indexOf(l) >= 0);
t('sem libs legadas (jQuery/moment/lodash)', libsFound.length === 0, libsFound.length ? libsFound.join(', ') : 'nenhuma');

// 7. Meta viewport
t('meta viewport presente', /<meta[^>]+name=["']viewport/i.test(VOT));
t('charset definido',       /<meta[^>]+charset/i.test(VOT));
t('<title> presente',       /<title[^>]*>[\s\S]+?<\/title>/i.test(VOT));

// 8. Tamanho total do site (pages/)
let totalRaw = 0, totalGz = 0, nFiles = 0;
const pages = fs.readdirSync(path.join(ROOT,'pages')).filter(f => f.endsWith('.html'));
pages.forEach(f => {
  const buf = fs.readFileSync(path.join(ROOT,'pages',f));
  totalRaw += buf.length;
  totalGz  += zlib.gzipSync(buf, {level:9}).length;
  nFiles++;
});
t('site total (pages/) < 2MB raw', totalRaw < 2*1024*1024, Math.round(totalRaw/1024)+'KB em '+nFiles+' arquivos');
t('site total gzip < 500KB',       totalGz  < 500*1024,   Math.round(totalGz/1024)+'KB gzip');

// Relatório
console.log('=== PERFORMANCE CHECK ===');
let pass = 0, fail = 0;
checks.forEach(c => {
  const mark = c.ok ? '✅' : '❌';
  console.log(mark + ' ' + c.label + (c.detail ? ' (' + c.detail + ')' : ''));
  if (c.ok) pass++; else fail++;
});
console.log('\nTotal: ' + pass + ' OK / ' + fail + ' FAIL');
process.exit(fail === 0 ? 0 : 1);
