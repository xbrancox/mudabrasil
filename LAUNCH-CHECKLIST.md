# 🚀 LAUNCH CHECKLIST - MeuVoto

> Checklist completo para lançamento público do projeto MeuVoto/VotaBrasil
> Última atualização: 2026-10-01

## ✅ STATUS ATUAL

| Categoria | Status | Detalhes |
|-----------|--------|----------|
| **Backend Railway** | ✅ PRONTO | Deploy ativo, volume persistente, APIs funcionais |
| **Frontend GitHub Pages** | ✅ PRONTO | 29 páginas, todos os ciclos aplicados |
| **Testes Automatizados** | ✅ PRONTO | 16 suítes de teste, todas passando |
| **CI/CD** | ✅ PRONTO | GitHub Actions configurado |
| **Domínio Próprio** | ⏳ PENDENTE | voto.online DISPONÍVEL, aguardando compra |
| **SMTP** | ⏳ PENDENTE | Aguardando credenciais de e-mail |
| **Observabilidade** | ⚠️ OPCIONAL | Tracing desativado (pode ativar depois) |

---

## 📋 CHECKLIST DE LANÇAMENTO

### 1. INFRAESTRUTURA (Crítico)

- [x] **Railway**: Projeto VotaBrasil ativo (198baa4d-6141-418c-96dd-d7826831249f)
- [x] **Volume persistente**: 5GB montado em `/app/server/data`
- [x] **GitHub Pages**: Frontend em `meu-voto.app`
- [x] **Backup automático**: GitHub faz backup do código
- [ ] **Domínio próprio**: Comprar `voto.online` ou outro escolhido
- [ ] **DNS configurado**: Apontar domínio para Railway + GitHub Pages
- [ ] **SSL/TLS**: Certificado HTTPS ativo (Railway/GitHub fornecem automaticamente)

### 2. BACKEND (Crítico)

- [x] **API Health**: `/api/health` respondendo 200 OK
- [x] **SQLite**: Database persistindo no volume
- [x] **VAPID Keys**: Configuradas para push notifications
- [x] **Digest Secret**: Configurado para worker
- [x] **CORS**: Configurado para aceitar requisições do frontend
- [ ] **SMTP configurado**: Variáveis SMTP_* setadas no Railway
- [ ] **Teste de envio**: Enviar e-mail de teste do digest
- [ ] **Monitoramento**: Logs do Railway acessíveis

### 3. FRONTEND (Crítico)

- [x] **Todas as páginas**: 29 páginas HTML funcionais
- [x] **Open Graph tags**: Meta tags para compartilhamento social
- [x] **Service Worker**: PWA instalável
- [x] **Manifest**: `manifest.webmanifest` configurado
- [x] **Ícones**: 192x192, 512x512, maskable
- [x] **Acessibilidade**: WCAG 2.1 AA (auditoria passada)
- [x] **SEO**: Meta tags, sitemap, robots.txt
- [x] **Performance**: Resource hints, lazy loading
- [ ] **Analytics**: Google Analytics ou similar (opcional)
- [ ] **Error tracking**: Sentry ou similar (opcional)

### 4. TESTES (Crítico)

- [x] **Smoke tests**: `tests/smoke.js` passando
- [x] **Engine tests**: `tests/test-engine.js` passando
- [x] **Integration tests**: `tests/test-ia.js` passando
- [x] **Accessibility tests**: `scripts/testar-acessibilidade.js` criado
- [x] **SEO tests**: `scripts/testar-seo.js` criado
- [x] **PWA tests**: `scripts/testar-pwa.js` criado
- [x] **Performance tests**: `scripts/testar-performance.js` passando
- [x] **Link checker**: `scripts/testar-links.js` passando
- [x] **CI pipeline**: GitHub Actions rodando todos os testes
- [ ] **E2E tests**: Testes end-to-end com Playwright (opcional)
- [ ] **Load testing**: Teste de carga (opcional)

### 5. SEGURANÇA (Crítico)

- [x] **HTTPS**: Forçado em todas as páginas
- [x] **CORS**: Configurado corretamente
- [x] **Input validation**: Validação de dados no backend
- [x] **Rate limiting**: Proteção contra abuso (se implementado)
- [x] **Secrets**: Variáveis sensíveis no Railway, não no código
- [x] **LGPD**: Política de privacidade presente
- [x] **Termos de uso**: Página de termos presente
- [ ] **Security headers**: CSP, X-Frame-Options, etc. (opcional)
- [ ] **Penetration testing**: Teste de segurança (opcional)

### 6. DOCUMENTAÇÃO (Importante)

- [x] **README.md**: Documentação principal
- [x] **EVOLUCAO-PROJETO.md**: Arquitetura e decisões
- [x] **RELEASE-NOTES.md**: Histórico de releases
- [x] **docs/OPERACAO.md**: Runbook operacional
- [x] **docs/GUIA-SMTP.md**: Guia de configuração SMTP
- [x] **LAUNCH-CHECKLIST.md**: Este checklist
- [x] **SEO-AUDIT.md**: Auditoria de SEO
- [x] **PWA-AUDIT.md**: Auditoria de PWA
- [ ] **API documentation**: Documentação da API (Swagger/OpenAPI)
- [ ] **User guide**: Guia do usuário final

