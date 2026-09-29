# 🧠 VotaBrasil / MeuVoto — Arquitetura, Decisões e Evolução Cívica

> **Versão:** 2.0 — Setembro de 2026
> **Status:** documento vivo; toda alteração substancial entra na seção **11. Histórico de revisão**.
> **Público-alvo:** mantenedor do projeto, designers (Figma), colaboradores e futuras interações com IA.

Este documento é a **memória de produto** do VotaBrasil/MeuVoto. Ele registra decisões arquiteturais, métricas cívicas, protocolo de cobrança, arquitetura de informação, metodologia, backlog priorizado e lições aprendidas. Ele substitui a versão 1.0 em todos os pontos em que as duas divergem.

---

## 0. Como ler este documento

- Se você é **designer**, vá direto à seção **6. Arquitetura de informação** e ao apêndice **A. Especificação de UI (Fase 1)**.
- Se você é **dev**, comece pela seção **8. Qualidade e engenharia** e depois pelo roadmap (**9**).
- Se você é **jornalista/pesquisador**, leia as seções **2. Princípios**, **3. Métricas** e **7. Metodologia**.
- Se você é uma **IA em contexto**, leia este documento inteiro antes de propor novas métricas; evite reinventar os eixos já definidos aqui.

Regras editoriais deste documento:

- **Não usamos "nota única" para classificar parlamentares.** Usamos eixos separados e leitura contextual.
- **Separamos posição legislativa de reputação de base** (confiança não é concordância temática).
- **Separamos responsividade de prestabilidade** (gabinete responder não é o mesmo que concordar com o cidadão).
- **Toda métrica nova** exige fórmula explícita, fonte oficial declarada, frequência de atualização e limitações conhecidas.

---

## 1. Posicionamento do produto

O VotaBrasil responde três perguntas do eleitor, nesta ordem:

1. **O que foi decidido no Plenário?** (votações recentes, agenda futura)
2. **Como meu representante se posicionou?** (voto a voto, presença, coerência)
3. **Ele presta contas quando cobro?** (cobranças, abertura, resposta verificada)

Qualquer feature nova deve servir claramente a uma dessas três perguntas. Se não servir, é ruído.

> **Anti-objetivos** (não é o que o projeto faz):
> - Ranking moral de "bom/mau político".
> - Vigilância individual do voto (todos os agregados são anônimos).
> - Substituir o voto oficial em eleições.
> - Afirmar mecanismos jurídicos que não existem no ordenamento brasileiro vigente.

---

## 2. Princípios de leitura responsável

Os quatro princípios abaixo protegem o projeto contra leituras distorcidas. Eles **devem** aparecer na documentação pública (página `/metodologia`) e orientar qualquer UI que exponha métricas.

| # | Princípio | Implicação |
|---|---|---|
| P1 | **Posição legislativa ≠ Reputação pessoal** | Votar "Sim" em uma PEC não diz nada sobre a integridade do parlamentar. |
| P2 | **Confiança da base ≠ Concordância temática** | Um eleitor pode confiar pouco no deputado por ausência, escândalo ou silêncio — isso não significa que ele discordaria do voto específico. |
| P3 | **Resposta de gabinete ≠ Aprovação política** | Um gabinete responsivo pode responder "discordamos do cidadão" com urbanidade e clareza. |
| P4 | **Dado agregado anônimo ≠ Vigilância individual** | O termômetro é irreversível: ninguém consegue extrair o voto de uma pessoa. |

### Correção em relação à v1.0

A v1.0 descrevia o "Delta" como *"o desvio percentual entre o voto do deputado e o esperado pela base"*. Isso **misturava dois eixos distintos** (posição e confiança) em um único número, o que gera leitura enganosa. A v2 substitui o delta por **três eixos independentes** (seção 3.1) e por um **quadrante de representação** (seção 3.2).

---

## 3. Métricas de representação

### 3.1 Os três eixos independentes

Cada parlamentar acompanhado tem três indicadores calculados separadamente:

| Eixo | Pergunta | Fonte primária | Fórmula |
|---|---|---|---|
| **A. Fidelidade partidária** | Quanto o parlamentar segue a orientação da própria bancada? | `GET /api/camara/votacoes/{id}/orientacoes` (orientação oficial) + votos nominais | `alinhados / votos_nominais_com_orientacao` |
| **B. Distância da bancada** | Quão perto ou longe do comportamento médio do partido? | Votos nominais individuais vs. agregado do partido (apenas Sim/Não) | `Δpp = %Sim(deputado) − %Sim(bancada)` |
| **C. Confiança da base** | Qual a percepção agregada (anônima) da UF? | Termômetro (`/api/termometro`), agregado por UF | Índice 0–100 com tendência (↑/↓/→) |

