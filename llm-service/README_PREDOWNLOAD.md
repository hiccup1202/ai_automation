# Pre-Download Lag-Llama Model

This guide shows how to download the Lag-Llama model **during Docker build** instead of on first API call.

## Why Pre-Download?

**Without pre-download (current):**
- ❌ Model downloads on first `/predict` call
- ❌ First prediction takes 30 min - 4 hours
- ❌ Unpredictable behavior

**With pre-download (this approach):**
- ✅ Model downloads once during `docker compose build`
- ✅ First prediction is fast (uses cached model)
- ✅ Predictable behavior

## How to Use

### Option 1: Build with Pre-Download (Recommended for Production)

```bash
# 1. Use the pre-download Dockerfile
cd llm-service
cp Dockerfile.predownload Dockerfile

# 2. Build the image (this will download the model - takes 1-4 hours!)
sudo docker compose build llm-service

# 3. Start the container (fast, model already downloaded)
sudo docker compose up -d llm-service

# 4. Test - first prediction will be FAST!
curl -X POST http://localhost:3000/predictions/train-all-models
```

### Option 2: Download Manually (More Control)

```bash
# 1. Start container without pre-download
sudo docker compose up -d llm-service

# 2. Manually run download inside container
sudo docker exec -it inventory_llm python download_model.py

# 3. Restart container to use cached model
sudo docker restart inventory_llm

# 4. Test predictions
curl -X POST http://localhost:3000/predictions/train-all-models
```

### Option 3: Use Simplified Statistical Model (Fastest for POC)

```bash
# Use app_simple.py instead (no model download needed!)
# See main README.md for instructions
```

## Persistence

The model cache is stored in a Docker volume:

```yaml
# In docker-compose.yml
volumes:
  llm_cache:
    driver: local

services:
  llm-service:
    volumes:
      - llm_cache:/root/.cache/huggingface
```

This means:
- ✅ Model persists across container restarts
- ✅ Model survives `docker compose down`
- ❌ Model deleted with `docker compose down -v` (volumes flag)

## Requirements

**For Real Lag-Llama:**
- 📡 Internet connection (for initial download)
- 💾 10+ GB disk space
- 💾 8-16 GB RAM
- ⏱️  1-4 hours download time
- ⚡ GPU recommended (but CPU works)

## Troubleshooting

**Build fails during download:**
```bash
# The build won't fail completely, but check logs:
sudo docker logs inventory_llm

# Try manual download after container starts:
sudo docker exec inventory_llm python download_model.py
```

**Model cache not persisting:**
```bash
# Check if volume exists:
sudo docker volume ls | grep llm_cache

# Inspect volume:
sudo docker volume inspect ai_automation_llm_cache
```

**Out of disk space:**
```bash
# Clean up Docker to free space:
sudo docker system prune -a
sudo docker volume prune
```

## What Gets Downloaded?

- **Model name:** `time-series-foundation-models/lag-llama`
- **Source:** Hugging Face
- **Size:** 2-5 GB
- **Files:** Model weights, config, tokenizer
- **Location:** `/root/.cache/huggingface/` in container
- **Persisted in:** `llm_cache` Docker volume

