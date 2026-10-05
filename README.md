# ??? VotaBrasil � Redesign v2.0

Plataforma c�vica de **revoga��o do voto** com foco em **transpar�ncia total**.
Esta � a vers�o **redesign**, criada em arquivos novos sem alterar o projeto original.

> ? **Modo duplo de dados:** com o servidor Node rodando, o site exibe a **lista REAL
> de 513 deputados federais** (dados abertos da C�mara dos Deputados, com fotos) **e o
> Term�metro de Confian�a ao vivo** (votos reais colocados no navegador). Aberto sem
> servidor (ex.: `file://`), cai automaticamente no **modo demo** com dados sint�ticos �
> sempre funcional, nunca quebra.
>
> ??? **"Meu voto coloca, meu voto tira."** O Term�metro � um *term�metro de confian�a*
> ("IBOPE em tempo real"): um �ndice agregado e an�nimo de apoio cont�nuo a cada
> parlamentar. Prot�tipo de pesquisa/opini�o � **sem valor legal e sem v�nculo com
> elei��es oficiais**.
>
> ? **Tempo real de verdade:** cada voto, revoga��o ou "manter" � transmitido aos
> navegadores conectados em milissegundos via **SSE** (`GET /api/stream`), com polling
> como rede de seguran�a. A home exibe um painel **"??? Plataforma ao vivo"** com os
> n�meros reais, atualizando no ar quando algu�m vota em outra aba.
>
> ??? **Produ��o de verdade:** as urnas vivem num **SQLite nativo do Node**
> (`node:sqlite`, zero depend�ncias de npm), com migra��o autom�tica de urnas antigas
> em JSON, persist�ncia que sobrevive a rein�cios e atualiza��o autom�tica dos dados
> p�blicos a cada 24 h.

## ?? Atualiza��es � 04/09/2026

- **??? Como votou (vota��es nominais) na ficha:** deputados federais via sondagem
  das vota��es do Plen�rio (`/votacoes/{id}/votos`) com cache de sess�o compartilhado;
  senadores via hist�rico completo do Senado (`/senador/{codigo}/votacoes`) � 8 mais
  recentes na ficha e hist�rico inteiro com "Ver todas" e scroll infinito (blocos de 50).
  Badges: Sim = verde, N�o = vermelho, presentes/aus�ncias em cinza.
- **?? Proxy `/api/camara/*`:** o CORS da C�mara � inst�vel e `/deputados/{id}` nunca
  envia `Access-Control-Allow-Origin` � com backend ativo, todas as chamadas da C�mara
  v�o same-origin pelo proxy. Em hosts est�ticos (GitHub Pages), o frontend usa o
  Railway como proxy automaticamente.
- **?? Verifica��o de pol�ticos ponta a ponta:** `solicitar` envia `politicianId`,
  `confirmar` checa `data.ok`, o selo grava no SQLite e passa a aparecer no
  `/api/candidatos`; o link do e-mail redireciona para a home com toast. Dom�nios
  autorizados: `@camara.leg.br`, `@senado.leg.br`, `@senador.leg.br`, `@tse.jus.br`.
- **?? Bateria de testes verde:** `test-engine` 25/25 (migra��o, carga 10k, SSE,
  persist�ncia, fallback JSON), `test-thermometer` 21/21 (voto ? c�digo ? revoga��o),
  `test-live` 4/4 (SSE entre p�ginas), `test-render` 6 p�ginas sem erros.
  Novos: `tests/e2e-votos-ficha.js`, `tests/e2e-pages.js`, `tests/e2e-verificacao.js`.
- **?? Corre��es:** ids de senadores sem prefixo duplicado (`senado-senado-*`),
  `idDeputadoAutor` (par�metro correto das proposi��es), m�tricas sint�ticas removidas
  da ficha (s� dados reais), `config.js` em mesma origem quando servido pelo backend,
  consent-note/trendChart restabelecidos no meu-voto.html.

---

## ?? Como Executar

