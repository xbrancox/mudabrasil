# 📊 Guia de Configuração de Analytics - VotaBrasil

## 🎯 Visão Geral

Este guia explica como configurar os sistemas de analytics da plataforma para monitorar tráfego, comportamento dos usuários e performance.

**Arquivo Principal:** `js/analytics.js`

---

## 🔧 Opções de Analytics Disponíveis

### 1. Google Analytics 4 (GA4) - **Recomendado**

**Vantagens:**
- ✅ Gratuito e completo
- ✅ Integração com Google Ads e Search Console
- ✅ Relatórios avançados de conversão
- ✅ Suporte a eventos customizados

**Desvantagens:**
- ⚠️ Usa cookies (requer banner de consentimento LGPD)
- ⚠️ Dados armazenados fora do Brasil (Google Cloud)

### 2. Plausible Analytics - **Privacy-First**

**Vantagens:**
- ✅ Sem cookies (LGPD compliant por padrão)
- ✅ Dashboard simples e rápido
- ✅ Dados armazenados na EU
- ✅ Open source

**Desvantagens:**
- ⚠️ Pago (a partir de $9/mês)
- ⚠️ Menos recursos que GA4

### 3. Microsoft Clarity - **Heatmaps & Session Recording**

**Vantagens:**
- ✅ Gratuito e ilimitado
- ✅ Heatmaps de cliques e scroll
- ✅ Gravação de sessões de usuários
- ✅ Identifica erros de UX

**Desvantagens:**
- ⚠️ Focado apenas em UX (não substitui GA4/Plausible)
- ⚠️ Dados armazenados pela Microsoft

---

## 🚀 Configuração Passo a Passo

### Opção A: Google Analytics 4 (GA4)

#### 1. Criar Conta GA4

1. Acesse: https://analytics.google.com/
2. Clique em **"Admin"** > **"Create Property"**
3. Configure:
   - **Property Name:** `MeuVoto`
   - **Reporting Time Zone:** `Brazil`
   - **Currency:** `Brazilian Real (R$)`
4. Selecione **"Web"** como plataforma
5. Configure:
   - **Website Name:** `MeuVoto`
   - **Website URL:** `https://meu-voto.app`
   - **Industry:** `Government & Politics`
6. Clique em **"Create Stream"**
7. **Copie o Measurement ID** (formato: `G-XXXXXXXXXX`)

#### 2. Configurar no Código

Edite `js/analytics.js`:

```javascript
const CONFIG = {
  GA4_ID: 'G-XXXXXXXXXX',  // ← Cole seu ID aqui
  ENABLE_GA4: true,        // ← Mude para true
  // ... outras configurações ...
};
```

#### 3. Configurar Eventos Customizados

O GA4 já está configurado para rastrear automaticamente:
- ✅ Page views
- ✅ Scrolls
- ✅ Cliques em links externos
- ✅ Downloads de arquivos
- ✅ Buscas no site

**Eventos Customizados da Plataforma:**

```javascript
// Voto registrado
trackEvent('vote_cast', {
  politician_id: '12345',
  vote_type: 'trust',
  page: '/parlamentares'
});

// Busca realizada
trackEvent('search_performed', {
  query: 'deputado são paulo',
  results_count: 42
});

// Comprovante baixado
trackEvent('receipt_downloaded', {
  politician_id: '12345',
  vote_code: 'A3F9-K2MN'
});

// Compartilhamento
trackEvent('content_shared', {
  platform: 'whatsapp',
  content_type: 'politician_profile'
});
```

#### 4. Configurar Conversões

No GA4, vá em **"Configure"** > **"Events"** e marque como conversão:
- `vote_cast` (voto registrado)
- `receipt_downloaded` (comprovante baixado)
- `newsletter_signup` (inscrição na newsletter)

---

### Opção B: Plausible Analytics

#### 1. Criar Conta Plausible

