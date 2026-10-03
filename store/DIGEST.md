# 📧 Digest Semanal MeuVoto

## Visão Geral
O sistema de Digest Semanal envia um resumo das votações do Plenário toda segunda-feira para os e-mails inscritos. O fluxo inclui **confirmação por token** para evitar inscrições maliciosas e um **painel admin** para gerenciamento.

## Fluxo do Usuário
1. O usuário acessa `pages/digest.html` e insere seu e-mail.
2. O backend gera um token único e salva o e-mail como "pendente".
3. O frontend exibe um link de confirmação (ou simula o envio do e-mail).
4. O usuário clica no link (`pages/digest-confirm.html?token=XXX`), que valida o token e move o e-mail para a lista de "confirmados".
5. O GitHub Action semanal lê apenas a lista de confirmados e envia o resumo via SMTP.

## Configuração de Secrets (GitHub Actions)
No repositório, vá em **Settings → Secrets and variables → Actions** e adicione:

| Secret | Descrição | Exemplo |
|---|---|---|
| `DIGEST_API` | URL base do backend | `https://meu-voto.app` |
| `DIGEST_SECRET` | Chave secreta para proteger as rotas admin | `uma-string-aleatoria-forte-aqui` |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` ou `smtp.brevo.com` |
| `SMTP_PORT` | Porta do SMTP | `587` (ou `465` para SSL) |
| `SMTP_SECURE` | `true` se a porta for 465, senão `false` | `false` |
| `SMTP_USER` | Usuário do SMTP | `seu-email@gmail.com` |
| `SMTP_PASS` | Senha do SMTP (App Password no Gmail) | `abcd efgh ijkl mnop` |
| `SMTP_FROM` | Remetente (opcional, usa SMTP_USER se vazio) | `MeuVoto <no-reply@seudominio>` |

> **Nota para Gmail:** Use uma "Senha de App" gerada em https://myaccount.google.com/apppasswords, não a senha normal da conta.

## Painel Admin
Acesse `pages/digest-admin.html` no seu site.
1. Insira o valor de `DIGEST_SECRET` no campo de autenticação.
2. Visualize a lista de inscritos **Confirmados** e **Pendentes**.
3. Remova e-mails manualmente se necessário.
4. Use o botão **"🚀 Disparar Digest Manualmente"** para testar o envio sem esperar a segunda-feira.

## Estrutura de Dados
O arquivo `server/data/digest-subscribers.json` armazena os dados no seguinte formato (com migração automática de versões antigas):
```json
{
  "confirmed": ["email1@exemplo.com"],
  "pending": [
    {
      "email": "email2@exemplo.com",
      "token": "a1b2c3d4...",
      "createdAt": "2026-09-28T10:00:00.000Z"
    }
  ]
}
```

## Solução de Problemas
- **"O backend ainda não tem as rotas de digest publicadas"**: O deploy do Railway ainda está em andamento. Aguarde 1-2 minutos e recarregue a página.
- **E-mails não chegando**: Verifique os logs da GitHub Action. Se o SMTP estiver incompleto, o worker executa em modo "dry-run" e imprime o corpo do e-mail no log, sem enviar de fato.
- **Token inválido**: Tokens são de uso único. Se o usuário tentar confirmar duas vezes, a segunda tentativa falhará com segurança.
