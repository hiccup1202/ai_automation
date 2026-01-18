#!/bin/bash

# AI-Based Smart Inventory Automation System - Stop Script

echo "=================================================="
echo "🛑 Stopping AI Inventory Automation System"
echo "=================================================="
echo ""

# Stop all services
echo "Stopping services..."
docker-compose down

echo ""
echo "✅ All services stopped"
echo ""
echo "To restart the system, run: ./start.sh"
echo "To remove all data, run: docker-compose down -v"
echo ""









