#!/bin/sh
set -e

mkdir -p /app/data

echo "Running database migrations..."
if ! node_modules/.bin/prisma migrate deploy --config ./prisma.config.ts; then
  echo "WARNING: migration failed, continuing to start server anyway" >&2
fi

exec node server.js
