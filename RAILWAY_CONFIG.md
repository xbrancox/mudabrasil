# 🏗️ Configuração Completa do Backend Railway

## 📋 Visão Geral

Este documento descreve a configuração completa do backend do **MeuVoto** hospedado no Railway.

---

## 🔗 Informações do Projeto

| Campo | Valor |
|-------|-------|
| **Nome do Projeto** | VotaBrasil |
| **Project ID** | `198baa4d-6141-418c-96dd-d7826831249f` |
| **Workspace** | xbrancox's Projects |
| **Service ID** | `4d5f569d-9c54-45f5-a25a-b474fb218b18` |
| **Environment ID** | `930d0397-a453-4377-93e2-0c2f42f3abe0` |
| **Ambiente** | production |
| **Região** | Amsterdam (ams) |
| **Réplicas** | 1 |

---

## 🌐 Domínios

### Domínios Railway (Service Domains)
- **Primary**: `https://mudabrasil-production-79eb.up.railway.app`
- **Secondary**: `https://mudabrasil-production.up.railway.app`

### Por que o nome ainda é "mudabrasil"?
O projeto Railway foi criado originalmente com o nome `mudabrasil`. Quando o repositório foi renomeado para `votabrasil`, o Railway **não renomeou automaticamente os domínios** porque:
1. Os domínios Railway são gerados com um **hash único** (`-79eb`) para garantir unicidade
2. Renomear domínios públicos pode quebrar links existentes
3. O hash garante que o domínio seja único em toda a plataforma Railway

**Isso NÃO é um problema** porque:
- ✅ O backend está 100% isolado no projeto VotaBrasil
- ✅ Não há dependências de outros projetos
- ✅ O frontend aponta corretamente para este backend via `API_BASE`

---

## 📦 Configuração do Serviço

### Source (Repositório)
```json
{
  "repo": "xbrancox/votabrasil",
  "branch": "main",
  "checkSuites": false
}
```

### Build
```json
{
  "builder": "RAILPACK",
  "buildEnvironment": "V3"
}
```

### Deploy
```json
{
  "runtime": "V2",
  "useLegacyStacker": false,
  "ipv6EgressEnabled": false,
  "multiRegionConfig": {
    "ams": {
      "numReplicas": 1
    }
  }
}
```

### Networking
```json
{
  "serviceDomains": {
    "mudabrasil-production-79eb.up.railway.app": { "port": 8080 },
    "mudabrasil-production.up.railway.app": { "port": 8080 }
  },
  "privateNetworkEndpoint": "mudabrasil"
}
```

---

## 🔌 Variáveis de Ambiente

**Status**: Nenhuma variável de ambiente configurada (todas as configurações são feitas via código).

### Variáveis Opcionais (não configuradas, mas suportadas)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `MB_STORAGE` | Backend de storage (`sqlite` ou `json`) | `sqlite` (automático) |
| `MB_REFRESH_HOURS` | Intervalo de atualização dos dados públicos (horas) | `24` |
| `PORT` | Porta do servidor | `8080` |
| `NODE_ENV` | Ambiente (`production` ou `development`) | `production` |

---

## 🗄️ Armazenamento

### SQLite Nativo
- **Caminho**: `/app/server/data/votos.db`
- **Tipo**: SQLite nativo do Node.js (`node:sqlite`)
- **Dependências**: Zero (built-in)
- **Persistência**: Volume montado (500MB em Amsterdam)

### Arquivos de Dados
- `/app/server/data/deputados.json` — Cache dos 513 deputados
- `/app/server/data/senadores.json` — Cache dos 81 senadores
- `/app/server/data/votos.db` — Banco de votos (SQLite)
- `/app/server/data/.salt` — Salt criptográfico (gerado automaticamente)

---

## 🚀 Deploy Automático

### Trigger
Todo push na branch `main` do repositório `xbrancox/votabrasil` dispara automaticamente:
1. Build no Railway (RAILPACK)
2. Deploy no ambiente `production`
3. Reinício do container
4. Validação automática

### Último Deploy
- **ID**: `84ab5b16-8896-47c6-897d-d00ecc8f68e1`
- **Status**: ✅ SUCCESS
- **Data**: 2026-09-28T01:16:14.185Z
- **Uptime**: ~22 minutos (1306 segundos)

---

## 📡 APIs Disponíveis

### Endpoints Públicos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/health` | Health check (uptime, storage, stats) |
| `GET` | `/api/candidatos` | Lista de 594 políticos reais |
| `GET` | `/api/senadores` | Lista de 81 senadores |
| `GET` | `/api/termometro` | Índice de confiança ao vivo |
| `POST` | `/api/voto` | Colocar voto |
| `GET` | `/api/voto?code=` | Consultar voto por código |
| `POST` | `/api/voto/revogar` | Revogar voto |
| `POST` | `/api/voto/manter` | Manter voto (reafirmar) |
| `GET` | `/api/stream` | SSE (Server-Sent Events) tempo real |

