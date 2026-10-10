# VotaBrasil / MeuVoto — Infraestrutura e Deploy

## 📦 Visão Geral do Projeto

Plataforma cívica de transparência legislativa e cobrança cidadã, com:
- Acompanhamento de parlamentares e votações nominais
- Sistema de revogação de votos (confiança)
- Dados oficiais do TSE, Câmara e Senado
- API REST com persistência SQLite
- PWA (Progressive Web App)

## 🔗 Repositórios e URLs

| Serviço | URL | Função |
|---------|-----|--------|
| **GitHub (origin)** | `https://github.com/xbrancox/mudabrasilv4` | Repositório principal |
| **GitHub (site)** | `https://github.com/xbrancox/mudabrasil` | Repositório secundário |
| **Railway (Backend)** | `https://meu-voto.app` | API + Frontend em produção |
| **Cloudflare** | `meu-voto.app` | DNS + CDN + Proxy reverso |

## 📁 Estrutura de Arquivos

```
votabrasil/
├── index.html                    # Página inicial (landing page)
├── package.json                  # Dependências Node.js
├── railway.toml                  # Configuração Railway
├── Dockerfile                    # Build em produção
├── server/
│   ├── index.js                  # Servidor HTTP + API REST
│   ├── db.js                     # Camada de dados (SQLite/JSON)
│   ├── tse.js                    # Dados candidatos TSE
│   ├── ingest.js                 # Ingestão Câmara dos Deputados
│   ├── senado.js                 # Ingestão Senado Federal
│   ├── votes.js                  # Votos e revogações
│   ├── auth.js                   # Autenticação (Google, OTP)
│   ├── verificacao.js            # Verificação de parlamentares
│   ├── reclamacoes.js            # Reclamações e apoios
│   ├── fundo-eleitoral.js        # API Fundo Eleitoral
│   └── seed_pls.js               # Seed de PLs
├── pages/
│   ├── eleicoes-2026.html        # Página de eleições (TSE)
│   ├── parlamentares.html        # Radar político
│   ├── congresso.html            # PLs em tramitação
│   ├── votacoes.html             # Votações nominais
│   ├── iniciativa-cidada.html    # Iniciativa legislativa
│   ├── fundo-eleitoral.html      # Dados FEFC
│   ├── links.html                # Hub de links
│   ├── termos.html               # Termos de uso
│   └── privacidade.html          # Política de privacidade
├── app/                          # PWA (Progressive Web App)
│   ├── index.html
│   ├── app.css
│   ├── app.js
│   └── manifest.json
├── data/
│   ├── candidatos-2026.json      # Snapshot candidatos TSE
│   ├── deputados.json            # Cache deputados
│   ├── senadores.json            # Cache senadores
│   └── votos.db                  # SQLite (produção)
└── scripts/
    ├── deploy.sh                 # Script deploy Unix
    ├── deploy.ps1                # Script deploy Windows
    └── enriquecer-*.js           # Scripts de enriquecimento
```

## 🚀 Deploy e Configuração

### Railway (Backend + Frontend)

**Arquivo:** `railway.toml`

```toml
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "node server/index.js"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"

[env]
PORT = "8080"
NODE_ENV = "production"
MB_REFRESH_HOURS = "24"
MB_STORAGE = "sqlite"
DB_PATH = "/data/votos.db"
```

**Variáveis de Ambiente (Railway):**
- `PORT=8080` — Porta do servidor
- `NODE_ENV=production` — Ambiente
- `MB_STORAGE=sqlite` — Backend de dados
- `DB_PATH=/data/votos.db` — Caminho do SQLite (volume persistente)
- `MB_REFRESH_HOURS=24` — Atualização de dados públicos

**Volume Persistente:**
- Mount path: `/data`
- Usado para: `votos.db`, `deputados.json`, `senadores.json`, `cobrancas.json`

