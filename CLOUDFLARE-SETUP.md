# Guia de Configuração do Cloudflare — VotaBrasil

Este guia descreve como configurar o Cloudflare para o deploy de produção do VotaBrasil, garantindo segurança, performance e confiabilidade.

## 1. Configuração Inicial do Cloudflare

### 1.1 Adicionar Domínio
1. Acesse o painel do Cloudflare: https://www.cloudflare.com/
2. Clique em "Add site" ou "Add domain"
3. Adicione `meu-voto.app` (ou seu domínio de produção)
4. Siga as instruções para atualizar os nameservers no seu registrador

### 1.2 Configuração de DNS
Registre os seguintes records no Cloudflare:

```
Type    Name                Value
A       @                   <IP do Railway>
CNAME   www                 <domínio do Railway>
TXT     @                   v=spf1 include:_spf.railway.app ~all
```

## 2. Configuração de Segurança

### 2.1 SSL/TLS
1. Acesse "SSL/TLS" no menu lateral
2. Ative "Always Use HTTPS"
3. Configure "Auto Certificates" para emitir certificados automaticamente
4. Habilite "Origin Server CA" se necessário

### 2.2 Firewall (WAF)
1. Acesse "Firewall" → "WAF"
2. Habilite o "Cloudflare Managed Ruleset"
3. Adicione regras customizadas:

```
# Bloquear tentativas de backup não autorizadas
Block if: http.request.uri.path contains "/api/admin/backup" and not http.request.headers["x-backup-token"]
```

### 2.3 Rate Limiting
Configure rate limiting no Cloudflare para proteger endpoints sensíveis:

```
# Limitar requisições para API de voto
Limit if: http.request.uri.path starts with "/api/voto" and http.request.count > 10 per 10s
```

## 3. Configuração de Performance

### 3.1 Caching
1. Acesse "Caching" → "Configuration"
2. Configure "Browser Cache TTL": 1 dia para assets estáticos
3. Habilite "Respect existing headers" para usar os headers do `_headers`

### 3.2 Auto Minify
1. Acesse "Speed" → "Optimization"
2. Habilite:
   - [ ] Minify JavaScript
   - [ ] Minify CSS
   - [ ] Minify HTML
   - [ ] Optimize images (Mirage)

### 3.3 Argo Smart Routing
1. Acesse "Traffic" → "Argo"
2. Habilite "Argo Smart Routing" para reduzir latência

## 4. Configuração de Origem (Railway)

### 4.1 Conectar Railway ao Cloudflare
1. No Railway, adicione um domínio personalizado:
   - Acesse Settings → Domains
   - Adicione `meu-voto.app` e `www.meu-voto.app`
2. No Cloudflare, atualize os records de DNS para apontar para os servidores do Railway

### 4.2 Configuração de Headers de Origem
Adicione no Railway (via `_headers` ou configuração do server):

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

## 5. Monitoramento e Logs

### 5.1 Health Checks
Configure health checks no Cloudflare para monitorar a saúde do serviço:

```
Name: VotaBrasil Health Check
URL: https://meu-voto.app/api/health
Interval: 60 seconds
Method: GET
```

### 5.2 Análise de Tráfego
1. Acesse "Analytics" → "Dashboard"
2. Monitore:
   - Total de requests
   - Taxa de erro
   - Tempo de resposta
   - Top IPs e geografia

## 6. Checklist de Deploy

- [ ] Domínio configurado no Cloudflare
- [ ] SSL/TLS ativo (Always Use HTTPS)
- [ ] DNS records corretos
- [ ] WAF habilitado
- [ ] Rate limiting configurado
- [ ] Auto minify habilitado
- [ ] Argo Smart Routing ativo
- [ ] Health checks configurados
- [ ] Logs de segurança habilitados
- [ ] Notificações de incidentes configuradas

## 7. Comandos Úteis

### 7.1 Verificar DNS
```bash
dig meu-voto.app
dig www.meu-voto.app
```

### 7.2 Verificar SSL
```bash
openssl s_client -connect meu-voto.app:443 -servername meu-voto.app
```

### 7.3 Testar Headers de Segurança
```bash
curl -I https://meu-voto.app
```

## 8. Suporte

- Documentação oficial: https://developers.cloudflare.com/
- Status do Cloudflare: https://status.cloudflare.com/
- Railway Support: https://railway.app/support