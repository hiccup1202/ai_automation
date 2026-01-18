# 🚀 Project Setup Guide

## Prerequisites

### System Requirements
- **Operating System**: Linux, macOS, or Windows (WSL recommended)
- **Python**: 3.8 or higher
- **Node.js**: 18 or higher
- **Docker**: Latest version
- **Memory**: 8GB RAM minimum (16GB recommended)
- **Disk Space**: 10GB free

### Check Prerequisites

```bash
# Check Python version
python3 --version  # Should be 3.8+

# Check Node.js version
node --version     # Should be 18+

# Check Docker
docker --version
docker-compose --version

# Check available memory
free -h            # Linux
```

---

## Installation Steps

### 1. Clone or Navigate to Project

```bash
cd /path/to/ai_automation
```

### 2. Setup MySQL Database (Docker)

```bash
# Start MySQL container
docker-compose up -d mysql

# Wait for MySQL to be ready (about 10 seconds)
sleep 10

# Verify MySQL is running
docker ps | grep mysql
```

**Expected output**: Container `inventory_mysql` should be running on port 3307

### 3. Setup Backend (NestJS)

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Run database migrations
npm run prisma:generate
npm run prisma:migrate:prod

# Verify compilation
npx tsc --noEmit
```

**Expected**: No TypeScript errors

### 4. Setup Frontend (Next.js)

```bash
cd ../frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install
```

### 5. Setup Lag-Llama Service (Python)

```bash
cd ../llm-service

# Run automated setup
chmod +x setup.sh
./setup.sh
```

This will:
- Create Python virtual environment
- Install FastAPI, PyTorch, Transformers, GluonTS
- Download Lag-Llama model (~2GB) from Hugging Face
- Create `.env` file

**Note**: First-time model download takes 5-10 minutes depending on internet speed.

---

## Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=3307
DATABASE_USER=inventory_user
DATABASE_PASSWORD=inventory_password
DATABASE_NAME=inventory_db

# Prisma
DATABASE_URL="mysql://inventory_user:inventory_password@localhost:3307/inventory_db"
SHADOW_DATABASE_URL="mysql://inventory_user:inventory_password@localhost:3307/inventory_db_shadow"

# Application
NODE_ENV=development
PORT=3000

# Lag-Llama Service
LAG_LLAMA_SERVICE_URL=http://localhost:8000
```

### Frontend Configuration

Edit `frontend/.env`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Lag-Llama Service Configuration

Edit `llm-service/.env`:

```env
# Service Port
LLM_SERVICE_PORT=8000

# Model Configuration
LAG_LLAMA_MODEL_PATH=time-series-foundation-models/lag-llama

# Inference Settings
MAX_CONTEXT_LENGTH=64
DEFAULT_PREDICTION_LENGTH=7
NUM_SAMPLES=100

# Device (cpu or cuda)
DEVICE=cpu
```

**For GPU**: Change `DEVICE=cuda` if you have NVIDIA GPU with CUDA installed.

---

## Starting Services

### Option 1: Start All Services (Recommended)

```bash
cd /path/to/ai_automation

# Make scripts executable
chmod +x start-all.sh stop-all.sh

# Start everything
./start-all.sh
```

This starts:
- MySQL (port 3307)
- Lag-Llama service (port 8000)
- Backend (port 3000)
- Frontend (port 3001)

### Option 2: Start Services Manually

**Terminal 1 - MySQL**:
```bash
docker-compose up -d mysql
```

**Terminal 2 - Lag-Llama Service**:
```bash
cd llm-service
./start.sh
# Or manually:
# source venv/bin/activate
# python app.py
```

**Terminal 3 - Backend**:
```bash
cd backend
npm run start:dev
```

**Terminal 4 - Frontend**:
```bash
cd frontend
npm run dev
```

---

## Verification

### 1. Check All Services

```bash
# MySQL
docker ps | grep mysql
# Expected: Container running on 3307

# Lag-Llama Service
curl http://localhost:8000/health
# Expected: {"status":"healthy","model_ready":true,"device":"cpu"}

# Backend
curl http://localhost:3000/
# Expected: "Hello World!"

# Frontend
open http://localhost:3001
# Expected: Dashboard loads in browser
```

### 2. Check Logs

```bash
# Lag-Llama service
tail -f logs/llm-service.log

# Backend
tail -f logs/backend.log

# Frontend
tail -f logs/frontend.log
```

### 3. Verify Database Connection

```bash
# Connect to MySQL
mysql -h localhost -P 3307 -u inventory_user -p
# Password: inventory_password

# Check tables
USE inventory_db;
SHOW TABLES;
# Expected: products, inventory, predictions, alerts, users

# Exit
exit
```

---

## Stopping Services

### Stop All

```bash
./stop-all.sh
```

### Stop Individual Services

