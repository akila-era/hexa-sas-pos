#!/bin/sh
set -e

echo "🚀 Starting backend container..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Try to run migrations, but don't fail if database is not empty
echo "🔄 Running database migrations..."
npx prisma migrate deploy 2>/dev/null || {
  echo "⚠️  Migration deploy failed, trying db push..."
  npx prisma db push --accept-data-loss --skip-generate 2>/dev/null || {
    echo "⚠️  Database push failed, continuing anyway..."
  }
}

# Start the application
echo "✅ Starting application..."
exec "$@"

