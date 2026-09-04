# 🗳️ MudaBrasil — Redesign v2.0

Plataforma cívica de **voto contínuo e revogável** com foco em **transparência total**.
Esta é a versão **redesign**, criada em arquivos novos sem alterar o projeto original.

> ✨ **Modo duplo de dados:** com o servidor Node rodando, o site exibe a **lista REAL
> de 513 deputados federais** (dados abertos da Câmara dos Deputados, com fotos) **e o
> Termômetro de Confiança ao vivo** (votos reais colocados no navegador). Aberto sem
> servidor (ex.: `file://`), cai automaticamente no **modo demo** com dados sintéticos —
> sempre funcional, nunca quebra.
>
> 🌡️ **"Seu voto coloca, seu voto tira."** O Termômetro é um *termômetro de confiança*
> ("IBOPE em tempo real"): um índice agregado e anônimo de apoio contínuo a cada
> parlamentar. Protótipo de pesquisa/opinião — **sem valor legal e sem vínculo com
> eleições oficiais**.
>
> ⚡ **Tempo real de verdade:** cada voto, revogação ou "manter" é transmitido aos
> navegadores conectados em milissegundos via **SSE** (`GET /api/stream`), com polling
> como rede de segurança. A home exibe um painel **"🌡️ Plataforma ao vivo"** com os
> números reais, atualizando no ar quando alguém vota em outra aba.
>
> 🗄️ **Produção de verdade:** as urnas vivem num **SQLite nativo do Node**
> (`node:sqlite`, zero dependências de npm), com migração automática de urnas antigas
> em JSON, persistência que sobrevive a reinícios e atualização automática dos dados
> públicos a cada 24 h.

## 🆕 Atualizações — 04/09/2026

- **🗳️ Como votou (votações nominais) na ficha:** deputados federais via sondagem
  das votações do Plenário (`/votacoes/{id}/votos`) com cache de sessão compartilhado;
  senadores via histórico completo do Senado (`/senador/{codigo}/votacoes`) — 8 mais
  recentes na ficha e histórico inteiro com "Ver todas" e scroll infinito (blocos de 50).
  Badges: Sim = verde, Não = vermelho, presentes/ausências em cinza.
- **📡 Proxy `/api/camara/*`:** o CORS da Câmara é instável e `/deputados/{id}` nunca
  envia `Access-Control-Allow-Origin` — com backend ativo, todas as chamadas da Câmara
  vão same-origin pelo proxy. Em hosts estáticos (GitHub Pages), o frontend usa o
  Railway como proxy automaticamente.
- **🔐 Verificação de políticos ponta a ponta:** `solicitar` envia `politicianId`,
  `confirmar` checa `data.ok`, o selo grava no SQLite e passa a aparecer no
  `/api/candidatos`; o link do e-mail redireciona para a home com toast. Domínios
  autorizados: `@camara.leg.br`, `@senado.leg.br`, `@senador.leg.br`, `@tse.jus.br`.
- **🧪 Bateria de testes verde:** `test-engine` 25/25 (migração, carga 10k, SSE,
  persistência, fallback JSON), `test-thermometer` 21/21 (voto → código → revogação),
  `test-live` 4/4 (SSE entre páginas), `test-render` 6 páginas sem erros.
  Novos: `tests/e2e-votos-ficha.js`, `tests/e2e-pages.js`, `tests/e2e-verificacao.js`.
- **🩹 Correções:** ids de senadores sem prefixo duplicado (`senado-senado-*`),
  `idDeputadoAutor` (parâmetro correto das proposições), métricas sintéticas removidas
  da ficha (só dados reais), `config.js` em mesma origem quando servido pelo backend,
  consent-note/trendChart restabelecidos no meu-voto.html.

---

## 🚀 Como Executar

**Opção 1 — Com dados REAIS (recomendado):**
```bash
node server/index.js
# → http://localhost:8080
```
Um único comando sobe o site inteiro **e** a API de dados públicos.
Requer Node.js 18+ (usa o `fetch` global). **Sem `npm install`** — zero dependências.
Com **Node 22.5+** (recomendado), as urnas usam **SQLite nativo** (`node:sqlite`);
em Node mais antigo o servidor cai sozinho no **arquivo JSON atômico** — mesmo
comportamento, outro backend (dá para forçar com `MB_STORAGE=json|sqlite`).

