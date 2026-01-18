#!/bin/bash

# Lag-Llama Service Setup Script
# Sets up Python environment and installs dependencies

set -e

echo "🦙 Setting up Lag-Llama Service..."

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Python version: $PYTHON_VERSION"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Download Lag-Llama model (first time only)
echo "🔽 Downloading Lag-Llama model..."
python3 << 'EOF'
from transformers import AutoModelForCausalLM, AutoTokenizer
import os

model_name = "time-series-foundation-models/lag-llama"
cache_dir = os.path.expanduser("~/.cache/huggingface")

print(f"Downloading model to: {cache_dir}")

try:
    # This will download and cache the model
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        trust_remote_code=True,
        torch_dtype="auto"
    )
    print("✅ Model downloaded successfully!")
except Exception as e:
    print(f"⚠️  Model download failed (will retry on first API call): {e}")
EOF

# Create .env if not exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the service:"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "Or use the start script:"
echo "  ./start.sh"





