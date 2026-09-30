// Gerar par de chaves VAPID para Web Push.
// Rodar com: node scripts/gerar-vapid.js
// Requer: npm install web-push --no-save (executado sob demanda)
const cp = require('child_process');
const path = require('path');

try {
  require.resolve('web-push');
} catch (e) {
  console.log('web-push nao instalado; instalando localmente (nao salva no package.json)...');
  cp.spawnSync(process.execPath, [require.resolve('npm/bin/npm-cli.js'),'install','web-push','--no-save'], { stdio: 'inherit' });
}

try {
  const wp = require('web-push');
  const keys = wp.generateVAPIDKeys();
  console.log('\n=== CHAVES VAPID GERADAS ===');
  console.log('Publica (vai para o frontend / js/push-notifications.js):');
  console.log(keys.publicKey);
  console.log('\nPrivada (vai para secrets do Railway como VAPID_PRIVATE_KEY):');
  console.log(keys.privateKey);
  console.log('\nSubject (seu e-mail ou URL de contato):');
  console.log('mailto:contato@seudominio.com');
  console.log('\n=== COMO CONFIGURAR ===');
  console.log('1. Railway > Settings > Variables:');
  console.log('   VAPID_PUBLIC_KEY=' + keys.publicKey);
  console.log('   VAPID_PRIVATE_KEY=' + keys.privateKey);
  console.log('   VAPID_SUBJECT=mailto:seu@email.com');
  console.log('2. No frontend (js/push-notifications.js), substituir applicationServerKey pela chave publica acima.');
} catch (e) {
  console.error('Falha ao gerar chaves: ' + e.message);
  process.exit(1);
}
