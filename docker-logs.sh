#!/bin/bash

# ============================================
# Docker Compose - View Logs
# ============================================

cd "$(dirname "$0")"

if [ -z "$1" ]; then
    echo "📋 Viewing logs for all services..."
    echo "   Press Ctrl+C to stop"
    echo ""
    docker compose logs -f
else
    echo "📋 Viewing logs for: $1"
    echo "   Press Ctrl+C to stop"
    echo ""
    docker compose logs -f "$1"
fi




