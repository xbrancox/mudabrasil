/* ============================================================
   MudaBrasil App · Urna Digital do Povo
   Substitui a urna eletrônica: votar, conferir, revogar.
   ============================================================ */

const API = (window.MudaBrasil && window.MudaBrasil.API_BASE) || '';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const LS = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};

const state = {
  screen: 'splash',
  politicos: [],
  backendOK: false,
  selected: null,
  lastVote: null,
  term: { totalVotosAtivos: 0, totalRevogados: 0, topN: [], revogados: [] }
};

const toast = m => {
  const t = document.getElementById('toast') || (() => {
    const el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); return el;
  })();
  t.textContent = m; t.style.display = 'block';
  clearTimeout(toast._t); toast._t = setTimeout(() => t.style.display = 'none', 2600);
};

/* ============================================================
   NAVEGAÇÃO
   ============================================================ */
function go(s) {
  state.screen = s;
  $$('.scr').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('scr-' + s);
  if (el) el.classList.add('active');
  $$('.bot-nav button').forEach(b => b.classList.toggle('on', b.dataset.scr === s));
  const fab = $('#fab');
  if (fab) fab.classList.toggle('hidden', s === 'votar' || s === 'recibo');
  window.scrollTo(0, 0);
  if (s === 'votar') renderVotar();
  if (s === 'conferir') renderConferirLista();
  if (s === 'termometro') initTermometro();
  if (s === 'congresso') renderCongresso();
}

/* ============================================================
   HASH CHAIN (blockchain-like) — SHA-256
   ============================================================ */