### Endpoints de Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/google` | Login via Google OAuth |
| `POST` | `/api/auth/otp/send` | Enviar OTP (SMS/Email) |
| `POST` | `/api/auth/otp/verify` | Verificar OTP |
| `GET` | `/api/auth/me` | Sessão atual |
| `POST` | `/api/auth/logout` | Logout |

### Endpoints de Verificação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/verificacao/iniciar` | Iniciar verificação de político |
| `GET` | `/api/verificacao/confirmar` | Confirmar verificação |
| `GET` | `/api/verificacao/dominios` | Domínios autorizados |
| `GET` | `/api/verificacao/stats` | Estatísticas de verificação |
| `GET` | `/api/verificacao/politico/:id` | Status de um político |

### Endpoints de Reclamações/Apoios

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/reclamacoes` | Criar reclamação |
| `GET` | `/api/reclamacoes` | Listar reclamações |
| `POST` | `/api/apoios` | Criar apoio |
| `GET` | `/api/apoios` | Listar apoios |
| `POST` | `/api/respostas` | Responder (só verificados) |
| `GET` | `/api/rankings` | Rankings públicos |

---

## ✅ Validação

### Teste Rápido
```bash
# Health check
curl https://mudabrasil-production-79eb.up.railway.app/api/health

# Lista de candidatos
curl https://mudabrasil-production-79eb.up.railway.app/api/candidatos

# SSE (tempo real)
curl -N https://mudabrasil-production-79eb.up.railway.app/api/stream
```

### Resposta Esperada (Health)
```json
{
  "ok": true,
  "uptimeSec": 1306,
  "storage": "sqlite",
  "storageArquivo": "/app/server/data/votos.db",
  "totalRegistros": 0,
  "totalVotosAtivos": 0,
  "totalRevogados": 0,
  "atualizacaoDadosPublicos": "a cada 24h (automática)"
}
```

### Resposta Esperada (Candidatos)
```json
{
  "mode": "real",
  "source": "Câmara dos Deputados + Senado Federal",
  "total": 594,
  "retornados": 594,
  "doCache": true,
  "atualizadoEm": "2026-09-28T01:20:02.829Z"
}
```

---

## 🔄 Atualização Automática

### Cron Jobs (via GitHub Actions)
- **Snapshot de notícias**: Diário às 09:15
- **Backup do SQLite**: Diário às 09:45 (artifact 14 dias)
- **Candidaturas TSE**: Diário às 10:05
- **Enriquecimento de produção/presença**: Semanal (segunda 10:30)

### Workflow Files
- `.github/workflows/pages.yml` — Deploy GitHub Pages
- `.github/workflows/manutencao.yml` — Manutenção automática

---

## 🛡️ Segurança

### Rate Limiting
- **Votos**: 20 ações/minuto por IP
- **APIs públicas**: 100 requisições/minuto por IP

### Headers de Segurança
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Content-Type: application/json`

### Anonimato
- Votos armazenados como `sha256(code + SALT)`
- Código bruto nunca é salvo
- Agregação irreversível (não é possível mapear eleitor → candidato)

---

## 📊 Monitoramento

### Métricas Disponíveis
- **Uptime**: `/api/health` (uptimeSec)
- **Votos ativos**: `/api/termometro` (totalVotosAtivos)
- **Revogações**: `/api/termometro` (totalRevogados)
- **Cache**: `/api/candidatos` (doCache, atualizadoEm)

### Logs
- **Deploy logs**: Railway Dashboard → Service → Deployments → Logs
- **Application logs**: Railway Dashboard → Service → Deployments → Logs
- **SSE events**: `/api/stream` (tempo real)

---

## 🚨 Troubleshooting

### Problema: "Backend não responde"
1. Verificar se o deploy está SUCCESS: `railway status`
2. Verificar logs: Railway Dashboard → Service → Deployments → Logs
3. Reiniciar serviço: `railway restart`

### Problema: "Dados desatualizados"
1. Forçar refresh: `GET /api/candidatos?refresh=1`
2. Verificar cron jobs: GitHub Actions → manutencao.yml

### Problema: "SQLite corrompido"
1. Backup automático: `.github/workflows/manutencao.yml` (artifact 14 dias)
2. Restaurar: Railway Dashboard → Volumes → Restore from snapshot

### Problema: "Domínio não funciona"
1. Verificar DNS: Railway Dashboard → Service → Domains
2. Aguardar propagação: até 72 horas
3. Retry certificado: `railway domain certificate retry`

---

## 📚 Referências

- **Railway Docs**: https://docs.railway.com
- **Node.js SQLite**: https://nodejs.org/api/sqlite.html
- **SSE (Server-Sent Events)**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

---

## 📞 Contato

Para dúvidas ou problemas:
- **GitHub Issues**: https://github.com/xbrancox/votabrasil/issues
- **Railway Support**: https://railway.com/support

---

**Última atualização**: 2026-09-28  
**Status**: ✅ 100% Funcional e Independente