> **O que entra no cálculo:** apenas votações nominais (tipo `N`). Simbólicas, abstenções e obstruções são excluídas dos eixos A e B; ausência entra em um quarto indicador auxiliar de **presença**.

### 3.2 Quadrante de representação

A combinação de (A) fidelidade partidária e (C) confiança da base gera um **quadrante** com quatro perfis interpretativos:

```
           Fidelidade partidária
              alta       baixa
          ┌──────────┬──────────┐
    alta  │ Consistente │ Autônomo
 confiança │   (alinhado │  com respaldo
          │   e respaldado) │ popular  │
          ├──────────┼──────────┤
    baixa │ Partidário │ Em tensão │
          │  (distante │ (crise de │
          │   da base) │ representação) │
          └──────────┴──────────┘
```

**Leitura:** nenhum quadrante é "bom" ou "ruim" por si só — o que é útil é saber em qual perfil o parlamentar está e se ele está migrando entre quadrantes ao longo do tempo.

> **Limitação declarada:** o termômetro é percepção agregada, não mandato. Migrar para o quadrante "Em tensão" **não** significa que o mandato está juridicamente em risco (ver seção 5.3).

### 3.3 Evolução temporal

Cada eixo tem uma série histórica (últimas 30 votações nominais em que o parlamentar participou). O UI mostra **tendência** (↑/↓/→) e um sparkline SVG puro, sem bibliotecas.

---

## 4. Cobrança e responsividade do gabinete

### 4.1 Protocolo verificável

A taxa de resposta só tem valor se for **auditável**. O ciclo de vida de uma cobrança é:

```
gerada → enviada → aberta → respondida → validada
```

| Estado | Como se atinge | Peso na métrica |
|---|---|---|
| `gerada` | Usuário monta recibo e confirma envio | 0 |
| `enviada` | Link rastreável com token único (UTM + id da cobrança) | 0 |
| `aberta` | Pixel 1×1 do link no e-mail do gabinete disparado **ou** clique no link público | 1 |
| `respondida` | Gabinete usa **link oficial de resposta** (token assinado enviado no cabeçalho do recibo) | 3 |
| `validada` | Resposta oficial publicada e indexada na ficha pública do parlamentar | 5 |

### 4.2 Métricas derivadas

- **Taxa de resposta oficial** = `validadas / enviadas` (apenas cobranças entregues a endereços oficiais `@camara.leg.br` / `@senado.leg.br`).
- **Taxa de abertura** = `abertas / enviadas` (indicador secundário; subestimado por bloqueadores de imagem).
- **Tempo mediano de resposta** = percentil 50 de (validada.ts − enviada.ts).
- **Relato cidadão** = marcação "recebi resposta" feita pelo próprio eleitor, exibida em camada separada e com peso visual menor.

### 4.3 Selo de gabinete responsivo

| Nível | Critério |
|---|---|
| 🥇 Ouro | Taxa ≥ 70% e mediana ≤ 7 dias |
| 🥈 Prata | Taxa ≥ 40% e mediana ≤ 15 dias |
| 🥉 Bronze | Taxa ≥ 20% ou qualquer resposta dentro de 30 dias |
| ⚪ Sem registro | Nenhuma resposta validada |

O selo é **descritivo**, não moralizante. Ele mede **prestabilidade do canal**, não mérito político.

### 4.4 Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Eleitor marcar "recebi resposta" sem receber | Relato cidadão separado da métrica oficial |
| Gabinete responder "pro forma" | Resposta validada só após publicação na ficha pública (texto integral) |
| Uso político indevido do selo | Metodologia pública + disclaimer em cada ficha |

---

## 5. Pilares de transparência

### 5.1 Quórum e tipo de votação

O UI deve sempre deixar visível:

- **Badge grande**: `✍️ Nominal` ou `🗣️ Simbólica`.
- **Tooltip do badge**:
  - Nominal: *"cada voto individual é registrado e público."*
  - Simbólica: *"a Mesa apura o conjunto; não há registro individual. É como a maioria das matérias passa."*
