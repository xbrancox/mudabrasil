// Final SMTP configuration test with Gmail
process.env.SMTP_HOST = 'smtp.gmail.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'euler.branco@gmail.com';
process.env.SMTP_PASS = 'gmail-app-password-here';  // User needs to provide App Password
process.env.SMTP_FROM = 'MeuVoto <contato@meu-voto.app>';
process.env.RESEND_API_KEY = '';
process.env.RESEND_FROM = 'MeuVoto <onboarding@resend.dev>';

const contato = require('./server/contato');

contato.createContato({
  nome: "João Silva",
  email: "joao@exemplo.com",
  assunto: "Teste de contato via Gmail SMTP",
  mensagem: "Esta é uma mensagem de teste para verificar o envio de e-mails pelo formulário de contato."
}).then(r => {
  console.log('RESULT:', JSON.stringify(r, null, 2));
}).catch(e => {
  console.error('ERROR:', e.message);
});