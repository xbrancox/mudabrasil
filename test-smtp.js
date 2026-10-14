// Test SMTP configuration - direct env var test
process.env.SMTP_HOST = 'smtp.gmail.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'euler.branco@gmail.com';
process.env.SMTP_PASS = 'teste123';
process.env.SMTP_FROM = 'MeuVoto <contato@meu-voto.app>';

const contato = require('./server/contato');

contato.createContato({
  nome: "Teste",
  email: "teste@example.com",
  assunto: "Teste de SMTP",
  mensagem: "Esta é uma mensagem de teste do sistema MeuVota."
}).then(r => {
  console.log('RESULT:', JSON.stringify(r, null, 2));
}).catch(e => {
  console.error('ERROR:', e.message);
});