**Opção 2 — Aberto direto (modo demo):**
```
Dê um duplo clique em index.html
```
Sem servidor, a API não responde e o site usa os 6 candidatos sintéticos de exemplo.

**Opção 3 — Servidor estático (modo demo):**
```bash
python -m http.server 8000     # ou: npx serve .
```

> 🔁 Para **atualizar** os dados reais em cache: `GET /api/candidatos?refresh=1`
> (ou `node -e "require('./server/ingest').fetchDeputados({force:true}).then(r=>console.log(r.count))"`).

---

## 📁 Estrutura do Projeto

```
mudaBrasil-redesign/
├── index.html                 # Home — hero, painel "Plataforma ao vivo" (dados reais em tempo real), navegação
├── css/
│   └── design-system.css      # Sistema de design (tokens, componentes, animações)
├── js/
│   ├── candidate-data.js      # Dados DEMO sintéticos + helpers (formato, integridade)
│   ├── candidates.js          # Página Candidatos (dual-mode: reais via API → demo)
│   ├── thermometer.js         # 🌡️ Termômetro (votar/ver/revogar/manter + índice ao vivo)
│   ├── live-stream.js         # ⚡ Cliente SSE (window.MBLive): canal principal + polling de segurança
│   └── shared-ui.js           # UI compartilhada (menu mobile, login, scroll-reveal)
├── server/                    # 🆕 Backend (Node.js puro, sem dependências)
│   ├── index.js               # Servidor: estáticos + API /api/* + SSE /api/stream + cron de atualização
│   ├── ingest.js              # Ingestão + cache dos dados reais (Câmara)
│   ├── votes.js               # 🌡️ Engine de voto (anonimato, decaimento, revogação, hook de mudança)
│   ├── db.js                  # 🗄️ Armazenamento das urnas: SQLite nativo (node:sqlite) + fallback JSON
│   └── data/
│       ├── deputados.json     # Cache em disco dos 513 deputados reais
│       ├── votos.db           # 🗄️ Urnas anônimas em SQLite (hash do código — nunca o código)
│       ├── votos.json         # Urnas no fallback JSON / legado (migrado para o .db na 1ª execução)
│       └── .salt              # Sal criptográfico do ambiente (gerado na 1ª execução)
├── pages/
│   ├── candidatos.html        # ⭐ Comparação de candidatos (dados reais)
│   ├── termometro.html        # 🌡️ Voto contínuo e revogável + índice de confiança ao vivo
│   ├── proposta.html          # Manifesto editável da proposta
│   ├── status.html            # Painel ao vivo: métricas reais do termômetro (SSE + fallback demo)
│   ├── revogar.html           # Fluxo de revogação com assinaturas e debate
│   └── comunidade.html        # Contribuidores e estatísticas
└── tests/                     # Testes automatizados + screenshots
    ├── test-engine.js         # 🧪 Motor em Node puro: decaimento, migração JSON→SQLite, carga 10k, SSE, persistência pós-restart, fallback JSON (25 checks)
    ├── test-live.js           # 🧪 Playwright: tempo real entre páginas + fallback demo (13 checks)
    ├── test-thermometer.js    # 🧪 Playwright: termômetro completo — ciclo votar/ver/revogar (19 checks)
    ├── test-render.js         # 🧪 Playwright: renderização das páginas (modo real + demo)
    └── screenshots/           # Evidências visuais de cada fase
```

---

## 🎨 Design System

Todo o visual é controlado por **design tokens** em `css/design-system.css`:

- **Paleta cívica tecnológica**: azul-marinho (`#0A2E5D`), azul primário (`#115FCB`) e dourado (`#FFD700`)
- **Gradientes** em logo, botões, barras e círculo de assinatura
- **Textura** sutil de grid no fundo (efeito tecnológico)
- **Animações**: fade-in, scroll-reveal, pulso em ações, shimmer em barras, contadores animados
- **Responsivo**: sidebar vira menu hambúrguer em telas pequenas
- **Acessibilidade**: alto contraste, navegação por teclado, foco visível

