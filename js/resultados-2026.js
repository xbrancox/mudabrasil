/* ============================================================
   RESULTADOS 2026 — LÓGICA DE CARREGAMENTO
   ============================================================ */

(function () {
  'use strict';

  // ===== PRESIDENTE =====
  async function carregarPresidente() {
    const metricasContainer = document.getElementById('metricas-presidente');
    const candidatosContainer = document.getElementById('candidatos-presidente-lista');
    if (!metricasContainer || !candidatosContainer) return;

    try {
      const response = await fetch('../data/presidente-2026.json');
      const data = await response.json();

      // Métricas
      metricasContainer.innerHTML = `
        <div class="metrica-card">
          <p class="metrica-valor">${data.metricas_gerais.comparecimento.toLocaleString('pt-BR')}</p>
          <p class="metrica-label">✅ Comparecimento (${data.metricas_gerais.percentual_comparecimento}%)</p>
        </div>
        <div class="metrica-card">
          <p class="metrica-valor">${data.metricas_gerais.abstencao.toLocaleString('pt-BR')}</p>
          <p class="metrica-label">⚠️ Abstenção (${data.metricas_gerais.percentual_abstencao}%)</p>
        </div>
        <div class="metrica-card">
          <p class="metrica-valor">${data.metricas_gerais.votos_validos.toLocaleString('pt-BR')}</p>
          <p class="metrica-label">📝 Votos válidos (${data.metricas_gerais.percentual_validos}%)</p>
        </div>
        <div class="metrica-card">
          <p class="metrica-valor">${data.metricas_gerais.votos_brancos.toLocaleString('pt-BR')}</p>
          <p class="metrica-label">⬜ Votos brancos (${data.metricas_gerais.percentual_brancos}%)</p>
        </div>
        <div class="metrica-card">
          <p class="metrica-valor">${data.metricas_gerais.votos_nulos.toLocaleString('pt-BR')}</p>
          <p class="metrica-label">❌ Votos nulos (${data.metricas_gerais.percentual_nulos}%)</p>
        </div>
      `;

      // Candidatos
      candidatosContainer.innerHTML = data.candidatos.map((candidato, index) => {
        const medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
        const destaque = candidato.situacao === '2º turno' ? 'destaque' : '';
        return `
          <div class="candidato-item ${destaque}">
            <div class="candidato-posicao">${medalha}</div>
            <div class="candidato-info">
              <p class="nome">${candidato.nome}</p>
              <p class="partido">${candidato.partido} · Nº ${candidato.numero} · ${candidato.situacao}</p>
            </div>
            <div class="candidato-resultado">
              <div class="percent">${candidato.percentual.toFixed(2)}%</div>
              <div class="votos">${candidato.votos.toLocaleString('pt-BR')} votos</div>
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      candidatosContainer.innerHTML = '<div class="pesquisa-vazio"><i class="fa-solid fa-circle-exclamation"></i><p>Não foi possível carregar os dados.</p></div>';
    }
  }

  // ===== GOVERNADORES =====
  async function carregarGovernadores() {
    const select = document.getElementById('estado-resultado');
    const card = document.getElementById('governador-resultado-card');
    if (!select || !card) return;

    try {
      const response = await fetch('../data/governadores-2026.json');
      const data = await response.json();

      // Contadores
      const e1 = document.getElementById('eleitos-1turno-count');
      const e2 = document.getElementById('segundo-turno-count');
      if (e1) e1.textContent = data.resumo.eleitos_1_turno;
      if (e2) e2.textContent = data.resumo.segundo_turno;

      // Popular select
      const estados = Object.entries(data.estados).sort((a, b) => a[1].nome.localeCompare(b[1].nome));
      select.innerHTML = '<option value="">— Escolha um estado —</option>' +
        estados.map(([uf, d]) => {
          const icone = d.situacao === '2º turno' ? '🔁' : '✅';
          return `<option value="${uf}">${icone} ${d.nome}</option>`;
        }).join('');

      select.addEventListener('change', (e) => renderizarGovernador(e.target.value, data));

    } catch (error) {
      card.innerHTML = '<div class="pesquisa-vazio"><i class="fa-solid fa-circle-exclamation"></i><p>Não foi possível carregar os dados.</p></div>';
    }
  }

  function renderizarGovernador(uf, data) {
    const card = document.getElementById('governador-resultado-card');
    if (!uf) {
      card.innerHTML = `
        <div class="estado-placeholder">
          <i class="fa-solid fa-hand-pointer"></i>
          <p>Selecione um estado acima para ver o resultado</p>
        </div>
      `;
      return;
    }

    const estado = data.estados[uf];
    if (!estado) return;

    if (estado.situacao === '1º turno') {
      const eleito = estado.eleito;
      if (!eleito) {
        card.innerHTML = '<div class="pesquisa-vazio"><p>Dados não disponíveis para este estado.</p></div>';
        return;
      }
      const votosHtml = eleito.votos ? `<p class="estado-eleito-votos">${eleito.votos.toLocaleString('pt-BR')} votos válidos</p>` : '';
      const obsHtml = eleito.observacao ? `<p class="estado-eleito-obs"><small style="color:#C8D5E7">${eleito.observacao}</small></p>` : '';
      card.innerHTML = `
        <div class="estado-card-resultado">
          <span class="situacao-badge eleito">✅ Eleito no 1º turno</span>
          <h3 class="estado-nome">${estado.nome}</h3>
          <div class="estado-eleito-box" style="margin-top:20px">
            <div class="estado-eleito-icone"><i class="fa-solid fa-trophy"></i></div>
            <h4 class="estado-eleito-nome">${eleito.nome_completo || eleito.nome}</h4>
            <p class="estado-eleito-partido">${eleito.partido} · Nº ${eleito.numero || '—'}</p>
            <div class="estado-eleito-destaque">${eleito.percentual ? eleito.percentual.toFixed(2) + '%' : '—'}</div>
            ${votosHtml}
            ${obsHtml}
          </div>
        </div>
      `;
    } else {
      const top2 = estado.candidatos_2turno || [];
      card.innerHTML = `
        <div class="estado-card-resultado">
          <span class="situacao-badge segundo-turno">🔁 Disputa no 2º turno (25/10)</span>
          <h3 class="estado-nome">${estado.nome}</h3>
          <div class="estado-candidatos" style="margin-top:20px">
            ${top2.map((c, i) => {
              const votosHtml = c.votos ? `<div class="votos">${c.votos.toLocaleString('pt-BR')} votos</div>` : '<div class="votos">— votos</div>';
              const pctHtml = c.percentual ? `<div class="percent">${c.percentual.toFixed(1)}%</div>` : '<div class="percent">—</div>';
              return `
              <div class="candidato-item ${i === 0 ? 'destaque' : ''}">
                <div class="candidato-posicao">${i + 1}º</div>
                <div class="candidato-info">
                  <p class="nome">${c.nome}</p>
                  <p class="partido">${c.partido} · Nº ${c.numero || '—'}</p>
                </div>
                <div class="candidato-resultado">
                  ${pctHtml}
                  ${votosHtml}
                </div>
              </div>
            `;
            }).join('')}
          </div>
        </div>
      `;
    }
  }

  // ===== CÂMARA =====
  async function carregarCamara() {
    const cadeirasContainer = document.getElementById('camara-cadeiras');
    const top10Container = document.getElementById('top10-deputados');
    if (!cadeirasContainer || !top10Container) return;

    try {
      const response = await fetch('../data/camara-2026.json');
      const data = await response.json();

      // Ordenar por cadeiras
      const partidos = [...data.cadeiras_por_partido].sort((a, b) => b.cadeiras - a.cadeiras);
      const maxCadeiras = Math.max(...partidos.map(p => p.cadeiras));

      cadeirasContainer.innerHTML = partidos.map(p => {
        const percent = ((p.cadeiras / data.total_vagas) * 100).toFixed(1);
        const width = (p.cadeiras / maxCadeiras) * 100;
        return `
          <div class="partido-barra">
            <div class="partido-nome">${p.partido}</div>
            <div class="partido-track">
              <div class="partido-fill" style="width:${width}%"></div>
            </div>
            <div class="partido-valor">${p.cadeiras} (${percent}%)</div>
          </div>
        `;
      }).join('');

      const medalhas = ['🥇', '🥈', '🥉'];
      top10Container.innerHTML = data.top_10_deputados.map((dep, index) => `
        <div class="candidato-item ${index < 3 ? 'destaque' : ''}">
          <div class="candidato-posicao">${medalhas[index] || (index + 1) + 'º'}</div>
          <div class="candidato-info">
            <p class="nome">${dep.nome}</p>
            <p class="partido">${dep.partido} · ${dep.uf}</p>
          </div>
          <div class="candidato-resultado">
            <div class="percent">${dep.votos.toLocaleString('pt-BR')}</div>
            <div class="votos">votos</div>
          </div>
        </div>
      `).join('');

    } catch (error) {
      cadeirasContainer.innerHTML = '<div class="pesquisa-vazio"><i class="fa-solid fa-circle-exclamation"></i><p>Não foi possível carregar os dados.</p></div>';
    }
  }

  // ===== SENADO =====
  async function carregarSenado() {
    const cadeirasContainer = document.getElementById('senado-cadeiras');
    const select = document.getElementById('estado-senado');
    const card = document.getElementById('senadores-estado-card');
    if (!cadeirasContainer || !select || !card) return;

    try {
      const response = await fetch('../data/senado-2026.json');
      const data = await response.json();

      // Cadeiras
      const partidos = [...data.cadeiras_por_partido].sort((a, b) => b.cadeiras - a.cadeiras);
      const maxCadeiras = Math.max(...partidos.map(p => p.cadeiras));

      cadeirasContainer.innerHTML = partidos.map(p => {
        const percent = ((p.cadeiras / data.total_vagas_disputadas) * 100).toFixed(1);
        const width = (p.cadeiras / maxCadeiras) * 100;
        return `
          <div class="partido-barra">
            <div class="partido-nome">${p.partido}</div>
            <div class="partido-track">
              <div class="partido-fill" style="width:${width}%"></div>
            </div>
            <div class="partido-valor">${p.cadeiras} (${percent}%)</div>
          </div>
        `;
      }).join('');

      // Estados no select
      const estados = Object.keys(data.eleitos_por_estado).sort();
      const estadosSelect = estados.length > 0 ? estados : ['SP', 'RJ', 'MG'];
      select.innerHTML = '<option value="">— Escolha um estado —</option>' +
        estadosSelect.map(uf => `<option value="${uf}">${uf}</option>`).join('');

      select.addEventListener('change', (e) => renderizarSenadoresEstado(e.target.value, data));

    } catch (error) {
      cadeirasContainer.innerHTML = '<div class="pesquisa-vazio"><i class="fa-solid fa-circle-exclamation"></i><p>Não foi possível carregar os dados.</p></div>';
    }
  }

  function renderizarSenadoresEstado(uf, data) {
    const card = document.getElementById('senadores-estado-card');
    if (!uf) {
      card.innerHTML = `
        <div class="estado-placeholder">
          <i class="fa-solid fa-hand-pointer"></i>
          <p>Selecione um estado acima para ver os senadores eleitos</p>
        </div>
      `;
      return;
    }

    const senadores = data.eleitos_por_estado[uf];
    if (!senadores || senadores.length === 0) {
      card.innerHTML = '<div class="pesquisa-vazio"><p>Nenhum dado disponível para este estado.</p></div>';
      return;
    }

    card.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
        ${senadores.map((sen, i) => `
          <div class="candidato-item">
            <div class="candidato-posicao">${i + 1}º</div>
            <div class="candidato-info">
              <p class="nome">${sen.nome}</p>
              <p class="partido">${sen.partido}</p>
            </div>
            <div class="candidato-resultado">
              <div class="percent" style="font-size:14px">Senador</div>
              <div class="votos">eleito</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ===== ASSEMBLEIAS =====
  async function carregarAssembleias() {
    const select = document.getElementById('estado-assembleia');
    const card = document.getElementById('assembleia-estado-card');
    if (!select || !card) return;

    try {
      const response = await fetch('../data/assembleias-2026.json');
      const data = await response.json();

      const estados = Object.keys(data.resumo_por_estado).sort();
      const estadosSelect = estados.length > 0 ? estados : ['SP', 'RJ', 'MG'];
      select.innerHTML = '<option value="">— Escolha um estado —</option>' +
        estadosSelect.map(uf => `<option value="${uf}">${uf}</option>`).join('');

      select.addEventListener('change', (e) => renderizarAssembleiaEstado(e.target.value, data));

    } catch (error) {
      card.innerHTML = '<div class="pesquisa-vazio"><i class="fa-solid fa-circle-exclamation"></i><p>Não foi possível carregar os dados.</p></div>';
    }
  }

  function renderizarAssembleiaEstado(uf, data) {
    const card = document.getElementById('assembleia-estado-card');
    if (!uf) {
      card.innerHTML = `
        <div class="estado-placeholder">
          <i class="fa-solid fa-hand-pointer"></i>
          <p>Selecione um estado acima para ver a composição da Assembleia</p>
        </div>
      `;
      return;
    }

    const a = data.resumo_por_estado[uf];
    if (!a) {
      card.innerHTML = '<div class="pesquisa-vazio"><p>Nenhum dado disponível para este estado.</p></div>';
      return;
    }

    const depMaisVotadoHtml = a.deputado_mais_votado ? `
      <div class="info-box">
        <div class="info-icone"><i class="fa-solid fa-star"></i></div>
        <div>
          <span class="info-rotulo">Deputado mais votado</span>
          <strong class="info-valor">${a.deputado_mais_votado.nome} (${a.deputado_mais_votado.partido})</strong>
        </div>
      </div>
    ` : '';

    const cadeirasMaiorHtml = a.cadeiras_maior_bancada ? `
      <div class="info-box">
        <div class="info-icone"><i class="fa-solid fa-trophy"></i></div>
        <div>
          <span class="info-rotulo">Maior bancada</span>
          <strong class="info-valor">${a.maior_bancada} (${a.cadeiras_maior_bancada} cadeiras)</strong>
        </div>
      </div>
    ` : `
      <div class="info-box">
        <div class="info-icone"><i class="fa-solid fa-trophy"></i></div>
        <div>
          <span class="info-rotulo">Maior bancada</span>
          <strong class="info-valor">${a.maior_bancada || '—'}</strong>
        </div>
      </div>
    `;

    const deputadoMaisVotadoCardHtml = a.deputado_mais_votado ? `
      <div class="candidato-item" style="margin-top:8px">
        <div class="candidato-posicao">🥇</div>
        <div class="candidato-info">
          <p class="nome">${a.deputado_mais_votado.nome}</p>
          <p class="partido">${a.deputado_mais_votado.partido}</p>
        </div>
        <div class="candidato-resultado">
          <div class="percent">${a.deputado_mais_votado.votos.toLocaleString('pt-BR')}</div>
          <div class="votos">votos</div>
        </div>
      </div>
    ` : '';

    card.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;margin-top:8px">
        <div class="info-grid">
          <div class="info-box">
            <div class="info-icone"><i class="fa-solid fa-chair"></i></div>
            <div>
              <span class="info-rotulo">Total de cadeiras</span>
              <strong class="info-valor">${a.total_cadeiras}</strong>
            </div>
          </div>
          ${cadeirasMaiorHtml}
          ${depMaisVotadoHtml}
        </div>
        ${deputadoMaisVotadoCardHtml}
        <p style="font-size:12px;color:#8A9BA7;margin-top:8px">
          <small>Para composição completa da assembleia, consulte o TRE do estado.</small>
        </p>
      </div>
    `;
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', () => {
    carregarPresidente();
    carregarGovernadores();
    carregarCamara();
    carregarSenado();
    carregarAssembleias();
  });
})();