**Op��o 1 � Com dados REAIS (recomendado):**
```bash
node server/index.js
# ? http://localhost:8080
```
Um �nico comando sobe o site inteiro **e** a API de dados p�blicos.
Requer Node.js 18+ (usa o `fetch` global). **Sem `npm install`** � zero depend�ncias.
Com **Node 22.5+** (recomendado), as urnas usam **SQLite nativo** (`node:sqlite`);
em Node mais antigo o servidor cai sozinho no **arquivo JSON at�mico** � mesmo
comportamento, outro backend (d� para for�ar com `MB_STORAGE=json|sqlite`).

**Op��o 2 � Aberto direto (modo demo):**
```
D� um duplo clique em index.html
```
Sem servidor, a API n�o responde e o site usa os 6 candidatos sint�ticos de exemplo.

**Op��o 3 � Servidor est�tico (modo demo):**
```bash
python -m http.server 8000     # ou: npx serve .
```

> ?? Para **atualizar** os dados reais em cache: `GET /api/candidatos?refresh=1`
> (ou `node -e "require('./server/ingest').fetchDeputados({force:true}).then(r=>console.log(r.count))"`).

---

## ?? Estrutura do Projeto

```
votaBrasil-redesign/
+-- index.html                 # Home � hero, painel "Plataforma ao vivo" (dados reais em tempo real), navega��o
+-- css/
�   +-- design-system.css      # Sistema de design (tokens, componentes, anima��es)
+-- js/
�   +-- candidate-data.js      # Dados DEMO sint�ticos + helpers (formato, integridade)
�   +-- candidates.js          # P�gina Candidatos (dual-mode: reais via API ? demo)
�   +-- thermometer.js         # ??? Term�metro (votar/ver/revogar/manter + �ndice ao vivo)
�   +-- live-stream.js         # ? Cliente SSE (window.MBLive): canal principal + polling de seguran�a
�   +-- shared-ui.js           # UI compartilhada (menu mobile, login, scroll-reveal)
+-- server/                    # ?? Backend (Node.js puro, sem depend�ncias)
�   +-- index.js               # Servidor: est�ticos + API /api/* + SSE /api/stream + cron de atualiza��o
�   +-- ingest.js              # Ingest�o + cache dos dados reais (C�mara)
�   +-- votes.js               # ??? Engine de voto (anonimato, decaimento, revoga��o, hook de mudan�a)
�   +-- db.js                  # ??? Armazenamento das urnas: SQLite nativo (node:sqlite) + fallback JSON
�   +-- data/
�       +-- deputados.json     # Cache em disco dos 513 deputados reais
�       +-- votos.db           # ??? Urnas an�nimas em SQLite (hash do c�digo � nunca o c�digo)
�       +-- votos.json         # Urnas no fallback JSON / legado (migrado para o .db na 1� execu��o)
�       +-- .salt              # Sal criptogr�fico do ambiente (gerado na 1� execu��o)
+-- pages/
�   +-- candidatos.html        # ? Compara��o de candidatos (dados reais)
�   +-- termometro.html        # ??? Revoga��o do voto + �ndice de confian�a ao vivo
�   +-- proposta.html          # Manifesto edit�vel da proposta
�   +-- status.html            # Painel ao vivo: m�tricas reais do term�metro (SSE + fallback demo)
�   +-- revogar.html           # Fluxo de revoga��o com assinaturas e debate
�   +-- comunidade.html        # Contribuidores e estat�sticas
+-- tests/                     # Testes automatizados + screenshots
    +-- test-engine.js         # ?? Motor em Node puro: decaimento, migra��o JSON?SQLite, carga 10k, SSE, persist�ncia p�s-restart, fallback JSON (25 checks)
    +-- test-live.js           # ?? Playwright: tempo real entre p�ginas + fallback demo (13 checks)
    +-- test-thermometer.js    # ?? Playwright: term�metro completo � ciclo votar/ver/revogar (19 checks)
    +-- test-render.js         # ?? Playwright: renderiza��o das p�ginas (modo real + demo)
    +-- screenshots/           # Evid�ncias visuais de cada fase
```

