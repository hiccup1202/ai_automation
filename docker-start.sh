#!/bin/bash

# ============================================
# Docker Compose - Start All Services
# ============================================

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║         🐳 STARTING AI INVENTORY WITH DOCKER                        ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

echo "📋 Pre-flight checks..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "   Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available!"
    echo "   Please install Docker Compose v2+"
    exit 1
fi

echo "✅ Docker: $(docker --version)"
echo "✅ Docker Compose: $(docker compose version)"
echo ""

# Stop any existing services
echo "🛑 Stopping existing services..."
./stop-all.sh 2>/dev/null || true
docker compose down 2>/dev/null || true
echo ""

# Build images
echo "🔨 Building Docker images..."
echo "   (First build may take 15-30 minutes to download dependencies)"
echo ""
docker compose build --no-cache

echo ""
echo "🚀 Starting services..."
echo ""

# Start services
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
echo ""

# Wait for services
MAX_WAIT=120
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    MYSQL_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' inventory_mysql 2>/dev/null || echo "starting")
    LLM_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' inventory_llm 2>/dev/null || echo "starting")
    BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' inventory_backend 2>/dev/null || echo "starting")
    FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' inventory_frontend 2>/dev/null || echo "starting")
    
    echo "   MySQL: $MYSQL_HEALTH | LLM: $LLM_HEALTH | Backend: $BACKEND_HEALTH | Frontend: $FRONTEND_HEALTH"
    
    if [ "$MYSQL_HEALTH" = "healthy" ] && \
       [ "$LLM_HEALTH" = "healthy" ] && \
       [ "$BACKEND_HEALTH" = "healthy" ] && \
       [ "$FRONTEND_HEALTH" = "healthy" ]; then
        echo ""
        echo "✅ All services are healthy!"
        break
    fi
    
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo ""
    echo "⚠️  Warning: Some services may not be fully ready yet."
    echo "   Check logs: docker compose logs"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║                  ✅ ALL SERVICES RUNNING                            ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Service URLs:"
echo "   🗄️  MySQL:        localhost:3307"
echo "   🦙 Lag-Llama:    http://localhost:8000"
echo "   🔧 Backend API:  http://localhost:3000"
echo "   🎨 Frontend:     http://localhost:3001"
echo "   📚 API Docs:     http://localhost:3000/api"
echo ""
echo "🔍 Useful Commands:"
echo "   View logs:       docker compose logs -f"
echo "   View status:     docker compose ps"
echo "   Stop services:   docker compose down"
echo "   Restart:         docker compose restart"
echo ""
echo "🛑 To stop all services:"
echo "   ./docker-stop.sh"
echo "   or: docker compose down"
echo ""