- **Linha de quórum**: *"Aprovada com folga de N votos"* ou *"Rejeitada — faltaram N votos"*.
- **Aviso**: *"Indicativo calculado pelo MeuVoto. O resultado oficial está em [link da fonte]."*

### 5.2 Dossiê cívico

O dossiê de um parlamentar reúne:

1. Última janela de votações nominais (padrão: 30).
2. Presença percentual.
3. Eixos A, B e C da seção 3.
4. Promessas cobradas pelo usuário.
5. Recibos de cobrança emitidos e status.
6. Reclamações e apoios públicos.

Exportável em PDF (ficha única) ou CSV (para jornalistas).

### 5.3 Mandato revogável — tratamento educativo

No Brasil, **não há mecanismo vigente de revogação popular direta de mandato de deputado federal ou senador**. Apresentar isso como se fosse um recurso efetivo é **tecnicamente incorreto e juridicamente arriscado**.

**Como o projeto trata o tema:**

- Uma página educativa `/mandato-responsavel` explica o conceito de *recall* em democracias comparadas (alguns estados dos EUA, alguns cantões suíços, casos pontuais na América Latina).
- Um **simulador conceitual** mostra quantos eleitores da UF precisariam se mobilizar para atingir 70% — apenas como exercício aritmético, com disclaimer.
- Chamadas para mobilização legítima (abaixo-assinados, audiências públicas, pressão via canais oficiais) são **linkadas**, nunca simuladas como efetivas.

Texto obrigatório em qualquer tela que mencione revogação:

> *"A revogação popular direta de mandato parlamentar não é um mecanismo vigente no ordenamento brasileiro. Este painel tem finalidade educativa e de mobilização cívica responsável."*

---

## 6. Arquitetura de informação

### 6.1 Cinco abas principais (`pages/votacoes.html`)

| Aba | Conteúdo | Pergunta que responde |
|---|---|---|
| 🗳️ **Votações** | Filtros + agenda futura + lista de votações (progressive disclosure) | *O que foi decidido?* |
| ⭐ **Meus representantes** | Autocomplete, promessas, temas de interesse, alertas | *Quem me representa?* |
| 📊 **Análise** | Quadrante, fidelidade, distância, confiança, tendência, presença, coerência no tempo | *Como se posicionam?* |
| 🧾 **Cobranças** | Recibos, histórico, status de resposta, selo | *Prestam contas?* |
| 🏛️ **Sistema** | API pública, status, metodologia, digest, kit de publicação | *Como o sistema funciona?* |

### 6.2 Template obrigatório do `ⓘ`

Cada cartão/painel com `ⓘ` tem popover com **quatro campos**, nesta ordem:

1. **O que é** (1 frase)
2. **Para que serve** (1 frase)
3. **Como interpretar** (bullet curto)
4. **Limitações** (bullet curto, sempre presente)

Exemplo para "Fidelidade partidária":

> **O que é:** porcentagem de votos nominais em que o parlamentar seguiu a orientação oficial da própria bancada.
> **Para que serve:** identificar alinhamento partidário, não qualidade de mandato.
> **Como interpretar:** 90%+ = alinhado; 70–89% = moderado; <70% = autônomo ou em tensão.
> **Limitações:** só conta votações com orientação publicada; exclui abstenções; não mede acordo com a base.

### 6.3 Progressive disclosure

- **Lista de votações**: padrão mostra **2 cards** + botão "📖 Ver todas da janela".
- **Agenda futura**: padrão **10 dias** mostrando até 4 sessões; botões **"último mês"** e **"todas"** para expandir.
- **Cards de análise**: resumo em 1 linha; detalhes expandíveis (`<details>` ou accordion).
- **Dossiê**: resumo em 3 números grandes (presença, fidelidade, confiança); voto a voto em tabela expansível.

### 6.4 Barra de estatísticas no topo (contexto)

Quatro números sempre visíveis, atualizados em tempo real:

```
Votações na janela  ·  Nominais registradas  ·  Sessões futuras  ·  Representantes acompanhados
```

### 6.5 Estados que o design deve prever

- **Vazio** (sem representantes, sem promessas) — call-to-action, nunca tela quebrada.
- **Recesso** (janela de 10 dias vazia por calendário real) — aviso honesto + fallback das 40 mais recentes.
- **Offline/API fora** — cache local com timestamp; aviso "dados de DD/MM HH:MM".
- **Simbólica** (sem voto a voto) — explicação clara + orientações de bancada.
- **Nominal** — placar + quórum + placar por UF + coerência + voto a voto.
- **Senado bloqueado por WAF** — fallback com link oficial, nunca erro genérico.