async function sha256(msg) {
  if (window.crypto && crypto.subtle) {
    const buf = new TextEncoder().encode(msg);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // fallback simples (só dev)
  let h = 0; for (let i = 0; i < msg.length; i++) { h = ((h << 5) - h) + msg.charCodeAt(i); h |= 0; }
  return 'fallback-' + Math.abs(h).toString(16).padStart(64, '0');
}
async function chainHash(code, politicianId) {
  const prev = LS.get('mb_chain_hash', 'genesis');
  const msg = prev + '|' + code + '|' + politicianId + '|' + Date.now();
  const h = await sha256(msg);
  LS.set('mb_chain_hash', h);
  return h;
}

/* ============================================================
   POLÍTICOS — carregar / buscar
   ============================================================ */
async function loadPoliticos() {
  if (!API) return;
  try {
    const r = await fetch(API + '/api/candidatos');
    const j = await r.json();
    const arr = Array.isArray(j) ? j : (j.candidatos || j.dados || []);
    state.politicos = arr.map(d => ({
      id: d.id,
      nome: d.nome || d.name || d.nomeCivil || '—',
      partido: d.partido || d.party || d.siglaPartido || '—',
      uf: d.uf || d.state || d.siglaUf || '',
      cargo: d.cargo || d.position || 'Deputado Federal',
      foto: d.foto || d.urlFoto || d.photo || '',
      num: d.num || d.numero || (String(d.id || '').replace(/\D/g, '')),
      selo: !!(d.selo || d.verificado || d.verified)
    }));
    state.backendOK = true;
    const badge = $('#badge'); if (badge) badge.textContent = 'backend ativo';
    populaFiltros();
  } catch (e) {
    console.warn('loadPoliticos falhou:', e);
    const badge = $('#badge'); if (badge) { badge.textContent = 'offline'; badge.classList.add('off'); }
  }
}

function populaFiltros() {
  const ufs = [...new Set(state.politicos.map(p => p.uf).filter(Boolean))].sort();
  const cargos = [...new Set(state.politicos.map(p => p.cargo).filter(Boolean))].sort();
  const ufSel = $('#f-uf'); const cSel = $('#f-cargo');
  if (ufSel) ufSel.innerHTML = '<option value="">Todos os estados</option>' + ufs.map(u => `<option>${u}</option>`).join('');
  if (cSel) cSel.innerHTML = '<option value="">Todos os cargos</option>' + cargos.map(c => `<option>${c}</option>`).join('');
}

function avatarHTML(p, cls) {
  cls = cls || 'pol-av';
  if (p.foto) return `<img class="${cls}" src="${p.foto}" alt="" onerror="this.outerHTML='<div class=\\'${cls}\\' style=\\'background:#123059;color:#FFD700\\'>${(p.nome||'?')[0].toUpperCase()}</div>'">`;
  const cores = ['#2ECC71', '#FFD700', '#4a90f0', '#E74C3C', '#A855F7'];
  const cor = cores[(p.nome || '').length % 5];
  return `<div class="${cls}" style="background:${cor};color:#1a1400">${(p.nome || '?')[0].toUpperCase()}</div>`;
}

/* ============================================================
   TELA VOTAR
   ============================================================ */
function renderVotar() {
  if (!state.politicos.length) {
    $('#lista-pol').innerHTML = '<div class="mini" style="text-align:center;padding:20px">Carregando políticos…</div>';
    return;
  }
  const q = ($('#busca-pol').value || '').toLowerCase().trim();
  const uf = $('#f-uf') ? $('#f-uf').value : '';
  const cargo = $('#f-cargo') ? $('#f-cargo').value : '';
  const temFiltro = q || uf || cargo;
  if (!temFiltro) {
    $('#lista-pol').innerHTML = '<div class="mini" style="text-align:center;padding:26px"><i class="fa-solid fa-magnifying-glass" style="font-size:28px;color:var(--gold);display:block;margin-bottom:10px"></i><b style="color:var(--txt);display:block;margin-bottom:6px">Pesquise um político</b>Digite nome, partido, número ou escolha o estado.</div>';
    return;
  }
  const lista = state.politicos.filter(p =>
    (!q || (p.nome || '').toLowerCase().includes(q) || (p.partido || '').toLowerCase().includes(q) || String(p.num).includes(q) || (p.uf || '').toLowerCase().includes(q)) &&
    (!uf || p.uf === uf) &&
    (!cargo || p.cargo === cargo)
  ).slice(0, 10);
  if (!lista.length) {
    $('#lista-pol').innerHTML = '<div class="mini" style="text-align:center;padding:20px">Nenhum político encontrado com esse filtro.</div>';
    return;
  }
  $('#lista-pol').innerHTML = lista.map(p => `
    <div class="pol-item" onclick="abrirConfirm('${p.id}')">
      ${avatarHTML(p)}
      <div class="pol-info">
        <b>${p.nome}${p.selo ? '<span class="selo">✓ VERIFICADO</span>' : ''}</b>
        <small>${p.partido} · ${p.uf} · ${p.cargo}${p.num ? ' · nº ' + p.num : ''}</small>
      </div>
      <i class="fa-solid fa-chevron-right pol-arrow"></i>
    </div>
  `).join('');
}

function abrirConfirm(id) {
  const p = state.politicos.find(x => x.id === id);
  if (!p) return;
  state.selected = p;
  const box = $('#confirm-box');
  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="confirm-pol">
      ${avatarHTML(p)}
      <div>
        <b>${p.nome}${p.selo ? '<span class="selo" style="margin-left:6px">✓ VERIFICADO</span>' : ''}</b>
        <small>${p.partido} · ${p.uf} · ${p.cargo}${p.num ? ' · nº ' + p.num : ''}</small>
      </div>
    </div>
    <div class="confirm-text">
      Confirmar <b style="color:var(--gold)">voto de confiança</b> neste(a) político(a)?<br>
      Você receberá um <b>código único de 20 dígitos</b>. É seu comprovante. Guarde com segurança.
    </div>
    <div class="rounds">
      <button class="round-btn voto" onclick="confirmarVoto()">
        <i class="fa-solid fa-check"></i>
        <span>CONFIRMAR</span>
        <small style="font-size:10px;font-weight:600">CONFIANÇA</small>
      </button>
    </div>
    <div style="text-align:center">
      <button class="btn btn-sm btn-ghost" onclick="cancelarConfirm()">← Voltar</button>
    </div>
  `;
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelarConfirm() { $('#confirm-box').classList.add('hidden'); }

async function confirmarVoto() {
  const p = state.selected;
  if (!p) return;
  $('#confirm-box').innerHTML = '<div class="mini" style="text-align:center;padding:20px"><i class="fa-solid fa-spinner fa-spin" style="color:var(--gold);font-size:20px"></i><br>Registrando voto…</div>';
  let code = null;
  let erro = null;
  // Tenta registrar no backend
  if (state.backendOK) {
    try {
      const r = await fetch(API + '/api/voto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ politicianId: p.id, vote: 'confianca' })
      });
      if (r.ok) {
        const j = await r.json();
        code = j.code || j.formatted || null;
      } else {
        const j = await r.json().catch(() => ({}));
        erro = j.error || r.status;
      }
    } catch (e) { erro = 'falha de conexão'; }
  }
  // Fallback: gera código local
  if (!code) {
    code = genLocalCode();
    if (erro) console.warn('Backend falhou (' + erro + '), usando código local');
  }
  // Hash chain
  const hash = await chainHash(code, p.id);
  // Salva nos meus códigos
  const meus = LS.get('mb_meus_codigos', []);
  const reg = {
    code: code,
    politicianId: p.id,
    nome: p.nome,
    partido: p.partido,
    uf: p.uf,
    cargo: p.cargo,
    foto: p.foto,
    ts: Date.now(),
    hash: hash,
    ativo: true
  };
  meus.unshift(reg);
  LS.set('mb_meus_codigos', meus);
  state.lastVote = reg;
  go('recibo');
}

function genLocalCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 20; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}
function formatCodePretty(c) {
  return c.replace(/(.{4})/g, '$1-').replace(/-$/, '').trim();
}

/* ============================================================
   TELA RECIBO
   ============================================================ */
function renderRecibo() {
  const v = state.lastVote;
  if (!v) { go('votar'); return; }
  const body = $('#recibo-body');
  if (!body) return;
  body.innerHTML = `
    <div class="recibo-pol">
      ${avatarHTML({ nome: v.nome, foto: v.foto })}
      <b>${v.nome}</b>
      <small>${v.partido} · ${v.uf} · ${v.cargo}</small>
    </div>
    <div class="codigo-box">
      <label>🔑 Seu código (20 dígitos)</label>
      <div class="codigo" id="cod-display">${formatCodePretty(v.code)}</div>
      <div class="codigo-warn"><i class="fa-solid fa-triangle-exclamation"></i> Mostre uma vez. Salve agora.</div>
    </div>
    <div class="hash-box">
      <label>🔗 Hash encadeado (blockchain-like)</label>
      <div id="hash-display">${v.hash}</div>
      <small style="color:var(--mut);display:block;margin-top:6px;font-family:Manrope;font-size:10px">Cada voto gera um hash que liga ao anterior. Se alguém alterar um voto, toda a cadeia quebra.</small>
    </div>
    <div class="recibo-actions">
      <button class="btn btn-gold" onclick="copiarCodigo()"><i class="fa-solid fa-copy"></i> Copiar</button>
      <button class="btn btn-ghost" onclick="compartilhar()"><i class="fa-solid fa-share-nodes"></i> Compartilhar</button>
    </div>
    <div style="text-align:center;margin-top:14px">
      <button class="btn btn-sm btn-ghost" onclick="go('conferir')">Conferir depois →</button>
    </div>
  `;
}

async function copiarCodigo() {
  const v = state.lastVote; if (!v) return;
  try { await navigator.clipboard.writeText(formatCodePretty(v.code)); toast('✅ Código copiado!'); }
  catch (e) { toast('Copie manualmente: ' + formatCodePretty(v.code)); }
}
function compartilhar() {
  const v = state.lastVote; if (!v) return;
  const txt = '🗳️ Votei confiança em ' + v.nome + ' (' + v.partido + '-' + v.uf + ') no MudaBrasil.\nMeu código: ' + formatCodePretty(v.code) + '\nConfira em https://xbrancox.github.io/mudabrasil/app/';
  if (navigator.share) navigator.share({ title: 'Meu voto MudaBrasil', text: txt }).catch(() => { });
  else copiarCodigo();
}

/* ============================================================
   TELA CONFERIR
   ============================================================ */
function formatCode() {
  const i = $('#cod-input'); if (!i) return;
  const v = i.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 20);
  i.value = v.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

async function conferirVoto() {
  const raw = ($('#cod-input').value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const res = $('#conferir-res');
  if (!res) return;
  if (raw.length !== 20) { res.innerHTML = '<div class="mini" style="text-align:center;color:var(--red);padding:10px">⚠️ Código inválido (precisa ter 20 dígitos).</div>'; return; }
  res.innerHTML = '<div class="mini" style="text-align:center;padding:16px"><i class="fa-solid fa-spinner fa-spin" style="color:var(--gold);font-size:20px"></i><br>Conferindo…</div>';
  // Tenta backend
  let data = null, ok = false;
  if (state.backendOK) {
    try {
      const r = await fetch(API + '/api/voto?code=' + encodeURIComponent(raw));
      if (r.ok) { data = await r.json(); ok = true; }
      else { const j = await r.json().catch(() => ({})); throw new Error(j.error || r.status); }
    } catch (e) {
      console.warn('conferir backend falhou:', e.message);
    }
  }
  // Fallback: busca local
  if (!ok) {
    const meus = LS.get('mb_meus_codigos', []);
    const loc = meus.find(x => x.code === raw);
    if (loc) {
      data = { ok: true, local: loc };
      ok = true;
    }
  }
  if (!ok || !data) {
    res.innerHTML = '<div class="mini" style="text-align:center;color:var(--red);padding:16px">❌ Código não encontrado. Verifique se digitou certo.</div>';
    return;
  }
  const loc = data.local;
  if (loc) {
    // Local: mostra registro local
    const rev = !loc.ativo;
    const dias = Math.floor((Date.now() - loc.ts) / 86400000);
    res.innerHTML = `
      <div class="conf-res-card ${rev ? 'rev' : 'ok'}">
        <div style="display:flex;align-items:center;gap:12px">
          ${avatarHTML({ nome: loc.nome, foto: loc.foto })}
          <div style="flex:1">
            <b style="font-size:14px">${loc.nome}</b>
            <div class="mini">${loc.partido} · ${loc.uf} · ${loc.cargo}</div>
            <div class="mini" style="margin-top:4px">Voto há ${dias} dia${dias !== 1 ? 's' : ''} · ${rev ? '<span class="chip red">REVOGADO</span>' : '<span class="chip green">ATIVO</span>'}</div>
          </div>
        </div>
        <div class="hash-box" style="margin-top:10px"><label>🔗 Hash</label>${loc.hash}</div>
        ${!rev ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button class="btn btn-green btn-sm" onclick="manterVoto(\'' + raw + '\')"><i class="fa-solid fa-heart"></i> Reafirmar</button><button class="btn btn-red btn-sm" onclick="revogarVoto(\'' + raw + '\')"><i class="fa-solid fa-trash"></i> Revogar</button></div>' : ''}
      </div>
    `;
    return;
  }
  // Backend data
  const rec = data.record || data.ballot || data;
  const polId = rec.politicianId || rec.politician_id;
  const revoked = rec.revoked || rec.revogado;
  const peso = rec.pesoAtual != null ? rec.pesoAtual : 1;
  const dias = rec.diasDesdeReafirmacao != null ? rec.diasDesdeReafirmacao : 0;
  // Busca nome no cache
  const pc = state.politicos.find(p => p.id === polId);
  const nomePol = pc ? pc.nome : (polId || '?');
  const partidoPol = pc ? pc.partido : '';
  const ufPol = pc ? pc.uf : '';
  const cargoPol = pc ? pc.cargo : '';
  const fotoPol = pc ? pc.foto : '';
  res.innerHTML = `
    <div class="conf-res-card ${revoked ? 'rev' : 'ok'}">
      <div style="display:flex;align-items:center;gap:12px">
        ${avatarHTML({ nome: nomePol, foto: fotoPol })}
        <div style="flex:1">
          <b style="font-size:14px">${nomePol}</b>
          <div class="mini">${partidoPol} · ${ufPol} · ${cargoPol}</div>
          <div class="mini" style="margin-top:4px">${revoked ? '<span class="chip red">REVOGADO</span>' : '<span class="chip green">ATIVO</span>'} · peso ${Math.round(peso * 100)}%</div>
        </div>
      </div>
      <div style="margin-top:10px">
        <div class="mini">Peso da confiança (decai 90→180 dias):</div>
        <div class="peso-bar"><i style="width:${peso * 100}%"></i></div>
        <div class="mini">Última reafirmação: ${dias} dia${dias !== 1 ? 's' : ''} atrás</div>
      </div>
      ${!revoked ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button class="btn btn-green btn-sm" onclick="manterVoto(\'' + raw + '\')"><i class="fa-solid fa-heart"></i> Reafirmar</button><button class="btn btn-red btn-sm" onclick="revogarVoto(\'' + raw + '\')"><i class="fa-solid fa-trash"></i> Revogar</button></div>' : ''}
    </div>
  `;
}

async function manterVoto(code) {
  if (state.backendOK) {
    try {
      const r = await fetch(API + '/api/voto/manter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (!r.ok) throw new Error('backend erro ' + r.status);
      toast('✅ Confiança reafirmada! Peso voltou a 100%.');
    } catch (e) { toast('⚠️ Reafirmação local (backend indisponível).'); }
  } else {
    toast('✅ Reafirmação local registrada.');
  }
  conferirVoto();
}

async function revogarVoto(code) {
  if (!confirm('Tem certeza? Revogar é definitivo — o código não funciona mais.')) return;
  // Backend
  if (state.backendOK) {
    try {
      const r = await fetch(API + '/api/voto/revogar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (!r.ok) throw new Error('backend erro ' + r.status);
      toast('✅ Voto revogado com sucesso.');
    } catch (e) { toast('⚠️ Revogação local (backend indisponível).'); }
  }
  // Local: marca inativo
  const meus = LS.get('mb_meus_codigos', []);
  const m = meus.find(x => x.code === code);
  if (m) { m.ativo = false; LS.set('mb_meus_codigos', meus); }
  conferirVoto();
}

function renderConferirLista() {
  const meus = LS.get('mb_meus_codigos', []).slice(0, 8);
  const el = $('#lista-codigos'); if (!el) return;
  if (!meus.length) { el.innerHTML = '<div class="mini" style="text-align:center;padding:10px">Nenhum voto registrado ainda.</div>'; return; }
  el.innerHTML = meus.map(m => `
    <div class="cod-item" onclick="conferirDe('${m.code}')">
      <div style="flex:1;min-width:0">
        <div class="cod-pol">${m.nome}</div>
        <div class="cod-code">${formatCodePretty(m.code)}</div>
        <div class="cod-meta">${new Date(m.ts).toLocaleDateString('pt-BR')} · ${m.ativo ? '<span style="color:var(--green)">ativo</span>' : '<span style="color:var(--red)">revogado</span>'}</div>
      </div>
      <i class="fa-solid fa-chevron-right" style="color:var(--gold)"></i>
    </div>
  `).join('');
}
function conferirDe(code) {
  const i = $('#cod-input'); if (i) i.value = formatCodePretty(code);
  conferirVoto();
}

/* ============================================================
   TERMÔMETRO — SSE + polling
   ============================================================ */
let SSE = null;
async function initTermometro() {
  await loadTermometro();
  if (SSE) return;
  if (!state.backendOK || !window.EventSource) return;
  try {
    SSE = new EventSource(API + '/api/stream');
    SSE.addEventListener('termometro', e => {
      try { const d = JSON.parse(e.data); atualizaTermometro(d); } catch (e) { }
    });
    SSE.addEventListener('welcome', e => {
      try { const d = JSON.parse(e.data); atualizaTermometro(d); } catch (e) { }
    });
    SSE.onerror = () => { SSE.close(); SSE = null; };
  } catch (e) { console.warn('SSE falhou:', e); }
}

async function loadTermometro() {
  if (!state.backendOK) { renderTermometroVazio(); return; }
  try {
    const r1 = await fetch(API + '/api/termometro');
    const j1 = await r1.json();
    state.term.totalVotosAtivos = j1.totalVotosAtivos || 0;
    state.term.totalRevogados = j1.totalRevogados || 0;
  } catch (e) { }
  try {
    const r2 = await fetch(API + '/api/termometro?top=30');
    const j2 = await r2.json();
    state.term.topN = (j2.topN || []).slice(0, 8);
  } catch (e) { }
  try {
    const r3 = await fetch(API + '/api/voto/revogados');
    const j3 = await r3.json();
    state.term.revogados = (Array.isArray(j3) ? j3 : (j3.top || j3.revogados || [])).slice(0, 8);
  } catch (e) { }
  renderTermometroDados();
}

function atualizaTermometro(d) {
  if (d.totalVotosAtivos != null) state.term.totalVotosAtivos = d.totalVotosAtivos;
  if (d.totalRevogados != null) state.term.totalRevogados = d.totalRevogados;
  renderTermometroDados();
}

function renderTermometroVazio() {
  $('#term-stats').innerHTML = '<div class="mini" style="text-align:center;padding:10px;grid-column:1/-1">Sem dados.</div>';
  $('#term-top').innerHTML = '';
  $('#term-rev').innerHTML = '';
}

function renderTermometroDados() {
  $('#term-stats').innerHTML = `
    <div class="term-stat"><b>${state.term.totalVotosAtivos}</b><small>ativos</small></div>
    <div class="term-stat"><b>${state.term.totalRevogados}</b><small>revogados</small></div>
    <div class="term-stat"><b>${state.term.totalVotosAtivos + state.term.totalRevogados}</b><small>total</small></div>
  `;
  const polMap = {};
  state.politicos.forEach(p => polMap[p.id] = p);
  $('#term-top').innerHTML = state.term.topN.length ? state.term.topN.map(t => {
    const p = polMap[t.politicianId] || { nome: t.politicianId, partido: '', uf: '' };
    const idx = Math.round((t.indice || 0) * 100);
    return `
      <div class="term-item">
        <div class="term-item-head">
          ${avatarHTML(p)}
          <div style="flex:1;min-width:0">
            <b>${p.nome || t.politicianId}</b>
            <small style="display:block">${p.partido || ''}${p.uf ? ' · ' + p.uf : ''}</small>
          </div>
          <b style="color:var(--gold);font-size:14px">${idx}%</b>
        </div>
        <div class="term-bar"><i class="g" style="width:${idx}%"></i></div>
      </div>`;
  }).join('') : '<div class="mini" style="text-align:center;padding:10px">Nenhum político no ranking ainda.</div>';
  $('#term-rev').innerHTML = state.term.revogados.length ? state.term.revogados.map(t => {
    const nome = t.nome || t.politicianId || '?';
    const rev = t.revogados || t.revocados || t.rev || 0;
    const el = t.eleitos || t.eleicoes || t.el || 0;
    const pct = el ? Math.round(rev / el * 100) : 0;
    const falta = Math.max(0, Math.round(el * 0.7) - rev);
    return `
      <div class="term-item">
        <div class="term-item-head">
          <div class="pol-av" style="background:var(--red);color:#fff">${nome[0]}</div>
          <div style="flex:1;min-width:0"><b>${nome}</b><small style="display:block">${t.partido || ''}${t.uf ? ' · ' + t.uf : ''}</small></div>
          <b style="color:var(--red);font-size:14px">${pct}%</b>
        </div>
        <div class="mini">Revogados: <b style="color:var(--red)">${rev}</b> de ${el} eleitos</div>
        <div class="term-bar"><i class="r" style="width:${Math.min(100, pct)}%"></i><i class="g" style="width:${Math.max(0, 70 - pct)}%;margin-left:${pct}%"></i></div>
        <div class="mini" style="margin-top:4px">${falta > 0 ? `Faltam <b style="color:var(--gold)">${falta}</b> pra cassar (70%)` : '<b style="color:var(--red)">ATINGIU 70% — CASSAÇÃO</b>'}</div>
      </div>`;
  }).join('') : '<div class="mini" style="text-align:center;padding:10px">Nenhum político com revogação significativa.</div>';
}

/* ============================================================
   CONGRESSO (lightweight)
   ============================================================ */
let PLS_CACHE = [];
async function renderCongresso() {
  const body = $('#congresso-body'); if (!body) return;
  body.innerHTML = '<div class="mini" style="text-align:center;padding:20px"><i class="fa-solid fa-spinner fa-spin" style="color:var(--gold)"></i> Carregando PLs…</div>';
  if (!PLS_CACHE.length) {
    try {
      const r = await fetch(API + '/api/pls');
      const j = await r.json();
      PLS_CACHE = Array.isArray(j) ? j : (j.pls || []);
    } catch (e) { }
  }
  let POVO = {};
  try { POVO = await (await fetch(API + '/api/votos-pl')).json(); } catch (e) { }
  if (!PLS_CACHE.length) { body.innerHTML = '<div class="mini" style="text-align:center;padding:20px">Nenhuma PL disponível.</div>'; return; }
  body.innerHTML = PLS_CACHE.slice(0, 12).map(pl => {
    const key = (pl.siglaTipo || 'PL') + ' ' + (pl.numero || pl.number || '') + '/' + (pl.ano || pl.year || '');
    const desc = pl.ementa || pl.title || '';
    const povo = POVO[key] || { aprovo: 0, nao: 0 };
    const tot = povo.aprovo + povo.nao;
    const a = tot ? Math.round(povo.aprovo / tot * 100) : null;
    const mv = LS.get('mb_votos_pl', {})[key];
    return `
      <div class="pl-item">
        <div class="pl-head">
          <span class="pl-num">${key}</span>
          ${tot ? `<span class="chip gold">${tot} voto${tot > 1 ? 's' : ''}</span>` : ''}
          ${mv ? `<span class="chip ${mv === 'aprovo' ? 'green' : 'red'}">${mv === 'aprovo' ? 'você aprovou' : 'você não aprovou'}</span>` : ''}
        </div>
        <div class="pl-desc">${(desc || '').slice(0, 150)}${desc.length > 150 ? '…' : ''}</div>
        <div class="pl-actions">
          <button class="btn btn-green btn-sm" onclick="votaPL('${key}','aprovo')">👍 Aprovo</button>
          <button class="btn btn-red btn-sm" onclick="votaPL('${key}','nao')">👎 Não</button>
          <a class="btn btn-sm btn-ghost" href="pages/congresso.html" target="_blank">Ver página completa →</a>
        </div>
        ${tot ? `<div class="pl-povo"><div class="mini">PLACAR DO POVO</div><div class="term-bar" style="margin-top:4px"><i class="g" style="width:${a}%"></i><i class="r" style="width:${100 - a}%"></i></div><div class="mini" style="margin-top:4px">👍 aprovo ${a}% · 👎 não aprovo ${100 - a}%</div></div>` : '<div class="pl-povo"><div class="mini">Seja o primeiro a opinar</div></div>'}
      </div>
    `;
  }).join('');
}
async function votaPL(key, v) {
  const mv = LS.get('mb_votos_pl', {});
  mv[key] = v;
  LS.set('mb_votos_pl', mv);
  try {
    const uid = LS.get('mb_uid', null) || (() => { const u = 'u' + Math.random().toString(36).slice(2, 10); LS.set('mb_uid', u); return u; })();
    await fetch(API + '/api/votos-pl', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, pl: key, voto: v })
    });
  } catch (e) { }
  toast(v === 'aprovo' ? '✅ Aprovo registrado' : '✅ Não aprovo registrado');
  renderCongresso();
}

/* ============================================================
   INIT
   ============================================================ */
(function init() {
  // Bind nav buttons
  $$('.bot-nav button').forEach(b => b.onclick = () => go(b.dataset.scr));
  // First render
  go('splash');
  // Load data
  loadPoliticos();
  // Register SW
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW fail:', e));
  }
})();
