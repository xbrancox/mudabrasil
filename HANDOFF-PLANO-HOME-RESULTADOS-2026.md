# Handoff — Home 2º Turno + Página de Resultados 1º Turno (Dados Oficiais)

**Criado em:** 14/10/2026
**Status:** ✅ HOME CONCLUÍDA · PÁGINA RESULTADOS PENDENTE
**Próxima sessão:** Continuar com página `resultados-2026.html`

---

## ✅ O QUE FOI CONCLUÍDO

### Home Page (`index.html`) — commit 57e41f3
- ✅ Conteúdo original recuperado (Conferir Voto, Revogar, Quem Somos, Explore, Como Funciona, Notícias, Provas de impacto)
- ✅ Cards Lula × Flávio com **fotos oficiais do TSE** (GitHub: FBR280002542548_div.jpg e FBR280002551544_div.jpg)
- ✅ Faixa-resumo com dados reais: Flávio 47,03% × Lula 45,16%
- ✅ Seção de pesquisas Datafolha (52%×48% válidos), Quaester (em divulgação), Futura, Ipec, Gerp, Indexa
- ✅ Seção de governadores por estado (27 UFs, seletor funcional)
- ✅ Disclaimer claro: "PESQUISAS DE OPINIÃO — NÃO REPRESENTAM VOTOS REAIS"
- ✅ Removido card de pesquisa simulada (67%×33%)
- ✅ Removida seção "Resultado Real" com dados fictícios
- ✅ Footer atualizado com fontes TSE
- ✅ CSS `eleicoes-2026.css` criado e adicionado
- ✅ JS `home-2026.js` criado com `carregarPesquisasPresidente()` e `carregarGovernadores()`
- ✅ `AI-CONFIG.md` atualizado com instruções para futuras IAs

---

## 🔄 PENDENTE — Próxima Sessão

### Página `pages/resultados-2026.html`
- ❌ Criar página com dados reais do TSE
- ❌ Carregar `data/presidente-2026.json` (12 candidatos, Flávio 56.104.503 votos, Lula 53.879.538)
- ❌ Carregar `data/governadores-2026.json` (27 UFs, 21 eleitos 1º turno, 6 no 2º)
- ❌ Carregar `data/senado-2026.json`
- ❌ Carregar `data/camara-2026.json`
- ❌ Carregar `data/assembleias-2026.json`
- ❌ Seções: Presidente (cards), Governadores (grid de UFs), Senado, Câmara
- ❌ Fotos dos candidatos (extrair de `data/candidatos-2026-fotos.json` — 19.893 registros)
- ❌ CSS reutilizar `css/eleicoes-2026.css` + criar `css/resultados.css`

### Commit e push
- ❌ Commit `feat: página resultados-2026`
- ❌ Push `git push site main`

---

## 📂 ARQUIVOS JÁ CRIADOS

### Dados TSE (populados)
- `data/presidente-2026.json` — ✅ 12 candidatos
- `data/governadores-2026.json` — ✅ 27 UFs
- `data/pesquisas-presidente-2026.json` — ✅ 6 institutos
- `data/pesquisas-governadores-2026.json` — ✅ 6 estados
- `data/senado-2026.json` — ⚠️ precisa verificar se está populado
- `data/camara-2026.json` — ⚠️ precisa verificar se está populado
- `data/assembleias-2026.json` — ⚠️ precisa verificar se está populado
- `data/candidatos-2026-fotos.json` — ✅ 19.893 candidatos com fotos

### Páginas auxiliares (criadas, verificar conteúdo)
- `pages/resultados-2026.html` — ⚠️ verificar
- `pages/comparador.html` — ⚠️ verificar
- `pages/lula.html` — ⚠️ verificar
- `pages/flavio-bolsonaro.html` — ⚠️ verificar

### CSS/JS (criados)
- `css/eleicoes-2026.css` — ✅ estilos completos
- `js/home-2026.js` — ✅ home funcionando
- `js/resultados-2026.js` — ⚠️ precisa implementar

