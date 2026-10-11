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

### ⚠️ Risco de Latência em Dados Oficiais

O TSE **não oferece webhooks ou APIs de push**. A única fonte oficial é `divulgacandcontas.tse.jus.br`, um endpoint de dados estáticos (JSON/CSV) sem notificações de atualização.

**Estratégia adotada:**
- **Polling a cada 24h** (`MB_REFRESH_HOURS=24`) para dados do TSE, Câmara e Senado.
- **SSE (`GET /api/stream`)** é usado apenas para eventos internos da plataforma (votos, reclamações), não para dados eleitorais oficiais.
- **Refresh manual** disponível via endpoint administrativo para correções pontuais.

**Risco documentado:** Dados eleitorais oficiais têm latência intrínseca de até 24h. A plataforma **nunca deve se apresentar como "tempo real"** para dados do TSE — apenas para interações entre usuários. Esta limitação deve constar nos Termos de Uso e na descrição das páginas de dados.

| Tipo de Dado | Fonte | Latência Máxima | Atualização |
|-------------|-------|----------------|-------------|
| Candidaturas | TSE DivulgaCand | 24h | Polling automático |
| Situações de julgamento | TSE DivulgaCand | 24h | Polling automático |
| Votos registrados | Plataforma interna | ~1s | SSE (tempo real) |
| Reclamações | Plataforma interna | ~1s | SSE (tempo real) |

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

**Endpoint:** `GET /api/admin/backup`
**Proteção:** `BACKUP_TOKEN` (env var) — token de acesso, obrigatório no header `Authorization: Bearer <token>`
**Formato:** JSON dump de todas as tabelas, opcionalmente criptografado com AES-256-GCM quando `BACKUP_ENCRYPTION_KEY` está definido.

#### Plano de Backup

| Camada | Frequência | Retenção | Destino | Criptografia |
|--------|-----------|----------|---------|-------------|
| Snapshot SQLite | Diário (03h BR) | 30 dias | Railway volume `/data/backups/` | Não |
| Dump JSON (API) | Semanal (segunda, 04h BR) | 90 dias | Cloudflare R2 / S3 compatível | AES-256-GCM |
| Export manual | Sob demanda | Indefinido | Download do administrador | Opcional |

#### Restauração

```bash
# Restaurar snapshot SQLite
curl -X POST http://localhost:8080/api/admin/restore \
  -H "Authorization: Bearer $BACKUP_TOKEN" \
  -H "Content-Type: application/json" \
  -d @backup.json

# Restaurar do Railway volume
cp /data/backups/votos_$(date +%Y%m%d).db server/data/votos.db
```

#### Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `BACKUP_TOKEN` | Token para autenticar endpoints de backup | ✅ Produção |
| `BACKUP_ENCRYPTION_KEY` | Chave AES-256 (32 bytes, base64) para criptografar dumps | Recomendado |
| `BACKUP_RETENTION_DAYS` | Dias de retenção de backups locais (padrão: 30) | Não |
| `BACKUP_REMOTE` | URL do storage remoto (R2/S3) para backups semanais | Não |

#### Auditoria de Backup

- Cada backup registra: timestamp, tamanho, hash SHA-256, tables afetadas.
- Logs armazenados em `server/data/backup.log`.
- Alerta automático se o último backup tiver mais de 25h.

## 🔒 Privacidade e Analytics

### LGPD (Lei Geral de Proteção de Dados)

A plataforma trata dados sensíveis (votos, denúncias) sob as bases legais:

| Base Legal | Art. LGPD | Aplicação |
|-----------|-----------|-----------|
| Consentimento | Art. 11, I | Newsletter (digest) |
| Interesse legítimo | Art. 11, II | Proteção contra fraudes |
| Cumprimento legal | Art. 11, IV | Encaminhamento de denúncias ao TSE/MPE |
| Anonimato | Art. 5, III | Denúncias sem identificação do denunciante |

**Política de retenção:** Dados de voto são mantidos por **5 anos** (prazo eleitoral). Denúncias: 5 anos a contar do encerramento do processo. Dados de analytics: 6 meses.

### Analytics — Recomendações

**Não usar Google Analytics.** Dados de voto são sensíveis; GA coleta IPs, User-Agent e comportamento de navegação sem anonimato total, criando risco de não conformidade com LGPD.

| Ferramenta | Tipo | Custo | LGPD | Observação |
|------------|------|-------|------|------------|
| **Plausible** | SaaS | €9/mês | ✅ | Anonimiza IPs (máscara /24), não rastreia cruzado |
| **Fathom** | SaaS | $14/mês | ✅ | Similar ao Plausible, configuração simples |
| **Matomo (auto-hosted)** | Self-hosted | Servidor + DB | ✅ | Controle total dos dados, pode rodar no próprio Railway |
| **Umami** | Self-hosted | Baixo custo | ✅ | Open source, leve, compatível com Vercel/Railway |

