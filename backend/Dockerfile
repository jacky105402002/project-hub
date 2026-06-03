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

COPY package*.json ./
RUN npm ci --omit=dev

# Prisma 執行期所需的 client / engine
COPY --from=builder /app/node_modules/.prisma        ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY --from=builder /app/dist    ./dist
COPY                prisma       ./prisma
COPY                entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh && mkdir -p uploads

EXPOSE 3001
ENTRYPOINT ["./entrypoint.sh"]
