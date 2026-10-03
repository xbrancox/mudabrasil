#!/bin/bash
# Script de Deploy Automatizado - VotaBrasil
# Uso: ./deploy.sh [commit-message]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Verificar se há mudanças não commitadas
check_git_status() {
  print_info "Verificando status do Git..."
  
  if [[ -n $(git status --porcelain) ]]; then
    print_warning "Há mudanças não commitadas:"
    git status --short
    
    read -p "Deseja commitar todas as mudanças? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      COMMIT_MSG="${1:-Deploy: $(date '+%Y-%m-%d %H:%M:%S')}"
      git add .
      git commit -m "$COMMIT_MSG"
      print_success "Mudanças commitadas: $COMMIT_MSG"
    else
      print_error "Deploy cancelado. Commite as mudanças manualmente."
      exit 1
    fi
  else
    print_success "Working tree limpo"
  fi
}

# Verificar branch atual
check_branch() {
  BRANCH=$(git branch --show-current)
  print_info "Branch atual: $BRANCH"
  
  if [[ "$BRANCH" != "main" && "$BRANCH" != "master" ]]; then
    print_warning "Você não está na branch main/master"
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      print_error "Deploy cancelado"
      exit 1
    fi
  fi
}

# Push para GitHub
push_to_github() {
  print_info "Fazendo push para GitHub..."
  
  REMOTE=$(git remote get-url origin)
  print_info "Remote: $REMOTE"
  
  git push origin "$BRANCH"
  print_success "Push concluído"
}

# Verificar se Railway CLI está instalado
check_railway_cli() {
  if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI não está instalado"
    print_info "Instale com: npm install -g @railway/cli"
    print_info "Ou baixe em: https://railway.app/docs/cli"
    return 1
  fi
  
  print_success "Railway CLI detectado: $(railway --version)"
  return 0
}

# Deploy via Railway CLI
deploy_railway() {
  print_info "Iniciando deploy no Railway..."
  
  # Verificar se está autenticado
  if ! railway whoami &> /dev/null; then
    print_error "Não autenticado no Railway"
    print_info "Execute: railway login"
    exit 1
  fi
  
  # Listar projetos
  print_info "Projetos disponíveis:"
  railway projects
  
  # Deploy automático (Railway detecta push automaticamente)
  print_success "Deploy iniciado! O Railway detectará o push automaticamente."
  print_info "Acompanhe o deploy em: https://railway.app/dashboard"
}

# Verificar se o site está no ar
check_site_status() {
  print_info "Verificando status do site..."
  
  sleep 5
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://meu-voto.app/api/health)
  
  if [[ "$HTTP_CODE" == "200" ]]; then
    print_success "Site está no ar! (HTTP $HTTP_CODE)"
  else
    print_warning "Site retornou HTTP $HTTP_CODE"
    print_info "Verifique os logs no Railway"
  fi
}

# Limpar cache do Cloudflare (se configurado)
clear_cloudflare_cache() {
  print_info "Purge do cache Cloudflare..."
  
  # Verificar se há configuração do Cloudflare
  if [[ -f ".cloudflare.env" ]]; then
    source .cloudflare.env
    
    if [[ -n "$CF_ZONE_ID" && -n "$CF_API_TOKEN" ]]; then
      curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CF_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}'
      
      print_success "Cache Cloudflare limpo"
    else
      print_warning "Cloudflare não configurado"
    fi
  else
    print_info "Cloudflare não configurado (crie .cloudflare.env se necessário)"
  fi
}

# Mostrar resumo final
show_summary() {
  echo ""
  echo "========================================="
  echo -e "${GREEN}🚀 DEPLOY CONCLUÍDO!${NC}"
  echo "========================================="
  echo ""
  echo "📊 Acompanhe o deploy:"
  echo "   Railway: https://railway.app/dashboard"
  echo ""
  echo "🌐 Site:"
  echo "   https://meu-voto.app"
  echo ""
  echo "📈 Analytics:"
  echo "   GA4: https://analytics.google.com/"
  echo "   Clarity: https://clarity.microsoft.com/"
  echo ""
  echo "📝 Logs:"
  echo "   railway logs"
  echo ""
  echo "========================================="
}

# Função principal
main() {
  echo ""
  echo "========================================="
  echo -e "${BLUE}🚀 Deploy VotaBrasil${NC}"
  echo "========================================="
  echo ""
  
  COMMIT_MSG="${1:-Deploy: $(date '+%Y-%m-%d %H:%M:%S')}"
  
  # Etapas do deploy
  check_branch
  check_git_status "$COMMIT_MSG"
  push_to_github
  
  # Railway CLI (opcional)
  if check_railway_cli; then
    deploy_railway
  else
    print_info "Deploy será feito automaticamente pelo Railway"
  fi
  
  # Verificações finais
  check_site_status
  clear_cloudflare_cache
  
  # Resumo
  show_summary
}

# Executar
main "$@"