1. Acesse: https://plausible.io/
2. Clique em **"Start Free Trial"**
3. Configure:
   - **Domain:** `meu-voto.app`
   - **Timezone:** `America/Sao_Paulo`
4. **Copie o código de tracking**

#### 2. Configurar no Código

Edite `js/analytics.js`:

```javascript
const CONFIG = {
  PLAUSIBLE_DOMAIN: 'meu-voto.app',
  ENABLE_PLAUSIBLE: true,  // ← Mude para true
  // ... outras configurações ...
};
```

#### 3. Configurar Goals (Metas)

No Plausible, vá em **"Settings"** > **"Goals"** e adicione:
- `vote_cast`
- `receipt_downloaded`
- `newsletter_signup`

---

### Opção C: Microsoft Clarity

#### 1. Criar Projeto Clarity

1. Acesse: https://clarity.microsoft.com/
2. Clique em **"New Project"**
3. Configure:
   - **Project Name:** `MeuVoto`
   - **Website URL:** `https://meu-voto.app`
4. **Copie o Project ID** (formato: `xxxxxxxxxx`)

#### 2. Configurar no Código

Edite `js/analytics.js`:

```javascript
const CONFIG = {
  CLARITY_ID: 'xxxxxxxxxx',  // ← Cole seu ID aqui
  ENABLE_CLARITY: true,      // ← Mude para true
  // ... outras configurações ...
};
```

#### 3. Configurar Filtros

No Clarity, vá em **"Settings"** > **"Filters"** e adicione:
- **IP Filter:** Seu IP (para não gravar suas próprias sessões)
- **URL Filter:** `/admin/*` (para não gravar painel admin)

---

## 🎛️ Recomendação: Stack Completo

Para máxima visibilidade, use **GA4 + Clarity** juntos:

```javascript
const CONFIG = {
  GA4_ID: 'G-XXXXXXXXXX',
  CLARITY_ID: 'xxxxxxxxxx',
  ENABLE_GA4: true,
  ENABLE_CLARITY: true,
  // ... outras configurações ...
};
```

**Por que essa combinação?**
- **GA4:** Métricas quantitativas (quantos usuários, de onde vêm, o que fazem)
- **Clarity:** Insights qualitativos (como os usuários interagem, onde clicam, onde travam)

---

## 📈 Métricas Importantes para Monitorar

### KPIs de Engajamento

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Usuários Únicos Diários** | 1.000+ | GA4 > Reports > Acquisition |
| **Taxa de Rejeição** | < 40% | GA4 > Reports > Engagement |
| **Tempo Médio na Página** | > 3 min | GA4 > Reports > Engagement |
| **Votos Registrados/Dia** | 100+ | GA4 > Events > vote_cast |
| **Comprovantes Baixados** | 50+ | GA4 > Events > receipt_downloaded |

### KPIs de Performance

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Largest Contentful Paint (LCP)** | < 2.5s | GA4 > Reports > Engagement > Page performance |
| **First Input Delay (FID)** | < 100ms | GA4 > Reports > Engagement > Page performance |
| **Cumulative Layout Shift (CLS)** | < 0.1 | GA4 > Reports > Engagement > Page performance |

### KPIs de Conversão

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Taxa de Voto** | > 5% | (Votos / Usuários Únicos) × 100 |
| **Taxa de Compartilhamento** | > 2% | (Compartilhamentos / Usuários) × 100 |
| **Taxa de Inscrição Newsletter** | > 1% | (Inscrições / Visitantes) × 100 |

---

## 🔒 LGPD e Consentimento

### Banner de Cookies (Obrigatório para GA4)

Adicione ao `index.html` antes do `</body>`:

