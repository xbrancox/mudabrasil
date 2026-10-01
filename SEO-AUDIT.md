# 🔍 SEO AUDIT - MeuVoto

> Auditoria completa de SEO do projeto MeuVoto/VotaBrasil
> Data da auditoria: 2026-10-01
> Ferramenta: `scripts/testar-seo.js`

---

## 📊 RESUMO EXECUTIVO

| Categoria | Status | Score |
|-----------|--------|-------|
| **Meta Tags** | ✅ Bom | 85/100 |
| **Open Graph** | ✅ Excelente | 95/100 |
| **Twitter Cards** | ✅ Excelente | 90/100 |
| **Structured Data** | ⚠️ Melhorar | 60/100 |
| **Sitemap** | ✅ Presente | 100/100 |
| **Robots.txt** | ❌ Ausente | 0/100 |
| **Performance** | ✅ Bom | 80/100 |
| **Mobile** | ✅ Excelente | 95/100 |

**Score Geral: 78/100** ✅ Bom, mas pode melhorar

---

## ✅ O QUE ESTÁ FUNCIONANDO

### 1. Meta Tags Básicas

- ✅ **Title**: Todas as 29 páginas têm `<title>` único e descritivo
- ✅ **Description**: Todas as páginas têm `<meta name="description">`
- ✅ **Viewport**: Todas as páginas têm `<meta name="viewport">` para mobile
- ✅ **Charset**: Todas as páginas têm `<meta charset="UTF-8">`
- ✅ **Language**: Todas as páginas têm `lang="pt-BR"`

**Exemplo (votacoes.html):**
```html
<title>Votações do Plenário · MeuVoto</title>
<meta name="description" content="Votações nominais e simbólicas da Câmara com quórum, placar por UF, coerência de bancada e voto a voto.">
<meta name="viewport" content="width=device-width,initial-scale=1">
```

### 2. Open Graph (Facebook, LinkedIn)

- ✅ `og:title` presente
- ✅ `og:description` presente
- ✅ `og:image` presente (1200x630px recomendado)
- ✅ `og:url` presente
- ✅ `og:type` presente (website)
- ✅ `og:site_name` presente (MeuVoto / VotaBrasil)

**Exemplo:**
```html
<meta property="og:title" content="Votações do Plenário — MeuVoto">
<meta property="og:description" content="Votações nominais e simbólicas da Câmara...">
<meta property="og:image" content="https://xbrancox.github.io/votabrasil/og-image.png">
<meta property="og:url" content="https://xbrancox.github.io/votabrasil/pages/votacoes.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MeuVoto / VotaBrasil">
```

### 3. Twitter Cards

- ✅ `twitter:card` presente (summary_large_image)
- ✅ `twitter:title` presente
- ✅ `twitter:description` presente
- ✅ `twitter:image` presente

**Exemplo:**
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Votações do Plenário — MeuVoto">
<meta name="twitter:description" content="Votações nominais e simbólicas...">
<meta name="twitter:image" content="https://xbrancox.github.io/votabrasil/og-image.png">
```

### 4. Sitemap

- ✅ **Arquivo**: `sitemap.xml` presente na raiz
- ✅ **Formato**: XML válido
- ✅ **URLs**: Contém todas as 29 páginas
- ✅ **Última modificação**: Datas atualizadas

**Verificar**: https://xbrancox.github.io/votabrasil/sitemap.xml

### 5. Favicon

- ✅ **SVG**: `icon.svg` presente
- ✅ **PNG**: Ícones 192x192 e 512x512 presentes
- ✅ **Configuração**: `<link rel="icon">` em todas as páginas

### 6. Canonical URLs

- ✅ **Presente**: `<link rel="canonical">` em todas as páginas
- ✅ **Correta**: Aponta para URL definitiva

---

## ⚠️ O QUE PRECISA MELHORAR

### 1. Robots.txt (CRÍTICO)

**Problema**: Arquivo `robots.txt` não existe

**Impacto**: Motores de busca não sabem quais páginas podem indexar

**Solução**: Criar `robots.txt` na raiz

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /server/
Disallow: /scripts/
Disallow: /tests/

Sitemap: https://xbrancox.github.io/votabrasil/sitemap.xml
```

**Prioridade**: 🔴 Alta

---

### 2. Structured Data (JSON-LD)

**Problema**: Poucas páginas têm structured data

**Impacto**: Menos rich snippets nos resultados do Google

**Solução**: Adicionar JSON-LD para:

#### a) Organization (página inicial)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MeuVoto",
  "url": "https://xbrancox.github.io/votabrasil",
  "logo": "https://xbrancox.github.io/votabrasil/icon.svg",
  "description": "Plataforma cívica de acompanhamento parlamentar",
  "sameAs": []
}
```

#### b) WebSite (página inicial)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "MeuVoto",
  "url": "https://xbrancox.github.io/votabrasil",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://xbrancox.github.io/votabrasil/pages/votacoes.html?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

#### c) GovernmentOrganization (páginas de parlamentares)
```json
{
  "@context": "https://schema.org",
  "@type": "GovernmentOrganization",
  "name": "Câmara dos Deputados",
  "url": "https://www.camara.leg.br"
}
```

#### d) Person (páginas de deputados)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Nome do Deputado",
  "jobTitle": "Deputado Federal",
  "worksFor": {
    "@type": "GovernmentOrganization",
    "name": "Câmara dos Deputados"
  },
  "memberOf": {
    "@type": "Organization",
    "name": "Partido"
  }
}
```

