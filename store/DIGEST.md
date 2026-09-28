# Digest semanal MeuVoto

Inscricao pela pagina Votacoes (/api/digest/subscribe).
Toda segunda o GitHub Action le /api/digest/list com segredo e envia por SMTP.

Secrets necessarios:
- DIGEST_API
- DIGEST_SECRET
- SMTP_HOST
- SMTP_PORT
- SMTP_SECURE
- SMTP_USER
- SMTP_PASS
- SMTP_FROM (opcional)

Teste manual: Actions > Digest semanal MeuVoto > Run workflow.
Se SMTP estiver incompleto, o worker faz dry-run no log.
