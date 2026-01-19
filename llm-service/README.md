# Time Series Forecasting Service

**Amazon Chronos** - Production-ready transformer model for inventory demand prediction

## Quick Start

This service is automatically built and started with `docker compose up`.

### Build
```bash
cd /home/hiccup/work/ai_automation
docker compose build llm-service
```

### Start
```bash
docker compose up -d llm-service
```

### Test
```bash
curl http://localhost:9002/health
```

## Model Details

- **Model**: Amazon Chronos-T5-Small
- **Size**: ~200-500 MB
- **Accuracy**: 85-90%
- **Speed**: 1-2 seconds per prediction
- **Type**: Pretrained transformer

## API Endpoints

### Health Check
```bash
GET /health
```

### Predict
```bash
POST /predict
Content-Type: application/json

{
  "dates": ["2026-01-01", "2026-01-02", ...],
  "quantities": [10.0, 12.0, ...],
  "product_id": "abc-123",
  "days_ahead": 7
}
```

## Files

- `app.py` - Main FastAPI service
- `download_model.py` - Model download script  
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container configuration

## Environment Variables

- `CHRONOS_MODEL_SIZE` - Model size (tiny, mini, small, base, large). Default: `small`
- `HF_HOME` - Hugging Face cache directory. Default: `/root/.cache/huggingface`

## Integration

The backend (NestJS) calls this service for:
1. **Training** - Store model weights in database
2. **Predictions** - Real-time forecasting

See `/home/hiccup/work/ai_automation/LLM_SETUP.md` for complete documentation.

