const fs = require('fs');
const path = require('path');

const votacoesPath = path.join(__dirname, '..', 'pages', 'votacoes.html');
let html = fs.readFileSync(votacoesPath, 'utf8');

// Verifica se já foi aplicado
if (html.includes('id="ciclo37"')) {
  console.log('Ciclo 37 já aplicado');
  process.exit(0);
}

// 1. Adicionar CSS para seções e ícones de informação
const css37 = `
<style id="css37">
.sec37 { margin: 24px auto 0; max-width: 960px; }
.sec37-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 12px;
  padding: 0 4px;
}
.sec37-info {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--blueL);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: help;
  position: relative;
  flex-shrink: 0;
}
.sec37-info:hover::after {
  content: attr(data-tip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--card2);
  color: var(--ink);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  font-size: 12px;
  font-weight: 400;
  white-space: normal;
  width: 280px;
  max-width: 90vw;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  margin-bottom: 8px;
  line-height: 1.4;
}
.votacoes-preview {
  max-height: 600px;
  overflow: hidden;
  position: relative;
}
.votacoes-preview::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(to bottom, transparent, var(--bg));
  pointer-events: none;
}
.votacoes-preview.expanded {
  max-height: none;
  overflow: visible;
}
.votacoes-preview.expanded::after {
  display: none;
}
.btn-ver-todas {
  display: block;
  margin: 16px auto;
  padding: 12px 24px;
  background: var(--gold);
  color: #1a1400;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ver-todas:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}
.sumario37 {
  position: sticky;
  top: 60px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  margin: 20px auto;
  max-width: 960px;
  z-index: 90;
}
.sumario37 h3 {
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--muted);
}
.sumario37-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.sumario37-link {
  padding: 6px 12px;
  background: var(--card2);
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--ink);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
}
.sumario37-link:hover {
  background: var(--blueL);
  border-color: var(--blueL);
}
</style>
`;

// 2. Adicionar sumário de navegação
const sumario37 = `
<div id="sumario37" class="sumario37">
  <h3>🧭 Navegação Rápida</h3>
  <div class="sumario37-links">
    <a class="sumario37-link" onclick="document.getElementById('sec37-representantes').scrollIntoView({behavior:'smooth'})">⭐ Meus Representantes</a>
    <a class="sumario37-link" onclick="document.getElementById('sec37-votacoes').scrollIntoView({behavior:'smooth'})">🗳️ Votações</a>
    <a class="sumario37-link" onclick="document.getElementById('sec37-analise').scrollIntoView({behavior:'smooth'})">📊 Análise</a>
    <a class="sumario37-link" onclick="document.getElementById('sec37-ferramentas').scrollIntoView({behavior:'smooth'})">📈 Ferramentas</a>
    <a class="sumario37-link" onclick="document.getElementById('sec37-cobrancas').scrollIntoView({behavior:'smooth'})">📬 Cobranças</a>
  </div>
</div>
`;

// 3. Envolver painéis de representantes na seção
html = html.replace(
  /(<div class="painel"><div class="row"><span class="acwrap"><input id="mq")/,
  '<div id="sec37-representantes" class="sec37"><div class="sec37-title">⭐ Meus Representantes <span class="sec37-info" data-tip="Marque deputados e senadores para acompanhar como votam, criar promessas de cobrança e gerar dossiês completos de cada parlamentar.">ⓘ</span></div>$1'
);

// Fechar seção após o painel de dossiê
html = html.replace(
  /(<div id="dossie" style="margin-top:10px"><\/div><\/div>)/,
  '$1</div>'
);

// 4. Envolver seção de votações (já existe, mas vamos adicionar título)
html = html.replace(
  /(<h2 class="secT" id="lblPassado">🗳️ O que JÁ foi votado — últimos 10 dias<\/h2>)/,
  '<div id="sec37-votacoes" class="sec37"><div class="sec37-title">🗳️ Votações Recentes <span class="sec37-info" data-tip="Veja as votações nominais e simbólicas dos últimos 10 dias. Filtre por tipo (nominal/simbólica) e busque por assunto. Clique em uma votação para ver detalhes, placar por estado e voto dos seus deputados.">ⓘ</span></div>$1'
);

