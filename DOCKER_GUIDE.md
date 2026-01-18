# 🐳 Docker Deployment Guide

Complete guide for running the AI Inventory Automation System with Docker.

---

## 📋 Prerequisites

- **Docker**: v20.10 or higher
- **Docker Compose**: v2.0 or higher
- **Disk Space**: 5-8 GB free (for images and model cache)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Internet**: For initial build (downloads 2-3 GB)

### Install Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Check Installation:**
```bash
docker --version
docker compose version
```

---

## 🚀 Quick Start

### 1. Build and Start All Services

```bash
./docker-start.sh
```

This single command will:
- ✅ Stop any existing services
- ✅ Build all Docker images (15-30 min first time)
- ✅ Download Lag-Llama model (~2 GB)
- ✅ Start MySQL, LLM, Backend, Frontend
- ✅ Run database migrations
- ✅ Perform health checks

### 2. Access the Application

Once started, access:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api
- **Lag-Llama Service**: http://localhost:8000

### 3. Stop Services

```bash
./docker-stop.sh
# or
docker compose down
```

---

## 📦 Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
│                  (inventory_network)                        │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐  ┌─────────┐ │
│  │  MySQL   │   │ Lag-Llama│   │ Backend  │  │Frontend │ │
│  │  :3306   │◄──│   :8000  │◄──│  :3000   │◄─│  :3001  │ │
│  │          │   │          │   │          │  │         │ │
│  │ Database │   │   LLM    │   │  NestJS  │  │Next.js  │ │
│  └──────────┘   └──────────┘   └──────────┘  └─────────┘ │
│       │              │               │             │       │
│       └──────────────┴───────────────┴─────────────┘       │
│                   Persistent Volumes                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Docker Services

### 1. MySQL Database
- **Image**: mysql:8.0
- **Port**: 3307 (host) → 3306 (container)
- **Volume**: `inventory_mysql_data`
- **Credentials**:
  - Root: `root` / `rootpassword`
  - User: `inventory_user` / `inventory_password`
  - Database: `inventory_db`

### 2. Lag-Llama LLM Service
- **Build**: ./llm-service/Dockerfile
- **Port**: 8000 (host) → 8000 (container)
- **Volume**: `inventory_llm_cache` (for model storage)
- **Base Image**: python:3.12-slim
- **Dependencies**: FastAPI, PyTorch, Transformers, GluonTS

### 3. Backend API (NestJS)
- **Build**: ./backend/Dockerfile
- **Port**: 3000 (host) → 3000 (container)
- **Base Image**: node:20-alpine
- **Features**: 
  - Auto-runs Prisma migrations on start
  - Connects to MySQL and LLM service
  - Health checks enabled

### 4. Frontend (Next.js)
- **Build**: ./frontend/Dockerfile (multi-stage)
- **Port**: 3001 (host) → 3001 (container)
- **Base Image**: node:20-alpine
- **Build**: Production-optimized

---

## 📝 Common Commands

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f llm-service
docker compose logs -f frontend
docker compose logs -f mysql

# Or use helper script
./docker-logs.sh [service-name]
```

### Check Status
```bash
docker compose ps
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart llm-service
```

### Rebuild After Code Changes
```bash
# Rebuild and restart specific service
docker compose up -d --build backend

# Rebuild all services
docker compose up -d --build
```

### Access Container Shell
```bash
# Backend
docker exec -it inventory_backend sh

# LLM Service
docker exec -it inventory_llm bash

# MySQL
docker exec -it inventory_mysql mysql -u root -prootpassword
```

### View Health Status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🗄️ Database Management

### Run Migrations
```bash
# Migrations run automatically on backend start
# To run manually:
docker exec -it inventory_backend npx prisma migrate deploy
```

### Access MySQL
```bash
docker exec -it inventory_mysql mysql -u inventory_user -pinventory_password inventory_db
```

### Backup Database
```bash
docker exec inventory_mysql mysqldump \
  -u root -prootpassword inventory_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i inventory_mysql mysql \
  -u root -prootpassword inventory_db
