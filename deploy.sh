#!/bin/bash
set -e

echo "🚀 Deploying Chatie with full security"

# Check for required files
if [ ! -f "./backend/.env.production" ]; then
    echo "❌ Missing backend/.env.production file"
    exit 1
fi

if [ ! -f "./ssl/cert.pem" ] || [ ! -f "./ssl/privkey.pem" ]; then
    echo "❌ Missing SSL certificates in ./ssl/"
    exit 1
fi

# Build and start
echo "📦 Building Docker images..."
docker-compose build --no-cache

echo "🔒 Running security checks..."
docker run --rm -v $(pwd):/app aquasec/trivy image --severity HIGH,CRITICAL chatie-backend:latest

echo "🚀 Starting services..."
docker-compose up -d

echo "✅ Deployment complete!"
echo "📝 Check logs with: docker-compose logs -f"
