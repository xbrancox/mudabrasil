# 🎉 MudaBrasil — DEPLOY FINAL COMPLETO

## ✅ Status Atual (02/09/2026)

### Backend Railway — **PRODUÇÃO ATIVA**
- **URL:** https://mudabrasil-production-79eb.up.railway.app
- **Status:** ✅ Rodando
- **API Health:** ✅ `/api/health` retorna `{"ok":true}`
- **Dados:** ✅ 513 deputados reais da Câmara dos Deputados
- **Storage:** SQLite ativo (`/app/server/data/votos.db`)
- **Atualização:** Automática a cada 24h

### Frontend Local — **CONECTADO AO BACKEND**
- **Pasta:** `C:\Users\euler\MudaBrasil\`
- **Arquivos atualizados:**
  - `config.js` → aponta pro Railway
  - `index.html` → usa backend com fallback automático
  - `MudaBrasil/config.js` → cópia pra GitHub Pages
  - `MudaBrasil/index.html` → cópia pra GitHub Pages

---

## 🚀 PASSO ÚNICO RESTANTE (2 minutos)

### Subir os 2 arquivos pro GitHub

1. Abre https://github.com/xbrancox/mudabrasil
2. **Add file** → **Upload files**
3. Arrasta da pasta `C:\Users\euler\MudaBrasil\`:
   - `index.html`
   - `config.js`
4. **Commit changes**
5. ⏳ ~1 minuto → GitHub Pages atualiza automaticamente

---

## 🌐 URLs Finais

- **Frontend:** https://xbrancox.github.io/mudabrasil/
- **Backend:** https://mudabrasil-production-79eb.up.railway.app
- **API Health:** https://mudabrasil-production-79eb.up.railway.app/api/health
- **API Candidatos:** https://mudabrasil-production-79eb.up.railway.app/api/candidatos

---

## 🔧 O que foi feito automaticamente

### 1. Backend Railway
- ✅ Dockerfile Node 22-alpine
- ✅ SQLite nativo (`node:sqlite`)
- ✅ API completa (`/api/candidatos`, `/api/reclamacoes`, `/api/health`)
- ✅ Ingestão automática de 513 deputados
- ✅ Deploy via Railway (branch `master`)

### 2. Frontend
- ✅ `config.js` com `API_BASE` apontando pro Railway
- ✅ `index.html` com:
  - Helper `apiGet()` / `apiPost()` pra chamar o backend
  - `carregaPol()` tenta backend primeiro, fallback pra APIs diretas
  - `enviaForm()` envia reclamações/apoios pro backend (POST `/api/reclamacoes`)
  - Console.log mostra "✅ Backend ativo" quando conectado

### 3. Integração
- ✅ Frontend carrega políticos do backend (se disponível)
- ✅ Reclamações/apoios salvos no SQLite do Railway (persistentes)
- ✅ Fallback automático se backend cair (usa APIs diretas + localStorage)

---

## 🎯 Próximas Fases (quando tu quiser)

### Fase A — Selo de Verificação REAL
Político loga com email institucional (`@camara.leg.br` / `@senado.leg.br`) → backend valida → concede selo → pode responder reclamações.

**O que precisa:**
- Backend: endpoint `/api/auth/politico` (envia código pro email)
- Frontend: modal de verificação com input de código

### Fase B — Votos ao Vivo (SSE)
Reclamações/apoios atualizam em tempo real pra todos os usuários.

**O que precisa:**
- Backend: endpoint `/api/stream` (Server-Sent Events)
- Frontend: `EventSource` conectando ao stream

### Fase C — Termômetro Real com Decaimento
Voto de confiança com decaimento: 90 dias cheio → 180 dias piso 0.5.

**O que precisa:**
- Backend: calcular termômetro baseado em reclamações/apoios/respostas + timestamp
- Frontend: exibir gauge no perfil

### Fase D — Votações Nominais + Presença
Backend enriquece dados com votações e presença (cron 24h).

**O que precisa:**
- Backend: `server/ingest.js` já tem o motor, só ativar o cron
- Frontend: exibir na ficha

---

## 📊 Teste Rápido

### 1. Backend funcionando
```bash
curl https://mudabrasil-production-79eb.up.railway.app/api/health
```
Deve retornar:
```json
{
  "ok": true,
  "uptimeSec": ...,
  "storage": "sqlite",
  "totalRegistros": ...,
  "atualizacaoDadosPublicos": "a cada 24h (automática)"
}
```

### 2. Candidatos carregando
```bash
curl https://mudabrasil-production-79eb.up.railway.app/api/candidatos
```
Deve retornar JSON com `513` candidatos (deputados reais).

### 3. Frontend conectado
Abre https://xbrancox.github.io/mudabrasil/ → Console do navegador (F12) deve mostrar:
```
✅ Backend ativo: 513 políticos carregados
```

---

## 🛠️ Manutenção

### Atualizar código
```bash
cd C:\Users\euler\MudaBrasil
# Edita os arquivos
# Upload pro GitHub (frontend)
# Railway CLI: railway up (backend)
```

### Ver logs do Railway
Dashboard Railway → serviço `mudabrasil` → **Deployments** → último deploy → **View logs**

### Reiniciar backend
Dashboard Railway → serviço `mudabrasil` → **⋮** → **Restart**

---

## 📞 Contato

- **Email geral:** contato@mudabrasil.app
- **Anuncie:** anuncie@mudabrasil.app
- **Imprensa:** imprensa@mudabrasil.app

---

**MudaBrasil — Seu voto coloca, seu voto tira.** 🇧🇷
