# AI-CONFIG.md - Regras de Ouro do Projeto VotaBrasil

Este arquivo contém as regras obrigatórias que TODAS as IAs devem seguir ao modificar este projeto.

## 2.1 Dados
✅ Usar APENAS dados oficiais do TSE para resultados de eleições
✅ Usar APENAS pesquisas de institutos reconhecidos (Datafolha, Quaest, Futura, Ipec, Gerp, Indexa) para intenções de voto
❌ NUNCA inventar números (nada de "18.639 eleitores simulados" ou "108.432.109 votos" sem fonte oficial)
❌ NUNCA confundir pesquisa com resultado — sempre deixar claro visualmente

**Status atual (outubro/2026):** As eleições de 2026 aconteceram em 04/10/2026 (1º turno). O 2º turno será em 25/10/2026. Todos os dados de resultados são OFICIAIS do TSE.

## 2.2 Visual
🔵 Badge azul = Dado oficial TSE (resultado)
🟡 Badge amarelo + disclaimer obrigatório = Pesquisa de opinião
⚠️ Disclaimer sempre visível: "ATENÇÃO: Esta seção apresenta PESQUISAS DE OPINIÃO. Estes números NÃO representam votos reais."

## 2.3 Funcionalidades
❌ FAQ/Perguntas Frequentes: REMOVIDO PERMANENTEMENTE. Não pode voltar.
✅ Lula e Flávio Bolsonaro: Devem aparecer na disputa do 2º turno
✅ Notícias: Carregar de `data/noticias.json` (não pode ficar em branco)
✅ Resultado Real: Mostrar dados oficiais do TSE (não dados simulados)

## 2.4 Proteção
Qualquer IA deve ler este arquivo antes de fazer modificações.
Se alguma regra for violada, a modificação deve ser desfeita imediatamente.

## 2.5 Arquivos de Dados
Os seguintes arquivos em `data/` contêm dados oficiais do TSE:
- `presidente-2026.json` - Resultado oficial do 1º turno (12 candidatos)
- `pesquisas-presidente-2026.json` - Pesquisas registradas no TSE para o 2º turno
- `governadores-2026.json` - Resultado oficial por estado (27 UFs)
- `pesquisas-governadores-2026.json` - Pesquisas do 2º turno por estado
- `camara-2026.json` - Cadeiras na Câmara por partido (dados parciais)
- `senado-2026.json` - 54 senadores eleitos por estado
- `assembleias-2026.json` - Dados por UF (dados parciais)

## 2.6 Deploy
- Railway: conectado ao repositório `xbrancox/mudabrasil` (branch `master`)
- Domínio: `https://meu-voto.app/`
- Deploy automático após push

---
*Última atualização: 14 de outubro de 2026*


## 2026-10-14 — Home page unificada (2º turno)

### Arquivos modificados
- `index.html` — Home unificada: conteúdo original recuperado + novos blocos (faixa-resumo TSE, cards Lula×Flávio com fotos, pesquisas, governadores por estado)
- `js/home-2026.js` — JS da home: pesquisas presidente, governadores por estado
- `css/eleicoes-2026.css` — Estilos novos: badges TSE, cards de candidatos, pesquisas, estados

### Seções da home
1. Hero original (2º turno, "o poder emana do povo")
2. Faixa-resumo: Flávio (47,03%) × Lula (45,16%) — dados TSE
3. Provas de impacto (recuperadas)
4. Cards Lula × Flávio com fotos oficiais do TSE
5. Pesquisas de opinião do 2º turno (Datafolha, Quaest, Futura, Ipec, Gerp, Indexa)
6. Governadores por estado (27 UFs, seletor funcional)
7. Como funciona (3 passos)
8. Explore o MeuVoto (Radar, Congresso, etc.)
9. Notícias (carrossel com filtro por estado)
10. Conferir Voto (demo)
11. Revogar Voto
12. Quem Somos

### Removido da home antiga
- Card de pesquisa simulada "Lula vs Flavio — 67% vs 33%" (dados fictícios)
- Seção "Resultado Real das Eleições 2026" (dados fictícios sobre presidente e cargos)

### Fotos dos candidatos
- Lula: `https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002542548_div.jpg`
- Flávio Bolsonaro: `https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/FBR280002551544_div.jpg`
