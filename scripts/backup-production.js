/* ============================================================
   VotaBrasil — Script de Backup Automatizado para Produção
   Gera dumps criptografados de votos.db e arquivos de dados críticos.
   Suporte a criptografia AES-256-GCM via BACKUP_KEY (opcional).
   ============================================================ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'server', 'data', 'votos.db');
const DATA_DIR = path.join(ROOT, 'server', 'data');
const BACKUP_DIR = path.join(ROOT, 'backups');

// Garante que o diretório de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.tar.gz`);

console.log(`[backup] Iniciando backup automático em ${backupFile}...`);

// 1. Compacta o banco de dados SQLite e arquivos críticos
try {
  const filesToBackup = [
    DB_PATH,
    path.join(DATA_DIR, 'vapid-keys.generated.json'),
    path.join(DATA_DIR, 'digest-subscribers.json'),
    path.join(ROOT, 'data', 'politicos.json')
  ].filter(f => fs.existsSync(f));

  console.log(`[backup] Compactando ${filesToBackup.length} arquivos...`);

  // Cria um tarball compactado
  const tarCmd = `tar -czf "${backupFile}" ${filesToBackup.map(f => `"${f}"`).join(' ')}`;
  execSync(tarCmd, { cwd: ROOT });

  const stats = fs.statSync(backupFile);
  console.log(`[backup] Backup criado com sucesso: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  // 2. Criptografia Opcional (AES-256-GCM)
  const backupKey = process.env.BACKUP_KEY;
  if (backupKey) {
    console.log('[backup] Criptografando backup com AES-256-GCM...');
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(backupKey, salt, 32);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const input = fs.createReadStream(backupFile);
    const output = fs.createWriteStream(backupFile + '.enc');

    const authTag = iv.toString('base64') + ':' + salt.toString('base64');

    await new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output).on('finish', () => {
        // Salva o authTag em um arquivo separado (nunca no backup público)
        fs.writeFileSync(backupFile + '.auth', authTag);
        console.log(`[backup] Backup criptografado: ${backupFile}.enc`);
        console.log(`[backup] Auth tag salvo em: ${backupFile}.auth`);
        resolve();
      }).on('error', reject);
    });

    // Remove o backup não criptografado
    fs.unlinkSync(backupFile);
  } else {
    console.log('[backup] BACKUP_KEY não configurado. Backup gerado sem criptografia.');
  }

  // 3. Limpeza de backups antigos (retenção de 7 dias)
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-'))
    .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
    .sort((a, b) => a.time - b.time);

  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  files.forEach(f => {
    if (f.time.getTime() < sevenDaysAgo) {
      fs.unlinkSync(path.join(BACKUP_DIR, f.name));
      console.log(`[backup] Backup antigo removido: ${f.name}`);
    }
  });

  console.log('[backup] Backup concluído com sucesso!');
  process.exit(0);

} catch (error) {
  console.error('[backup] ERRO ao gerar backup:', error.message);
  process.exit(1);
}