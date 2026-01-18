#!/bin/bash

# Start All Services for AI Inventory Automation
# - MySQL (Docker)
# - Lag-Llama LLM Service (Python)
# - Backend (NestJS)
# - Frontend (Next.js)

set -e

echo "🚀 Starting AI Inventory Automation System"
echo "=========================================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i:"$1" >/dev/null 2>&1
}

# 1. Start MySQL (Docker)
echo "1️⃣  Starting MySQL..."
if docker ps | grep -q inventory_mysql; then
    echo "   ✅ MySQL already running"
else
    docker-compose up -d mysql
    echo "   ⏳ Waiting for MySQL to be ready..."
    sleep 10
    echo "   ✅ MySQL started"
fi
echo ""

# 2. Start Lag-Llama Service (Python)
echo "2️⃣  Starting Lag-Llama LLM Service..."
if port_in_use 8000; then
    echo "   ✅ Lag-Llama service already running on port 8000"
else
    cd llm-service
    if [ ! -d "venv" ]; then
        echo "   ⚠️  Virtual environment not found. Running setup..."
        ./setup.sh
    fi
    
    echo "   🦙 Starting Lag-Llama service in background..."
    nohup ./start.sh > ../logs/llm-service.log 2>&1 &
    echo $! > ../logs/llm-service.pid
    cd ..
    
    echo "   ⏳ Waiting for service to start..."
    sleep 5
    
    if port_in_use 8000; then
        echo "   ✅ Lag-Llama service started (PID: $(cat logs/llm-service.pid))"
    else
        echo "   ⚠️  Lag-Llama service may have failed to start. Check logs/llm-service.log"
    fi
fi
echo ""

# 3. Start Backend (NestJS)
echo "3️⃣  Starting Backend (NestJS)..."
if port_in_use 3000; then
    echo "   ✅ Backend already running on port 3000"
else
    cd backend
    
    if [ ! -d "node_modules" ]; then
        echo "   📦 Installing dependencies..."
        npm install
    fi
    
    echo "   🔧 Starting backend in background..."
    nohup npm run start:dev > ../logs/backend.log 2>&1 &
    echo $! > ../logs/backend.pid
    cd ..
    
    echo "   ⏳ Waiting for backend to start..."
    sleep 10
    
    if port_in_use 3000; then
        echo "   ✅ Backend started (PID: $(cat logs/backend.pid))"
    else
        echo "   ⚠️  Backend may have failed to start. Check logs/backend.log"
    fi
fi
echo ""

# 4. Start Frontend (Next.js)
echo "4️⃣  Starting Frontend (Next.js)..."
if port_in_use 3001; then
    echo "   ✅ Frontend already running on port 3001"
else
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        echo "   📦 Installing dependencies..."
        npm install
    fi
    
    echo "   🎨 Starting frontend in background..."
    nohup npm run dev > ../logs/frontend.log 2>&1 &
    echo $! > ../logs/frontend.pid
    cd ..
    
    echo "   ⏳ Waiting for frontend to start..."
    sleep 10
    
    if port_in_use 3001; then
        echo "   ✅ Frontend started (PID: $(cat logs/frontend.pid))"
    else
        echo "   ⚠️  Frontend may have failed to start. Check logs/frontend.log"
    fi
fi
echo ""

# Summary
echo "=========================================="
echo "✅ All services started!"
echo ""
echo "📊 Service Status:"
echo "   MySQL:        http://localhost:3307"
echo "   Lag-Llama:    http://localhost:8000"
echo "   Backend API:  http://localhost:3000"
echo "   Frontend:     http://localhost:3001"
echo ""
echo "📝 Logs:"
echo "   Lag-Llama:    logs/llm-service.log"
echo "   Backend:      logs/backend.log"
echo "   Frontend:     logs/frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "   ./stop-all.sh"
echo ""





