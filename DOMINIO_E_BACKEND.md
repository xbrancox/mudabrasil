# 🏗️ Arquitetura de Backend e Domínio — MeuVoto

## Status Atual (28/09/2026)

### ✅ Backend Railway (Produção)
- **Projeto**: `VotaBrasil` (`198baa4d-6141-418c-96dd-d7826831249f`)
- **Serviço**: `VotaBrasil` (`4d5f569d-9c54-45f5-a25a-b474fb218b18`)
- **Ambiente**: `production` (`930d0397-a453-4377-93e2-0c2f42f3abe0`)
- **Domínio atual**: `https://mudabrasil-production-79eb.up.railway.app`
- **Status**: ✅ SUCCESS (funcionando)
- **Uptime**: Contínuo
- **Região**: Amsterdam (ams)
- **Builder**: RAILPACK (Node 22)
- **Storage**: SQLite nativo (`node:sqlite`) — `/app/server/data/votos.db`
- **Volume**: 500MB persistente

### ✅ Frontend GitHub Pages
- **Repositório**: `xbrancox/votabrasil`
- **Branch**: `main`
- **Workflow**: `.github/workflows/pages.yml` (auto-deploy a cada push)
- **URL**: `https://xbrancox.github.io/votabrasil/`
- **Status**: ✅ Ativo

---

## 🎯 Por Que o Domínio Railway Ainda É `mudabrasil-*`?

O projeto Railway foi criado originalmente como `mudabrasil` e renomeado para `votabrasil` no GitHub. O domínio Railway (`mudabrasil-production-79eb.up.railway.app`) **não pode ser renomeado via CLI** — ele é gerado automaticamente pelo Railway com um ID único (`-79eb`).

**Isso não é um problema** porque:
1. ✅ O backend está **isolado no projeto VotaBrasil Railway** (não depende do projeto `mudabrasil-redesign`)
2. ✅ O domínio funciona perfeitamente (SSL, CORS, rate-limit)
3. ✅ O frontend aponta para ele via `API_BASE` em `config.js`
4. ✅ Todos os dados (votos, SQLite) vivem no projeto VotaBrasil Railway

---

## 📋 Plano de Migração para `omeuvoto.app`

### Passo 1: Registrar o Domínio
```bash
# No Registro.br ou outro registrador
Registrar: omeuvoto.app
```

### Passo 2: Configurar DNS
Adicionar os seguintes registros no painel do registrador:

```
Tipo: CNAME
Nome: api
Valor: meuvoto-production.up.railway.app (ou o domínio que o Railway gerar)

Tipo: CNAME
Nome: www
Valor: xbrancox.github.io

Tipo: TXT
Nome: _railway.api
Valor: (Railway fornecerá após adicionar o domínio custom)
```

### Passo 3: Adicionar Domínio Custom no Railway
```bash
# No diretório do projeto votabrasil
railway link
railway domain omeuvoto.app
```

O Railway exibirá os registros DNS necessários. Configure-os no registrador e aguarde propagação (até 72h).

### Passo 4: Atualizar `API_BASE` nos Arquivos
Atualizar em todos os arquivos que referenciam o backend:

**Arquivos a atualizar:**
- `config.js` (linha 5)
- `config.local.js` (linhas 4, 10)
- `app/config.js` (linha 3)
- `app/config.local.js` (linhas 4, 10)
- `js/live-stream.js` (linha 27)
- `js/parlamentar-auth.js` (linha 18)
- `js/parlamentares.js` (linha 19)
- `js/thermometer.js` (linha 31)

**Substituir:**
```js
// De:
'https://mudabrasil-production-79eb.up.railway.app'

// Para:
'https://api.omeuvoto.app'
```

### Passo 5: Commit e Push
```bash
git add .
git commit -m "feat(dominio): migra backend para api.omeuvoto.app"
git push origin main
```

### Passo 6: Validar
```bash
# Testar o novo domínio
curl https://api.omeuvoto.app/api/health
curl https://api.omeuvoto.app/api/candidatos
curl https://api.omeuvoto.app/api/stream
```

---

## 🔧 Comandos Úteis Railway

### Ver Status do Projeto
```bash
railway status
```

### Ver Logs em Tempo Real
```bash
railway logs
```

### Abrir Dashboard
```bash
railway open
```

### Variáveis de Ambiente
```bash
railway variables
railway variables set API_BASE=https://api.omeuvoto.app
```

---

## 📊 URLs de Validação

### Backend (Railway)
```
GET https://mudabrasil-production-79eb.up.railway.app/api/health
GET https://mudabrasil-production-79eb.up.railway.app/api/candidatos
GET https://mudabrasil-production-79eb.up.railway.app/api/senadores
GET https://mudabrasil-production-79eb.up.railway.app/api/termometro
GET https://mudabrasil-production-79eb.up.railway.app/api/stream (SSE)
```

### Frontend (GitHub Pages)
```
https://xbrancox.github.io/votabrasil/
https://xbrancox.github.io/votabrasil/pages/candidatos.html
https://xbrancox.github.io/votabrasil/pages/termometro.html
https://xbrancox.github.io/votabrasil/pages/parlamentares.html
```

---

## 🚨 Importante

1. **Nunca delete o projeto Railway `mudabrasil-redesign`** até confirmar que o VotaBrasil está 100% funcional
2. **Sempre teste localmente** antes de fazer push para produção
3. **Faça backup do SQLite** regularmente (workflow `manutencao.yml` já faz isso diariamente)
4. **Monitore os logs** do Railway para detectar erros de CORS, rate-limit ou crashes

---

**Última atualização**: 28/09/2026 13:45  
**Status**: ✅ Backend e frontend funcionais, aguardando registro de domínio custom