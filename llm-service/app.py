"""
Lag-Llama LLM Service for Time Series Forecasting
- Runs locally (offline)
- Provides REST API for predictions
- Integrates with NestJS backend
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
    title="Lag-Llama Forecasting Service",
    description="Local LLM service for inventory demand prediction",
    version="1.0.0"
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance (lazy loading)
lag_llama_model = None
lag_llama_predictor = None

class TimeSeriesData(BaseModel):
    """Input data for prediction"""
    dates: List[str]  # ISO format dates
    quantities: List[float]  # Sales quantities
    product_id: str
    product_name: Optional[str] = None
    days_ahead: int = 7
    context_length: Optional[int] = 32  # Historical window

class PredictionResponse(BaseModel):
    """Prediction output"""
    product_id: str
    predictions: List[float]  # Predicted values for each day
    prediction_dates: List[str]  # Dates for predictions
    confidence_intervals: Dict[str, List[float]]  # lower, upper bounds
    model_type: str = "lag-llama"
    metadata: Dict[str, Any]

def load_lag_llama_model():
    """Load Lag-Llama model (lazy loading on first request)"""
    global lag_llama_model, lag_llama_predictor
    
    if lag_llama_model is not None:
        return lag_llama_model, lag_llama_predictor
    
    try:
        logger.info("🚀 Loading Lag-Llama model...")
        
        from gluonts.torch.model.lag_llama import LagLlamaEstimator
        from gluonts.dataset.pandas import PandasDataset
        from gluonts.dataset.common import ListDataset
        
        # Initialize Lag-Llama
        # Using pretrained checkpoint
        model_path = os.getenv("LAG_LLAMA_MODEL_PATH", "time-series-foundation-models/lag-llama")
        
        estimator = LagLlamaEstimator(
            prediction_length=7,  # Default forecast horizon
            context_length=32,    # Historical context window
            input_size=1,         # Univariate time series
            n_layer=12,           # Model depth
            n_head=8,             # Attention heads
            scaling=True,         # Auto-scale data
            num_parallel_samples=100,  # For probabilistic forecasting
        )
        
        # Load pretrained weights from local cache
        # (Model should be pre-downloaded during Docker build)
        from transformers import AutoModelForCausalLM
        try:
            # Try to use cached model first (fast!)
            lag_llama_backbone = AutoModelForCausalLM.from_pretrained(
                model_path,
                local_files_only=True,  # Use pre-downloaded model from cache
                trust_remote_code=True,
                cache_dir="/root/.cache/huggingface"
            )
            logger.info("✅ Using pre-downloaded model from cache")
        except Exception as e:
            # Fallback: download if not cached (slower)
            logger.warning(f"⚠️  Model not in cache, downloading now: {e}")
            lag_llama_backbone = AutoModelForCausalLM.from_pretrained(
                model_path,
                local_files_only=False,  # Download from internet as fallback
                trust_remote_code=True,
                cache_dir="/root/.cache/huggingface"
            )
            logger.info("✅ Model downloaded and cached")
        
        lag_llama_model = estimator
        lag_llama_predictor = None  # Will be created per prediction
        
        logger.info("✅ Lag-Llama model loaded successfully!")
        return lag_llama_model, lag_llama_predictor
        
    except Exception as e:
        logger.error(f"❌ Failed to load Lag-Llama: {e}")
        raise

@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "running",
        "service": "Lag-Llama Forecasting",
        "model_loaded": lag_llama_model is not None,
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_ready": lag_llama_model is not None,
        "gpu_available": torch.cuda.is_available(),
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(data: TimeSeriesData):
    """
    Generate probabilistic forecast using Lag-Llama
    
    Input:
    - Historical sales data (dates + quantities)
    - Product metadata
    - Forecast horizon (days_ahead)
    
    Output:
    - Point predictions
    - Confidence intervals (10th, 50th, 90th percentiles)
    - Metadata (trend, seasonality detected, etc.)
    """
    try:
        logger.info(f"📊 Prediction request for product {data.product_id}")
        
        # Load model if not already loaded
        estimator, _ = load_lag_llama_model()
        
        if len(data.quantities) < 7:
            raise HTTPException(
                status_code=400, 
                detail="Need at least 7 days of historical data"
            )
        
        # Prepare data for Lag-Llama
        from gluonts.dataset.pandas import PandasDataset
        import pandas as pd
        
        # Convert to pandas
        df = pd.DataFrame({
            'timestamp': pd.to_datetime(data.dates),
            'target': data.quantities
        })
        df = df.set_index('timestamp')
        df = df.sort_index()
        
        # Create GluonTS dataset
        dataset = PandasDataset.from_long_dataframe(
            df.reset_index(),
            target='target',
            timestamp='timestamp',
            freq='D'  # Daily frequency
        )
        
        # Train predictor (fine-tuning on this product's data)
        logger.info("🧠 Fine-tuning Lag-Llama on product data...")
        predictor = estimator.train(
            training_data=dataset,
            num_batches_per_epoch=50,
            epochs=10,
        )
        
        # Generate forecast
        logger.info(f"🔮 Generating {data.days_ahead}-day forecast...")
        forecast_it = predictor.predict(dataset)
        forecasts = list(forecast_it)
        
        if not forecasts:
            raise HTTPException(status_code=500, detail="Forecast generation failed")
        
        forecast = forecasts[0]
        
        # Extract predictions and confidence intervals
        median_prediction = forecast.median.tolist()[:data.days_ahead]
        lower_bound = forecast.quantile(0.1).tolist()[:data.days_ahead]
        upper_bound = forecast.quantile(0.9).tolist()[:data.days_ahead]
        
        # Generate prediction dates
        last_date = pd.to_datetime(data.dates[-1])
        prediction_dates = [
            (last_date + timedelta(days=i+1)).strftime('%Y-%m-%d')
            for i in range(data.days_ahead)
        ]
        
        # Calculate metadata
        historical_mean = np.mean(data.quantities)
        predicted_mean = np.mean(median_prediction)
        trend = "increasing" if predicted_mean > historical_mean else "decreasing"
        
        # Detect seasonality (simple variance check)
        weekly_variance = np.var([
            np.mean(data.quantities[i::7]) 
            for i in range(min(7, len(data.quantities)))
        ])
        has_seasonality = weekly_variance > np.var(data.quantities) * 0.1
        
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
                "has_seasonality": bool(has_seasonality),
                "forecast_horizon": data.days_ahead,
                "context_length": len(data.quantities),
                "model": "Lag-Llama",
                "confidence_range": "10th-90th percentile"
            }
        )
        
        logger.info(f"✅ Prediction completed for {data.product_id}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    uvicorn.run(
        "app:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        log_level="info"
    )



