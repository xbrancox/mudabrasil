/* ============================================================
   Enriquecedor de Dados — Eleições 2026
   Busca fotos oficiais via Wikidata API para candidatos.
   Salva em data/candidatos-2026-fotos.json
   ============================================================ */

const fs = require('fs');
const path = require('path');
const https = require('https');

const INPUT = path.join(__dirname, '..', 'data', 'candidatos-2026.json');
const OUTPUT = path.join(__dirname, '..', 'data', 'candidatos-2026-fotos.json');

console.log('[enriquecer] Carregando candidatos…');
const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
console.log(`[enriquecer] ${data.candidatos.length} candidatos carregados.`);

// Cache de fotos já buscadas por nome
const fotoCache = {};
let processados = 0;
let encontradas = 0;

async function buscarFotoWikidata(nomeUrna, nomeCivil) {
  const nome = nomeUrna || nomeCivil;
  if (!nome) return '';

  // Normaliza nome para busca
  const busca = nome.split(' ').slice(0, 3).join(' ').trim();
  if (fotoCache[busca]) return fotoCache[busca];

  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(busca)}&language=pt&format=json&type=item`;
    const res = await fetch(url, { headers: { 'User-Agent': 'MeuVoto/1.0' } });
    const json = await res.json();

    if (json.search && json.search.length > 0) {
      const qid = json.search[0].id;
      // Busca a imagem (P18) do entity
      const imgUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
      const imgRes = await fetch(imgUrl, { headers: { 'User-Agent': 'MeuVoto/1.0' } });
      const imgJson = await imgRes.json();

      const entity = imgJson.entities && imgJson.entities[qid];
      if (entity && entity.claims && entity.claims.P18) {
        const filename = entity.claims.P18[0].mainsnak.datavalue.value;
        const photoUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=200`;
        fotoCache[busca] = photoUrl;
        encontradas++;
        return photoUrl;
      }
    }
    fotoCache[busca] = '';
    return '';
  } catch (e) {
    fotoCache[busca] = '';
    return '';
  }
}

async function processar() {
  const candidatosComFoto = [];

  for (let i = 0; i < data.candidatos.length; i++) {
    const c = data.candidatos[i];
    processados++;

    if (processados % 500 === 0) {
      console.log(`[enriquecer] Processados ${processados}/${data.candidatos.length}…`);
    }

    // Busca foto apenas para cargos principais (reduz tempo)
    const cargosPrincipais = ['1', '3', '5', '6', '7'];
    if (cargosPrincipais.includes(String(c.cargo))) {
      const foto = await buscarFotoWikidata(c.nomeUrana, c.nomeCivil);
      if (foto) {
        c.foto = foto;
      }
    }

    candidatosComFoto.push(c);
  }

  const output = {
    ...data,
    candidatos: candidatosComFoto,
    enriquecidoEm: new Date().toISOString(),
    totalFotos: candidatosComFoto.filter(c => c.foto).length
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output));
  console.log(`[enriquecer] ✅ Concluído! ${output.totalFotos} fotos encontradas.`);
}

processar().catch(e => console.error('[enriquecer] Erro:', e));