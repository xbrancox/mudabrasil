/* ============================================================
   HOME 2026 — CARREGAMENTO DE DADOS
   Popula: pesquisas presidente, governadores por estado
   Notícias são carregadas inline no index.html (função nufSet)
   ============================================================ */

(function () {
  'use strict';

  // ===== PESQUISAS DE PRESIDENTE =====
  async function carregarPesquisasPresidente() {
    const select = document.getElementById('seletor-pesquisa');
    const card = document.getElementById('pesquisa-card');
    if (!select || !card) {
      console.warn('[home-2026] Seletor de pesquisa ou card não encontrado no DOM');
      return;
    }

    let pesquisasData;
    try {
      const resp = await fetch('data/pesquisas-presidente-2026.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      pesquisasData = await resp.json();
      console.log('[home-2026] Pesquisas presidente carregadas:', pesquisasData.pesquisas?.length || 0, 'registros');
    } catch (err) {
      console.error('[home-2026] Erro ao carregar pesquisas presidente:', err);
      card.innerHTML = '<div class="pesquisa-vazio"><i class="fa-solid fa-circle-exclamation"></i><p>Não foi possível carregar as pesquisas.</p></div>';
      return;
    }

    function renderizar(valor) {
      const pesquisa = pesquisasData.pesquisas.find(p => p.instituto.toLowerCase() === valor);
      if (!pesquisa) {
        card.innerHTML = '<div class="pesquisa-vazio"><i class="fa-solid fa-circle-exclamation"></i><p>Pesquisa não encontrada.</p></div>';
        return;
      }

      if (pesquisa.status === 'em campo' || !pesquisa.espontanea) {
        card.innerHTML = '\n          <div class="pesquisa-header">\n            <h3 class="pesquisa-instituto">📊 PESQUISA ' + pesquisa.instituto.toUpperCase() + '</h3>\n            <p class="pesquisa-meta">Status: <strong>' + (pesquisa.status || 'Em campo') + '</strong></p>\n          </div>\n          <div class="pesquisa-vazio">\n            <i class="fa-solid fa-hourglass-half"></i>\n            <p>Esta pesquisa ainda está em campo ou em divulgação. Os resultados serão disponibilizados assim que divulgados pelo instituto.</p>\n          </div>\n        ';
        return;
      }

      const espont = pesquisa.espontanea;
      const listaCandidatos = Object.keys(espont).filter(n => 
        !n.includes('Indeciso') && !n.includes('Brancos') && !n.includes('Nulos') && !n.includes('Nenhum') && !n.includes('Não sabe')
      );
      const indecisos = espont['Indecisos/Nenhum'] || espont['Brancos/Nulos/Nenhum'] || espont['Indecidos/Nenhum'] || espont['Não sabe'] || 0;

      const partidoMap = {
        'Flávio Bolsonaro': { partido: 'PL', cor: 'azul' },
        'Lula': { partido: 'PT', cor: 'vermelho' }
      };

      const barrasHtml = listaCandidatos.map(function(nome) {
        const info = partidoMap[nome] || { partido: '', cor: '' };
        const pct = espont[nome];
        return '\n          <div class="pesquisa-barra-item">\n            <div class="pesquisa-barra-topo">\n              <div class="pesquisa-barra-nome">\n                ' + nome + ' <small>' + info.partido + '</small>\n              </div>\n              <div class="pesquisa-barra-percent">' + pct + '%</div>\n            </div>\n            <div class="pesquisa-barra-track">\n              <div class="pesquisa-barra-fill" style="width:' + pct + '%"></div>\n            </div>\n          </div>\n        ';
      }).join('');

      const indecisosHtml = indecisos > 0 ? '\n        <div class="pesquisa-barra-item">\n          <div class="pesquisa-barra-topo">\n            <div class="pesquisa-barra-nome">Indecisos / Brancos / Nulos</div>\n            <div class="pesquisa-barra-percent">' + indecisos + '%</div>\n          </div>\n          <div class="pesquisa-barra-track">\n            <div class="pesquisa-barra-fill" style="width:' + indecisos + '%;background:linear-gradient(90deg,#5A6E8E,#8A9BA7)"></div>\n          </div>\n        </div>\n      ' : '';

      const vv = pesquisa.votos_validos || {};
      const vvHtml = Object.keys(vv).map(function(nome) {
        const info = partidoMap[nome] || { cor: '' };
        return '\n          <div class="pesquisa-vv-card ' + info.cor + '">\n            <div class="pesquisa-vv-nome">' + nome + '</div>\n            <div class="pesquisa-vv-percent">' + vv[nome] + '%</div>\n            <div class="pesquisa-vv-label">Votos válidos</div>\n          </div>\n        ';
      }).join('');

      card.innerHTML = '\n        <div class="pesquisa-header">\n          <h3 class="pesquisa-instituto">📊 PESQUISA ' + pesquisa.instituto.toUpperCase() + '</h3>\n          <p class="pesquisa-meta">\n            <strong>' + pesquisa.data + '</strong> · Registro TSE: <strong>' + pesquisa.registro_tse + '</strong><br>\n            Amostra: <strong>' + (pesquisa.amostra ? pesquisa.amostra.toLocaleString('pt-BR') : '—') + ' entrevistas</strong> · Margem de erro: <strong>±' + pesquisa.margem_erro + ' p.p.</strong>\n          </p>\n        </div>\n\n        <div class="pesquisa-titulo-secao">Intenções de voto (total)</div>\n        <div class="pesquisa-barras">\n          ' + barrasHtml + '\n          ' + indecisosHtml + '\n        </div>\n\n        <div class="pesquisa-titulo-secao">Votos válidos (exclui brancos, nulos e indecisos)</div>\n        <div class="pesquisa-votos-validos">\n          ' + vvHtml + '\n        </div>\n      ';
    }

    select.addEventListener('change', function (e) { renderizar(e.target.value); });
    renderizar(select.value || 'datafolha');
  }

  // ===== GOVERNADORES POR ESTADO =====
  async function carregarGovernadores() {
    const select = document.getElementById('seletor-estado');
    const card = document.getElementById('estado-card');
    if (!select || !card) {
      console.warn('[home-2026] Seletor de estado ou card não encontrado no DOM');
      return;
    }

    let govData, pesqData;
    try {
      const [r1, r2] = await Promise.all([
        fetch('data/governadores-2026.json').then(function(r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        }),
        fetch('data/pesquisas-governadores-2026.json').then(function(r) {
          if (!r.ok) return { pesquisas: {} };
          return r.json();
        }).catch(function() { return { pesquisas: {} }; })
      ]);
      govData = r1;
      pesqData = r2;
      console.log('[home-2026] Governadores carregados:', Object.keys(govData.estados || {}).length, 'estados');
    } catch (err) {
      console.error('[home-2026] Erro ao carregar governadores:', err);
      card.innerHTML = '<div class="pesquisa-vazio"><i class="fa-solid fa-circle-exclamation"></i><p>Não foi possível carregar os dados de governadores. Tente recarregar a página.</p><p style="font-size:11px;margin-top:8px;color:var(--muted)">Erro: ' + err.message + '</p></div>';
      return;
    }

    if (!govData.estados || Object.keys(govData.estados).length === 0) {
      card.innerHTML = '<div class="pesquisa-vazio"><p>Dados de governadores indisponíveis.</p></div>';
      return;
    }

    // Popular o select com os estados (ordenados alfabeticamente)
    const estados = Object.entries(govData.estados).sort(function(a, b) { return a[1].nome.localeCompare(b[1].nome); });
    select.innerHTML = '<option value="">— Escolha um estado —</option>' +
      estados.map(function(entry) {
        const uf = entry[0];
        const dados = entry[1];
        const situacao = dados.situacao === '2º turno' ? '🔁' : '✅';
        return '<option value="' + uf + '">' + situacao + ' ' + dados.nome + '</option>';
      }).join('');

    console.log('[home-2026] Select de estados populado com', estados.length, 'opções');

    function renderizar(uf) {
      if (!uf) {
        card.innerHTML = '\n          <div class="estado-placeholder">\n            <i class="fa-solid fa-hand-pointer"></i>\n            <p>Selecione um estado acima para ver os candidatos e pesquisas</p>\n          </div>\n        ';
        return;
      }

      const estado = govData.estados[uf];
      if (!estado) {
        card.innerHTML = '<div class="pesquisa-vazio"><p>Estado não encontrado: ' + uf + '</p></div>';
        return;
      }

      if (estado.situacao === '1º turno') {
        // Eleito no 1º turno
        const eleito = estado.eleito;
        if (!eleito) {
          card.innerHTML = '<div class="pesquisa-vazio"><p>Dados não disponíveis para ' + estado.nome + '.</p></div>';
          return;
        }
        const votosHtml = eleito.votos ? '<p class="estado-eleito-votos">' + eleito.votos.toLocaleString('pt-BR') + ' votos válidos</p>' : '';
        const obsHtml = eleito.observacao ? '<p class="estado-eleito-obs"><small>' + eleito.observacao + '</small></p>' : '';
        card.innerHTML = '\n          <div class="estado-resultado">\n            <span class="estado-situacao">✅ ELEITO NO 1º TURNO</span>\n            <h3 class="estado-nome">' + estado.nome + '</h3>\n            <div class="estado-eleito-box">\n              <div class="estado-eleito-icone"><i class="fa-solid fa-trophy"></i></div>\n              <h4 class="estado-eleito-nome">' + (eleito.nome_completo || eleito.nome) + '</h4>\n              <p class="estado-eleito-partido">' + eleito.partido + ' · Nº ' + (eleito.numero || '—') + '</p>\n              <div class="estado-eleito-destaque">' + (eleito.percentual ? eleito.percentual.toFixed(2) + '%' : '—') + '</div>\n              ' + votosHtml + '\n              ' + obsHtml + '\n            </div>\n          </div>\n        ';
      } else {
        // 2º turno
        const top2 = estado.candidatos_2turno || [];

        const candidatosHtml = top2.map(function(c, i) {
          const votosHtml = c.votos ? '<span class="estado-candidato-abs">' + c.votos.toLocaleString('pt-BR') + ' votos</span>' : '';
          const pctHtml = c.percentual ? '<div class="estado-candidato-percent">' + c.percentual.toFixed(1) + '%</div>' : '';
          return '\n          <div class="estado-candidato ' + (i === 0 ? 'primeiro' : '') + '">\n            <div class="estado-candidato-info">\n              <div class="estado-candidato-posicao">' + (i + 1) + 'º</div>\n              <div>\n                <p class="estado-candidato-nome">' + c.nome + '</p>\n                <p class="estado-candidato-partido">' + c.partido + ' · Nº ' + (c.numero || '—') + '</p>\n              </div>\n            </div>\n            <div class="estado-candidato-votos">\n              ' + pctHtml + '\n              ' + votosHtml + '\n            </div>\n          </div>\n        ';
        }).join('');

        // Pesquisar se há pesquisa deste estado
        const pesquisaEst = pesqData.pesquisas && pesqData.pesquisas[uf];
        let pesquisaHtml = '';
        if (pesquisaEst && pesquisaEst.institutos && pesquisaEst.institutos.length > 0) {
          const p = pesquisaEst.institutos[0];
          const esp = p.espontanea || {};
          const nomes = Object.keys(esp).filter(function(n) { 
            return !n.includes('Indeciso') && !n.includes('Brancos') && !n.includes('Nulos') && !n.includes('Nenhum');
          });

          pesquisaHtml = '\n            <div style="margin-top:32px;padding-top:28px;border-top:1px dashed rgba(255,215,0,0.2)">\n              <div class="disclaimer-pesquisa">\n                <i class="fa-solid fa-triangle-exclamation"></i>\n                <div><strong>ATENÇÃO:</strong> Pesquisa de opinião para o 2º turno. Não representa votos reais.</div>\n              </div>\n              <div class="pesquisa-header" style="text-align:left">\n                <h3 class="pesquisa-instituto" style="font-size:20px">📊 Pesquisa ' + p.instituto + '</h3>\n                <p class="pesquisa-meta">' + p.data + ' · Registro TSE: <strong>' + p.registro_tse + '</strong> · Amostra: <strong>' + (p.amostra ? p.amostra.toLocaleString('pt-BR') : '—') + '</strong> · Margem: <strong>±' + p.margem_erro + ' p.p.</strong></p>\n              </div>\n              <div class="pesquisa-barras" style="margin-top:18px">\n                ' + nomes.map(function(nome) {
                  var pct = esp[nome];
                  return '\n                    <div class="pesquisa-barra-item">\n                      <div class="pesquisa-barra-topo">\n                        <div class="pesquisa-barra-nome">' + nome + '</div>\n                        <div class="pesquisa-barra-percent">' + pct + '%</div>\n                      </div>\n                      <div class="pesquisa-barra-track">\n                        <div class="pesquisa-barra-fill" style="width:' + pct + '%"></div>\n                      </div>\n                    </div>\n                  ';
                }).join('') + '\n              </div>\n            </div>\n          ';
        }

        card.innerHTML = '\n          <div class="estado-resultado">\n            <span class="estado-situacao segundo-turno">🔁 DISPUTA NO 2º TURNO</span>\n            <h3 class="estado-nome">' + estado.nome + '</h3>\n            <div class="estado-candidatos">\n              ' + candidatosHtml + '\n            </div>\n            ' + pesquisaHtml + '\n          </div>\n        ';
      }
    }

    select.addEventListener('change', function (e) { renderizar(e.target.value); });
  }

  // ===== INICIALIZAR =====
  function init() {
    console.log('[home-2026] Inicializando módulos da home');
    carregarPesquisasPresidente();
    carregarGovernadores();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