### 6.6 Acessibilidade

- `role=tablist / tab / tabpanel` na barra de abas, com setas ←/→, Home/End.
- `role=button` + `tabindex=0` + `aria-label` em todos os `span[onclick]` e `div[onclick]` (incluindo gerados dinamicamente — MutationObserver debounced).
- Foco visível dourado (`--gold`).
- `aria-live="polite"` nos números de contexto.
- `prefers-reduced-motion` respeitado (sem animações).
- Contraste AA no tema escuro.

### 6.7 URL por aba e deep-links

- `#tab-votacoes`, `#tab-analise`, `#tab-cobrancas`, `#tab-sistema`.
- `#v<id>` abre a votação específica e expande os detalhes.
- `?meus=camara-X,camara-Y` carrega representantes de um link compartilhado (adoção aditiva).

### 6.8 Modo leitura e impressão

- Botão "🖨️ Modo leitura" adiciona `body.printall` — abas e controles somem, todos os cartões expandem, CSS de print limpo.

### 6.9 Busca global (roadmap — Fase 2)

- `⌘K` / `Ctrl+K` abre command palette sobre abas, cartões e as votações carregadas.
- Resultados agrupados: *Aba → Cartão → Votação*.

---

## 7. Metodologia e fontes

| Item | Fonte oficial | Frequência |
|---|---|---|
| Votações nominais/simbólicas | `dadosabertos.camara.leg.br` via proxy `/api/camara/votacoes` | tempo real |
| Orientações de bancada | `dadosabertos.camara.leg.br` `/votacoes/{id}/orientacoes` | tempo real |
| Votações do Senado | `legis.senado.leg.br/dadosabertos` (com fallback se WAF) | tempo real |
| Parlamentares (513 dep. + 81 sen.) | APIs oficiais + cache local | atualizado diariamente |
| Termômetro de confiança | Agregado anônimo interno (irreversível) | tempo real |
| Digest semanal | GitHub Action cron `0 12 * * 1` via SMTP | segunda-feira 12h UTC |

**O que é oficial vs. estimado:**

- Oficiais: placares, votos nominais, presença, orientações publicadas.
- Estimados: quadrante de representação (combinação), tendência (suavização), taxa de abertura (subestimada por bloqueadores), presença agregada (só conta sessões com votação nominal registrada).

LGPD: nenhum dado pessoal é publicado. Termômetro é irreversível. Cobranças só são indexadas com token público do usuário. E-mails do digest são armazenados localmente no servidor, sem terceiros.

---

## 8. Qualidade e engenharia

### 8.1 Scripts de auditoria no repositório

- `scripts/auditar-votacoes.js` — sintaxe de todos os `<script>` inline de `pages/votacoes.html`, órfãs reais (exclui strings, templates, comentários, palavras-chave, globais do browser e funções CSS como `rgba`, `var`, `repeat`), duplicadas (só `function` de topo).
- `scripts/validar-ia.js` — estende o auditor: valida atributos HTML com aspas, balanceamento de `<div>`, marcadores de ciclo.
- `scripts/testar-ia.js` — suíte de 60+ asserções em DOM real (jsdom) com API simulada.
- `scripts/testar-ia-real.js` — mesma suíte com dados reais de produção.

**CI obrigatório** (roadmap Fase 1+): GitHub Action rodando `node scripts/validar-ia.js && node scripts/testar-ia.js` em cada push a `main`. Falha no gate **bloqueia o merge**.

### 8.2 Lições aprendidas (incidentes reais)

| Incidente | Causa raiz | Prevenção |
|---|---|---|
| **ID com traço tratado como subtração** (`onclick="expand(2634392-21)"` → `expand(2634371)`) | ID da Câmara contém `-`; passado sem aspas em gerador de HTML. | Todos os `onclick` com IDs usam template literal: `` `onclick="expand('${id}')"` ``. Varredura automatizada rejeita `/onclick="[^"]*\(.*\w-\w/`. |
| **IIFE quebrada** (`)();\n</script>` em vez de `})();\n</script>`) | Injeção automática de shim dentro de `<script>` existente. | Shims sempre inseridos como blocos completos, validados por `new Function()` antes do commit. |
| **Auditor acusando `rgba`, `var`, `repeat` como órfãs** | Regex contava chamadas dentro de strings CSS embutidas. | Auditor v2 faz **strip de strings, templates e comentários** antes da análise; allowlist de funções CSS. |
| **`const` de topo não expõe em `window`** | Agenda ficava vazia porque bindings não estavam globais. | Bindings globais explícitos (`var CAM = …`) quando precisam ser acessados por scripts injetados. |
| **`exit 1` de PowerShell fechava janela** | Erros no bloco abortavam a sessão sem log. | Zero `exit` em nível de shell; flag + transcript em arquivo `_*.txt`. |

