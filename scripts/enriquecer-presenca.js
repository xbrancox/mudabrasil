/* ============================================================
   MUDABRASIL — ENRIQUECIMENTO DE PRESENÇA (snapshot)
   ------------------------------------------------------------
   Complementa data/politicos.json com a atuação em plenário
   em 2026 das APIs oficiais:
   - Câmara (513): sessões deliberativas do deputado ÷ total → attendanceRate
   - Senado (81):  votações com voto registrado em 2026 → votesPlenary2026
   Uso:  node scripts/enriquecer-presenca.js [--skip-done]
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SNAP = path.join(ROOT, 'data', 'politicos.json');
const UA = 'MudaBrasil/1.0 (plataforma civica de transparencia)';
const INICIO = '2026-01-01';
const FIM = new Date().toISOString().slice(0, 10);
const DELAY_MS = 150;
const SALVAR_A_CADA = 25;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function paginar(urlBase, extrair) {
  let alvo = 1;
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
  const d = await getJson('https://legis.senado.leg.br/dadosabertos/senador/' + encodeURIComponent(codigo) + '/votacoes?formato=json');
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
  const TOTAL_SESSOES = await totalSessoesDeliberativas();

  let feitos = 0, falhas = 0, pulados = 0;

  for (let i = 0; i < lista.length; i++) {
    const c = lista[i];
    const deputado = c.id.startsWith('camara-');
    const campo = deputado ? 'attendanceRate' : 'votesPlenary2026';
    if (skipDone && c[campo] != null) { pulados++; continue; }

    try {
      if (deputado) {
        const n = await sessoesDeliberativasDeputado(c.id.slice(7));
        c.sessoesDeliberativas2026 = n;
        c.attendanceRate = TOTAL_SESSOES > 0 ? Math.round(100 * n / TOTAL_SESSOES) : null;
      } else {
        c.votesPlenary2026 = await votacoes2026Senador(c.id.replace('senado-', ''));
      }
      feitos++;
    } catch (e) {
      falhas++;
      console.warn('[' + (i + 1) + '] ' + c.name + ': ' + e.message);
    }
    if (feitos % SALVAR_A_CADA === 0) fs.writeFileSync(SNAP, JSON.stringify(snap));
    await sleep(DELAY_MS);
  }

  snap.presenceEnrichedAt = new Date().toISOString();
  fs.writeFileSync(SNAP, JSON.stringify(snap));
  console.log('FIM: ' + feitos + ' ok, ' + pulados + ' já tinham, ' + falhas + ' falhas');
}

main().catch(e => { console.error('FALHA:', e); process.exit(1); });