---

## ?? Design System

Todo o visual � controlado por **design tokens** em `css/design-system.css`:

- **Paleta c�vica tecnol�gica**: azul-marinho (`#0A2E5D`), azul prim�rio (`#115FCB`) e dourado (`#FFD700`)
- **Gradientes** em logo, bot�es, barras e c�rculo de assinatura
- **Textura** sutil de grid no fundo (efeito tecnol�gico)
- **Anima��es**: fade-in, scroll-reveal, pulso em a��es, shimmer em barras, contadores animados
- **Responsivo**: sidebar vira menu hamb�rguer em telas pequenas
- **Acessibilidade**: alto contraste, navega��o por teclado, foco vis�vel

---

## ??? M�dulo de Candidatos (destaque)

A p�gina `pages/candidatos.html` � o grande diferencial: **ajuda o eleitor a decidir**
comparando candidatos com base em **dados p�blicos oficiais**.

### Modo duplo (autom�tico)

| | ?? **Modo Real** (com `node server/index.js`) | ?? **Modo Demo** (sem servidor) |
|---|---|---|
| **Fonte** | API aberta da C�mara dos Deputados | Dados sint�ticos embutidos |
| **Quantidade** | 513 deputados federais atuais | 6 candidatos de exemplo |
| **Fotos** | Fotos oficiais reais (lazy-load) | Avatares com iniciais |
| **Dados** | Nome, partido, estado, cargo, e-mail, foto | Perfil completo (exemplo) |
| **Selo** | "?? Dados reais � C�mara dos Deputados" | "?? Modo demo � dados sint�ticos" |

O frontend tenta `fetch('/api/candidatos')`; se responder com dados reais, usa-os;
caso contr�rio, mant�m o modo demo. **O usu�rio nunca v� uma p�gina quebrada.**

### Recursos

| Recurso | Descri��o |
|---------|-----------|
| ?? **Busca** | Por nome, partido, estado ou �rea de atua��o |
| ??? **Filtros** | Por estado e partido (e cargo, no modo demo) |
| ?? **Ordena��o** | Ajustada ao modo (nome/partido/estado no real; transpar�ncia/votos/processos no demo) |
| ?? **Compara��o** | At� 3 candidatos lado a lado, com ? no melhor valor |
| ?? **Detalhes** | Perfil com foto e tabela Indicador/Valor/Fonte |

### �ndice de Integridade

Quando os dados completos existem (modo demo / enriquecido em produ��o), cada candidato
recebe um **�ndice de integridade (0�100)**:

```
score = transpar�ncia
      - (processos judiciais � 4)
      - (condena��es � 10)
      + ((presen�a - 80) � 0.5)
```

No modo real b�sico, o �ndice aparece apenas quando os dados necess�rios est�o dispon�veis.

---

## ??? Term�metro de Confian�a � Revoga��o do Voto

`pages/termometro.html` � o cora��o da plataforma: o eleitor **coloca** seu apoio a um
parlamentar, acompanha um **�ndice de confian�a ao vivo** e pode **tirar** (revogar) ou
**manter** (reafirmar) o voto a qualquer momento. "Meu voto coloca, meu voto tira."

### Como funciona

| A��o | O que acontece |
|------|----------------|
| ??? **Colocar** | Escolhe um parlamentar (busca nos 513 reais) e recebe um **c�digo de voto** (ex.: `A3F9-K2MN-P7Q1-X4TR`) |
| ?? **Ver** | Digita o c�digo e v� o status do voto � **o nome do candidato aparece mascarado por padr�o** (anti-coer��o / anti-impress�o) |
| ?? **Manter** | Reafirma o voto e **reinicia o rel�gio** do decaimento |
| ? **Tirar (revogar)** | O voto deixa de contar imediatamente � e fica vis�vel no total de revoga��es (transpar�ncia) |

### Anonimato (regra inegoci�vel � LGPD / anti-coer��o)

