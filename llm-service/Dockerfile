# Dockerfile for Chronos Time Series Service (Amazon's Chronos Model)
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy download script
COPY download_model.py .

# 🔥 PRE-DOWNLOAD CHRONOS MODEL DURING BUILD
# Amazon Chronos: Fast, reliable, production-ready
RUN echo "===========================================" && \
    echo "⏰ DOWNLOADING AMAZON CHRONOS MODEL..." && \
    echo "This will take 2-10 minutes" && \
    echo "Size: ~200-500 MB" && \
    echo "===========================================" && \
    python download_model.py || echo "⚠️  Download failed, will retry at runtime"

# Copy application code
COPY app.py .

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/root/.cache/huggingface
ENV CHRONOS_MODEL_SIZE=small

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the Chronos service
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