```html
<!-- Cookie Consent Banner -->
<div id="cookie-banner" style="
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1a1a1a;
  color: #fff;
  padding: 20px;
  z-index: 9999;
  display: none;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
">
  <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
    <p style="margin: 0; flex: 1; min-width: 300px;">
      🍪 Usamos cookies para melhorar sua experiência e analisar o tráfego do site. 
      <a href="/privacidade.html" style="color: #FFD700; text-decoration: underline;">Política de Privacidade</a>
    </p>
    <div style="display: flex; gap: 10px;">
      <button onclick="acceptCookies()" style="
        background: #FFD700;
        color: #1a1a1a;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
      ">Aceitar</button>
      <button onclick="rejectCookies()" style="
        background: transparent;
        color: #fff;
        border: 1px solid #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
      ">Rejeitar</button>
    </div>
  </div>
</div>

<script>
// Mostrar banner se não houver consentimento
if (!localStorage.getItem('cookie_consent')) {
  document.getElementById('cookie-banner').style.display = 'block';
}

function acceptCookies() {
  localStorage.setItem('cookie_consent', 'accepted');
  document.getElementById('cookie-banner').style.display = 'none';
  // Carregar analytics
  if (window.gtag) {
    gtag('config', 'G-XXXXXXXXXX', { 'anonymize_ip': true });
  }
}

function rejectCookies() {
  localStorage.setItem('cookie_consent', 'rejected');
  document.getElementById('cookie-banner').style.display = 'none';
  // Analytics não será carregado
}
</script>
```

---

## 🧪 Testando a Configuração

### 1. Verificar se o Analytics Está Carregando

Abra o console do navegador (F12) e procure por:

```
[Analytics] GA4 carregado: G-XXXXXXXXXX
[Analytics] Clarity carregado: xxxxxxxxxx
```

### 2. Testar Eventos Customizados

No console, execute:

```javascript
trackEvent('test_event', { test: 'value' });
```

Verifique no GA4:
- **Reports** > **Realtime** > Deve aparecer o evento `test_event`

### 3. Verificar no Clarity

Acesse https://clarity.microsoft.com/ e:
- Vá em **"Recordings"**
- Sua sessão deve aparecer em alguns minutos
- Clique para ver a gravação

---

## 📊 Dashboard Personalizado

### GA4: Criar Dashboard Customizado

1. Vá em **"Explore"** > **"Blank"**
2. Adicione as seguintes métricas:
   - **Usuários Ativos** (últimos 7 dias)
   - **Eventos: vote_cast** (por dia)
   - **Eventos: receipt_downloaded** (por dia)
   - **Taxa de Rejeição** (por página)
3. Salve como **"MeuVoto Dashboard"**

### Plausible: Dashboard Já Vem Pronto

O Plausible já fornece um dashboard completo em:
- https://plausible.io/meu-voto.app

---

## 🚨 Troubleshooting

### Analytics Não Está Carregando

**Problema:** Mensagem `[Analytics] Do Not Track ativado` no console

**Solução:** 
- Desative o "Do Not Track" nas configurações do navegador
- Ou use Plausible (respeita DNT mas ainda coleta dados anonimizados)

### Eventos Não Aparecem no GA4

**Problema:** Eventos customizados não aparecem nos relatórios

**Solução:**
1. Aguarde 24-48 horas (GA4 tem delay)
2. Verifique em **Reports** > **Realtime** (aparece imediatamente)
3. Confirme que o evento foi registrado: **DebugView** (em Configure > DebugView)

### Clarity Não Está Gravando

**Problema:** Nenhuma gravação aparece no Clarity

**Solução:**
1. Verifique se o Clarity ID está correto
2. Confirme que o domínio está correto em **Settings** > **Sites**
3. Aguarde 5-10 minutos (Clarity tem delay)
4. Verifique se não há filtros bloqueando seu IP

---

## 📞 Suporte

- **GA4 Help:** https://support.google.com/analytics/
- **Plausible Docs:** https://plausible.io/docs
- **Clarity Docs:** https://docs.microsoft.com/en-us/clarity/

---

**Última atualização:** 03/10/2026  
**Versão:** 1.0
