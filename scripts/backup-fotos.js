#!/usr/bin/env node
/* ============================================================
   BACKUP DE FOTOS — download local para resiliência
   ------------------------------------------------------------
   Baixa todas as fotos reais (GitHub, Wikimedia, outras) para
   data/fotos/<sq>.jpg e atualiza candidatos-2026.json para
   apontar para a cópia local. Protege contra quebras do repo
   externo e permite que o GitHub Pages sirva as fotos mesmo
   sem internet / rate limit.

   Uso:
     node scripts/backup-fotos.js
     node scripts/backup-fotos.js --dry-run    # só reporta, não baixa
     node scripts/backup-fotos.js --force      # re-baixa mesmo se já existir
     node scripts/backup-fotos.js --preserve   # baixa mas NÃO altera candidatos-2026.json

   Segurança:
   - Faz backup de candidatos-2026.json em .bak antes de escrever
   - Não sobrescreve arquivos existentes sem --force
   - Valida que o conteúdo baixado é imagem (magic bytes JPEG/PNG/WebP)
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CAND_FILE = path.join(ROOT, 'data', 'candidatos-2026.json');
const BACKUP_FILE = path.join(ROOT, 'data', 'candidatos-2026.json.bak');
const FOTOS_DIR = path.join(ROOT, 'data', 'fotos');

const CONCURRENCY = 10;
const TIMEOUT_MS = 15000;
const RETRIES = 2;
const UA = 'VotaBrasil/1.0 (plataforma civica de transparencia)';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const PRESERVE = args.includes('--preserve');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isImageUrl(buf) {
  if (!buf || buf.length < 8) return false;
  // JPEG
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpg';
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
  // WebP
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
      && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'webp';
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif';
  return false;
}

async function download(url) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' },
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(t);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = isImageUrl(buf);
      if (!ext) throw new Error('conteúdo não é imagem conhecida');
      return { buf, ext, size: buf.length };
    } catch (e) {
      if (attempt < RETRIES && (e.name === 'AbortError' || /network|timeout|ECONN/i.test(e.message))) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw e;
    }
  }
  throw new Error('exhausted');
}

function isExternal(url) {
  if (!url || url.length < 10) return false;
  if (url.startsWith('data/fotos/') || url.startsWith('fotos/')) return false;
  if (url.startsWith('data:')) return false;
  if (url.includes('ui-avatars.com')) return false; // placeholder, não precisa backup
  return /^https?:\/\//i.test(url);
}

async function main() {
  console.log('💾 Backup de fotos dos candidatos');
  console.log('📄 Lendo', CAND_FILE);

  const data = JSON.parse(fs.readFileSync(CAND_FILE, 'utf8'));
  const candidatos = Array.isArray(data) ? data : (data.candidatos || []);

  const externos = candidatos.filter(c => isExternal(c.foto));
  console.log(`\n📊 Total de candidatos: ${candidatos.length}`);
  console.log(`📊 Fotos externas a baixar: ${externos.length}`);
  console.log(`   (GitHub: ${externos.filter(c => c.foto.includes('github')).length}, ` +
              `Wikimedia: ${externos.filter(c => c.foto.includes('wikimedia')).length}, ` +
              `Outras: ${externos.filter(c => !c.foto.includes('github') && !c.foto.includes('wikimedia')).length})`);

  if (DRY_RUN) {
    console.log('\n🏃 DRY-RUN — nada será baixado ou alterado.');
    externos.slice(0, 10).forEach(c => console.log(`   • ${c.nomeUrna} (${c.partido}) — ${c.foto}`));
    if (externos.length > 10) console.log(`   … e mais ${externos.length - 10}`);
    return;
  }

  // Cria diretório de fotos
  if (!fs.existsSync(FOTOS_DIR)) {
    fs.mkdirSync(FOTOS_DIR, { recursive: true });
    console.log(`📁 Criado: ${FOTOS_DIR}`);
  }

  // Backup do JSON antes de qualquer alteração
  if (!PRESERVE) {
    fs.writeFileSync(BACKUP_FILE, fs.readFileSync(CAND_FILE));
    console.log(`💾 Backup do JSON em: ${BACKUP_FILE}`);
  }

  let baixadas = 0, jaExistentes = 0, falhas = 0;
  const falhasDetalhes = [];
  const queue = externos.map(c => ({
    c,
    url: c.foto,
    localName: `${c.sq}.${guessExt(c.foto)}`
  }));

  function guessExt(url) {
    const m = url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i);
    return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
  }

  async function worker() {
    while (queue.length) {
      const item = queue.shift();
      if (!item) continue;
      const localPath = path.join(FOTOS_DIR, item.localName);
      const relPath = `data/fotos/${item.localName}`;

      if (fs.existsSync(localPath) && !FORCE) {
        jaExistentes++;
        if (!PRESERVE) item.c.foto = relPath;
        continue;
      }

      try {
        const { buf, ext, size } = await download(item.url);
        // Renomeia extensão se diferente do esperado
        const finalName = `${item.c.sq}.${ext}`;
        const finalPath = path.join(FOTOS_DIR, finalName);
        const finalRel = `data/fotos/${finalName}`;
        fs.writeFileSync(finalPath, buf);
        baixadas++;
        if (!PRESERVE) item.c.foto = finalRel;
        process.stdout.write(`✓ ${baixadas + jaExistentes + falhas}/${externos.length} ${item.c.nomeUrna} (${size} bytes)\r`);
      } catch (e) {
        falhas++;
        falhasDetalhes.push({ nome: item.c.nomeUrna, url: item.url, error: e.message });
        process.stdout.write(`✗ ${baixadas + jaExistentes + falhas}/${externos.length} ${item.c.nomeUrna} — ${e.message}\r`);
      }
    }
  }

  const started = Date.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  // Reescreve o JSON
  if (!PRESERVE) {
    data.enriquecidoEm = new Date().toISOString();
    data.backupFotosEm = new Date().toISOString();
    fs.writeFileSync(CAND_FILE, JSON.stringify(data, null, 2));
  }

  console.log(`\n\n✅ Backup concluído em ${elapsed}s`);
  console.log(`   Baixadas:    ${baixadas}`);
  console.log(`   Já existiam: ${jaExistentes}`);
  console.log(`   Falhas:      ${falhas}`);
  if (PRESERVE) console.log(`   🔒 --preserve: candidatos-2026.json NÃO foi alterado`);
  if (falhasDetalhes.length) {
    console.log('\n⚠️  Falhas:');
    falhasDetalhes.forEach(f => console.log(`   • ${f.nome}: ${f.error}`));
  }
  console.log(`\n📂 Arquivos: ${FOTOS_DIR}`);
}

main().catch(e => {
  console.error('❌ Erro fatal:', e.message);
  process.exit(1);
});