---

## 🗳️ Módulo de Candidatos (destaque)

A página `pages/candidatos.html` é o grande diferencial: **ajuda o eleitor a decidir**
comparando candidatos com base em **dados públicos oficiais**.

### Modo duplo (automático)

| | 📡 **Modo Real** (com `node server/index.js`) | 🧪 **Modo Demo** (sem servidor) |
|---|---|---|
| **Fonte** | API aberta da Câmara dos Deputados | Dados sintéticos embutidos |
| **Quantidade** | 513 deputados federais atuais | 6 candidatos de exemplo |
| **Fotos** | Fotos oficiais reais (lazy-load) | Avatares com iniciais |
| **Dados** | Nome, partido, estado, cargo, e-mail, foto | Perfil completo (exemplo) |
| **Selo** | "📡 Dados reais — Câmara dos Deputados" | "🧪 Modo demo — dados sintéticos" |

O frontend tenta `fetch('/api/candidatos')`; se responder com dados reais, usa-os;
caso contrário, mantém o modo demo. **O usuário nunca vê uma página quebrada.**

### Recursos

| Recurso | Descrição |
|---------|-----------|
| 🔍 **Busca** | Por nome, partido, estado ou área de atuação |
| 🎛️ **Filtros** | Por estado e partido (e cargo, no modo demo) |
| ↕️ **Ordenação** | Ajustada ao modo (nome/partido/estado no real; transparência/votos/processos no demo) |
| 🆚 **Comparação** | Até 3 candidatos lado a lado, com ★ no melhor valor |
| 📋 **Detalhes** | Perfil com foto e tabela Indicador/Valor/Fonte |

### Índice de Integridade

Quando os dados completos existem (modo demo / enriquecido em produção), cada candidato
recebe um **índice de integridade (0–100)**:

```
score = transparência
      − (processos judiciais × 4)
      − (condenações × 10)
      + ((presença − 80) × 0.5)
```

No modo real básico, o índice aparece apenas quando os dados necessários estão disponíveis.

---

## 🌡️ Termômetro de Confiança — Voto Contínuo e Revogável

`pages/termometro.html` é o coração da plataforma: o eleitor **coloca** seu apoio a um
parlamentar, acompanha um **índice de confiança ao vivo** e pode **tirar** (revogar) ou
**manter** (reafirmar) o voto a qualquer momento. "Seu voto coloca, seu voto tira."

### Como funciona

| Ação | O que acontece |
|------|----------------|
| 🗳️ **Colocar** | Escolhe um parlamentar (busca nos 513 reais) e recebe um **código de voto** (ex.: `A3F9-K2MN-P7Q1-X4TR`) |
| 🔍 **Ver** | Digita o código e vê o status do voto — **o nome do candidato aparece mascarado por padrão** (anti-coerção / anti-impressão) |
| ♻️ **Manter** | Reafirma o voto e **reinicia o relógio** do decaimento |
| ⛔ **Tirar (revogar)** | O voto deixa de contar imediatamente — e fica visível no total de revogações (transparência) |

### Anonimato (regra inegociável — LGPD / anti-coerção)

- O servidor **nunca armazena o código bruto**: guarda apenas
  `sha256(código + SALT)` — o código não é recuperável, nem por nós.
- O voto **não se vincula a conta, IP ou dispositivo**: quem revoga/prova é só quem tem
  o código; o site não prova que *você* votou em alguém.
- A agregação (`/api/termometro`) é **irreversível**: não existe rota que mapeie
  eleitor → candidato.
- **UI nunca revela o candidato votado por padrão** (nome mascarado com `•`); há um
  botão "Mostrar" apenas para o próprio portador do código.
- Sem cadastro, sem e-mail, sem tracking — voto = um código que só o eleitor conhece.

### Decaimento do voto ("voto nunca morre, só esfria")

