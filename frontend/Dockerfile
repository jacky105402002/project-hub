# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .
RUN npm run build

# ── Stage 2: Nginx ──────────────────────────────────────
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# 放到 /etc/nginx/templates/ 目錄，Nginx 啟動時會自動 envsubst 並輸出至 conf.d
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