### Dockerfile (Produção)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "server/index.js"]
```

### Cloudflare (DNS + CDN)

**Domínio:** `meu-voto.app`

**Configuração DNS:**
```
Tipo: A
Nome: @
Conteúdo: <IP do Railway>
Proxy: Ativado (laranja)
TTL: Automático
```

**Configurações de Cache:**
- Cache Level: Standard
- Browser Cache TTL: 4 horas
- Auto Minify: HTML, CSS, JS ativados
- Brotli: Ativado
- HTTP/2: Ativado
- HTTP/3: Ativado

**Regras de Page Rules:**
1. `meu-voto.app/api/*` → Cache Level: Bypass
2. `meu-voto.app/*` → Cache Level: Cache Everything (TTL 4h)

## 🔌 API Endpoints

### Dados Públicos (GET)

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/candidatos` | Lista de deputados (dados reais) |
| `GET /api/candidatos/:id` | Detalhe + enriquecimento |
| `GET /api/senadores` | Lista de senadores |
| `GET /api/candidatos-tse` | Candidatos TSE 2026 (com filtros) |
| `GET /api/noticias` | Notícias políticas (RSS) |
| `GET /api/pls` | Proposições legislativas |
| `GET /api/votos-pl` | Agregado de votos em PLs |
| `GET /api/termometro` | Termômetro político |
| `GET /api/health` | Saúde do serviço |

### Voto e Revogação

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /api/voto` | POST | Registrar voto de confiança |
| `POST /api/voto/revogar` | POST | Revogar voto (código) |
| `POST /api/voto/manter` | POST | Reafirmar voto |
| `GET /api/voto?code=` | GET | Ver voto (mascarado) |

### Denúncias / Alerta Cidadão

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /api/denuncias` | POST | Criar denúncia com protocolo `MV-2026-XXXXXX` |
| `GET /api/denuncias/consulta?protocolo=` | GET | Consultar denúncia por protocolo |

### Autenticação

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /api/auth/google` | POST | Login com Google OAuth |
| `POST /api/auth/otp/send` | POST | Enviar OTP (SMS/WhatsApp) |
| `POST /api/auth/otp/verify` | POST | Verificar OTP |
| `POST /api/auth/me` | GET | Dados do usuário |
| `POST /api/auth/logout` | POST | Logout |

### Verificação de Parlamentares

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /api/verificacao/solicitar` | POST | Iniciar verificação |
| `POST /api/verificacao/confirmar` | POST | Confirmar verificação |
| `GET /api/verificacao/dominios` | GET | Domínios válidos |
| `GET /api/verificacao/stats` | GET | Estatísticas |

### Reclamações e Apoios

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /api/reclamacoes` | POST | Criar reclamação |
| `POST /api/apoios` | POST | Criar apoio |
| `POST /api/respostas` | POST | Resposta do político |
| `GET /api/rankings` | GET | Rankings de reclamações/apoios |

### Digest (Newsletter Semanal)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /api/digest/subscribe` | POST | Assinar newsletter |
| `POST /api/digest/unsubscribe` | POST | Cancelar assinatura |
| `GET /api/digest/status` | GET | Status da assinatura |
| `GET /api/digest/last` | GET | Último digest enviado |
| `GET /api/digest/archive` | GET | Arquivo de digests |

### Tempo Real (SSE)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `GET /api/stream` | GET | Server-Sent Events (votos, reclamações) |

## 📊 Dados e Fontes

### Fontes Oficiais

| Fonte | API/URL | Dados |
|-------|---------|-------|
| **TSE** | `divulgacandcontas.tse.jus.br` | Candidatos, situações, fotos, bens |
| **Câmara** | `dadosabertos.camara.leg.br` | Deputados, votações, proposições |
| **Senado** | `legis.senado.leg.br/dadosabertos` | Senadores, votações, autorias |
| **Portal da Transparência** | `portaldatransparencia.gov.br` | Gastos, rendimentos |

### Arquivos de Dados

| Arquivo | Conteúdo | Atualização |
|---------|----------|-------------|
| `data/candidatos-2026.json` | Snapshot TSE 2026 (19.893 candidatos) | Manual/Script |
| `server/data/deputados.json` | Cache deputados | Automática (24h) |
| `server/data/senadores.json` | Cache senadores | Automática (24h) |
| `server/data/votos.db` | SQLite com votos, denúncias, usuários | Persistente (volume) |

## 🔐 Segurança

### Headers de Segurança (server/index.js)

```javascript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; ..."
}
```

### Rate Limiting

- **Janela:** 1 minuto
- **Limite:** 60 requisições por IP/minuto
- **Resposta:** 429 Too Many Requests

### Backup

- **Endpoint:** `GET /api/admin/backup`
- **Proteção:** `BACKUP_TOKEN` (env var)
- **Formato:** JSON dump de todas as tabelas

## 📱 PWA (Progressive Web App)

**Local:** `app/`

- `index.html` — App de votação
- `app.css` — Estilos
- `app.js` — Lógica do app
- `manifest.json` — Manifesto PWA
- `sw.js` — Service Worker (offline)

**Funcionalidades:**
- Voto com código de 20 dígitos
- Conferência de voto
- Revogação de confiança
- Funciona offline (cache)

## 🛠️ Scripts de Deploy

### Unix (deploy.sh)

```bash
#!/bin/bash
# Deploy para produção (Railway + Cloudflare)
git pull origin main
npm install
node server/index.js &
```

### Windows (deploy.ps1)

```powershell
# Deploy para produção
git pull origin main
npm install
node server/index.js
```

## 📝 Comandos Úteis

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar servidor local
node server/index.js

# Acessar localmente
http://localhost:8080/
```

### Produção (Railway)

```bash
# Ver logs
railway logs

# Ver variáveis de ambiente
railway variables

# Deploy manual
railway up
```

### Git

```bash
# Push para ambos remotos
git push origin main
git push site main

# Ver status
git status --short

# Ver commits recentes
git log --oneline -5
```

## 📞 Contato e Suporte

- **Email:** contato@meu-voto.app
- **Domínio:** meu-voto.app
- **Backend:** https://meu-voto.app/api/health

---

*Documento gerado para análise de infraestrutura por IA — Outubro 2026*