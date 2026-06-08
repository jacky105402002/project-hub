#!/bin/sh
set -e

echo "Syncing Prisma schema (db push)..."
npx prisma db push --skip-generate

echo "Starting NestJS server..."
exec node dist/main.js