- O servidor **nunca armazena o c�digo bruto**: guarda apenas
  `sha256(c�digo + SALT)` � o c�digo n�o � recuper�vel, nem por n�s.
- O voto **n�o se vincula a conta, IP ou dispositivo**: quem revoga/prova � s� quem tem
  o c�digo; o site n�o prova que *voc�* votou em algu�m.
- A agrega��o (`/api/termometro`) � **irrevers�vel**: n�o existe rota que mapeie
  eleitor ? candidato.
- **UI nunca revela o candidato votado por padr�o** (nome mascarado com `�`); h� um
  bot�o "Mostrar" apenas para o pr�prio portador do c�digo.
- Sem cadastro, sem e-mail, sem tracking � voto = um c�digo que s� o eleitor conhece.

### Decaimento do voto ("voto nunca morre, s� esfria")

O peso de cada voto decai com o tempo para refletir **apoio ativo**, n�o in�rcia:

| Idade do voto | Peso |
|---------------|------|
| 0�90 dias | **1,0** (peso cheio) |
| 90�180 dias | decaimento linear (1,0 ? 0,5) |
| 180+ dias | **0,5** (piso � o voto nunca zera sozinho) |

"Manter meu voto" reinicia a contagem de 90 dias. A UI avisa quando o voto tem
mais de 30 dias sem reafirma��o.

### �ndice de confian�a (ao vivo)

```
pesoEfetivo(politico) = S peso(voto ativo)          # com decaimento por idade
indice = 100 � pesoEfetivo / (pesoEfetivo + 100)    # curva de satura��o (K = 100)
```

A satura��o evita que um �nico pol�tico domine a escala por volume puro � o �ndice
mede **intensidade de apoio ativo**, e a p�gina mostra sempre os n�meros crus ao lado
(votos ativos, revoga��es, peso efetivo) para nada ficar oculto.

> **ICM v1.0 (�ndice de Confian�a VotaBrasil)**: em produ��o,
> `ICM = 0.40�resposta + 0.35�cumprimento + 0.25�(1 - devolu��es usadas)`.
> Este prot�tipo implementa a **componente de confian�a** (o �ndice acima); as demais
> componentes vir�o com as fontes de dados de produ��o (TSE/Transpar�ncia/CNJ).

### Prote��o, persist�ncia e opera��o

- **Anti-brigada**: rate-limit por IP (20 a��es/min) no motor de voto.
- **??? Armazenamento** (`server/db.js`): urnas num **SQLite nativo do Node**
  (`node:sqlite`, Node 22.5+) � um �nico arquivo `server/data/votos.db`, transa��es
  at�micas, �ndice por parlamentar. Em Node mais antigo, fallback autom�tico para o
  **arquivo JSON at�mico** (tmp + rename); `MB_STORAGE=json|sqlite` for�a o backend.
- **Migra��o autom�tica**: urnas legadas em `votos.json` s�o importadas para o SQLite
  na primeira inicializa��o (o JSON fica como backup hist�rico).
- **Durabilidade**: o voto **sobrevive a rein�cios do servidor** (coberto por teste).
- **Atualiza��o autom�tica**: os dados p�blicos (513 deputados) s�o rebuscados a cada
  24 h por um cron no pr�prio processo (`MB_REFRESH_HOURS` ajusta o intervalo).
- **Modo demo**: sem servidor, a p�gina exibe 5 linhas sint�ticas e desabilita a busca �
  o selo no topo indica sempre a fonte (?? real / ?? demo).

### Painel ao vivo (`pages/status.html`)

O Status l� `/api/termometro` em tempo real (SSE como canal principal + polling de
15 s de seguran�a): votos ativos, revogados, participantes, top do �ndice, tend�ncia
de 30 dias e ranking. Sem servidor, cai no modo demo � nunca quebra.

### ? Tempo real (SSE)

Cada escrita na urna dispara um hook no motor (`votes.js`), que o servidor traduz em
um **Server-Sent Events** na rota `GET /api/stream`:

