# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ── Stage 2: Production ─────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# 直接從 builder 複製 node_modules（包含 Prisma client/engine），再 prune devDeps
COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev

COPY --from=builder /app/dist    ./dist
COPY                prisma       ./prisma
COPY                entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh && mkdir -p uploads

EXPOSE 3001
ENTRYPOINT ["./entrypoint.sh"]