### 8.3 Política de commits

- Commits atômicos: uma feature por commit.
- Mensagem no padrão Conventional Commits (`feat(scope)`, `fix(scope)`, `docs(scope)`).
- Nenhum merge em `main` sem gate verde.

---

## 9. Roadmap

### Fase 1 — UX profissional (parcialmente concluída)

**Objetivo:** página clara, navegável e auditável.

- [x] Cinco abas principais.
- [x] `ⓘ` padronizado em todos os blocos.
- [x] Progressive disclosure (2 votações + expandir).
- [x] Agenda 10 dias / mês / todas.
- [x] Estatísticas no topo.
- [x] Estados vazios úteis.
- [x] Acessibilidade teclado/ARIA.
- [x] Modo impressão.
- [ ] **Busca global `⌘K`** (próximo).
- [ ] CI obrigatório.

### Fase 2 — Métricas de representação

**Objetivo:** tirar o produto de "consulta" e levar para "análise cívica".

- [ ] Fidelidade partidária (eixo A) no UI.
- [ ] Distância da bancada (eixo B) no UI.
- [ ] Confiança da base (eixo C) no UI.
- [ ] Quadrante de representação (visualização).
- [ ] Tendência no tempo (sparkline).
- [ ] Comparador A × B de dois deputados.

### Fase 3 — Cobrança verificada

**Objetivo:** fechar o ciclo cidadão → gabinete → resposta pública.

- [ ] Token assinado no recibo.
- [ ] Link oficial de resposta do gabinete.
- [ ] Página pública da cobrança.
- [ ] Métricas de abertura/resposta.
- [ ] Selo de gabinete responsivo (ouro/prata/bronze).

### Fase 4 — Educação cívica

**Objetivo:** abordar temas como *recall* e mobilização sem erro jurídico.

- [ ] Página `/mandato-responsavel`.
- [ ] Simulador conceitual (aritmético, nunca jurídico).
- [ ] Disclaimer obrigatório em toda tela que mencione revogação.
- [ ] Links para mobilização legítima.

---

## 10. Backlog sugerido (ordenado por impacto/esforço)

| # | Item | Impacto | Esforço |
|---|---|---|---|
| P0 | Busca global `⌘K` | Alto | Médio |
| P1 | Comparador A × B | Muito alto | Médio |
| P2 | Tema automático por votação (tags editoriais) | Alto | Médio |
| P3 | Linha "O que muda na prática" por matéria | Muito alto | Alto |
| P4 | Modo cidadão (menos siglas, mais frases prontas) | Alto | Baixo |
| P5 | Tema claro / alto contraste | Alto | Baixo |
| P6 | Exportar card como PNG (WhatsApp) | Muito alto | Alto |
| P7 | Notificações push inteligentes (tema + representante + prazo) | Médio | Médio |
| P8 | Offline-first visível (timestamp da última atualização) | Médio | Baixo |

---

## 11. Histórico de revisão

| Versão | Data | Mudança |
|---|---|---|
| v1.0 | 2026-09 | Primeira versão. Conceitos iniciais de delta, taxa de resposta, mandato revogável. |
| v2.0 | 2026-09-30 | Reescrita completa. Separação de eixos (A/B/C). Quadrante de representação. Protocolo verificável de cobrança. Tratamento educativo de mandato revogável. Arquitetura de 5 abas. Template de `ⓘ`. Metodologia pública. Lições aprendidas documentadas. Roadmap priorizado. |

---

## Apêndice A — Especificação de UI (Fase 1)

> Para entrega ao Figma/figma-free: este apêndice é o contrato visual.

### A.1 Tokens de design

```
--bg        #061a3a
--card      #0d2242
--card2     #123059
--line      rgba(127,176,245,.22)
--ink       #ffffff
--muted     #94A3B8
--gold      #FFD700   (foco, CTA, destaque)
--blueL     #4a90f0
--green     #2ECC71   (Sim, sucesso)
--red       #E74C3C   (Não, erro)
```

