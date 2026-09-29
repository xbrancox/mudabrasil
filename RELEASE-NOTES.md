# Release Notes — MeuVoto (linha do tempo real)
- Fundo eleitoral compacto (donut+barras+R$/cadeira) e Prefeito/Vereador removidos (home + Eleições 2026).
- Cabeçalho uniforme em todas as páginas (site-header.js).
- Modal Radar: topo abaixo do header + botão Fechar no rodapé (commit 18cfc5f).
- Votações v1–v8: assunto/resumo/lei com tooltip+link, simbólica×nominal explicada, quórum, voto a voto, placar por UF, coerência de bancada, dossiê+PDF, agenda ±10 dias, autocomplete ⭐, tooltips estáveis, calor por UF, comparador × Plenário (commits c6da4e6, 8b402ab, 671b7e6, 8294e49, ac649a3).
- Votações v9–v13: resumo semanal PWA+cache offline, CSV, recibo de cobrança, Meu Congresso+PDF, tendência+presença, alertas de pauta, espelho Câmara×Senado, digest mailto, Brasil por bancadas, link público ?meus=.
- PWA/lojas: ícones 192/512/maskable gerados + manifest corrigido; store/twa-config.json + PUBLICACAO-LOJAS.md.
- Digest backend: /api/digest/* (subscribe/unsubscribe/status/list), worker SMTP, GitHub Action semanal, página pública digest.html, confirmação por token, admin, métricas, arquivo público, tracking de abertura (commits até 6a24a68).
- Votações v16-final (6a24a68): sumário navegável, meus temas (filtro client-side do resumo), impressão modo leitura, FIGMA-HANDOFF.md.
- v17 (este): acessibilidade de teclado em todos os chips clicáveis + auditor corrigido em scripts/auditar-votacoes.js.
Pendências que dependem do mantenedor: domínio omeuvoto.app (Registro.br), publicação Play Store (conta), secrets SMTP/DIGEST no GitHub.