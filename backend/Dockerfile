# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund && \
    ls node_modules/.bin/nest || (echo "ERROR: nest CLI not found!" && exit 1)

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
