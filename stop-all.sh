#!/bin/bash

# Stop All Services

echo "🛑 Stopping all services..."
echo ""

# Stop Frontend
if [ -f "logs/frontend.pid" ]; then
    PID=$(cat logs/frontend.pid)
    if ps -p $PID > /dev/null; then
        echo "Stopping Frontend (PID: $PID)..."
        kill $PID
        rm logs/frontend.pid
    fi
fi

# Stop Backend
if [ -f "logs/backend.pid" ]; then
    PID=$(cat logs/backend.pid)
    if ps -p $PID > /dev/null; then
        echo "Stopping Backend (PID: $PID)..."
        kill $PID
        rm logs/backend.pid
    fi
fi

# Stop Lag-Llama Service
if [ -f "logs/llm-service.pid" ]; then
    PID=$(cat logs/llm-service.pid)
    if ps -p $PID > /dev/null; then
        echo "Stopping Lag-Llama Service (PID: $PID)..."
        kill $PID
        rm logs/llm-service.pid
    fi
fi

# Stop MySQL (Docker)
echo "Stopping MySQL..."
docker-compose down

echo ""
echo "✅ All services stopped"