```bash
# Stop frontend (if started manually)
# Ctrl+C in terminal or:
pkill -f "next dev"

# Stop backend (if started manually)
# Ctrl+C in terminal or:
pkill -f "nest start"

# Stop Lag-Llama service (if started manually)
# Ctrl+C in terminal or:
pkill -f "python app.py"

# Stop MySQL
docker-compose down
```

---

## Troubleshooting

### Issue: Port Already in Use

**Check which ports are in use**:
```bash
lsof -i:3000  # Backend
lsof -i:3001  # Frontend
lsof -i:3307  # MySQL
lsof -i:8000  # Lag-Llama
```

**Solution**: Kill the process using the port:
```bash
kill -9 <PID>
```

### Issue: MySQL Connection Failed

**Check MySQL container**:
```bash
docker ps -a | grep mysql
docker logs inventory_mysql
```

**Solution**: Restart MySQL:
```bash
docker-compose down
docker-compose up -d mysql
sleep 10
```

### Issue: Lag-Llama Service Not Starting

**Check Python environment**:
```bash
cd llm-service
source venv/bin/activate
python --version
pip list | grep -E "fastapi|torch|transformers"
```

**Solution**: Reinstall dependencies:
```bash
cd llm-service
rm -rf venv
./setup.sh
```

### Issue: Model Download Failed

**Check internet connection and retry**:
```bash
cd llm-service
source venv/bin/activate
python -c "from transformers import AutoModelForCausalLM; AutoModelForCausalLM.from_pretrained('time-series-foundation-models/lag-llama', trust_remote_code=True)"
```

**Model cache location**: `~/.cache/huggingface/`

### Issue: Backend Won't Start

**Check TypeScript compilation**:
```bash
cd backend
npx tsc --noEmit
```

**Check database migrations**:
```bash
npm run prisma:migrate:prod
```

**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Frontend Build Errors

**Clear Next.js cache**:
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

---

## Directory Structure

```
ai_automation/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── products/       # Product management
│   │   ├── inventory/      # Inventory & transactions
│   │   ├── predictions/    # AI predictions
│   │   ├── alerts/         # Stock alerts
│   │   ├── llm/           # Lag-Llama integration
│   │   └── analytics/      # Analytics
│   ├── prisma/            # Database schema & migrations
│   ├── .env               # Backend configuration
│   └── package.json       # Dependencies
│
├── frontend/               # Next.js Frontend
│   ├── app/               # Pages (App Router)
│   ├── components/        # React components
│   ├── .env              # Frontend configuration
│   └── package.json      # Dependencies
│
├── llm-service/           # Lag-Llama Python Service
│   ├── app.py            # FastAPI server
│   ├── requirements.txt  # Python dependencies
│   ├── setup.sh         # Setup script
│   ├── start.sh         # Start script
│   ├── .env             # Service configuration
│   └── venv/            # Python virtual environment
│
├── logs/                 # Service logs
│   ├── backend.log
│   ├── frontend.log
│   └── llm-service.log
│
├── docker-compose.yml    # MySQL container
├── start-all.sh         # Start all services
├── stop-all.sh          # Stop all services
│
└── Documentation
    ├── SETUP.md         # This file
    ├── WORKFLOW.md      # Usage workflows
    └── LAG_LLAMA.md     # LLM integration guide
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | MySQL host | localhost |
| `DATABASE_PORT` | MySQL port | 3307 |
| `DATABASE_USER` | MySQL user | inventory_user |
| `DATABASE_PASSWORD` | MySQL password | inventory_password |
| `DATABASE_NAME` | Database name | inventory_db |
| `DATABASE_URL` | Prisma connection string | (see above) |
| `SHADOW_DATABASE_URL` | Prisma shadow DB | (see above) |
| `NODE_ENV` | Environment | development |
| `PORT` | Backend port | 3000 |
| `LAG_LLAMA_SERVICE_URL` | LLM service URL | http://localhost:8000 |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3000 |

### Lag-Llama Service (`llm-service/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_SERVICE_PORT` | Service port | 8000 |
| `LAG_LLAMA_MODEL_PATH` | Model path/name | time-series-foundation-models/lag-llama |
| `MAX_CONTEXT_LENGTH` | Max historical data | 64 |
| `DEFAULT_PREDICTION_LENGTH` | Forecast days | 7 |
| `NUM_SAMPLES` | Prediction samples | 100 |
| `DEVICE` | Computation device | cpu |

---

## Next Steps

After successful setup:

1. ✅ **Read WORKFLOW.md** - Learn how to use the system
2. ✅ **Read LAG_LLAMA.md** - Understand AI integration
3. ✅ **Access Frontend** - http://localhost:3001
4. ✅ **Test API** - http://localhost:3000/api (Swagger docs)

---

**Setup Complete!** 🎉

Your AI-powered inventory system is ready to use.