Tipografia: **Montserrat** 700–900 (títulos) · **Manrope** 400–800 (texto). Raios padrão: `14–16px`. Contraste AA obrigatório.

### A.2 Componentes reutilizáveis

`.btn` / `.btn.gold` / `.btn.sm` · `.badge(.tn/.ts)` · `.vb(.sim/.nao/.abs/.out)` · `.ecard` · `.painel` · `.vcard` · `.vtable` · `.ochips` · `.cbar` / `.cleg` · `.quorum` · `.sbox` · `.lei` · `.fonte` · `.infoBtn` (ⓘ) · `.popover`

### A.3 Grid

- Desktop: largura máxima 1180px; grid de 12 colunas.
- Mobile: coluna única; abas roláveis horizontalmente com auto-scroll para aba ativa.
- Breakpoint crítico: 860px (troca grid de 2 para 1 coluna).

### A.4 Hierarquia de uma votação (card)

```
┌─────────────────────────────────────────────────────────┐
│ [badge: Nominal/Simbólica]        [data · Plenário]    │
│                                                         │
│ Título da matéria                                       │
│ [📜 Sigla N/ANO]  (mouse: resumo · clique: oficial)    │
│ Ementa (até 240 chars)                                  │
│                                                         │
│ [🔎 Como foi esta votação?]                             │
└─────────────────────────────────────────────────────────┘
```

Quando expandida (nominal):

```
┌─────────────────────────────────────────────────────────┐
│ Barra de placar: ██████ verde █████ vermelho ██ cinza    │
│ Sim: X · Não: Y · Abstenção: Z · Outros: W              │
│                                                         │
│ 🧮 Quórum: tot presentes · necessários N · frase        │
│                                                         │
│ 🗺️ Placar por UF (chips; UF do usuário dourada)         │
│                                                         │
│ 🗣️ Coerência de bancada (chips por partido)             │
│                                                         │
│ ⭐ Seus deputados (chips com voto)                      │
│                                                         │
│ 🤝 Promessas cobradas                                   │
│                                                         │
│ [📄 PDF] [📲 WhatsApp] [busca] [filtro tipo]            │
│                                                         │
│ Tabela voto a voto (150 primeiras, lazy-load)            │
└─────────────────────────────────────────────────────────┘
```

### A.5 Estados críticos

- **Vazio**: "Marque ⭐ representantes para começar." + CTA.
- **Recesso**: "Câmara pode estar em recesso/período eleitoral. Mostrando as 40 mais recentes."
- **Offline**: banner amarelo com "Última atualização: DD/MM HH:MM. Algumas ações podem falhar."
- **Senado WAF**: card explicativo + link oficial (nunca erro genérico).

### A.6 Acessibilidade mínima

- Foco visível em todos os elementos interativos (outline `--gold`).
- `aria-live="polite"` nos 4 números do topo.
- `role=tablist/tab/tabpanel` na barra de abas.
- `role=button` + `tabindex=0` + `aria-label` em chips clicáveis.
- `prefers-reduced-motion` desliga animações.
- Textos sempre em `--ink` ou `--muted` (nunca branco sobre branco).

---

## Apêndice B — Glossário cívico do projeto

- **Nominal:** votação em que cada parlamentar registra Sim/Não/Abstenção/Obstrução individualmente.
- **Simbólica:** votação em que a Mesa apura o conjunto sem registro individual.
- **Bancada:** conjunto de parlamentares do mesmo partido.
- **Orientação:** voto recomendado pela liderança da bancada para uma votação específica.
- **Fidelidade partidária:** porcentagem de alinhamento do parlamentar com a orientação da própria bancada.
- **Distância da bancada:** diferença em pontos percentuais (Δpp) entre o %Sim do parlamentar e o %Sim agregado da bancada.
- **Termômetro de confiança:** índice agregado anônimo da UF; irreversível.
- **Recibo de cobrança:** documento gerado pelo usuário citando votações nominais e promessas, enviado ao gabinete.
- **Resposta verificada:** resposta do gabinete registrada via link oficial assinado no recibo.
- **Mandato revogável:** conceito educativo (não vigente no Brasil para deputados federais).

---

*Fim do documento. Para alterações, abra PR atualizando a seção 11.*


---

## 5. Implementações pós-v2.0

