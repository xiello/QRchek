#!/bin/bash
# Run database migration with Railway DATABASE_URL
# Usage: DATABASE_URL="your-railway-database-url" ./run-migration.sh

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is required"
  echo ""
  echo "Usage:"
  echo "  DATABASE_URL='postgresql://...' ./run-migration.sh"
  echo ""
  echo "Get your DATABASE_URL from Railway:"
  echo "  1. Go to your Postgres service in Railway"
  echo "  2. Click 'Variables' tab"
  echo "  3. Copy the DATABASE_URL value"
  exit 1
fi

echo "Running migration with DATABASE_URL..."
cd server
DATABASE_URL="$DATABASE_URL" npm run migrate

