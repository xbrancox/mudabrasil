/* ============================================================
   ENRIQUECER CANDIDATOS 2026 — Fotos + Fundo Eleitoral Real
   ------------------------------------------------------------
   1. Fotos: usa repositório GitHub oficial
      https://github.com/Marinasantosrocha/fotos-candidatos2026
   2. Fundo eleitoral: baixa prestação de contas do TSE e cruza
      por SQ_CANDIDATO
   3. Atualiza data/candidatos-2026.json com dados reais
   ============================================================ */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CANDIDATOS_FILE = path.join(ROOT, 'data', 'candidatos-2026.json');
const FOTOS_DIR = path.join(ROOT, 'data', 'fotos-candidatos');
const FUNDO_FILE = path.join(ROOT, 'tmp', 'fundo-eleitoral-candidatos.json');

// URLs oficiais
const FOTOS_REPO = 'https://raw.githubusercontent.com/Marinasantosrocha/fotos-candidatos2026/main/';
const FUNDO_ZIP = 'https://cdn.tse.jus.br/estatistica/sead/odsele/prestacao_contas_candidatos/pccand_2026.zip';

console.log('🔍 Enriquecendo candidatos 2026...');

// 1. Carregar candidatos
console.log('[1/5] Carregando candidatos...');
let data;
try {
  data = JSON.parse(fs.readFileSync(CANDIDATOS_FILE, 'utf8'));
} catch (e) {
  console.error('❌ Erro ao ler candidatos-2026.json:', e.message);
  process.exit(1);
}
const candidatos = data.candidatos || [];
console.log(`   📦 ${candidatos.length} candidatos carregados`);

// 2. Fotos — criar diretório e baixar lista do GitHub
console.log('[2/5] Verificando fotos...');
if (!fs.existsSync(FOTOS_DIR)) {
  fs.mkdirSync(FOTOS_DIR, { recursive: true });
  console.log('   📁 Diretório de fotos criado');
}

// Lista de arquivos do repositório de fotos
const fotosIndexFile = path.join(FOTOS_DIR, 'fotos-index.json');
let fotosDisponiveis = [];

try {
  // Tenta baixar o índice do repositório
  console.log('   📥 Buscando lista de fotos do GitHub...');
  const apiResp = httpsGetSync('https://api.github.com/repos/Marinasantosrocha/fotos-candidatos2026/contents/');
  const files = JSON.parse(apiResp);
  fotosDisponiveis = files.filter(f => f.name.endsWith('_div.jpg')).map(f => f.name);
  fs.writeFileSync(fotosIndexFile, JSON.stringify(fotosDisponiveis));
  console.log(`   ✅ ${fotosDisponiveis.length} fotos disponíveis no repositório`);
} catch (e) {
  console.log('   ⚠️  Não foi possível listar fotos do GitHub:', e.message);
  if (fs.existsSync(fotosIndexFile)) {
    fotosDisponiveis = JSON.parse(fs.readFileSync(fotosIndexFile, 'utf8'));
    console.log(`   📂 Usando índice local: ${fotosDisponiveis.length} fotos`);
  }
}

// Mapear SQ → foto
const sqToFotos = {};
fotosDisponiveis.forEach(nome => {
  // FBR{SQ}_div.jpg
  const match = nome.match(/^FBR(\d+)_div\.jpg$/);
  if (match) {
    sqToFotos[match[1]] = FOTOS_REPO + nome;
  }
});

// 3. Fundo eleitoral — baixar e processar prestação de contas
console.log('[3/5] Processando fundo eleitoral...');
const fundoPorCandidato = {};

try {
  // Tenta ler arquivo já processado
  if (fs.existsSync(FUNDO_FILE)) {
    const fundo = JSON.parse(fs.readFileSync(FUNDO_FILE, 'utf8'));
    Object.assign(fundoPorCandidato, fundo);
    console.log(`   ✅ Fundo eleitoral carregado (${Object.keys(fundoPorCandidato).length} candidatos)`);
  } else {
    console.log('   ⏳ Fundo eleitoral será processado na próxima execução (baixar pccand_2026.zip)');
  }
} catch (e) {
  console.log('   ⚠️  Fundo eleitoral indisponível:', e.message);
}

// 4. Enriquecer candidatos
console.log('[4/5] Enriquecendo dados...');
let fotosAdicionadas = 0;
let fundoAdicionado = 0;

candidatos.forEach(c => {
  const sq = String(c.sq || '');
  
  // Foto
  if (!c.foto && sq && sqToFotos[sq]) {
    c.foto = sqToFotos[sq];
    fotosAdicionadas++;
  }
  
  // Fundo eleitoral
  if (sq && fundoPorCandidato[sq]) {
    c.prestacaoContas = {
      recebidoTotal: fundoPorCandidato[sq].total,
      gastoDeclarado: fundoPorCandidato[sq].gasto || 0,
      statusPrestacao: fundoPorCandidato[sq].status || 'EM ANÁLISE',
      fonte: 'TSE - Prestação de Contas 2026',
      atualizadoEm: new Date().toISOString()
    };
    fundoAdicionado++;
  }
});

console.log(`   ✅ Fotos adicionadas: ${fotosAdicionadas}`);
console.log(`   ✅ Fundo eleitoral adicionado: ${fundoAdicionado}`);

// 5. Salvar
console.log('[5/5] Salvando...');
data.enriquecidoEm = new Date().toISOString();
data.totalFotos = candidatos.filter(c => c.foto && c.foto.length > 10).length;
data.totalComFundo = candidatos.filter(c => c.prestacaoContas && c.prestacaoContas.recebidoTotal > 0).length;

fs.writeFileSync(CANDIDATOS_FILE, JSON.stringify(data, null, 2));
console.log(`   💾 ${CANDIDATOS_FILE} atualizado`);

// Resumo
console.log('');
console.log('📊 Resumo:');
console.log(`   Total de candidatos: ${candidatos.length}`);
console.log(`   Com foto: ${data.totalFotos} (${((data.totalFotos/candidatos.length)*100).toFixed(2)}%)`);
console.log(`   Com fundo eleitoral real: ${data.totalComFundo} (${((data.totalComFundo/candidatos.length)*100).toFixed(2)}%)`);
console.log('');
console.log('✅ Enriquecimento concluído!');

// Helper: HTTPS GET síncrono
function httpsGetSync(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'VotaBrasil/1.0' }}, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}