---

## 🔗 FONTES DE DADOS

### Fotos dos candidatos (19.893)
- **Repositório:** `leofn/tse-candidatos-2026`
- **Modo:** `real` (extraído de CSVs oficiais do TSE)
- **Formato:** `{"nomeUrna":"...","foto":"https://...","sq":"280002542548"}`
- **URL padrão:** `https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR{sq}_div.jpg`
- **Lula:** `sq=280002542548` → `FBR280002542548_div.jpg`
- **Flávio:** `sq=280002551544` → `FBR280002551544_div.jpg`

### Pesquisas de opinião
- Datafolha 08/10 · BR-08729/2026 · 52%×48% válidos
- Quaester 14/10 · BR-08855/2026 · em divulgação
- Futura 13/10 · BR-09102/2026 · em divulgação
- Ipec · BR-??????/2026 · em campo
- Gerp 13/10 · BR-09187/2026 · 55%×45% válidos
- Indexa/Broadcast 11/10 · BR-08950/2026 · 53%×47% válidos

### Governadores — 2º turno (6 estados)
- AC: Mailza Assis (PP) × Alan Rick (Republicanos)
- AM: Omar Aziz (PSD) × Prof. Maria do Carmo (PL)
- DF: Celina Leão (PP) × Leandro Grass (PT)
- ES: Lorenzo Pazolini (Republicanos) × Ricardo Ferraço (MDB)
- RN: Allyson Bezerra (União) × Cadu de Lula (PT)
- TO: Prof. Dorinha (União) × Vicentinho Júnior (PSDB)

### Eleitos no 1º turno (21 UFs)
- AL: JHC (PSDB) · AP: Dr. Furlan (PSD, sub judice) · BA: Jerônimo (PT) · CE: Elmano (PT) · GO: Daniel Vilela (MDB) · MA: Eduardo Braide (PSD) · MG: Cleitinho (Republicanos) · MS: Eduardo Riedel (PP) · MT: Otaviano Pivetta (Republicanos) · PA: Dr. Daniel (Podemos) · PB: Lucas Ribeiro (PP) · PE: Raquel Lyra (PSD) · PI: Rafael Fonteles (PT) · PR: Sergio Moro (PL) · RJ: Douglas Ruas (PL) · RO: Marcos Rogério (PL) · RR: Arthur Henrique (PL, sub judice) · RS: Zucco (PL) · SC: Jorginho Mello (PL) · SE: Fábio Mitidieri (PSD) · SP: Tarcísio (Republicanos, 62,65%)

---

## 🚨 REGRAS INEGOCIÁVEIS

1. **NUNCA inventar dados de eleição** — usar apenas TSE oficial
2. **NUNCA apresentar pesquisa de opinião como "resultado oficial"**
3. **Disclaimer obrigatório** em toda seção de pesquisa
4. **Fotos reais** dos candidatos (extrair do JSON de fotos)
5. **Remover seções fictícias** antes de prosseguir
6. **Commit + push** após cada modificação
7. **Testar** no navegador antes de finalizar

---

## 🧠 CONTEXTO PARA A PRÓXIMA IA

Ao iniciar a próxima sessão, leia:
1. Este arquivo (`HANDOFF-PLANO-HOME-RESULTADOS-2026.md`)
2. `AI-CONFIG.md`
3. `IMPLEMENTACAO-HANDOFF-2026-10-14.md`

Depois:
1. Verifique `git status` e `git log --oneline -10`
2. Abra `pages/resultados-2026.html` e verifique o estado atual
3. Verifique se os JSONs (senado, camara, assembleias) estão populados
4. Implemente a página com os dados reais do TSE
5. Commit + push para `site main`

**Git remotes:**
- `origin` → `https://github.com/xbrancox/mudabrasilv4.git`
- `site` → `https://github.com/xbrancox/mudabrasil.git` (produção)
- `mbv4` → `https://github.com/xbrancox/mudabrasilv4.git`

**Deploy:** https://meu-voto.app/