```
retry: 10000

event: welcome
data: {"ok":true,"ts":"2026-08-19T�","totalVotosAtivos":123,"totalRevogados":4}

event: termometro
data: {"tipo":"voto","ts":"2026-08-19T�","totalVotosAtivos":124,"totalRevogados":4}
```

- `tipo` � `voto` | `revogacao` | `manutencao`; o heartbeat `:hb` vai a cada 30 s.
- **O payload s� carrega totais agregados** � nenhum dado individual passa pelo canal
  (mesma regra de anonimato da API: o evento n�o revela quem votou em quem).
- O cliente (`js/live-stream.js`, exposto como `window.MBLive`) usa o SSE como canal
  principal e mant�m **polling de 15 s como rede de seguran�a**: ao receber um evento,
  pausa o polling; ap�s 3 falhas do SSE, encerra a conex�o e o polling assume sozinho.
  Sem servidor (`file://`/demo), o SSE nem chega a iniciar � o fallback � transparente.
- A home exibe os n�meros reais num painel **"??? Plataforma ao vivo"** (votos ativos,
  revogados, participa��es e o 1� lugar do �ndice), atualizando no ar quando algu�m
  vota em qualquer outra aba do navegador � comprovado em teste E2E (aba da home
  reage a voto feito na aba do term�metro, sem reload).

---

## ?? Integra��o com Dados P�blicos (backend)

O backend (`server/`) j� est� **conectado a uma fonte p�blica real**:

- **C�mara dos Deputados � Dados Abertos** ? **INTEGRADO**
  `https://dadosabertos.camara.leg.br/api/v2/deputados`
  ? 513 deputados federais atuais (nome, partido, UF, foto, e-mail), com cache em disco.
- Enriquecimento sob demanda (`/api/candidatos/:id`) tenta o n� de proposi��es por autor.

### Fontes de produ��o (documentadas para a pr�xima etapa)

| Fonte | Dados | Endpoint / URL | Status daqui |
|-------|-------|----------------|--------------|
| **C�mara dos Deputados** | Deputados, proposituras, presen�a | `dadosabertos.camara.leg.br` | ? **Integrado** |
| **TSE � DivulgaDados** | Candidaturas, votos, condena��es, hist�rico | `dadosabertos.tse.jus.br` | ? Produ��o (HTTP 403 neste ambiente) |
| **Portal da Transpar�ncia** | Rendimentos, patrim�nio, gastos | `dadosabertos.portaltransparencia.gov.br` | ? Produ��o (inacess�vel neste ambiente) |
| **Senado Federal** | Senadores, proposituras, vota��es | `legis.senado.leg.br` | ? Produ��o |
| **CNJ** | Processos judiciais, a��es | `consultaprocessos.cnj.jus.br` | ? Produ��o (anti-rob�) |

> Em produ��o, o `server/ingest.js` ganharia mais fontes (TSE, Transpar�ncia, CNJ,
> Senado) mescladas por parlamentar, completando transpar�ncia, patrim�nio e hist�rico
> judicial. O schema j� est� pronto para receber esses campos (hoje `null`).

---

## ?? API do Backend

| Rota | Descri��o |
|------|-----------|
| `GET /api/candidatos` | Lista de candidatos reais. Query: `?busca=&uf=&partido=&ordem=nome:asc&refresh=1` |
| `GET /api/candidatos/:id` | Detalhe de um candidato + enriquecimento sob demanda |
| `GET /api/status` | Metadados da fonte (origem, aviso) |
| `GET /api/termometro` | ??? �ndice de confian�a ao vivo: `topN` (ranking por �ndice), `tendencia` (30 dias), `porUf`, totais |
| `POST /api/voto` | ??? Coloca um voto. Body: `{politicianId, uf?}` ? `{ok, code, ballotId}` |
| `GET /api/voto?code=` | ??? Consulta o status do voto pelo c�digo (nome mascarado, peso atual, dias, `precisaReafirmar`) |
| `POST /api/voto/revogar` | ??? Tira o voto (revoga). Body: `{code}` |
| `POST /api/voto/manter` | ??? Mant�m o voto (reafirma � reinicia o rel�gio do decaimento). Body: `{code}` |
| `GET /api/stream` | ? SSE � eventos em tempo real: `welcome` (totais ao conectar), `termometro` (voto/revogacao/manutencao, s� totais), heartbeat `:hb` a cada 30 s |

