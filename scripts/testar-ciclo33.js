// Testes do ciclo 33: P0 marcador ciclo14, P1 performance, P2 push (rotas + SW),
// P3 PDF (dossiePdf existe), P4 changelog dinâmico.
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const VOT = fs.readFileSync(path.join(ROOT,'pages','votacoes.html'), 'utf8');
const SRV = fs.readFileSync(path.join(ROOT,'server','index.js'), 'utf8');
// ciclo33 usa 'push-subscriptions' e 'sub.endpoint' — regex atualizadas
const SW  = fs.readFileSync(path.join(ROOT,'app','sw.js'), 'utf8');
const WORK = fs.readFileSync(path.join(ROOT,'scripts','digest-send.js'), 'utf8');
const CHL = fs.existsSync(path.join(ROOT,'pages','changelog.html'))
  ? fs.readFileSync(path.join(ROOT,'pages','changelog.html'), 'utf8') : '';
const PERF = fs.existsSync(path.join(ROOT,'scripts','testar-performance.js'))
  ? fs.readFileSync(path.join(ROOT,'scripts','testar-performance.js'), 'utf8') : '';

const checks = [];
function t(g, label, ok, detail){ checks.push({g, label, ok: !!ok, detail: detail || ''}); }

// A. ciclo14 marcador
t('A','ciclo14 presente (script ou div)', /id="ciclo14"/.test(VOT));
t('A','div do painel v14 com id="ciclo14"', /<div[^>]+id="ciclo14"[^>]+class="painel"/.test(VOT));

// B. performance test
t('B','testar-performance.js existe', PERF.length > 0);
t('B','verifica gzip', /gzipSync/.test(PERF));
t('B','verifica scripts inline', /inline/.test(PERF));
t('B','verifica defer/async', /defer|async/i.test(PERF));
t('B','verifica preconnect', /preconnect/i.test(PERF));
t('B','verifica libs legadas', /jquery|moment|lodash/i.test(PERF));
t('B','verifica meta viewport', /viewport/.test(PERF));

// C. push: rotas no backend
t('C','/api/digest/subscribe-push', /\/api\/digest\/subscribe-push/.test(SRV));
t('C','/api/digest/unsubscribe-push', /\/api\/digest\/unsubscribe-push/.test(SRV));
t('C','push-subscriptions.json', /push-subscription[s]?\.json/.test(SRV));
t('C','validacao endpoint', /sub\.endpoint|subscription\.endpoint/.test(SRV));
t('C','endpoint /api/push/vapid-public', /\/api\/push\/vapid-public/.test(SRV));

// D. push: SW handler
t('D','SW escuta evento push', /addEventListener\(['"]push['"]/.test(SW));
t('D','SW mostra Notification', /registration\.showNotification|showNotification/.test(SW));
t('D','SW escuta pushsubscriptionchange', /pushsubscriptionchange/.test(SW));

// E. push: worker
t('E','worker busca push subscribers', /push-list|pushList|subscriptions|push-subscribers/i.test(WORK));
t('E','worker tenta web-push opcional', /web-push/.test(WORK));
t('E','worker tem fallback graciosos sem web-push', /try[\s\S]{0,200}web-push/.test(WORK));

// F. changelog
t('F','changelog.html existe', CHL.length > 0);
t('F','changelog busca GitHub API', /api\.github\.com\/repos/.test(CHL));
t('F','changelog formata datas pt-BR', /pt-BR|toLocaleDateString/.test(CHL));
t('F','changelog mostra mensagem de erro', /erro|error/i.test(CHL));
t('F','changelog tem fallback offline', /cache|cach/i.test(CHL));

// G. dossiePdf (P3 - ja existia)
t('G','dossiePdf presente em votacoes.html', /function\s+dossiePdf|dossiePdf\s*\(/.test(VOT));
t('G','fichaPrint presente', /id="fichaPrint"/.test(VOT));

// H. integridade geral
let inlineScripts = 0;
const sc = Array.from(VOT.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)).map(m=>m[1]);
let syntaxOk = true;
sc.forEach((s,i)=>{ try{ new Function(s); inlineScripts++; } catch(e){ syntaxOk=false; t('H','script#'+i+' sintaxe', false, e.message); } });
t('H','sintaxe votacoes.html OK', syntaxOk, inlineScripts+' scripts');

// Relatório agrupado por grupo
const groups = {};
checks.forEach(c => { (groups[c.g] = groups[c.g] || []).push(c); });
let totalPass = 0, totalFail = 0;
Object.keys(groups).sort().forEach(g => {
  console.log('\n[' + g + '] ' + ({'A':'marcador ciclo14','B':'teste performance','C':'push rotas backend','D':'push SW','E':'push worker','F':'changelog','G':'dossiePdf','H':'integridade'}[g] || g));
  groups[g].forEach(c => {
    console.log((c.ok ? '  ✅ ' : '  ❌ ') + c.label + (c.detail ? ' ('+c.detail+')' : ''));
    if (c.ok) totalPass++; else totalFail++;
  });
});
console.log('\n=== TOTAL: ' + totalPass + ' OK / ' + totalFail + ' FAIL ===');
process.exit(totalFail === 0 ? 0 : 1);
