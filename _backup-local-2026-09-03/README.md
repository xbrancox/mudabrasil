# 🚀 STATUS DO PROJETO — ATUALIZADO

## ✅ O QUE ESTÁ FUNCIONANDO AGORA

### Backend (Railway) — **PRODUÇÃO**
- **URL:** https://mudabrasil-production-79eb.up.railway.app
- **Status:** ✅ Ativo (200 OK)
- **Teste:** https://mudabrasil-production-79eb.up.railway.app/api/health
- **Retorno:**
  ```json
  {
    "ok": true,
    "uptimeSec": 1762,
    "storage": "sqlite",
    "totalRegistros": 0,
    "atualizacaoDadosPublicos": "a cada 24h (automática)"
  }
  ```
- **Dados:** 513 deputados reais da Câmara
- **Deploy:** Dockerfile + Node 22 + SQLite nativo

### Frontend (GitHub Pages) — **DEMO**
- **URL:** https://xbrancox.github.io/mudabrasil/
- **Status:** ✅ Ativo
- **Config:** `config.js` aponta pro backend Railway

## 📁 ESTRUTURA FINAL NO TEU PC

```
C:\Users\euler\MudaBrasil\
├── .dockerignore          (ignora votos.db)
├── .gitignore             (ignora node_modules)
├── config.js              ← API_BASE = Railway ✅
├── deploy-direct.ps1      (deploy via Railway CLI)
├── Dockerfile             (Node 22-alpine)
├── index.html             ← versão aprovada ✅
├── package.json           (backend)
├── Procfile               (web: node server/index.js)
├── push-frontend.bat      ← EXECUTA ESSE! 🎯
├── push-frontend.ps1      (alternativa PowerShell)
├── railway.toml           (healthcheck /api/health)
├── README.md              (este)
├── server/
│   ├── auth.js            (Google/Email/SMS OTP)
│   ├── db.js              (SQLite nativo)
│   ├── index.js           (HTTP + 40+ rotas)
│   ├── ingest.js          (Câmara deputados)
│   ├── reclamacoes.js     (CRUD reclamações)
│   ├── seed_pls.js        (PLs exemplo)
│   ├── senado.js          (Senado Federal)
│   ├── verificacao.js     (selo @camara/@senado)
│   └── votes.js           (motor voto contínuo)
└── MudaBrasil/            ← pasta que o GitHub Pages lê
    ├── config.js          ← mesmo da raiz (backend)
    └── index.html         ← mesmo da raiz (frontend)
```

## 🎯 ÚLTIMO PASSO — PUSH PRO GITHUB

**Execute este arquivo:** `C:\Users\euler\MudaBrasil\push-frontend.bat`

O que ele faz automaticamente:
1. Adiciona a pasta `MudaBrasil/` + `config.js` + `index.html`
2. Faz commit com mensagem automática
3. Dá push pro repo `xbrancox/mudabrasil` (branch `main`)
4. GitHub Actions roda o deploy em ~1 minuto

## 🌐 DEPOIS DO PUSH

- **Frontend:** https://xbrancox.github.io/mudabrasil/
- **Backend:** https://mudabrasil-production-79eb.up.railway.app
- **Teste:** pesquise um deputado (ex: "Aécio Neves") → dados reais da Câmara
- **Próximas fases:** selo real, reclamações persistentes, votos ao vivo (SSE)

## 🔧 PRÓXIMAS FASES (automatizáveis)

### Fase A — Selo de verificação REAL
- Político loga com email `@camara.leg.br` ou `@senado.leg.br`
- Backend envia código → valida → concede selo
- Só verificado responde reclamações

### Fase B — Reclamações persistentes
- POST `/api/reclamacoes` → salva no SQLite do Railway
- GET `/api/reclamacoes?politicoId=X` → todos os usuários veem

### Fase C — Votos ao vivo (SSE)
- `/api/stream` → reclamações novas aparecem em tempo real

### Fase D — Votações nominais + presença
- Cron 24h puxa `/votacoes` global + filtra por deputado
- Backend enriquece `/api/candidatos/:id`

## 📊 ARQUITETURA

```
[GitHub Pages]
  └── index.html + config.js (API_BASE = Railway)
       ↓
  [Browser] → fetch(Railway/api/...) → [Railway Container]
       ↓                                      ↓
  [Câmara API] ←── (ingest 24h) ── [SQLite] ← (reclamações/votos)
```

## 💡 COMO ATUALIZAR O FRONTEND

1. Edita `C:\Users\euler\MudaBrasil\index.html`
2. Copia pra `C:\Users\euler\MudaBrasil\MudaBrasil\index.html`
3. Roda `push-frontend.bat`
4. Pages atualiza em ~1 min

---

**Última atualização:** 02/09/2026
**Backend:** ✅ Produção (Railway)
**Frontend:** ⚠️ Aguardando push final
