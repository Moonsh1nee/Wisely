#!/bin/sh
set -e

mkdir -p /app/data

echo "Running database migrations..."
node_modules/.bin/prisma migrate deploy --config ./prisma.config.ts || true

exec node server.js
