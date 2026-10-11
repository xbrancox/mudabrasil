#!/usr/bin/env node
/* ============================================================
   Health Check Script — Verifica estado do servidor
   Uso: node scripts/health_check.js
   ------------------------------------------------------------
   - Status da saúde (/api/health)
   - Banco de dados (SQLite) — tabelas obrigatórias
   - Último backup (se endpoint admin disponível)
   - Cache de dados (deputados, senadores, votos)
   ============================================================ */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:8080';
let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (e) {
    console.error(`❌ ${name}: ${e.message}`);
    failures++;
  }
}

// 1. Health check HTTP
check('Health check (/api/health)', () =>
  new Promise((resolve, reject) => {
    http.get(`${BASE}/api/health`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (!j.ok) throw new Error(`health.ok=${j.ok}`);
          if (!j.storage) throw new Error('storage missing');
          if (!j.uptimeSec) throw new Error('uptimeSec missing');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  })
);

// 2. Banco SQLite - tabelas obrigatórias
check('Tabelas SQLite obrigatórias', () => {
  const tables = execSync(
    `node -e "const d = require('./server/db'); d.init(); const r = d.exec('SELECT name FROM sqlite_master WHERE type=\\'table\\''); console.log(r.toString());"`,
    { cwd: process.cwd() }
  ).toString();
  const required = ['ballots', 'politicians', 'denuncias'];
  for (const t of required) {
    if (!tables.includes(t)) throw new Error(`Tabela ${t} não encontrada`);
  }
});

// 3. Cache de dados (deputados, senadores)
check('Cache de dados (deputados.json)', () => {
  const p = path.join(process.cwd(), 'server', 'data', 'deputados.json');
  if (!fs.existsSync(p)) throw new Error('deputados.json não encontrado');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!d.total || d.total < 1) throw new Error('deputados.json vazio');
});

check('Cache de dados (senadores.json)', () => {
  const p = path.join(process.cwd(), 'server', 'data', 'senadores.json');
  if (!fs.existsSync(p)) throw new Error('senadores.json não encontrado');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!d.total || d.total < 1) throw new Error('senadores.json vazio');
});

// 4. Backup admin (se disponível)
check('Backup admin (GET /api/admin/backup)', () =>
  new Promise((resolve, reject) => {
    http.get(`${BASE}/api/admin/backup`, {
      headers: { 'authorization': 'Bearer dummy-token' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          // Esperado — token inválido
          resolve();
        } else if (res.statusCode === 200) {
          resolve(); // Backup disponível
        } else {
          reject(new Error(`status ${res.statusCode}`));
        }
      });
    }).on('error', () => reject(new Error('Erro de conexão')));
  })
);

// 5. Configuração de backup (env vars)
check('Variáveis de ambiente BACKUP_TOKEN', () => {
  if (!process.env.BACKUP_TOKEN) throw new Error('BACKUP_TOKEN não definida');
});

check('Variáveis de ambiente DB_PATH', () => {
  if (!process.env.DB_PATH) throw new Error('DB_PATH não definida');
});

console.log(`\n🔍 Health check concluído`);
if (failures) {
  console.error(`❌ ${failures} verificação(ões) falharam`);
  process.exit(1);
}
console.log('✅ Todas as verificações passaram');
process.exit(0);