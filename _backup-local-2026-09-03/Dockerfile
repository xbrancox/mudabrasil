# MudaBrasil — Dockerfile simplificado para Railway
# Sem build stage, direto ao ponto
FROM node:22-alpine

WORKDIR /app

# Copia package.json e instala dependências (se houver)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copia TODO o código (incluindo server/ e index.html na raiz)
COPY . .

# Porta que o servidor escuta
EXPOSE 8080

# Comando de inicialização
CMD ["node", "server/index.js"]