O peso de cada voto decai com o tempo para refletir **apoio ativo**, não inércia:

| Idade do voto | Peso |
|---------------|------|
| 0–90 dias | **1,0** (peso cheio) |
| 90–180 dias | decaimento linear (1,0 → 0,5) |
| 180+ dias | **0,5** (piso — o voto nunca zera sozinho) |

"Manter meu voto" reinicia a contagem de 90 dias. A UI avisa quando o voto tem
mais de 30 dias sem reafirmação.

### Índice de confiança (ao vivo)

```
pesoEfetivo(politico) = Σ peso(voto ativo)          # com decaimento por idade
indice = 100 × pesoEfetivo / (pesoEfetivo + 100)    # curva de saturação (K = 100)
```

A saturação evita que um único político domine a escala por volume puro — o índice
mede **intensidade de apoio ativo**, e a página mostra sempre os números crus ao lado
(votos ativos, revogações, peso efetivo) para nada ficar oculto.

> **ICM v1.0 (Índice de Confiança MudaBrasil)**: em produção,
> `ICM = 0.40·resposta + 0.35·cumprimento + 0.25·(1 − devoluções usadas)`.
> Este protótipo implementa a **componente de confiança** (o índice acima); as demais
> componentes virão com as fontes de dados de produção (TSE/Transparência/CNJ).

### Proteção, persistência e operação

- **Anti-brigada**: rate-limit por IP (20 ações/min) no motor de voto.
- **🗄️ Armazenamento** (`server/db.js`): urnas num **SQLite nativo do Node**
  (`node:sqlite`, Node 22.5+) — um único arquivo `server/data/votos.db`, transações
  atômicas, índice por parlamentar. Em Node mais antigo, fallback automático para o
  **arquivo JSON atômico** (tmp + rename); `MB_STORAGE=json|sqlite` força o backend.
- **Migração automática**: urnas legadas em `votos.json` são importadas para o SQLite
  na primeira inicialização (o JSON fica como backup histórico).
- **Durabilidade**: o voto **sobrevive a reinícios do servidor** (coberto por teste).
- **Atualização automática**: os dados públicos (513 deputados) são rebuscados a cada
  24 h por um cron no próprio processo (`MB_REFRESH_HOURS` ajusta o intervalo).
- **Modo demo**: sem servidor, a página exibe 5 linhas sintéticas e desabilita a busca —
  o selo no topo indica sempre a fonte (📡 real / 🧪 demo).

### Painel ao vivo (`pages/status.html`)

O Status lê `/api/termometro` em tempo real (SSE como canal principal + polling de
15 s de segurança): votos ativos, revogados, participantes, top do índice, tendência
de 30 dias e ranking. Sem servidor, cai no modo demo — nunca quebra.

### ⚡ Tempo real (SSE)

Cada escrita na urna dispara um hook no motor (`votes.js`), que o servidor traduz em
um **Server-Sent Events** na rota `GET /api/stream`:

```
retry: 10000

event: welcome
data: {"ok":true,"ts":"2026-08-19T…","totalVotosAtivos":123,"totalRevogados":4}

event: termometro
data: {"tipo":"voto","ts":"2026-08-19T…","totalVotosAtivos":124,"totalRevogados":4}
```

- `tipo` é `voto` | `revogacao` | `manutencao`; o heartbeat `:hb` vai a cada 30 s.
- **O payload só carrega totais agregados** — nenhum dado individual passa pelo canal
  (mesma regra de anonimato da API: o evento não revela quem votou em quem).
- O cliente (`js/live-stream.js`, exposto como `window.MBLive`) usa o SSE como canal
  principal e mantém **polling de 15 s como rede de segurança**: ao receber um evento,
  pausa o polling; após 3 falhas do SSE, encerra a conexão e o polling assume sozinho.
  Sem servidor (`file://`/demo), o SSE nem chega a iniciar — o fallback é transparente.
- A home exibe os números reais num painel **"🌡️ Plataforma ao vivo"** (votos ativos,
  revogados, participações e o 1º lugar do índice), atualizando no ar quando alguém
  vota em qualquer outra aba do navegador — comprovado em teste E2E (aba da home
  reage a voto feito na aba do termômetro, sem reload).