```

---

## 🧹 Cleanup

### Stop and Remove Containers
```bash
docker compose down
```

### Remove Containers + Volumes (⚠️ DELETES ALL DATA)
```bash
docker compose down -v
```

### Remove Everything (Images + Volumes)
```bash
docker compose down --rmi all -v
```

### Clean Build Cache
```bash
docker builder prune -a
```

---

## 🐛 Troubleshooting

### 1. Lag-Llama Service Not Starting

**Check logs:**
```bash
docker compose logs llm-service
```

**Common issues:**
- Model download interrupted → Restart: `docker compose restart llm-service`
- Out of memory → Increase Docker memory limit (Docker Desktop settings)
- CUDA errors → Service will fallback to CPU automatically

### 2. Backend Cannot Connect to MySQL

**Check MySQL health:**
```bash
docker inspect inventory_mysql | grep -A 5 Health
```

**Wait for MySQL to be ready:**
```bash
docker compose logs mysql | grep "ready for connections"
```

### 3. Frontend Shows Connection Errors

**Check backend health:**
```bash
curl http://localhost:3000/products
```

**Update NEXT_PUBLIC_API_URL if needed:**
- Edit `docker-compose.yml` → `frontend.environment`
- Rebuild: `docker compose up -d --build frontend`

### 4. Port Already in Use

**Find and kill process:**
```bash
# For port 3000
sudo lsof -ti:3000 | xargs kill -9

# Or change port in docker-compose.yml
# Example: "3002:3000" instead of "3000:3000"
```

### 5. Slow Build Times

**Use BuildKit (faster builds):**
```bash
export DOCKER_BUILDKIT=1
docker compose build
```

**Clear build cache:**
```bash
docker builder prune
```

---

## 🔄 Development Workflow

### Option 1: Full Docker (Recommended for Production-like Testing)
```bash
# Start all services
./docker-start.sh

# Make code changes
# ...

# Rebuild and restart changed service
docker compose up -d --build backend

# View logs
docker compose logs -f backend
```

### Option 2: Hybrid (Faster Development)
```bash
# Run only MySQL + LLM in Docker
docker compose up -d mysql llm-service

# Run backend locally
cd backend
npm run start:dev

# Run frontend locally
cd frontend
npm run dev
```

### Option 3: Local Development (No Docker)
```bash
# Use the original scripts
./start-all.sh
```

---

## 🚀 Production Deployment

### Environment Variables

Edit `docker-compose.yml` for production:

```yaml
backend:
  environment:
    - NODE_ENV=production
    - DATABASE_URL=mysql://user:pass@mysql:3306/db
    - LAG_LLAMA_SERVICE_URL=http://llm-service:8000
```

### Security Checklist

- [ ] Change MySQL root password
- [ ] Change MySQL user password
- [ ] Use `.env` file for secrets (don't commit to git)
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Configure firewall rules
- [ ] Set up backup system
- [ ] Enable Docker logging

### Reverse Proxy Example (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
    }
}
```

---

## 📊 Resource Usage

### Expected Resource Consumption

| Service    | CPU (Idle) | CPU (Active) | RAM    | Disk   |
|------------|------------|--------------|--------|--------|
| MySQL      | <5%        | 10-20%       | 400MB  | 500MB  |
| LLM        | <5%        | 60-90%       | 2GB    | 3GB    |
| Backend    | <5%        | 10-30%       | 200MB  | 300MB  |
| Frontend   | <5%        | 10-20%       | 150MB  | 200MB  |
| **Total**  | ~10%       | ~100%        | ~3GB   | ~4GB   |

### Optimize Resource Usage

**Limit CPU/Memory:**
```yaml
services:
  llm-service:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          memory: 2G
```

---

## 🎯 Next Steps

1. ✅ **Test the System**
   ```bash
   ./docker-start.sh
   # Wait for services to start (2-5 minutes)
   # Open http://localhost:3001
   ```

2. ✅ **Add Sample Data**
   - Use frontend UI to create products
   - Or import via API (see WORKFLOW.md)

3. ✅ **Generate Predictions**
   - Add sales transactions
   - Click "Generate Predictions" button

4. ✅ **Monitor Logs**
   ```bash
   ./docker-logs.sh
   ```

---

## 📚 Additional Resources

- **Docker Compose Docs**: https://docs.docker.com/compose/
- **Multi-stage Builds**: https://docs.docker.com/build/building/multi-stage/
- **Health Checks**: https://docs.docker.com/engine/reference/builder/#healthcheck
- **Volumes**: https://docs.docker.com/storage/volumes/

---

## ✅ Summary

**Advantages of Docker Deployment:**
- ✅ Consistent environment across machines
- ✅ Easy deployment (one command)
- ✅ Automatic dependency installation
- ✅ Isolated services
- ✅ Easy scaling
- ✅ Production-ready

**Disadvantages:**
- ⚠️ First build takes 15-30 minutes
- ⚠️ Requires 5-8 GB disk space
- ⚠️ Slightly more complex debugging
- ⚠️ Slower code changes (need rebuild)

**Best Use Cases:**
- ✅ Production deployment
- ✅ Testing in production-like environment
- ✅ Easy onboarding (new developers)
- ✅ CI/CD pipelines
- ✅ Multi-machine deployment

---

**Last Updated**: 2026-01-18  
**Version**: 1.0.0 (Docker)