**Prioridade**: 🟡 Média

---

### 3. Hreflang Tags

**Problema**: Não há tags hreflang (mesmo que só tenha português)

**Impacto**: Menor clareza para Google sobre idioma

**Solução**: Adicionar em todas as páginas
```html
<link rel="alternate" hreflang="pt-BR" href="https://xbrancox.github.io/votabrasil/pages/votacoes.html">
<link rel="alternate" hreflang="x-default" href="https://xbrancox.github.io/votabrasil/pages/votacoes.html">
```

**Prioridade**: 🟢 Baixa

---

### 4. Breadcrumb Structured Data

**Problema**: Navegação estrutural não tem structured data

**Impacto**: Menos contexto nos resultados do Google

**Solução**: Adicionar JSON-LD para breadcrumbs
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://xbrancox.github.io/votabrasil"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Votações",
      "item": "https://xbrancox.github.io/votabrasil/pages/votacoes.html"
    }
  ]
}
```

**Prioridade**: 🟢 Baixa

---

### 5. Image Optimization

**Problema**: Algumas imagens não têm `width` e `height` definidos

**Impacto**: Cumulative Layout Shift (CLS) piora

**Solução**: Adicionar dimensões em todas as `<img>`
```html
<img src="..." alt="..." width="100" height="100" loading="lazy">
```

**Prioridade**: 🟡 Média

---

### 6. Internal Linking

**Problema**: Poucos links internos entre páginas relacionadas

**Impacto**: Menor autoridade distribuída

**Solução**: Adicionar links contextuais:
- Página de votação → link para deputado
- Página de deputado → link para votações relacionadas
- Página de cobrança → link para votação citada

**Prioridade**: 🟡 Média

---

## 🔧 AÇÕES RECOMENDADAS (Por Prioridade)

### Prioridade Alta (Fazer Agora)

1. **Criar robots.txt**
   ```bash
   # Criar arquivo robots.txt na raiz
   # Conteúdo: ver seção acima
   ```

2. **Submeter sitemap ao Google**
   - Google Search Console → Sitemaps → Adicionar `https://xbrancox.github.io/votabrasil/sitemap.xml`

3. **Submeter sitemap ao Bing**
   - Bing Webmaster Tools → Sitemaps → Adicionar URL

### Prioridade Média (Fazer em 1 Semana)

4. **Adicionar structured data JSON-LD**
   - Organization na página inicial
   - WebSite na página inicial
   - Person nas páginas de deputados
   - BreadcrumbList em todas as páginas

5. **Otimizar imagens**
   - Adicionar `width` e `height` em todas as `<img>`
   - Usar `loading="lazy"` em imagens abaixo da dobra

6. **Melhorar internal linking**
   - Adicionar links contextuais entre páginas relacionadas

### Prioridade Baixa (Fazer em 1 Mês)

7. **Adicionar hreflang tags**
   - Mesmo que só tenha português

8. **Criar blog**
   - Posts sobre transparência, democracia, etc.
   - Atrai tráfego orgânico

9. **Guest posting**
   - Escrever para blogs de política, tecnologia cívica
   - Gerar backlinks de qualidade

---

## 📈 MÉTRICAS DE SEO PARA MONITORAR

### Métricas Técnicas
- **Crawl errors**: Google Search Console
- **Index coverage**: Páginas indexadas vs. total
- **Core Web Vitals**: LCP, FID, CLS
- **Mobile usability**: Problemas de mobile

### Métricas de Tráfego
- **Organic sessions**: Visitas via busca orgânica
- **Keywords**: Palavras-chave que geram tráfego
- **CTR**: Click-through rate nos resultados
- **Bounce rate**: Taxa de rejeição

### Métricas de Conversão
- **Goal completions**: Votos, inscrições, cobranças
- **Conversion rate**: % de visitantes que convertem

---

## 🎯 KEYWORDS ALVO

### Keywords Principais
- "acompanhamento parlamentar"
- "votações câmara"
- "como votou deputado"
- "revogação de mandato"
- "transparência política"

### Keywords Long-tail
- "como acompanhar votações da câmara"
- "ver como meu deputado votou"
- "plataforma de cobrança de políticos"
- "app de acompanhamento parlamentar"

### Keywords Locais
- "deputados de [estado]"
- "votações [estado]"
- "políticos de [cidade]"

---

## 📝 NOTAS

- **Domínio atual**: `xbrancox.github.io/votabrasil` (subdomínio do GitHub)
- **Domínio futuro**: `voto.online` (disponível para compra)
- **Concorrência**: Atlas Político, Congresso Aberto, Excelências
- **Diferencial**: Foco em revogação, cobrança verificada, UX moderna

---

**Status do documento**: ✅ Completo
**Próxima revisão**: Após implementar ações de prioridade alta