---

## 📡 Integração com Dados Públicos (backend)

O backend (`server/`) já está **conectado a uma fonte pública real**:

- **Câmara dos Deputados — Dados Abertos** ✅ **INTEGRADO**
  `https://dadosabertos.camara.leg.br/api/v2/deputados`
  → 513 deputados federais atuais (nome, partido, UF, foto, e-mail), com cache em disco.
- Enriquecimento sob demanda (`/api/candidatos/:id`) tenta o nº de proposições por autor.

### Fontes de produção (documentadas para a próxima etapa)

| Fonte | Dados | Endpoint / URL | Status daqui |
|-------|-------|----------------|--------------|
| **Câmara dos Deputados** | Deputados, proposituras, presença | `dadosabertos.camara.leg.br` | ✅ **Integrado** |
| **TSE — DivulgaDados** | Candidaturas, votos, condenações, histórico | `dadosabertos.tse.jus.br` | ⏳ Produção (HTTP 403 neste ambiente) |
| **Portal da Transparência** | Rendimentos, patrimônio, gastos | `dadosabertos.portaltransparencia.gov.br` | ⏳ Produção (inacessível neste ambiente) |
| **Senado Federal** | Senadores, proposituras, votações | `legis.senado.leg.br` | ⏳ Produção |
| **CNJ** | Processos judiciais, ações | `consultaprocessos.cnj.jus.br` | ⏳ Produção (anti-robô) |

> Em produção, o `server/ingest.js` ganharia mais fontes (TSE, Transparência, CNJ,
> Senado) mescladas por parlamentar, completando transparência, patrimônio e histórico
> judicial. O schema já está pronto para receber esses campos (hoje `null`).

---

## 🔌 API do Backend

| Rota | Descrição |
|------|-----------|
| `GET /api/candidatos` | Lista de candidatos reais. Query: `?busca=&uf=&partido=&ordem=nome:asc&refresh=1` |
| `GET /api/candidatos/:id` | Detalhe de um candidato + enriquecimento sob demanda |
| `GET /api/status` | Metadados da fonte (origem, aviso) |
| `GET /api/termometro` | 🌡️ Índice de confiança ao vivo: `topN` (ranking por índice), `tendencia` (30 dias), `porUf`, totais |
| `POST /api/voto` | 🌡️ Coloca um voto. Body: `{politicianId, uf?}` → `{ok, code, ballotId}` |
| `GET /api/voto?code=` | 🌡️ Consulta o status do voto pelo código (nome mascarado, peso atual, dias, `precisaReafirmar`) |
| `POST /api/voto/revogar` | 🌡️ Tira o voto (revoga). Body: `{code}` |
| `POST /api/voto/manter` | 🌡️ Mantém o voto (reafirma — reinicia o relógio do decaimento). Body: `{code}` |
| `GET /api/stream` | ⚡ SSE — eventos em tempo real: `welcome` (totais ao conectar), `termometro` (voto/revogacao/manutencao, só totais), heartbeat `:hb` a cada 30 s |

Resposta de `/api/candidatos`:
```json
{ "mode":"real", "source":"Câmara dos Deputados (dados reais)",
  "total":513, "retornados":513, "doCache":true,
  "atualizadoEm":"2026-08-19T00:59:31.383Z",
  "candidatos":[ { "id":"camara-204379", "name":"Acácio Favacho",
    "party":"MDB", "state":"AP", "position":"Deputado Federal",
    "photo":"https://www.camara.leg.br/...", "email":"dep.acaciofavacho@camara.leg.br" } ] }
```

Resposta de `POST /api/voto` (colocar):
```json
{ "ok": true, "code": "A3F9-K2MN-P7Q1-X4TR", "ballotId": "a1b2c3…",
  "politician": { "id":"camara-204379", "name":"Acácio Favacho" } }
```

