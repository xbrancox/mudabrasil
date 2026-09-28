# 📧 Configuração do Digest Semanal MeuVoto

Este documento explica como ativar o envio automático de e-mails semanais com o resumo das votações.

## 1. O que o sistema faz
- Os usuários se inscrevem via página **Votações** ou na página dedicada **Digest** (`/pages/digest.html`).
- Os e-mails são salvos no backend em `server/data/digest-subscribers.json`.
- Toda **segunda-feira às 12:00 UTC**, o GitHub Action (`digest.yml`) é acionado.
- O worker (`scripts/digest-send.js`) consulta os inscritos, monta o resumo das últimas votações e envia via SMTP.

## 2. Secrets necessários no GitHub
Vá em **Settings > Secrets and variables > Actions** do repositório `xbrancox/votabrasil` e adicione os seguintes **Repository secrets**:

| Nome do Secret | Descrição / Exemplo |
|---|---|
| `DIGEST_API` | URL base do backend. Ex: `https://mudabrasil-production-79eb.up.railway.app` |
| `DIGEST_SECRET` | Uma string aleatória forte para proteger a rota `/api/digest/list`. Ex: `a8f9d2k3j4h5g6` |
| `SMTP_HOST` | Servidor SMTP. Ex: `smtp.gmail.com`, `smtp.sendgrid.net`, `smtp.brevo.com` |
| `SMTP_PORT` | Porta do SMTP. Ex: `587` (TLS) ou `465` (SSL) |
| `SMTP_SECURE` | `true` se usar porta 465, `false` se usar 587 |
| `SMTP_USER` | Usuário ou e-mail da conta SMTP |
| `SMTP_PASS` | Senha da conta SMTP ou App Password (no Gmail, use "Senhas de app") |
| `SMTP_FROM` | *(Opcional)* Remetente exibido. Ex: `MeuVoto <no-reply@seudominio.com>`. Se vazio, usa `SMTP_USER`. |

## 3. Como testar manualmente
1. No GitHub, vá na aba **Actions**.
2. Clique em **Digest semanal MeuVoto** no menu à esquerda.
3. Clique no botão **Run workflow** (canto superior direito) e confirme.
4. Observe os logs. Se os secrets SMTP estiverem incompletos, o worker fará um **dry-run** e imprimirá o corpo do e-mail no log, sem enviar de fato.

## 4. Segurança e Privacidade
- A rota `/api/digest/list` é protegida pelo `DIGEST_SECRET`. Sem ele, retorna `403 Forbidden`.
- A lista de e-mails é armazenada em texto plano no servidor (`digest-subscribers.json`). Recomenda-se que o mantenedor do backend faça backups regulares desse arquivo.
- O usuário pode cancelar a inscrição a qualquer momento pela página de Digest, removendo seu e-mail da lista imediatamente.

## 5. Solução de Problemas
- **Erro "sem permissao"**: Verifique se `DIGEST_SECRET` no GitHub Action é exatamente igual ao definido nas variáveis de ambiente do Railway (se o backend precisar validar localmente) ou se a lógica de comparação no `server/index.js` está correta.
- **Erro de autenticação SMTP**: No Gmail, senhas normais não funcionam mais. É necessário gerar uma "Senha de app" em https://myaccount.google.com/apppasswords.
- **E-mails indo para Spam**: Configure os registros SPF, DKIM e DMARC no seu domínio de e-mail.