### 5.1 Ciclo 18 — Painel de representação (3 eixos + quadrante)
Página: `pages/votacoes.html`, aba **📊 Análise**, botão **🧭 Painel de representação (3 eixos)**.

Entrega, por deputado ⭐, quatro indicadores simultâneos:
- **A. Fidelidade partidária** — % dos votos nominais alinhados à orientação da bancada;
- **B. Distância da bancada** — diferença em pp entre o %Sim do deputado e o %Sim do partido;
- **C. Confiança da base** — índice agregado do Termômetro Cívico (UF);
- **Badge de quadrante** — classificação em *Consistente / Autônomo com respaldo / Partidário / Em tensão / Indeterminado*.

Bloco ⓘ editorial com os 4 campos fixos do padrão (o que é / para que serve / como interpretar / limitações).

### 5.2 Ciclo 19 — Página educativa de Mandato Responsável
Arquivo: `pages/mandato-responsavel.html`. Linkada a partir do painel de Análise (junto ao botão do painel de 3 eixos) e do painel de Dossiê.

Conteúdo:
1. **⚠️ Aviso (disclaimer)** — esclarece que o ordenamento brasileiro não prevê revogação popular direta de mandato de deputado federal; a página tem finalidade educativa e protótipo sem valor legal.
2. **O que é recall em outras democracias** — exemplos citados na literatura (alguns estados dos EUA, Venezuela, Bolívia, cantões suíços), com nota sobre restrições de ativação.
3. **Como um mandato pode terminar hoje no Brasil** — renúncia, perda por votação na Casa (art. 55 CF), cassação por infidelidade partidária (TSE), condenação, falecimento.
4. **Simulador conceitual (hipotético)** — entrada: votos obtidos, % da base assinando, regra conceitual (% dos votos obtidos); saída: assinaturas necessárias, assinaturas no cenário, barra de progresso e veredicto, sempre com lembrete do caráter hipotético.
5. **Chaves de mobilização legítima** — pressão ao gabinete, requerimentos a comissões, representação ao Conselho de Ética, acionamento de MPF/TCU/TSE/CGU, organização de voto e informação, participação em audiências públicas.
6. Navegação para Votações, Radar Político e API pública.


### 5.3 Ciclo 20 — Busca global (Ctrl+K / ⌘K)
**Arquivos:** `js/busca-global.js` (módulo) + 10 linhas injetadas em `js/site-header.js`.
- **Quatro domínios de busca** cruzados em uma única modal acessível:
  1. Páginas do site (18 rotas conhecidas) — navegação direta.
  2. Seções da página atual (h1/h2/h3, desduplicadas) — rola até o elemento.
  3. Votações recentes da Câmara (40, cache 30 min) — abre `expand(id)` se estiver em votacoes.html ou deep-link `#v<id>`.
  4. Parlamentares (`/api/candidatos`, cache 30 min) — abre ficha do parlamentar.
- **Interação:** atalho `Ctrl+K` / `⌘K`, botão flutuante `🔍`, `↑↓` para navegar, `Enter` para abrir, `Esc` para fechar, clique fora fecha.
- **Acessibilidade:** `role=dialog`, `aria-modal`, `aria-label`, foco gerenciado, label em cada item.
- **Cache:** vota + candidatos em memória por 30 min; evita chamadas repetidas ao abrir/fechar a modal.
- **Adaptação visual:** botão flutuante sobe 50 px quando há `.cmpbar.on` para não ser ocultado.
- **Validação:** `node --check` nos dois arquivos, marcadores `busca-global.js` + `ciclo20: busca global Ctrl+K` confirmados via HTTP no raw do GitHub após push.

### 5.4 Ciclo 21 — Comparador A × B de deputados (P1 do backlog)
Entregue em commit `21-xxx` (substituir hash real). Nova ferramenta na aba **Análise** que responde à pergunta real do eleitor: *"meu deputado e o dele discordaram em quê?"*

**Funcionalidades:**
- Dois seletores (preenchidos automaticamente com a lista ⭐ do usuário) para escolher os deputados A e B.
- Tabela das últimas votações nominais onde ambos votaram: data, matéria, voto de A, voto de B, ícone ✓/✗ de concordância/discordância e link direto para abrir a votação.
- Taxa de convergência (%) com barra colorida (verde = iguais, vermelho = divergentes).
- Top 5 discordâncias com links diretos.
- Exportação em **PNG** (canvas puro, sem libs) e compartilhamento via **WhatsApp**.
- Popover ⓘ com o template editorial obrigatório (o que é / para que serve / como interpretar / limitações).