Resposta de `GET /api/voto?code=…` (o nome só é retornado já mascarado):
```json
{ "ok": true,
  "ballot": { "politicianId":"camara-204379", "uf":"AP",
    "createdAt":"2026-08-19T…", "reaffirmedAt":"2026-08-19T…",
    "revoked": false, "pesoAtual":1.0, "diasDesdeReafirmacao":0,
    "precisaReafirmar": false } }
```

Resposta de `GET /api/termometro` (agregado irreversível — nunca revela quem votou em quem):
```json
{ "mode":"real", "ok": true,
  "metodo":"Índice de Confiança MudaBrasil (ICM) — componente de confiança",
  "icm": { "versao":"v1.0", "pesos": { "resposta":0.40, "cumprimento":0.35, "devolucao":0.25 } },
  "decadencia": { "cheioDias":90, "pisoDias":180, "piso":0.5 },
  "totalVotosAtivos":123, "totalRevogados":4, "totalRegistros":127,
  "topN":[ { "politicianId":"camara-204379", "name":"Acácio Favacho", "party":"MDB",
             "state":"AP", "photo":"https://www.camara.leg.br/...",
             "votosAtivos":40, "revogacoes":1, "pesoEfetivo":39.2, "indice":27.3 } ],
  "porIndice":[ "…ranking completo, do 1º ao último…" ],
  "tendencia":[ { "at":"2026-08-19", "ativos":123 } ],
  "porUf": { "AP": 40 } }
```

Evento SSE de `GET /api/stream` (após um voto ser colocado):
```
event: termometro
data: {"tipo":"voto","ts":"2026-08-19T12:00:00.000Z","totalVotosAtivos":124,"totalRevogados":4}
```

---

## ⚖️ Aviso Legal

- No **modo real**, os nomes, partidos, estados e fotos são **dados reais** de
  deputados federais, obtidos dos dados abertos públicos da Câmara dos Deputados.
- No **modo demo**, os candidatos e seus valores (finanças, processos, votos) são
  **fictícios/sintéticos**, apenas para demonstrar a arquitetura completa.
- O **Termômetro é um protótipo de pesquisa/opinião** ("IBOPE em tempo real"):
  **não tem valor legal, não é urna oficial e não vincula a eleições**. Os votos são
  uma manifestação anônima de opinião que qualquer pessoa pode colocar e revogar.
- A plataforma **não solicita voto, não promove candidatos e não faz campanha** —
  monitoramento neutro (regra inegociável). Não constitui recomendação de voto.
- **Privacidade (LGPD)**: sem cadastro, sem e-mail, sem vinculação de voto à pessoa.
  O servidor guarda apenas o hash do código; a agregação pública é irreversível.

---

## 🗺️ Próximos Passos

1. **ICM completo**: conectar as componentes de **resposta** e **cumprimento**
   (radar de resposta, histórico de proposições) para compor o
   `ICM = 0.40·resposta + 0.35·cumprimento + 0.25·(1 − devoluções)`.
2. **Mais fontes reais** no `ingest.js`: TSE (candidaturas/votos), Portal da Transparência
   (patrimônio/renda), CNJ (processos), Senado (senadores no termômetro) — mescladas
   por parlamentar.
3. **Autenticação real (opcional)** para funcionalidades de conta — o voto em si
   permanece anônimo por código, sem conta obrigatória.

