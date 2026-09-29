# 🎨 Figma Handoff — MeuVoto / Votações
Arquivo-alvo do redesign: **pages/votacoes.html** (suporte: js/site-header.js, css/design-system.css, icon.svg).
## Tokens (CSS :root)
--bg #061a3a · --card #0d2242 · --card2 #123059 · --line rgba(127,176,245,.22) · --ink #fff · --muted #94A3B8 · --gold #FFD700 · --blueL #4a90f0 · --green #2ECC71 · --red #E74C3C
Tipografia: Montserrat 700-900 (titulos) · Manrope 400-800 (texto). Raio padrao 14-16px.
## Componentes existentes (classes reutilizaveis)
.btn/.btn.gold/.btn.sm · .badge(.tn/.ts) · .vb(.sim/.nao/.abs/.out) · .ecard · .painel · .vcard · .vtable · .ochips · .cbar/.cleg · .quorum · .sbox · .lei · .fonte
## Inventario de paineis (ordem na pagina)
1 Hero+educação (simbólica×nominal) · 2 abas Câmara/Senado · 3 ⭐ meus deputados+alertas · 4 🤝 promessas · 5 🕰️ dossiê · 6 🌡️ calor+⚖️ comparador · 7 📈 tendência+🏆 presença · 8 🔔 resumo auto+📥 CSV+🧾 recibo · 9 📊 Meu Congresso+🖨️ PDF · 10 📅 alertas pauta+📈 coerência SVG · 11 🧾 dossiê completo+🔗 link público · 12 🗺️ Brasil bancadas+🏛️ espelho+📧 digest · 13 📘 API+📦 kit lojas · 14 📧 painel digest · 15 🧭 sumário+📌 temas+🖨️ leitura (ciclo16) · + barra sticky de filtros e lista de cards.
## Estados que o design DEVE prever
vazio (sem ⭐/sem promessas) · recesso (janela 10 dias vazia → fallback 40 recentes) · offline/API fora (cache) · simbólica (sem voto a voto) · nominal (placar+quórum+UF+coerência+voto a voto) · WAF Senado bloqueado.
## Regras
Nunca remover: explicação simbólica×nominal, quórum, fontes oficiais, avisos de protótipo sem valor legal. Contraste AA no tema escuro. Mobile-first (chips quebram linha).