**Validações:**
- Sintaxe de todos os 15 `<script>` inline: OK.
- 146 nomes chamados sem funções órfãs.
- 616 tags HTML com atributos entre aspas.
- 138/138 `<div>` balanceadas.
- 60+ asserções DOM (grupos A–L) passaram.
- Bug fix aplicado: `<div style="overflow-x:auto">` agora fechado corretamente após `</table>`.

**Próximos passos sugeridos (backlog priorizado):**
- P2: Virtualização do voto a voto (513 linhas por nominal) para dispositivos fracos.
- P3: Tema claro / alto contraste (tokens já centralizados).
- P4: Testes no CI (Action rodando `validar-ia.js` + `testar-ia.js` em cada push).


### 5.5 Ciclo 22 — Virtualização do voto a voto

**Objetivo:** Reduzir o custo de renderização em votações nominais com centenas de votos (até 513 deputados), melhorando performance em dispositivos móveis e fracos.

**O que foi feito:**
- Substituição da função `tab(id)` por uma versão paginada que renderiza **50 linhas por página** em vez de todas de uma vez.
- Cache dos resultados filtrados em `TABROWS[id]` e contador de página em `TABPAGE[id]`.
- Função auxiliar `tabRowHtml(x)` centraliza a geração de cada `<tr>` (foto, nome+partido-UF, voto colorido).
- Linha de rodapé `<tr class="vmrow">` com botão **"▼ Mostrar mais 50 (restam N)"** aparece quando há mais votos além dos 50 atuais.
- Filtros (busca por nome/partido/UF e tipo de voto) reiniciam a paginação automaticamente.
- Sem dependência de libs externas (sem IntersectionObserver/scroll infinito — abordagem mais robusta e previsível).

**Impacto:**
- Votações com 513 votos (nominal completo) agora renderizam ~10× mais rápido no primeiro paint (50 linhas vs. 513).
- Experiência fluida em celulares de entrada.
- Sem quebra de funcionalidade: todos os filtros, busca e links diretos continuam funcionando.

**Validações aplicadas:**
- `node scripts/validar-ia.js`: 15 scripts, 147 nomes sem órfãos, 619 tags com aspas, 138/138 divs balanceadas.
- `node scripts/testar-ia.js`: todos os 12 grupos A–L verdes (incluindo tabela voto a voto com 3 linhas no teste).

**Status:** Commit aplicado e publicado em produção (GitHub Pages).


### 5.6 Ciclo hotfix — reforço do expand e tratamento de erros

**Commit `71ce1f5`** (hotfix aplicado após relato de que "abrir votação nominal não funciona").

Diagnóstico:
- O teste automatizado do DOM (grupo I) confirmou que `expand()` abre detalhes, renderiza quórum, coerência, placar por UF e a tabela voto a voto.
- No entanto, foram identificados três pontos fracos que podiam fazer o clique parecer inoperante em situações de borda:
  1. **Deep-link `#v<id>` só aceitava IDs puramente numéricos** (`/^\d+$/`). IDs reais da Câmara contêm traço (ex.: `2611313-31`), então links diretos como `#v2611313-31` não abriam a votação.
  2. **`votosDe()` engolia silenciosamente falhas de rede**: retornava `{nominal:false}` e o card caía no branch simbólica sem nenhum aviso ao usuário.
  3. **`expand()` não logava quando `el` ou `v` não eram encontrados**, dificultando diagnóstico.

Correções aplicadas:
- Regex do deep-link trocada para aceitar strings com traço; `W.expand(nid)` agora recebe a string diretamente (sem `Number()`).
- `votosDe()` agora faz `try/catch` e loga no `console.warn` quando o fetch falha.
- `expand()` ganha `console.warn` quando não encontra elementos, e mostra mensagem amigável na tela quando `votosDe` retorna vazio: *"Não foi possível carregar os votos desta votação agora. Tente novamente em instantes."*.
- 15 scripts inline revalidados (`validar-ia.js`) — todos OK.
- Teste DOM completo (grupos A–L, 60+ asserções) — todos passaram, incluindo "detalhes expandem" e "tabela voto a voto com 3 linhas".

Resultado: a funcionalidade de abrir votações nominais ficou mais robusta, com diagnóstico claro caso volte a falhar.
