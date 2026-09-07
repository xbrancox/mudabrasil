/* ============================================================
   MUDABRASIL — ENRIQUECIMENTO DO SNAPSHOT DE PARLAMENTARES
   ------------------------------------------------------------
   Conta as proposições autorais de cada parlamentar usando as
   APIs abertas oficiais e grava no snapshot data/politicos.json
   (usado pelo GitHub Pages, onde não há backend).

   Fontes:
   - Câmara:  GET /api/v2/proposicoes?idDeputadoAutor={id}&itens=100&pagina=N
              (conta paginando até página curta; teto 500)
   - Senado:  GET /dadosabertos/senador/{codigo}/autorias?formato=json
              (conta MateriasAutoriaParlamentar.Parlamentar.Autorias.Autoria)

   Uso:  node scripts/enriquecer-snapshot.js
   Salva progresso a cada 25 parlamentares; pode ser reexecutado
   (pulando quem já tem billsAuthored) com --skip-done.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SNAP = path.join(ROOT, 'data', 'politicos.json');
const UA = 'MudaBrasil/1.0 (plataforma civica de transparencia; dados abertos)';
const DELAY_MS = 150;          // ~6-7 req/s, respeitoso com as APIs
const CAP_PAGINAS = 5;         // 5 x 100 = teto 500 proposições contadas
const SALVAR_A_CADA = 25;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' em ' + url);
  return res.json();
}

async function contarProposicoesCamara(camaraId) {
  let total = 0;
  for (let pag = 1; pag <= CAP_PAGINAS; pag++) {
    const d = await getJson('https://dadosabertos.camara.leg.br/api/v2/proposicoes?idDeputadoAutor=' +
      encodeURIComponent(camaraId) + '&itens=100&pagina=' + pag);
    const n = Array.isArray(d.dados) ? d.dados.length : 0;
    total += n;
    if (n < 100) break;
    await sleep(DELAY_MS);
  }
  return total;
}

async function contarAutoriasSenado(codigo) {
  const d = await getJson('https://legis.senado.leg.br/dadosabertos/senador/' +
    encodeURIComponent(codigo) + '/autorias?formato=json');
  const p = d && d.MateriasAutoriaParlamentar && d.MateriasAutoriaParlamentar.Parlamentar;
  const aut = p && p.Autorias;
  const lista = aut && aut.Autoria;
  if (!lista) return 0;
  return Array.isArray(lista) ? lista.length : 1;
}

function camaraIdDe(id) { return id.startsWith('camara-') ? id.slice(7) : null; }
function senadoIdDe(id) { return id.startsWith('senado-') ? id.replace('senado-', '') : null; }

async function main() {
  const skipDone = process.argv.includes('--skip-done');
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  const lista = snap.candidatos;
  console.log('Snapshot: ' + lista.length + ' parlamentares');

  let feitos = 0, falhas = 0, pulados = 0;
  const inicio = Date.now();

  for (let i = 0; i < lista.length; i++) {
    const c = lista[i];
    if (skipDone && c.billsAuthored != null) { pulados++; continue; }

    try {
      const cid = camaraIdDe(c.id);
      const sid = senadoIdDe(c.id);
      if (cid) {
        c.billsAuthored = await contarProposicoesCamara(cid);
        c.dataSources = ['Câmara dos Deputados (dados reais)', 'Proposições autorais: API de Dados Abertos da Câmara'];
      } else if (sid) {
        c.billsAuthored = await contarAutoriasSenado(sid);
        c.dataSources = ['Senado Federal (dados reais)', 'Autorias: API de Dados Abertos do Senado'];
      } else {
        pulados++;
        continue;
      }
      c.hasFullData = true;
      feitos++;
    } catch (e) {
      falhas++;
      console.warn('[' + (i + 1) + '] ' + c.name + ': ' + e.message);
      // marca como não disponível para não travar a UI
      if (c.billsAuthored === undefined || c.billsAuthored === null) c.billsAuthored = null;
    }

    if (feitos % 12 === 0) {
      const s = Math.round((Date.now() - inicio) / 1000);
      console.log('progresso: ' + (i + 1) + '/' + lista.length + ' (' + feitos + ' ok, ' + falhas + ' falhas, ' + s + 's)');
    }
    if (feitos % SALVAR_A_CADA === 0) {
      fs.writeFileSync(SNAP, JSON.stringify(snap));
    }
    await sleep(DELAY_MS);
  }

  snap.billsEnrichedAt = new Date().toISOString();
  snap.detalhes.comProposicoes = feitos + pulados;
  fs.writeFileSync(SNAP, JSON.stringify(snap));

  const comDados = lista.filter(c => c.billsAuthored != null).length;
  console.log('=== FIM === ' + feitos + ' enriquecidos agora, ' + pulados + ' já tinham, ' +
    falhas + ' falhas. Total com proposições: ' + comDados + '/' + lista.length);
}

main().catch(e => { console.error('FALHA GERAL:', e); process.exit(1); });