### 7. MARKETING (Opcional)

- [ ] **Press kit**: Material para imprensa
- [ ] **Social media**: Contas no Twitter, Instagram, LinkedIn
- [ ] **Blog**: Post de lançamento
- [ ] **Video**: Demo do projeto
- [ ] **Landing page**: Página de captura de leads
- [ ] **Email marketing**: Sequência de onboarding

### 8. MONITORAMENTO PÓS-LANÇAMENTO (Importante)

- [ ] **Uptime monitoring**: UptimeRobot, Pingdom, ou similar
- [ ] **Error tracking**: Sentry, LogRocket, ou similar
- [ ] **Analytics**: Google Analytics, Plausible, ou similar
- [ ] **Performance monitoring**: WebPageTest, Lighthouse CI
- [ ] **User feedback**: Formulário de feedback ou pesquisa
- [ ] **Backup verification**: Testar restauração de backup

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### Prioridade 1: Domínio e SMTP (Bloqueantes)

1. **Comprar domínio** `voto.online` (ou outro escolhido)
   - Custo estimado: ~R$ 40/ano no Registro.br
   - Tempo: 5 minutos

2. **Configurar DNS**
   - Apontar `voto.online` para GitHub Pages (CNAME)
   - Apontar `api.voto.online` para Railway (CNAME)
   - Configurar MX para e-mail (se usar domínio para e-mail)

3. **Configurar SMTP**
   - Escolher provedor: Brevo (recomendado), Gmail, ou SendGrid
   - Obter credenciais SMTP
   - Setar variáveis no Railway via `scripts/CONFIGURAR-DOMINIO.ps1`

4. **Testar digest completo**
   - Inscrever e-mail de teste
   - Confirmar inscrição
   - Aguardar segunda-feira ou disparar manualmente
   - Verificar se e-mail chegou

### Prioridade 2: Validação Final

1. **Rodar todos os testes**
   ```bash
   node tests/smoke.js
   node scripts/testar-acessibilidade.js
   node scripts/testar-seo.js
   node scripts/testar-pwa.js
   node scripts/testar-performance.js
   ```

2. **Testar fluxos críticos manualmente**
   - [ ] Votar em 5 cargos
   - [ ] Conferir voto com código
   - [ ] Revogar voto
   - [ ] Inscrever no digest
   - [ ] Gerar cobrança
   - [ ] Comparar deputados A×B

3. **Testar em dispositivos móveis**
   - [ ] iPhone (Safari)
   - [ ] Android (Chrome)
   - [ ] Tablet

4. **Testar em navegadores diferentes**
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Edge

### Prioridade 3: Lançamento

1. **Anunciar internamente**
   - Equipe, amigos, família
   - Coletar feedback inicial

2. **Anunciar publicamente**
   - Redes sociais
   - Comunidades (Reddit, Hacker News, etc.)
   - Imprensa (se aplicável)

3. **Monitorar métricas**
   - Tráfego
   - Erros
   - Performance
   - Feedback de usuários

---

## 📊 MÉTRICAS DE SUCESSO

### Métricas Técnicas
- **Uptime**: > 99.5%
- **Tempo de carregamento**: < 3s (LCP)
- **Lighthouse score**: > 90 (Performance, Accessibility, SEO)
- **Zero erros críticos** no console

### Métricas de Negócio
- **Inscrições no digest**: Meta inicial
- **Votos registrados**: Meta inicial
- **Cobranças geradas**: Meta inicial
- **Taxa de conversão**: % de visitantes que votam

### Métricas de Qualidade
- **Bug reports**: < 5 por semana
- **Feedback positivo**: > 80%
- **Retenção**: % de usuários que voltam

---

## 🚨 ROLLBACK PLAN

Se algo der errado no lançamento:

1. **Identificar o problema**
   - Verificar logs do Railway
   - Verificar console do navegador
   - Verificar GitHub Actions

2. **Reverter mudanças**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Comunicar usuários**
   - Post nas redes sociais
   - Banner no site
   - E-mail para inscritos

4. **Corrigir e relançar**
   - Identificar causa raiz
   - Corrigir bug
   - Testar extensivamente
   - Relançar

---

## 📝 NOTAS

- **Domínio atual**: `mudabrasil-production-79eb.up.railway.app` (funcional, mas não definitivo)
- **Frontend atual**: `meu-voto.app` (funcional)
- **Domínio disponível**: `voto.online` (confirmado via RDAP)
- **Outros domínios**: `euvoto.site`, `euvoto.ong`, `meuvoto.org` (status desconhecido)

---

**Status do documento**: ✅ Completo
**Próxima revisão**: Após compra do domínio