Resposta de `/api/candidatos`:
```json
{ "mode":"real", "source":"C�mara dos Deputados (dados reais)",
  "total":513, "retornados":513, "doCache":true,
  "atualizadoEm":"2026-08-19T00:59:31.383Z",
  "candidatos":[ { "id":"camara-204379", "name":"Ac�cio Favacho",
    "party":"MDB", "state":"AP", "position":"Deputado Federal",
    "photo":"https://www.camara.leg.br/...", "email":"dep.acaciofavacho@camara.leg.br" } ] }
```

Resposta de `POST /api/voto` (colocar):
```json
{ "ok": true, "code": "A3F9-K2MN-P7Q1-X4TR", "ballotId": "a1b2c3�",
  "politician": { "id":"camara-204379", "name":"Ac�cio Favacho" } }
```

Resposta de `GET /api/voto?code=�` (o nome s� � retornado j� mascarado):
```json
{ "ok": true,
  "ballot": { "politicianId":"camara-204379", "uf":"AP",
    "createdAt":"2026-08-19T�", "reaffirmedAt":"2026-08-19T�",
    "revoked": false, "pesoAtual":1.0, "diasDesdeReafirmacao":0,
    "precisaReafirmar": false } }
```

Resposta de `GET /api/termometro` (agregado irrevers�vel � nunca revela quem votou em quem):
```json
{ "mode":"real", "ok": true,
  "metodo":"�ndice de Confian�a VotaBrasil (ICM) � componente de confian�a",
  "icm": { "versao":"v1.0", "pesos": { "resposta":0.40, "cumprimento":0.35, "devolucao":0.25 } },
  "decadencia": { "cheioDias":90, "pisoDias":180, "piso":0.5 },
  "totalVotosAtivos":123, "totalRevogados":4, "totalRegistros":127,
  "topN":[ { "politicianId":"camara-204379", "name":"Ac�cio Favacho", "party":"MDB",
             "state":"AP", "photo":"https://www.camara.leg.br/...",
             "votosAtivos":40, "revogacoes":1, "pesoEfetivo":39.2, "indice":27.3 } ],
  "porIndice":[ "�ranking completo, do 1� ao �ltimo�" ],
  "tendencia":[ { "at":"2026-08-19", "ativos":123 } ],
  "porUf": { "AP": 40 } }
```

Evento SSE de `GET /api/stream` (ap�s um voto ser colocado):
```
event: termometro
data: {"tipo":"voto","ts":"2026-08-19T12:00:00.000Z","totalVotosAtivos":124,"totalRevogados":4}
```

---

## ??? Arquitetura de Infraestrutura

### Backend (Railway)
- **Projeto**: VotaBrasil (`198baa4d-6141-418c-96dd-d7826831249f`)
- **Servi�o**: VotaBrasil (`4d5f569d-9c54-45f5-a25a-b474fb218b18`)
- **Dom�nio atual**: `https://meu-voto.app`
- **Regi�o**: Amsterdam (ams)
- **Builder**: RAILPACK (Node 22)
- **Storage**: SQLite nativo (`node:sqlite`) em `/app/server/data/votos.db`
- **Volume**: 500MB persistente

### Frontend (GitHub Pages)
- **Reposit�rio**: `xbrancox/votabrasil`
- **Branch**: `main`
- **Workflow**: `.github/workflows/pages.yml`
- **URL**: `https://meu-voto.app/`

