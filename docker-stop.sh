#!/bin/bash

# ============================================
# Docker Compose - Stop All Services
# ============================================

echo "🛑 Stopping Docker services..."
echo ""

cd "$(dirname "$0")"

docker compose down

echo ""
echo "✅ All Docker services stopped"
echo ""
echo "💡 To remove all data (including database):"
echo "   docker compose down -v"
echo ""
echo "💡 To remove images as well:"
echo "   docker compose down --rmi all"
echo ""



