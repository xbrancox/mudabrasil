// Gerar par de chaves VAPID para Web Push — SEM dependências externas.
// Usa apenas o módulo `crypto` nativo do Node.js (P-256).
// Rodar com: node scripts/gerar-vapid.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function gerarVAPID() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
  });

  // Chave pública VAPID: ponto EC não-comprimido (65 bytes = 0x04 + X(32) + Y(32))
  const pubJwk = publicKey.export({ format: 'jwk' });
  const x = Buffer.from(pubJwk.x, 'base64url');
  const y = Buffer.from(pubJwk.y, 'base64url');
  const vapidPublicKey = Buffer.concat([Buffer.from([0x04]), x, y]).toString('base64url');

  // Chave privada VAPID: JWK em base64url (formato esperado por web-push)
  const privJwk = privateKey.export({ format: 'jwk' });
  const vapidPrivateKey = Buffer.from(JSON.stringify(privJwk)).toString('base64url');

  return { publicKey: vapidPublicKey, privateKey: vapidPrivateKey };
}

const keys = gerarVAPID();

console.log('');
console.log('======================================');
console.log(' CHAVES VAPID GERADAS (P-256, sem deps)');
console.log('======================================');
console.log('');
console.log('PUBLIC KEY (frontend + backend VAPID_PUBLIC_KEY):');
console.log(keys.publicKey);
console.log('');
console.log('PRIVATE KEY (secreta — VAPID_PRIVATE_KEY no Railway):');
console.log(keys.privateKey);
console.log('');
console.log('SUBJECT (contato do administrador):');
console.log('mailto:contato@seudominio.com');
console.log('');
console.log('======================================');
console.log(' COMO CONFIGURAR NO RAILWAY');
console.log('======================================');
console.log('1. Railway > Project > Service > Variables:');
console.log('   VAPID_PUBLIC_KEY=' + keys.publicKey);
console.log('   VAPID_PRIVATE_KEY=' + keys.privateKey);
console.log('   VAPID_SUBJECT=mailto:seu@email.com');
console.log('');
console.log('2. O frontend (js/push-notifications.js) já busca a chave');
console.log('   pública dinamicamente via GET /api/push/vapid-public.');
console.log('');

// Salvar localmente em .gitignore-friendly path (para referência)
const outPath = path.join(process.cwd(), 'server', 'data', 'vapid-keys.generated.json');
try {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
    warning: 'PRIVADA - nunca commitar. Apenas referência local.'
  }, null, 2));
  console.log('Salvo localmente (não commitar): ' + outPath);
} catch (e) {
  console.log('Não foi possível salvar localmente: ' + e.message);
}
