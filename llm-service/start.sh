#!/bin/bash

# Start Lag-Llama Service

set -e

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Run ./setup.sh first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "🦙 Starting Lag-Llama Service..."
echo "   Port: ${LLM_SERVICE_PORT:-8000}"
echo "   Device: ${DEVICE:-cpu}"
echo ""

# Start the service
python app.py