### Plano de Migra��o de Dom�nio
1. **Registrar dom�nio**: `omeuvoto.app` (pendente)
2. **Configurar DNS**: CNAME apontando para Railway
3. **Adicionar dom�nio custom no Railway**: `railway domain omeuvoto.app`
4. **Atualizar `API_BASE`** em todos os arquivos para `https://api.omeuvoto.app`
5. **Configurar SSL**: Autom�tico pelo Railway (Let's Encrypt)

---

## ?? Aviso Legal

- No **modo real**, os nomes, partidos, estados e fotos s�o **dados reais** de
  deputados federais, obtidos dos dados abertos p�blicos da C�mara dos Deputados.
- No **modo demo**, os candidatos e seus valores (finan�as, processos, votos) s�o
  **fict�cios/sint�ticos**, apenas para demonstrar a arquitetura completa.
- O **Term�metro � um prot�tipo de pesquisa/opini�o** ("IBOPE em tempo real"):
  **n�o tem valor legal, n�o � urna oficial e n�o vincula a elei��es**. Os votos s�o
  uma manifesta��o an�nima de opini�o que qualquer pessoa pode colocar e revogar.
- A plataforma **n�o solicita voto, n�o promove candidatos e n�o faz campanha** �
  monitoramento neutro (regra inegoci�vel). N�o constitui recomenda��o de voto.
- **Privacidade (LGPD)**: sem cadastro, sem e-mail, sem vincula��o de voto � pessoa.
  O servidor guarda apenas o hash do c�digo; a agrega��o p�blica � irrevers�vel.

---

## ??? Pr�ximos Passos

1. **ICM completo**: conectar as componentes de **resposta** e **cumprimento**
   (radar de resposta, hist�rico de proposi��es) para compor o
   `ICM = 0.40�resposta + 0.35�cumprimento + 0.25�(1 - devolu��es)`.
2. **Mais fontes reais** no `ingest.js`: TSE (candidaturas/votos), Portal da Transpar�ncia
   (patrim�nio/renda), CNJ (processos), Senado (senadores no term�metro) � mescladas
   por parlamentar.
3. **Autentica��o real (opcional)** para funcionalidades de conta � o voto em si
   permanece an�nimo por c�digo, sem conta obrigat�ria.

> ? **Fase 5 � "Produ��o" (2026-08-19):** urnas em **SQLite nativo** (zero
> depend�ncias) com migra��o autom�tica do JSON legado, persist�ncia que sobrevive a
> rein�cios, fallback JSON autom�tico em Node antigo (`MB_STORAGE`) e atualiza��o
> autom�tica dos dados p�blicos (cron de 24 h, `MB_REFRESH_HOURS`).
>
> ? **Fase 4 � "Plataforma Viva" (2026-08-19):** tempo real via SSE
> (`GET /api/stream`, ~7 ms do voto ao navegador), painel "Plataforma ao vivo" na
> home com dados reais, e su�te de testes do motor (decaimento exato, carga de 10.000
> votos, lat�ncia SSE).
>
> ? **Fase 6 � "Conclus�o" (2026-08-20):**
> - **Integra��o Senado Federal**: nova rota `/api/senadores` + merge na `/api/candidatos`
>   (513 deputados + 81 senadores = 594 candidatos totais). Fonte:
>   `legis.senado.leg.br/dadosabertos` (JSON/XML com fallback gracioso se WAF bloquear).
> - **Health check**: `GET /api/health` � uptime, backend de armazenamento (SQLite/JSON),
>   totais de votos ativos/revogados, status do cron de atualiza��o.
> - **Encerramento gracioso**: handlers para `SIGINT`/`SIGTERM` fecham o banco SQLite
>   ordenadamente antes de sair (nenhuma urna perdida, nenhum arquivo corrompido).
> - **Headers de privacidade/seguran�a** em todas as respostas JSON:
>   `X-Content-Type-Options: nosniff` + `Referrer-Policy: no-referrer`.
> - **Testes validados**: 25/25 (engine) + 19/19 (thermometer) + 13/13 (live) + render
>   = **70 checks passando** (Node puro + Playwright E2E + SSE real + persist�ncia p�s-restart).
> - **Reposit�rio**: https://github.com/xbrancox/VotaBrasil

---

Feito com ???? para a transpar�ncia c�vica brasileira.

---

## ??? Nova Aba "Parlamentares" (v2.1)

A p�gina **/pages/parlamentares.html** unifica tudo: **Candidatos + Radar Pol�tico + Rankings**.

### ? Funcionalidades
- **594 parlamentares** (513 deputados + 81 senadores) com dados reais
- **?? Busca avan�ada** com filtros: estado, partido, cargo, verificados
- **??? Radar C�vico**: feed ao vivo de reclama��es, apoios e respostas
- **?? Rankings**: mais reclamados, mais apoiados, melhor avaliados, mais respondem
- **?? Selo de verifica��o**: somente pol�ticos verificados respondem
- **?? Login via Google OAuth ou Telefone (SMS OTP)** � sem Gov.br
- **?? Reclama��es + Apoios + Respostas** com modera��o IA + humana
- **Sem limite** de reclama��es/apoios por eleitor (identificado por hash)
- **Sem prazo** para resposta (vai para estat�sticas/gr�ficos)
- **?? Links oficiais** para C�mara, Senado, TSE, Portal da Transpar�ncia

### ?? Dom�nios autorizados para verifica��o
- `@camara.leg.br` (deputados)
- `@senado.leg.br` / `@senador.leg.br` (senadores)
- `@tse.jus.br` (Tribunal Superior Eleitoral)

### ??? Arquivos novos
- `server/auth.js` � login Google + telefone (SMS OTP)
- `server/verificacao.js` � selo via dom�nio de e-mail
- `server/reclamacoes.js` � reclama��es, apoios, respostas, rankings
- `pages/parlamentares.html` � aba unificada
- `js/parlamentares.js` + `js/parlamentar-auth.js` � l�gica
- `css/parlamentares.css` � design com cores, fontes e anima��es premium

### ?? Endpoints novos
```
POST /api/auth/{google,otp/send,otp/verify}        Login
GET  /api/auth/me                                  Sess�o atual
POST /api/auth/logout                              Sair

POST /api/verificacao/iniciar                      Iniciar verifica��o
GET  /api/verificacao/confirmar?token=...          Confirmar
GET  /api/verificacao/dominios                     Dom�nios autorizados
GET  /api/verificacao/stats                        Estat�sticas
GET  /api/verificacao/politico/:id                 Status de um pol�tico

POST /api/reclamacoes                              Criar reclama��o
GET  /api/reclamacoes?politicianId=...             Listar
POST /api/apoios                                   Criar apoio
GET  /api/apoios?politicianId=...                  Listar
POST /api/respostas                                Resposta (s� verificado)
GET  /api/rankings                                 Rankings p�blicos
GET  /api/estatisticas/politico/:id                Stats detalhadas
```

### ?? Fluxo de teste (modo dev)
```bash
node server/index.js
# ? http://localhost:8080/pages/parlamentares.html
# 1. Login: "google:seu@email.com:Seu Nome"
# 2. Abrir qualquer parlamentar
# 3. Reclamar / Apoiar (com sess�o ativa)
# 4. Verificar: e-mail institucional com dom�nio autorizado
```

### ?? Deploy (setembro/2026)
- **Front:** GitHub Pages � autom�tico a cada push na `main` (workflow `pages.yml`).
- **Backend:** Railway � autom�tico a cada push na `main` (Source repo conectado,
  auto-deploy ON). Manual, se um dia precisar: `railway up --service votabrasil-redesign`.
- **Manuten��o autom�tica** (workflow `manutencao.yml`): snapshot de not�cias
  di�rio (09:15), backup do SQLite di�rio (09:45, artifact 14 dias), candidaturas
  TSE di�rias (10:05), enriquecimento de produ��o/presen�a semanal (seg 10:30).
  Executar manualmente: aba Actions ? "Manuten��o autom�tica" ? Run workflow.
- **Dados de candidatos 2026:** `node scripts/baixar-candidatos-tse.js`
  (regenera `data/candidatos-2026.json` a partir dos CSVs oficiais do TSE
  via espelho di�rio `leofn/tse-candidatos-2026`).
