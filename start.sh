#!/bin/bash

# AI-Based Smart Inventory Automation System - Quick Start Script
# This starts only MySQL in Docker. Run backend and frontend locally.

echo "=================================================="
echo "🚀 AI Inventory Automation System - Quick Start"
echo "=================================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed"
    echo "Please install Docker Compose or use Docker Desktop which includes it"
    exit 1
fi

echo "✅ Docker is installed"
echo "✅ Docker Compose is installed"
echo ""

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker daemon is not running"
    echo "Please start Docker Desktop or Docker daemon"
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null

echo ""
echo "🔨 Starting MySQL database..."
echo ""

# Start MySQL
docker-compose up -d

# Wait for MySQL to be ready
echo ""
echo "⏳ Waiting for MySQL to start..."
sleep 5

# Check MySQL
echo "Checking MySQL..."
for i in {1..30}; do
    if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -prootpassword &> /dev/null; then
        echo "✅ MySQL is ready"
        break
    fi
    echo "Waiting for MySQL... ($i/30)"
    sleep 2
done

echo ""
echo "=================================================="
echo "✨ MySQL Database is ready! ✨"
echo "=================================================="
echo ""
echo "📦 Database Connection:"
echo "   Host:     localhost"
echo "   Port:     3306"
echo "   Database: inventory_db"
echo "   User:     inventory_user"
echo "   Password: inventory_password"
echo ""
echo "🚀 Next Steps - Run Backend and Frontend Locally:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend"
echo "   cp .env.example .env  # First time only"
echo "   npm install           # First time only"
echo "   npm run start:dev"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd frontend"
echo "   cp .env.example .env  # First time only"
echo "   npm install           # First time only"
echo "   npm run dev"
echo ""
echo "📱 Once running, access:"
echo "   Backend API: http://localhost:3000"
echo "   API Docs:    http://localhost:3000/api"
echo "   Frontend:    http://localhost:3000 (or 3001)"
echo ""
echo "📖 Documentation:"
echo "   DEVELOPMENT.md - Local development guide"
echo "   README.md      - Complete documentation"
echo ""
echo "🛠️  Useful Commands:"
echo "   MySQL logs:    docker-compose logs -f mysql"
echo "   Stop MySQL:    docker-compose down"
echo "   Reset data:    docker-compose down -v"
echo ""
echo "=================================================="

