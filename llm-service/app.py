"""
Chronos Time Series Forecasting Service
- Amazon's Chronos model (pretrained transformer)
- Easy to integrate, reliable, production-ready
- Smaller than Lag-Llama, better performance
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import torch
from datetime import datetime, timedelta
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Chronos Time Series Forecasting Service",
    description="Amazon Chronos model for inventory demand prediction",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance (lazy loading)
chronos_pipeline = None

class TimeSeriesData(BaseModel):
    """Input data for prediction"""
    dates: List[str]
    quantities: List[float]
    product_id: str
    product_name: Optional[str] = None
    days_ahead: int = 7
    context_length: Optional[int] = 32

class PredictionResponse(BaseModel):
    """Prediction output"""
    product_id: str
    predictions: List[float]
    prediction_dates: List[str]
    confidence_intervals: Dict[str, List[float]]
    model_type: str = "chronos"
    metadata: Dict[str, Any]

def load_chronos_model():
    """Load Chronos model (lazy loading on first request)"""
    global chronos_pipeline
    
    if chronos_pipeline is not None:
        return chronos_pipeline
    
    try:
        logger.info("🚀 Loading Amazon Chronos model...")
        
        from chronos import ChronosPipeline
        
        # Use Chronos-T5 Small (best balance of speed/accuracy)
        # Options: tiny, mini, small, base, large
        model_size = os.getenv("CHRONOS_MODEL_SIZE", "small")
        model_path = f"amazon/chronos-t5-{model_size}"
        
        logger.info(f"📦 Loading model: {model_path}")
        
        # Load with proper device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        
        chronos_pipeline = ChronosPipeline.from_pretrained(
            model_path,
            device_map=device,
            torch_dtype=torch.bfloat16 if device == "cuda" else torch.float32,
        )
        
        logger.info(f"✅ Chronos model loaded successfully on {device}!")
        return chronos_pipeline
        
    except Exception as e:
        logger.error(f"❌ Failed to load Chronos: {e}")
        raise

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "running",
        "service": "Chronos Time Series Forecasting",
        "model_loaded": chronos_pipeline is not None,
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_ready": chronos_pipeline is not None,
        "model_type": "Amazon Chronos Transformer",
        "gpu_available": torch.cuda.is_available(),
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(data: TimeSeriesData):
    """
    Generate forecast using Amazon Chronos
    
    Input: Historical sales data
    Output: Probabilistic forecasts with confidence intervals
    """
    try:
        logger.info(f"📊 Prediction request for product {data.product_id} ({len(data.quantities)} data points)")
        
        if len(data.quantities) < 7:
            raise HTTPException(
                status_code=400, 
                detail=f"Need at least 7 days of historical data (got {len(data.quantities)})"
            )
        
        # Load model if not already loaded
        pipeline = load_chronos_model()
        
        # Prepare data for Chronos
        # Chronos expects torch tensors
        context = torch.tensor(data.quantities, dtype=torch.float32)
        
        logger.info(f"🔮 Generating {data.days_ahead}-day forecast with Chronos...")
        
        # Generate forecast
        # Chronos generates probabilistic forecasts (multiple samples)
        forecast = pipeline.predict(
            context.unsqueeze(0),  # First positional arg: context tensor with batch dimension
            data.days_ahead,  # Second positional arg: prediction_length
            num_samples=100,  # Number of probabilistic samples
        )
        
        # Extract predictions (shape: [batch, num_samples, prediction_length])
        forecast_samples = forecast[0].numpy()  # Remove batch dimension
        
        # Calculate statistics
        median_prediction = np.median(forecast_samples, axis=0).tolist()
        lower_bound = np.percentile(forecast_samples, 10, axis=0).tolist()
        upper_bound = np.percentile(forecast_samples, 90, axis=0).tolist()
        
        # Generate prediction dates
        last_date = datetime.fromisoformat(data.dates[-1].replace('Z', '+00:00'))
        prediction_dates = [
            (last_date + timedelta(days=i+1)).strftime('%Y-%m-%d')
            for i in range(data.days_ahead)
        ]
        
        # Calculate metadata
        historical_mean = float(np.mean(data.quantities))
        predicted_mean = float(np.mean(median_prediction))
        historical_std = float(np.std(data.quantities))
        
        # Determine trend
        recent_data = data.quantities[-min(7, len(data.quantities)):]
        older_data = data.quantities[-min(14, len(data.quantities)):-min(7, len(data.quantities))] if len(data.quantities) >= 14 else recent_data
        
        recent_mean = np.mean(recent_data)
        older_mean = np.mean(older_data) if len(older_data) > 0 else recent_mean
        
        if predicted_mean > historical_mean * 1.05:
            trend = "increasing"
        elif predicted_mean < historical_mean * 0.95:
            trend = "decreasing"
        else:
            trend = "stable"
        
        # Detect seasonality (simple variance check)
        if len(data.quantities) >= 14:
            weekly_means = []
            for i in range(7):
                day_values = [data.quantities[j] for j in range(i, len(data.quantities), 7)]
                if day_values:
                    weekly_means.append(np.mean(day_values))
            
            weekly_variance = np.var(weekly_means) if len(weekly_means) > 0 else 0
            has_seasonality = weekly_variance > historical_std * 0.5
        else:
            has_seasonality = False
        
        # Calculate confidence from prediction spread
        avg_spread = np.mean([u - l for u, l in zip(upper_bound, lower_bound)])
        confidence = max(0, min(100, 100 - (avg_spread / (predicted_mean + 1)) * 50))
        
        response = PredictionResponse(
            product_id=data.product_id,
            predictions=median_prediction,
            prediction_dates=prediction_dates,
            confidence_intervals={
                "lower": lower_bound,
                "median": median_prediction,
                "upper": upper_bound,
            },
            metadata={
                "trend": trend,
                "historical_mean": float(historical_mean),
                "predicted_mean": float(predicted_mean),
                "historical_std": float(historical_std),
                "has_seasonality": bool(has_seasonality),
                "forecast_horizon": int(data.days_ahead),
                "context_length": int(len(data.quantities)),
                "model": "Amazon Chronos",
                "confidence_range": f"{confidence:.1f}%",
                "num_samples": 100,
            }
        )
        
        logger.info(f"✅ Prediction completed for {data.product_id}: {median_prediction[0]:.1f} (day 1)")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Prediction error for {data.product_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict-batch")
async def predict_batch(products: List[TimeSeriesData]):
    """Batch prediction for multiple products"""
    results = []
    for product_data in products:
        try:
            result = await predict(product_data)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed for product {product_data.product_id}: {e}")
            results.append({
                "product_id": product_data.product_id,
                "error": str(e)
            })
    return results

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("LLM_SERVICE_PORT", 8000))
    logger.info(f"🚀 Starting Chronos service on port {port}")
    uvicorn.run(
        "app_chronos:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        log_level="info"
    )

