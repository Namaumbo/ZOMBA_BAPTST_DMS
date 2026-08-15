#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is required." >&2
  echo "Example:" >&2
  echo "  docker run -p 5000:5000 \\" >&2
  echo "    -e DATABASE_URL=postgresql://postgres:postgres@db:5432/church_dms \\" >&2
  echo "    -e SECRET_KEY=your-secret-key \\" >&2
  echo "    -e JWT_SECRET_KEY=your-jwt-secret \\" >&2
  echo "    zbc-backend" >&2
  exit 1
fi

exec gunicorn \
  --bind "0.0.0.0:${PORT:-5000}" \
  --workers "${WEB_CONCURRENCY:-4}" \
  --threads 2 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  wsgi:app
