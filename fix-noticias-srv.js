const fs = require('fs');
const ps = 'C:/Users/euler/MudaBrasil/server/index.js';
let s = fs.readFileSync(ps, 'utf8');
let n = 0;
function rep(from, to, label) {
  if (!s.includes(from)) { console.error('FALHOU: ' + label); process.exit(1); }
  s = s.split(from).join(to);
  n++;
}

/* bloco de notícias: feeds confiáveis + cache 10 min + detecção de UF */
rep(
  "async function handleApi(req, res, url) {",
  "/* ===== Notícias: RSS de fontes confiáveis (Agência Brasil, G1 Política, Senado) ===== */\n" +
  "const NEWS_FEEDS = [\n" +
  "  { fonte: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml' },\n" +
  "  { fonte: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },\n" +
  "  { fonte: 'Agência Senado', url: 'https://www12.senado.leg.br/noticias/rss' }\n" +
  "];\n" +
  "const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];\n" +
  "const NEWS_CACHE = { ts: 0, items: [] };\n" +
  "function stripTags(v) { return String(v || '').replace(/<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>/g, '$1').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '\"').replace(/&#39;|&apos;/g, \"'\").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\\s+/g, ' ').trim(); }\n" +
  "function parseRss(xml, fonte) {\n" +
  "  const items = [];\n" +
  "  const blocks = String(xml).replace(/\\r/g, '').split(/<item[\\s>]/).slice(1);\n" +
  "  for (const b of blocks) {\n" +
  "    const pick = tag => { const m = b.match(new RegExp('<' + tag + '[^>]*>([\\\\s\\\\S]*?)</' + tag + '>', 'i')); return m ? stripTags(m[1]) : ''; };\n" +
  "    const t = pick('title');\n" +
  "    const lm = b.match(/<link[^>]*href=[\"']([^\"']+)[\"']/i);\n" +
  "    const l = lm ? lm[1] : pick('link');\n" +
  "    const dt = pick('pubDate') || pick('published') || pick('updated');\n" +
  "    let iso = ''; try { iso = dt ? new Date(dt).toISOString() : ''; } catch (_) { }\n" +
  "    if (t && l) items.push({ t: t.slice(0, 200), l: l.trim(), res: (pick('description') || pick('summary')).slice(0, 220), fonte: fonte, dt: iso });\n" +
  "  }\n" +
  "  return items;\n" +
  "}\n" +
  "function detectUF(texto) {\n" +
  "  const t = ' ' + String(texto || '').toUpperCase() + ' ';\n" +
  "  let found = null;\n" +
  "  for (const uf of UF_LIST) {\n" +
  "    if (new RegExp('[ ([\\\\[]' + uf + '[ )\\\\]\\\\.,;:!?~-]').test(t)) {\n" +
  "      if (found && found !== uf) return 'BR';\n" +
  "      found = uf;\n" +
  "    }\n" +
  "  }\n" +
  "  return found;\n" +
  "}\n" +
  "async function refreshNoticias(force) {\n" +
  "  const now = Date.now();\n" +
  "  if (!force && now - NEWS_CACHE.ts < 600000 && NEWS_CACHE.items.length) return;\n" +
  "  try {\n" +
  "    const res = await Promise.all(NEWS_FEEDS.map(f =>\n" +
  "      fetch(f.url, { headers: { Accept: 'application/rss+xml,application/xml,text/xml', 'User-Agent': 'MudaBrasil/1.0' } })\n" +
  "        .then(r => r.text()).then(x => parseRss(x, f.fonte)).catch(() => [])));\n" +
  "    const items = [].concat(...res).map(n => ({ ...n, uf: detectUF(n.t + ' ' + n.res) }));\n" +
  "    items.sort((a, b) => (b.dt || '').localeCompare(a.dt || ''));\n" +
  "    if (items.length) { NEWS_CACHE.items = items.slice(0, 40); NEWS_CACHE.ts = now; }\n" +
  "  } catch (e) { console.warn('[noticias] falha ao atualizar feeds:', e.message); }\n" +
  "}\n\n" +
  "async function handleApi(req, res, url) {",
  'bloco noticias + handleApi');

rep(
  "  if (p === '/api/health') {",
  "  if (p === '/api/noticias' && req.method === 'GET') {\n" +
  "    try { await refreshNoticias(q.force === '1'); } catch (_) { }\n" +
  "    const uf = (q.uf || '').toUpperCase();\n" +
  "    let lista = NEWS_CACHE.items;\n" +
  "    if (uf === 'GERAL') lista = lista.filter(n => !n.uf || n.uf === 'BR');\n" +
  "    else if (uf) lista = lista.filter(n => n.uf === uf);\n" +
  "    return sendJson(res, 200, { ok: true, geradoEm: new Date(NEWS_CACHE.ts).toISOString(), total: lista.length, noticias: lista });\n" +
  "  }\n\n" +
  "  if (p === '/api/health') {",
  'rota /api/noticias');

fs.writeFileSync(ps, s);
console.log('server/index.js OK —', n, 'substituições');
