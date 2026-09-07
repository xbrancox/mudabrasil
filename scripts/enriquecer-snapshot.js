/* ============================================================
   MUDABRASIL — ENRIQUECIMENTO DO SNAPSHOT DE PARLAMENTARES
   ------------------------------------------------------------
   Conta as proposições autorais de cada parlamentar usando as
   APIs abertas oficiais e grava em data/politicos.json.
   Uso:  node scripts/enriquecer-snapshot.js [--skip-done]
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SNAP = path.join(ROOT, 'data', 'politicos.json');
const UA = 'MudaBrasil/1.0';
const DELAY_MS = 150;
const CAP_PAGINAS = 5;
const SALVAR_A_CADA = 25;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
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
  const d = await getJson('https://legis.senado.leg.br/dadosabertos/senador/' + encodeURIComponent(codigo) + '/autorias?formato=json');
  const p = d && d.MateriasAutoriaParlamentar && d.MateriasAutoriaParlamentar.Parlamentar;
  const aut = p && p.Autorias;
  const lista = aut && aut.Autoria;
  if (!lista) return 0;
  return Array.isArray(lista) ? lista.length : 1;
}

async function main() {
  const skipDone = process.argv.includes('--skip-done');
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  const lista = snap.candidatos;

  let feitos = 0, falhas = 0, pulados = 0;

  for (let i = 0; i < lista.length; i++) {
    const c = lista[i];
    if (skipDone && c.billsAuthored != null) { pulados++; continue; }

    try {
      const cid = c.id.startsWith('camara-') ? c.id.slice(7) : null;
      const sid = c.id.startsWith('senado-') ? c.id.replace('senado-', '') : null;
      if (cid) {
        c.billsAuthored = await contarProposicoesCamara(cid);
        c.dataSources = ['Câmara dos Deputados (dados reais)'];
      } else if (sid) {
        c.billsAuthored = await contarAutoriasSenado(sid);
        c.dataSources = ['Senado Federal (dados reais)'];
      } else { pulados++; continue; }
      feitos++;
    } catch (e) {
      falhas++;
      if (c.billsAuthored === undefined) c.billsAuthored = null;
    }
    if (feitos % SALVAR_A_CADA === 0) fs.writeFileSync(SNAP, JSON.stringify(snap));
    await sleep(DELAY_MS);
  }

  snap.billsEnrichedAt = new Date().toISOString();
  fs.writeFileSync(SNAP, JSON.stringify(snap));
  console.log('FIM: ' + feitos + ' ok, ' + pulados + ' já tinham, ' + falhas + ' falhas');
}

main().catch(e => { console.error('FALHA:', e); process.exit(1); });