> ✅ **Fase 5 — "Produção" (2026-08-19):** urnas em **SQLite nativo** (zero
> dependências) com migração automática do JSON legado, persistência que sobrevive a
> reinícios, fallback JSON automático em Node antigo (`MB_STORAGE`) e atualização
> automática dos dados públicos (cron de 24 h, `MB_REFRESH_HOURS`).
>
> ✅ **Fase 4 — "Plataforma Viva" (2026-08-19):** tempo real via SSE
> (`GET /api/stream`, ~7 ms do voto ao navegador), painel "Plataforma ao vivo" na
> home com dados reais, e suíte de testes do motor (decaimento exato, carga de 10.000
> votos, latência SSE).
>
> ✅ **Fase 6 — "Conclusão" (2026-08-20):**
> - **Integração Senado Federal**: nova rota `/api/senadores` + merge na `/api/candidatos`
>   (513 deputados + 81 senadores = 594 candidatos totais). Fonte:
>   `legis.senado.leg.br/dadosabertos` (JSON/XML com fallback gracioso se WAF bloquear).
> - **Health check**: `GET /api/health` — uptime, backend de armazenamento (SQLite/JSON),
>   totais de votos ativos/revogados, status do cron de atualização.
> - **Encerramento gracioso**: handlers para `SIGINT`/`SIGTERM` fecham o banco SQLite
>   ordenadamente antes de sair (nenhuma urna perdida, nenhum arquivo corrompido).
> - **Headers de privacidade/segurança** em todas as respostas JSON:
>   `X-Content-Type-Options: nosniff` + `Referrer-Policy: no-referrer`.
> - **Testes validados**: 25/25 (engine) + 19/19 (thermometer) + 13/13 (live) + render
>   = **70 checks passando** (Node puro + Playwright E2E + SSE real + persistência pós-restart).
> - **Repositório**: https://github.com/xbrancox/mudabrasil

---

Feito com 🇧🇷 para a transparência cívica brasileira.

---

## 🏛️ Nova Aba "Parlamentares" (v2.1)

A página **/pages/parlamentares.html** unifica tudo: **Candidatos + Radar Político + Rankings**.

### ✨ Funcionalidades
- **594 parlamentares** (513 deputados + 81 senadores) com dados reais
- **🔍 Busca avançada** com filtros: estado, partido, cargo, verificados
- **🛡️ Radar Cívico**: feed ao vivo de reclamações, apoios e respostas
- **🏆 Rankings**: mais reclamados, mais apoiados, melhor avaliados, mais respondem
- **🪪 Selo de verificação**: somente políticos verificados respondem
- **🔐 Login via Google OAuth ou Telefone (SMS OTP)** — sem Gov.br
- **📝 Reclamações + Apoios + Respostas** com moderação IA + humana
- **Sem limite** de reclamações/apoios por eleitor (identificado por hash)
- **Sem prazo** para resposta (vai para estatísticas/gráficos)
- **📊 Links oficiais** para Câmara, Senado, TSE, Portal da Transparência

### 🔐 Domínios autorizados para verificação
- `@camara.leg.br` (deputados)
- `@senado.leg.br` / `@senador.leg.br` (senadores)
- `@tse.jus.br` (Tribunal Superior Eleitoral)

### 🛠️ Arquivos novos
- `server/auth.js` — login Google + telefone (SMS OTP)
- `server/verificacao.js` — selo via domínio de e-mail
- `server/reclamacoes.js` — reclamações, apoios, respostas, rankings
- `pages/parlamentares.html` — aba unificada
- `js/parlamentares.js` + `js/parlamentar-auth.js` — lógica
- `css/parlamentares.css` — design com cores, fontes e animações premium

### 🌐 Endpoints novos
```
POST /api/auth/{google,otp/send,otp/verify}        Login
GET  /api/auth/me                                  Sessão atual
POST /api/auth/logout                              Sair

POST /api/verificacao/iniciar                      Iniciar verificação
GET  /api/verificacao/confirmar?token=...          Confirmar
GET  /api/verificacao/dominios                     Domínios autorizados
GET  /api/verificacao/stats                        Estatísticas
GET  /api/verificacao/politico/:id                 Status de um político

POST /api/reclamacoes                              Criar reclamação
GET  /api/reclamacoes?politicianId=...             Listar
POST /api/apoios                                   Criar apoio
GET  /api/apoios?politicianId=...                  Listar
POST /api/respostas                                Resposta (só verificado)
GET  /api/rankings                                 Rankings públicos
GET  /api/estatisticas/politico/:id                Stats detalhadas
```

### 🧪 Fluxo de teste (modo dev)
```bash
node server/index.js
# → http://localhost:8080/pages/parlamentares.html
# 1. Login: "google:seu@email.com:Seu Nome"
# 2. Abrir qualquer parlamentar
# 3. Reclamar / Apoiar (com sessão ativa)
# 4. Verificar: e-mail institucional com domínio autorizado
```
