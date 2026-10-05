#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const pagesDir = path.join(__dirname, '..', 'pages');

const labels = {
  'congresso.html': { 'busca': 'Buscar projetos de lei', 'u-num': 'Número da urna' },
  'eleicoes-2026.html': { 'q': 'Buscar candidatos' },
  'fundo-eleitoral.html': { 'fx-pq': 'Buscar por partido', 'fx-q': 'Buscar por emenda ou parlamentar' },
  'iniciativa-cidada.html': { 'filter-search': 'Filtrar iniciativas', 'orgName': 'Nome da organização', 'orgEmail': 'Email da organização', 'title': 'Título da iniciativa', 'attachmentUrl': 'URL do anexo', 'invite-name': 'Nome do convidado' },
  'mandato-responsavel.html': { 'mrVotos': 'Número de votos recebidos', 'mrPct': 'Percentual de cassação', 'mrRegra': 'Regra de revogação' },
  'meu-voto.html': { 'code-input': 'Código do voto' },
  'parlamentares.html': { 'q': 'Buscar parlamentar', 'fPol': 'Filtrar por partido', 'fTitulo': 'Filtrar por título', 'vEmail': 'Seu email', 'vCodigo': 'Código de verificação', 'vq': 'Buscar no radar' },
  'votacoes.html': { 'mq': 'Buscar nas minhas votações', 'pTxt': 'Buscar por proposição', 'q': 'Buscar votações', 'dgEmail': 'Email para o digest' }
};

let totalAdded = 0;

Object.keys(labels).forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  Object.keys(labels[file]).forEach(id => {
    const label = labels[file][id];
    const idStr = 'id="' + id + '"';
    const forStr = 'for="' + id + '"';
    
    if (content.includes(idStr) && !content.includes(forStr)) {
      // Encontra a linha do input e adiciona label antes
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(idStr) && lines[i].includes('<input')) {
          const indent = lines[i].match(/^(\s*)/)[1];
          const labelLine = indent + '<label for="' + id + '" class="sr-only" style="position:absolute;left:-9999px">' + label + '</label>';
          lines.splice(i, 0, labelLine);
          content = lines.join('\n');
          modified = true;
          totalAdded++;
          console.log('+label', id, 'em', file);
          break;
        }
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

// inputs sem id (aria-label)
const ariaLabels = {
  'comunidade.html': ['Buscar na comunidade', 'Filtrar por categoria'],
  'iniciativa-cidada.html': ['Buscar iniciativas'],
  'meu-voto.html': ['Dígito do código', 'Dígito do código'],
  'proposta.html': ['Buscar propostas', 'Filtrar propostas'],
  'votacoes.html': ['Buscar voto específico']
};

Object.keys(ariaLabels).forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let idx = 0;
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length && idx < ariaLabels[file].length; i++) {
    if (lines[i].includes('<input') && !lines[i].includes('type="hidden"') && !lines[i].includes('id=') && !lines[i].includes('aria-label')) {
      lines[i] = lines[i].replace('>', ' aria-label="' + ariaLabels[file][idx] + '">');
      modified = true;
      console.log('+aria-label em', file);
      idx++;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('\n✅ Total de labels adicionados:', totalAdded);