// 5. Modificar a renderização da lista para mostrar apenas 3 por padrão
// Encontrar a função render() e modificar para mostrar preview
html = html.replace(
  /function render\(\)\{const L=filtrados\(\);/,
  'function render(){const L=filtrados();const isPreview=typeof window.__showAllVotacoes==="undefined"||!window.__showAllVotacoes;'
);

// Modificar a parte que renderiza a lista para usar preview
html = html.replace(
  /const vis=L\.slice\(0,SHOW\);/,
  'const vis=isPreview?L.slice(0,3):L.slice(0,SHOW);'
);

// Adicionar botão "Ver todas" após a lista
html = html.replace(
  /(<div class="loadmore"><button id="more")/,
  '<div id="ver-todas-container" style="display:none"><button class="btn-ver-todas" onclick="mostrarTodasVotacoes()">Ver todas as votações (<span id="total-votacoes">0</span> encontradas)</button></div>$1'
);

// 6. Envolver painéis de análise na seção
html = html.replace(
  /(<div class="painel"><div class="row"><select id="hmUF")/,
  '<div id="sec37-analise" class="sec37"><div class="sec37-title">📊 Análise e Comparação <span class="sec37-info" data-tip="Ferramentas avançadas de análise: mapa de calor por estado, comparador entre deputados, painel de representação com 3 eixos (fidelidade partidária, distância da bancada e confiança da base).">ⓘ</span></div>$1'
);

// Fechar seção após o painel de análise (após cmpAB)
html = html.replace(
  /(<div id="rep18" style="margin-top:10px"><\/div><div id="cmpAB" style="margin-top:10px"><\/div>\s*<\/div>)/,
  '$1</div>'
);

// 7. Envolver painéis de ferramentas na seção
html = html.replace(
  /(<div class="painel" style="max-width:960px;margin:12px auto 0;border:1px solid var\(--line\);border-radius:14px;background:var\(--card\);padding:12px 14px">\s*<div class="row" style="display:flex;gap:8px;flex-wrap:wrap">\s*<button class="btn sm" data-tip="Liga\/desliga: ao abrir o site numa semana nova")/,
  '<div id="sec37-ferramentas" class="sec37"><div class="sec37-title">📈 Ferramentas de Exportação <span class="sec37-info" data-tip="Exporte dados em CSV, gere recibos de cobrança para enviar ao gabinete do deputado, receba resumo semanal automático por notificação e acesse o ranking público de selos de responsividade.">ⓘ</span></div>$1'
);

// Fechar seção após o painel de cobranças
html = html.replace(
  /(<div id="outCob" style="margin-top:10px"><p class="muted">Clique em "📬 Minhas cobranças" para ver o status das cobranças registradas\.<\/p><\/div>\s*<\/div>)/,
  '$1</div>'
);

// 8. Envolver painéis de digest e API na seção de cobranças (continuação)
html = html.replace(
  /(<div class="painel" style="max-width:960px;margin:12px auto 0;border:1px solid var\(--line\);border-radius:14px;background:var\(--card\);padding:12px 14px">\s*<div class="row" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">\s*<input id="dgEmail")/,
  '<div id="sec37-cobrancas" class="sec37"><div class="sec37-title">📬 Cobranças e Digest <span class="sec37-info" data-tip="Assine o digest semanal por e-mail, gerencie sua inscrição, veja métricas do sistema e acesse a API pública para jornalistas e desenvolvedores.">ⓘ</span></div>$1'
);

// Fechar última seção antes do footer
html = html.replace(
  /(<script id="ciclo16">)/,
  '</div>$1'
);

// 9. Adicionar script do ciclo 37
const script37 = `
<script id="ciclo37">
// Função para mostrar todas as votações
function mostrarTodasVotacoes() {
  window.__showAllVotacoes = true;
  const preview = document.getElementById('list');
  if (preview) {
    preview.parentElement.classList.add('votacoes-preview', 'expanded');
  }
  const container = document.getElementById('ver-todas-container');
  if (container) container.style.display = 'none';
  if (typeof render === 'function') render();
}

// Hook para mostrar botão "Ver todas" quando houver mais de 3 votações
(function() {
  const originalRender = window.render;
  if (originalRender) {
    window.render = function() {
      const result = originalRender.apply(this, arguments);
      setTimeout(() => {
        const L = typeof filtrados === 'function' ? filtrados() : [];
        const container = document.getElementById('ver-todas-container');
        const totalSpan = document.getElementById('total-votacoes');
        if (container && totalSpan && L.length > 3 && !window.__showAllVotacoes) {
          totalSpan.textContent = L.length;
          container.style.display = 'block';
          const listDiv = document.getElementById('list');
          if (listDiv) {
            listDiv.parentElement.classList.add('votacoes-preview');
          }
        } else if (container) {
          container.style.display = 'none';
        }
      }, 100);
      return result;
    };
  }
})();

// Inicializar sumário
document.addEventListener('DOMContentLoaded', function() {
  const sumario = document.getElementById('sumario37');
  if (sumario && window.innerWidth < 768) {
    sumario.style.display = 'none'; // Esconder em mobile para não poluir
  }
});
</script>
`;

// Inserir CSS e sumário após o <head>
html = html.replace(
  /(<\/head>)/,
  css37 + sumario37 + '$1'
);

// Inserir script antes do fechamento de </body>
html = html.replace(
  /(<\/body>)/,
  script37 + '$1'
);

// Salvar
fs.writeFileSync(votacoesPath, html);
console.log('✅ Ciclo 37 aplicado com sucesso');
console.log('Melhorias implementadas:');
console.log('  - 5 seções com títulos e ícones ⓘ');
console.log('  - Preview de 3 votações com botão "Ver todas"');
console.log('  - Sumário de navegação no topo');
