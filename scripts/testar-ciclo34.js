// Testar ciclo 34: VAPID dinâmico + jsPDF para dossiê
// Testa:
//   - scripts/gerar-vapid.js gera chaves válidas (P-256, 87 chars public, JWK base64url private)
//   - js/push-notifications.js busca chave pública do backend (sem hardcoded)
//   - pages/votacoes.html tem jsPDF via CDN + dossiePdf com fallback

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
let fails = 0, passes = 0;
const bad = m => { fails++; console.log('  ❌ ' + m); };
const ok = m => { passes++; console.log('  ✅ ' + m); };

function read(p) { return fs.readFileSync(path.join(ROOT, p), 'utf8'); }
function exists(p) { return fs.existsSync(path.join(ROOT, p)); }

console.log('\n[A] VAPID GENERATOR (scripts/gerar-vapid.js)');
const genSrc = read('scripts/gerar-vapid.js');
if (genSrc.indexOf('crypto.generateKeyPairSync') < 0) bad('não usa crypto nativo');
else ok('usa crypto nativo (sem dependência web-push)');
if (genSrc.indexOf('prime256v1') < 0) bad('não usa P-256');
else ok('curva P-256 correta');
if (genSrc.indexOf('0x04') < 0) bad('não concatena prefixo 0x04');
else ok('prefixo 0x04 (ponto não-comprimido) presente');
if (genSrc.indexOf('base64url') < 0) bad('não usa base64url');
else ok('codificação base64url');

console.log('\n[B] VAPID KEY GENERATION (execução real)');
const r = cp.spawnSync(process.execPath, ['scripts/gerar-vapid.js'], {
  cwd: ROOT, encoding: 'utf8', timeout: 15000
});
if (r.status !== 0) bad('gerar-vapid.js falhou: ' + (r.stderr || '').slice(0, 200));
else {
  ok('executou com sucesso (exit 0)');
  const out = r.stdout || '';
  const pubMatch = out.match(/PUBLIC KEY[^:]*:\s*([A-Za-z0-9_-]{60,})/);
  const privMatch = out.match(/PRIVATE KEY[^:]*:\s*([A-Za-z0-9_-]{60,})/);
  if (pubMatch) ok('chave pública gerada (' + pubMatch[1].length + ' chars)');
  else bad('chave pública não encontrada na saída');
  if (privMatch) {
    ok('chave privada gerada (' + privMatch[1].length + ' chars)');
    // Verificar se é JWK válido
    try {
      const decoded = Buffer.from(privMatch[1], 'base64url').toString('utf8');
      const jwk = JSON.parse(decoded);
      if (jwk.kty === 'EC' && jwk.crv === 'P-256' && jwk.x && jwk.y && jwk.d)
        ok('chave privada é JWK EC P-256 válido');
      else bad('JWK decodificado mas formato inesperado: ' + JSON.stringify(jwk).slice(0, 80));
    } catch (e) { bad('chave privada não é JWK válido: ' + e.message); }
  } else bad('chave privada não encontrada na saída');
}

console.log('\n[C] PUSH-NOTIFICATIONS.JS (js/push-notifications.js)');
const pushSrc = read('js/push-notifications.js');
if (pushSrc.indexOf('/api/push/vapid-public') < 0) bad('não busca chave pública do backend');
else ok('busca chave pública via GET /api/push/vapid-public');
if (/BEl62iUYgUiv|applicationServerKey\s*=\s*urlBase64ToUint8Array\s*\(\s*['"][A-Za-z0-9]/.test(pushSrc))
  bad('CHAVE VAPID HARDCODED DETECTADA - precisa ser dinâmica');
else ok('sem chave VAPID hardcoded');
if (pushSrc.indexOf('getVapidPublicKey') < 0) bad('não tem função getVapidPublicKey');
else ok('getVapidPublicKey definida');
if (pushSrc.indexOf('urlBase64ToUint8Array') < 0) bad('não tem helper urlBase64ToUint8Array');
else ok('helper urlBase64ToUint8Array presente');
if (pushSrc.indexOf('subscribe-push') < 0) bad('não envia subscription ao backend');
else ok('envia subscription via /api/digest/subscribe-push');

console.log('\n[D] JSPDF EM VOTACOES.HTML (pages/votacoes.html)');
const votSrc = read('pages/votacoes.html');
if (votSrc.indexOf('jspdf') < 0) bad('jsPDF não adicionado via CDN');
else ok('jsPDF adicionado via CDN (cdnjs.cloudflare.com/ajax/libs/jspdf)');
if (votSrc.indexOf('jspdf.umd.min.js') < 0) bad('CDN específico UMD não encontrado');
else ok('CDN UMD carregado');

console.log('\n[E] DOSSIEPDF COM FALLBACK');
const dossiePdfMatch = votSrc.match(/function dossiePdf\(\)\{[\s\S]*?^}/m);
if (!dossiePdfMatch) bad('função dossiePdf não encontrada');
else {
  const src = dossiePdfMatch[0];
  if (src.indexOf('jsPDF') < 0 && src.indexOf('jspdf') < 0)
    bad('dossiePdf não usa jsPDF');
  else ok('dossiePdf usa jsPDF');
  if (src.indexOf('doc.save') < 0) bad('não chama doc.save()');
  else ok('chama doc.save() para download direto');
  if (src.indexOf('window.print()') < 0) bad('não tem fallback print-to-PDF');
  else ok('fallback window.print() preservado');
  if (src.indexOf('try') < 0 || src.indexOf('catch') < 0)
    bad('sem try/catch para fallback gracioso');
  else ok('try/catch para fallback em caso de falha do jsPDF');
}

console.log('\n[F] BACKEND VAPID-PUBLIC ENDPOINT');
const srvSrc = read('server/index.js');
if (srvSrc.indexOf('/api/push/vapid-public') < 0) bad('endpoint /api/push/vapid-public ausente');
else ok('endpoint /api/push/vapid-public presente');
if (srvSrc.indexOf('VAPID_PUBLIC_KEY') < 0) bad('não lê VAPID_PUBLIC_KEY do env');
else ok('lê VAPID_PUBLIC_KEY de process.env');

console.log('\n[G] GITIGNORE (proteção de chaves locais)');
const gitignorePath = path.join(ROOT, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gi = fs.readFileSync(gitignorePath, 'utf8');
  if (gi.indexOf('server/data') >= 0 || gi.indexOf('vapid-keys') >= 0)
    ok('.gitignore protege server/data ou vapid-keys');
  else console.log('  ⚠️ .gitignore não menciona server/data/vapid-keys — revise manualmente');
} else {
  console.log('  ⚠️ .gitignore não encontrado');
}

console.log('\n=== RESULTADO: ' + (fails ? ('❌ ' + fails + ' falha(s), ' + passes + ' ok') : ('✅ ' + passes + ' OK')) + ' ===');
process.exit(fails ? 1 : 0);
