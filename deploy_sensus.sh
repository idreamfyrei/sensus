#!/bin/bash
set -e

echo "🚀 Starting Sensus Update..."

echo "📥 Pulling latest changes..."
git pull origin main

if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found! Please create it."
    exit 1
fi

echo "🏗️  Building new Docker images..."
docker compose -f docker-compose.prod.yml build

echo "🚢 Starting updated containers..."
docker compose -f docker-compose.prod.yml up -d

echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "⏳ Waiting for PostgreSQL to be healthy..."
sleep 15

echo "🗄️  Applying database migrations..."
docker compose -f docker-compose.prod.yml exec -T api node -e "require('child_process').execSync('pnpm db:migrate', { stdio: 'inherit' })"

echo "✅ Update completed successfully!"