**Configuração recomendada (Matomo no Railway):**

```toml
[env]
MATOMO_URL = "https://analytics.meu-voto.app"
MATOMO_SITE_ID = "1"
ANONIMIZAR_IP = "true"  # Mascara os últimos 2 octetos do IP
```

**Obrigatório em produção:**
- Página de privacidade (`pages/privacidade.html`) descrevendo quais dados são coletados.
- Banner de cookies com opção de recusa (opt-out).
- Nenhum dado de voto associado a identidade — o protocolo é anônimo por design.

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

## 🧪 Testes & Qualidade

### Testes Automatizados

| Tipo | Ferramenta | O que cobre | Critério de aprovação |
|------|-----------|-------------|----------------------|
| **Unit** | Node:test | db.js, auth.js, utils | ≥ 90% de cobertura |
| **Integration** | Supertest | Rotas `/api/voto`, `/api/denuncias`, `/api/health` | 100% das rotas |
| **E2E** | Playwright | Fluxo: voto → conferir → revogar | Sem falhas em 3 runs |
| **Carga** | k6 / Artillery | 100 req/s por 5 min | p95 < 2s |
| **Segurança** | OWASP ZAP | Headers, rate limit, injeção | 0 críticas, 0 altas |

### Critérios de Aceitação

- [ ] Criar voto → consultar por código → revogar → verificar status alterado
- [ ] Criar denúncia → gerar protocolo MV-2026-XXXXXX → consultar → verificar hash
- [ ] Duplo voto simultâneo para mesmo candidato → apenas 1 persiste (transação)
- [ ] Rate limit (60 req/min) → retorna 429 após limite
- [ ] Backup → restaurar → integridade dos records verificada (hash SHA-256)
- [ ] Headers de segurança (HSTS, CSP, nosniff) → validados via ZAP
- [ ] Dados de voto anônimos → nenhum IP/log associado ao código do voto

### Configuração (package.json)

```json
{
  "scripts": {
    "test": "node --test server/test/**/*.test.js",
    "test:e2e": "playwright test tests/e2e/",
    "test:load": "k6 run tests/load/vote-load-test.js",
    "test:security": "docker run --rm -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:8080"
  }
}
```

### Pipeline de CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
      - run: npm run test:security
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: railway up
      - run: curl -sS https://meu-voto.app/api/health | grep '"ok":true'
      - if: failure() → railway rollback
```

## 🏛️ Governança e Comunicação

### Stakeholders

| Grupo | Interesse | Comunicação | Responsável |
|-------|----------|-------------|-------------|
| **Usuários** | Transparência de votos, revogação | Blog, notificações push | Comunicação |
| **Candidatos** | Status de denúncias, respostas | Dashboard + email | Relacionamento |
| **Órgãos (MPE/TSE)** | Dossiês de auditoria | API + email formal | Diretoria |
| **Comunidade técnica** | Bugs, contribuições | GitHub Issues + Discord | Tech Lead |
| **Imprensa** | Reportagens, dados abertos | Press kit + API pública | Diretoria |

### Processo de Release

| Etapa | Responsável | Timing | Critério |
|-------|------------|--------|----------|
| 1. PR review | Tech Lead + 1 revisor | 2h | 2 aprovações + testes passando |
| 2. Staging deploy | CI/CD | Automático | 90s de health check OK |
| 3. Produção deploy | CI/CD | Após staging (1h de observação) | 90s de health check OK |
| 4. Comunicação | Comunicação | Pós-deploy | Banner no site + newsletter |

**Janelas de manutenção:** Semana 2 e 4, 02h–04h (horário de Brasília). Anúncio 48h antes por email + banner no site.

**Rollback automático:** Se `GET /api/health` falhar por 2x consecutivas em 5 minutos após deploy, o Railway faz rollback automático para o commit anterior.

### Decisões de Arquitetura (ADR)

| ADR | Decisão | Status |
|-----|--------|--------|
| ADR-001 | Persistência SQLite nativo (`node:sqlite`) vs Postgres | ✅ Aceito (SQLite) |
| ADR-002 | SSE para eventos internos vs WebSockets | ✅ Aceito (SSE) |
| ADR-003 | API pública sem autenticação | ⚠️ Em discussão |
| ADR-004 | Código de voto anônimo por design | ✅ Aceito |

## 📞 Contato e Suporte

- **Email:** contato@meu-voto.app
- **Domínio:** meu-voto.app
- **Backend:** https://meu-voto.app/api/health

---

*Documento gerado para análise de infraestrutura por IA — Outubro 2026*