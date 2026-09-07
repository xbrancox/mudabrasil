# ============================================================
# MudaBrasil — Dockerfile para Railway (Fase 2)
# Node 22-alpine para suporte nativo a node:sqlite (>=22.13)
# Servidor HTTP puro (sem Express) na porta 8080
# ============================================================

FROM node:22-alpine AS build

WORKDIR /app

# Copia apenas package.json primeiro para aproveitar cache de layers
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ============================================================
FROM node:22-alpine

WORKDIR /app

# Copia node_modules do build stage
COPY --from=build /app/node_modules ./node_modules

# Copia código da aplicação
COPY . .

# Expõe a porta usada pelo servidor (Railway define PORT, fallback 8080)
EXPOSE 8080

# Inicia o servidor
CMD ["node", "server/index.js"]
