# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN NODE_ENV=development npm install --legacy-peer-deps --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN node_modules/.bin/nest build

# ── Stage 2: Production ─────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# 從 builder 直接複製所有產出物，不需要重跑 npm install
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY                prisma            ./prisma
COPY                entrypoint.sh     ./entrypoint.sh
RUN chmod +x entrypoint.sh && mkdir -p uploads

EXPOSE 3001
ENTRYPOINT ["./entrypoint.sh"]
