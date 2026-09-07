/* ============================================================
   MUDABRASIL — ENRIQUECIMENTO DE PRESENÇA (snapshot)
   ------------------------------------------------------------
   Complementa data/politicos.json com a atuação em plenário
   em 2026, das APIs abertas oficiais:

   - Câmara (513 deputados):
       sessões deliberativas com participação do deputado
       (/deputados/{id}/eventos?dataInicio=2026-01-01) ÷ total de
       sessões deliberativas realizadas no período (/eventos,
       descricaoTipo="Sessão Deliberativa") → attendanceRate (%).
       Guarda também o bruto em sessoesDeliberativas2026.

   - Senado (81 senadores):
       votações do plenário com voto registrado em 2026
       (/senador/{codigo}/votacoes, SessaoPlenaria.DataSessao)
       → votesPlenary2026. O Senado não publica % de presença
       nesta API; o número bruto é honesto e verificável.

   Uso:  node scripts/enriquecer-presenca.js [--skip-done]
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SNAP = path.join(ROOT, 'data', 'politicos.json');
const UA = 'MudaBrasil/1.0 (plataforma civica de transparencia; dados abertos)';
const INICIO = '2026-01-01';
// Fim do período = hoje: re-rodadas semanais pegam as sessões novas
const FIM = new Date().toISOString().slice(0, 10);
const DELAY_MS = 150;
const SALVAR_A_CADA = 25;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/* A API pode devolver páginas menores que o tamanho sem que seja a
   última — confiar em `len < 100` subestima o total. Seguimos o
   link rel="last" e paginamos até a última página (ou lista vazia). */
async function paginar(urlBase, extrair) {
  let alvo = 1; // atualizado pelo link rel="last" quando presente
  let acumulado = [];
  for (let pag = 1; pag <= alvo && pag <= 100; pag++) {
    const sep = urlBase.includes('?') ? '&' : '?';
    const res = await fetch(urlBase + sep + 'itens=100&pagina=' + pag, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    const evs = d.dados || [];
    acumulado = acumulado.concat(evs);
    if (extrair) acumulado = extrair(acumulado);
    const last = (d.links || []).find(l => l.rel === 'last');
    if (last && last.href) {
      const m = last.href.match(/[?&]pagina=(\d+)/);
      if (m) alvo = Math.min(parseInt(m[1], 10), 100);
    }
    if (!evs.length) break;
    await sleep(DELAY_MS);
  }
  return acumulado;
}

async function totalSessoesDeliberativas() {
  const evs = await paginar('https://dadosabertos.camara.leg.br/api/v2/eventos?dataInicio=' + INICIO + '&dataFim=' + FIM,
    a => a.filter(e => e.descricaoTipo === 'Sessão Deliberativa'));
  return evs.length;
}

async function sessoesDeliberativasDeputado(id) {
  const evs = await paginar('https://dadosabertos.camara.leg.br/api/v2/deputados/' + encodeURIComponent(id) + '/eventos?dataInicio=' + INICIO + '&dataFim=' + FIM,
    a => a.filter(e => e.descricaoTipo === 'Sessão Deliberativa'));
  return evs.length;
}

async function votacoes2026Senador(codigo) {
  const d = await getJson('https://legis.senado.leg.br/dadosabertos/senador/' + encodeURIComponent(codigo) +
    '/votacoes?formato=json');
  const parl = d && d.VotacaoParlamentar && d.VotacaoParlamentar.Parlamentar;
  const vots = parl && parl.Votacoes && parl.Votacoes.Votacao;
  if (!vots) return 0;
  const lista = Array.isArray(vots) ? vots : [vots];
  return lista.filter(v => {
    const data = v && v.SessaoPlenaria && v.SessaoPlenaria.DataSessao;
    return typeof data === 'string' && data.startsWith('2026');
  }).length;
}

async function main() {
  const skipDone = process.argv.includes('--skip-done');
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  const lista = snap.candidatos;
  console.log('Contando sessões deliberativas da Câmara em ' + INICIO + '..' + FIM + '…');
  const TOTAL_SESSOES = await totalSessoesDeliberativas();
  console.log('Total de sessões deliberativas: ' + TOTAL_SESSOES);

  let feitos = 0, falhas = 0, pulados = 0;
  const inicio = Date.now();

  for (let i = 0; i < lista.length; i++) {
    const c = lista[i];
    const deputado = c.id.startsWith('camara-');
    const campo = deputado ? 'attendanceRate' : 'votesPlenary2026';
    if (skipDone && c[campo] != null) { pulados++; continue; }

    try {
      if (deputado) {
        const n = await sessoesDeliberativasDeputado(c.id.slice(7));
        if (TOTAL_SESSOES > 0 && n > TOTAL_SESSOES) {
          console.error('SANIDADE: ' + c.name + ' tem ' + n + ' sessões, mas o total global é ' + TOTAL_SESSOES + '. Abortando sem gravar.');
          process.exit(1);
        }
        c.sessoesDeliberativas2026 = n;
        c.attendanceRate = TOTAL_SESSOES > 0 ? Math.round(100 * n / TOTAL_SESSOES) : null;
        c.attendanceContext = { ano: 2026, participadas: n, totalSessoes: TOTAL_SESSOES, fonte: 'API de Dados Abertos da Câmara (Sessões Deliberativas)' };
      } else {
        const sid = c.id.replace('senado-', '');
        c.votesPlenary2026 = await votacoes2026Senador(sid);
        c.votesContext = { ano: 2026, fonte: 'API de Dados Abertos do Senado (votações do senador)' };
      }
      feitos++;
    } catch (e) {
      falhas++;
      console.warn('[' + (i + 1) + '] ' + c.name + ': ' + e.message);
    }

    if (feitos % 12 === 0) {
      const s = Math.round((Date.now() - inicio) / 1000);
      console.log('progresso: ' + (i + 1) + '/' + lista.length + ' (' + feitos + ' ok, ' + falhas + ' falhas, ' + s + 's)');
    }
    if (feitos % SALVAR_A_CADA === 0) fs.writeFileSync(SNAP, JSON.stringify(snap));
    await sleep(DELAY_MS);
  }

  snap.presenceEnrichedAt = new Date().toISOString();
  fs.writeFileSync(SNAP, JSON.stringify(snap));

  const dep = lista.filter(c => c.attendanceRate != null).length;
  const sen = lista.filter(c => c.votesPlenary2026 != null).length;
  console.log('=== FIM === ' + feitos + ' agora, ' + pulados + ' já tinham, ' + falhas +
    ' falhas. Deputados com presença: ' + dep + ' · Senadores com votações: ' + sen);
}

main().catch(e => { console.error('FALHA GERAL:', e); process.exit(1); });
